/**
 * FCMIntegrationHandler
 * ======================
 * Socket.IO와 FCM 알림의 통합 관리 및 중복 방지 시스템
 *
 * 주요 기능:
 * 1. Socket.IO와 FCM 알림 중복 필터링
 * 2. 알림 우선순위 관리 (Socket.IO 우선)
 * 3. 메시지 ID 기반 중복 감지
 * 4. 시간 기반 자동 정리
 * 5. 알림 라우팅 및 화면 이동
 * 6. 포그라운드/백그라운드 상태 감지 및 처리
 *
 * 아키텍처:
 * ┌──────────────┬─────────────────┐
 * │ Socket.IO    │       FCM       │
 * └──────────────┴─────────────────┘
 *         ↓              ↓
 *   FCMIntegrationHandler
 *         ↓
 *   AppState 확인 (포그라운드?)
 *         ↓
 *   중복 필터링 (Set)
 *         ↓
 *   로컬 알림 표시 (Notifee)
 *         ↓
 *   Redux 상태 업데이트
 *         ↓
 *   화면 라우팅
 */

import { Platform, AppState } from 'react-native';
import notifee from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import logger from '@shared/utils/system/logger';
import { getApolloClient } from '@services/apollo/apolloClient';
import { M_GET_NOTIFICATIONS_SETTINGS } from '@gql/queries/notifications';

class FCMIntegrationHandler {
  constructor() {
    // ============================================
    // 중복 방지 시스템
    // ============================================
    // Set을 사용하여 메시지 ID 추적 (O(1) 조회 성능)
    this.processedMessages = new Set();

    // 최대 보관 메시지 수 (메모리 관리)
    this.MAX_MESSAGES = 100;

    // 메시지 타임아웃 (5분)
    this.MESSAGE_TIMEOUT = 5 * 60 * 1000;

    // 타임아웃 타이머 Map
    this.timeouts = new Map();

    // 알림 설정 캐시 (1분마다 갱신)
    this.settingsCache = null;
    this.settingsCacheTime = 0;
    this.SETTINGS_CACHE_TTL = 60000; // 1분

    console.log('[FCMIntegrationHandler] 초기화 완료');
  }

  /**
   * ============================================
   * Socket.IO 알림 처리
   * ============================================
   * 포그라운드에서 우선적으로 처리되는 실시간 알림
   *
   * @param {Object} notification - 알림 객체
   * @param {string} notification.id - 고유 알림 ID
   * @param {string} notification.type - 알림 타입
   * @param {string} notification.title - 알림 제목
   * @param {string} notification.body - 알림 내용
   * @param {Object} notification.data - 추가 데이터
   */
  async handleRealtimeNotification(notification) {
    try {
      logger.info('[FCMIntegrationHandler] 🔔 Socket.IO 알림 처리 시작:', {
        id: notification?.id,
        type: notification?.type,
        appState: AppState.currentState,
        timestamp: new Date().toISOString()
      });

      // 데이터 검증
      if (!notification || !notification.id) {
        logger.warn('[FCMIntegrationHandler] ⚠️ Invalid notification data');
        return { success: false, reason: 'invalid_data' };
      }

      const { id, type, title, body, data, priority, channelId } = notification;

      // ============================================
      // 1. 앱 상태 확인
      // ============================================
      const currentAppState = AppState.currentState;
      const isForeground = currentAppState === 'active';

      logger.info('[FCMIntegrationHandler] 📱 App state:', {
        currentAppState,
        isForeground,
        notificationId: id
      });

      // ============================================
      // 2. 백그라운드 상태면 Socket 알림 무시
      // ============================================
      // 백그라운드에서는 FCM 푸시 알림으로만 수신
      if (!isForeground) {
        logger.info('[FCMIntegrationHandler] ⏭️ App in background - skipping Socket notification:', id);
        return { success: false, reason: 'background_skip' };
      }

      // ============================================
      // 3. 사용자 알림 설정 확인
      // ============================================
      const settings = await this.getNotificationSettings();
      const shouldShow = this.shouldShowNotification(type, settings);

      if (!shouldShow) {
        logger.info('[FCMIntegrationHandler] 🚫 Notification blocked by user settings:', {
          type,
          settings
        });
        return { success: false, reason: 'user_settings_blocked' };
      }

      // ============================================
      // 4. 중복 체크 (포그라운드에서만)
      // ============================================
      if (this.isProcessed(id)) {
        logger.info('[FCMIntegrationHandler] ⏭️ Duplicate Socket.IO notification:', id);
        return { success: false, reason: 'duplicate' };
      }

      // ============================================
      // 5. 메시지 ID 등록 (중복 방지)
      // ============================================
      this.markAsProcessed(id);

      // ============================================
      // 6. 포그라운드 로컬 알림 표시 (Notifee)
      // ============================================
      logger.info('[FCMIntegrationHandler] 🎨 Displaying foreground notification via Notifee');

      await this.displayLocalNotification({
        id,
        title: title || '알림',
        body: body || '',
        type,
        data,
        priority: priority || 'HIGH',
        channelId: channelId || 'default-channel',
        foreground: true // 포그라운드 알림임을 표시
      });

      logger.info('[FCMIntegrationHandler] ✅ Socket.IO notification processed (foreground):', id);
      return { success: true, source: 'socket', foreground: true };

    } catch (error) {
      logger.error('[FCMIntegrationHandler] ❌ Socket.IO notification handling error:', error);
      return { success: false, error };
    }
  }

  /**
   * ============================================
   * FCM 알림 처리
   * ============================================
   * 백그라운드/종료 상태에서 전달되는 푸시 알림
   *
   * @param {Object} remoteMessage - FCM 메시지 객체
   */
  async handleFCMMessage(remoteMessage) {
    try {
      console.log('[FCMIntegrationHandler] 📨 FCM 메시지 처리 시작:', {
        messageId: remoteMessage?.messageId,
        hasNotification: !!remoteMessage?.notification,
        hasData: !!remoteMessage?.data
      });

      // 데이터 검증
      if (!remoteMessage || !remoteMessage.messageId) {
        console.warn('[FCMIntegrationHandler] ⚠️ Invalid FCM message');
        return { success: false, reason: 'invalid_data' };
      }

      const { messageId, notification, data } = remoteMessage;

      // 알림 ID 추출 (data.notificationId 또는 messageId 사용)
      const notificationId = data?.notificationId || messageId;

      // ============================================
      // 1. Socket.IO 중복 체크
      // ============================================
      // Socket.IO에서 이미 처리된 알림이면 무시 (Socket.IO 우선)
      if (this.isProcessed(notificationId)) {
        console.log('[FCMIntegrationHandler] ⏭️ FCM notification already processed by Socket.IO:', notificationId);
        return { success: false, reason: 'duplicate_socket' };
      }

      // ============================================
      // 2. 사용자 알림 설정 확인
      // ============================================
      const notificationType = data?.type || 'SYSTEM';
      const settings = await this.getNotificationSettings();
      const shouldShow = this.shouldShowNotification(notificationType, settings);

      if (!shouldShow) {
        console.log('[FCMIntegrationHandler] 🚫 FCM notification blocked by user settings:', {
          type: notificationType,
          settings
        });
        return { success: false, reason: 'user_settings_blocked' };
      }

      // ============================================
      // 3. 메시지 ID 등록
      // ============================================
      this.markAsProcessed(notificationId);

      // ============================================
      // 4. 로컬 알림 표시 (FCM 전용)
      // ============================================
      await this.displayLocalNotification({
        id: notificationId,
        title: notification?.title || data?.title || '알림',
        body: notification?.body || data?.body || '',
        type: data?.type || 'GENERAL',
        data: data || {},
        priority: data?.priority || 'HIGH',
        channelId: data?.channelId || 'default-channel'
      });

      console.log('[FCMIntegrationHandler] ✅ FCM notification processed:', notificationId);
      return { success: true, source: 'fcm' };

    } catch (error) {
      console.error('[FCMIntegrationHandler] ❌ FCM message handling error:', error);
      return { success: false, error };
    }
  }

  /**
   * ============================================
   * 로컬 알림 표시 (Notifee)
   * ============================================
   * Socket.IO와 FCM 모두에서 사용하는 통합 알림 표시 메서드
   *
   * @param {Object} params - 알림 파라미터
   * @param {string} params.id - 알림 ID
   * @param {string} params.title - 알림 제목
   * @param {string} params.body - 알림 내용
   * @param {string} params.type - 알림 타입
   * @param {Object} params.data - 추가 데이터
   * @param {string} params.priority - 우선순위
   * @param {string} params.channelId - 채널 ID
   * @param {boolean} params.foreground - 포그라운드 알림 여부
   */
  async displayLocalNotification({ id, title, body, type, data, priority, channelId, foreground = false }) {
    try {
      const currentAppState = AppState.currentState;
      const isForeground = currentAppState === 'active';

      logger.info('[FCMIntegrationHandler] 📱 로컬 알림 표시:', {
        id,
        title: title?.substring(0, 50),
        type,
        priority,
        channelId,
        foreground,
        appState: currentAppState,
        isForeground
      });

      // 알림 우선순위에 따른 Android importance 설정
      const importance = this.getImportanceLevel(priority);

      // 타입별 아이콘 설정
      const smallIcon = this.getNotificationIcon(type);

      // ============================================
      // Android 전용 알림 설정
      // ============================================
      const vibrationPattern = this.getVibrationPattern(priority);

      const androidConfig = {
        channelId,
        smallIcon,
        importance,
        pressAction: {
          id: 'default'
        },
        sound: isForeground ? 'default' : 'default', // 포그라운드/백그라운드 모두 소리
        ...(vibrationPattern && { vibrationPattern }), // vibrationPattern이 있을 때만 포함
        style: {
          type: 1, // AndroidStyle.BIGTEXT
          text: body
        },
        // 포그라운드 알림 표시 강제 (Android)
        ...(isForeground && {
          showTimestamp: true,
          timestamp: Date.now(),
          ongoing: false,
          autoCancel: true
        })
      };

      // ============================================
      // iOS 전용 알림 설정
      // ============================================
      const iosConfig = {
        sound: 'default',
        criticalVolume: priority === 'CRITICAL' ? 1.0 : 0.8,
        // 포그라운드 알림 표시 옵션
        ...(isForeground && {
          foregroundPresentationOptions: {
            alert: true,  // 배너 표시
            badge: true,  // 배지 업데이트
            sound: true   // 소리 재생
          }
        })
      };

      // ============================================
      // Notifee 알림 표시
      // ============================================
      logger.info('[FCMIntegrationHandler] 🎨 Notifee.displayNotification() 호출');

      await notifee.displayNotification({
        id: id?.toString(),
        title,
        body,
        data: {
          ...data,
          notificationId: id,
          type,
          priority,
          foreground: foreground.toString(),
          appState: currentAppState
        },
        android: androidConfig,
        ios: iosConfig
      });

      logger.info('[FCMIntegrationHandler] ✅ Local notification displayed:', {
        id,
        foreground: isForeground,
        type
      });

    } catch (error) {
      logger.error('[FCMIntegrationHandler] ❌ Local notification display error:', error);
      throw error;
    }
  }

  /**
   * ============================================
   * 중복 체크
   * ============================================
   * @param {string} messageId - 메시지 ID
   * @returns {boolean} 이미 처리된 메시지면 true
   */
  isProcessed(messageId) {
    return this.processedMessages.has(messageId);
  }

  /**
   * ============================================
   * 메시지 처리 완료 마킹
   * ============================================
   * @param {string} messageId - 메시지 ID
   */
  markAsProcessed(messageId) {
    // Set에 추가
    this.processedMessages.add(messageId);

    // 메모리 관리: 최대 개수 초과 시 가장 오래된 항목 삭제
    if (this.processedMessages.size > this.MAX_MESSAGES) {
      const firstItem = this.processedMessages.values().next().value;
      this.processedMessages.delete(firstItem);

      // 해당 타이머도 정리
      if (this.timeouts.has(firstItem)) {
        clearTimeout(this.timeouts.get(firstItem));
        this.timeouts.delete(firstItem);
      }
    }

    // 자동 정리 타이머 설정 (5분 후 삭제)
    const timeout = setTimeout(() => {
      this.processedMessages.delete(messageId);
      this.timeouts.delete(messageId);
      console.log('[FCMIntegrationHandler] 🗑️ Message ID expired:', messageId);
    }, this.MESSAGE_TIMEOUT);

    this.timeouts.set(messageId, timeout);

    console.log('[FCMIntegrationHandler] ✅ Message marked as processed:', {
      messageId,
      totalProcessed: this.processedMessages.size,
      expiresIn: `${this.MESSAGE_TIMEOUT / 1000}s`
    });
  }

  /**
   * ============================================
   * 우선순위에 따른 Importance 레벨 반환
   * ============================================
   */
  getImportanceLevel(priority) {
    switch (priority) {
      case 'CRITICAL':
        return 5; // AndroidImportance.MAX
      case 'HIGH':
        return 4; // AndroidImportance.HIGH
      case 'NORMAL':
        return 3; // AndroidImportance.DEFAULT
      case 'LOW':
        return 2; // AndroidImportance.LOW
      default:
        return 3; // AndroidImportance.DEFAULT
    }
  }

  /**
   * ============================================
   * 우선순위에 따른 진동 패턴 반환
   * ============================================
   * Android 전용: [대기시간, 진동시간] 짝수 쌍으로 구성
   * iOS는 이 패턴을 사용하지 않으므로 영향 없음
   */
  getVibrationPattern(priority) {
    // Android만 진동 패턴 적용
    if (Platform.OS !== 'android') {
      return undefined;
    }

    switch (priority) {
      case 'CRITICAL':
        return [500, 1000]; // [대기 500ms, 진동 1000ms]
      case 'HIGH':
        return [300, 500]; // [대기 300ms, 진동 500ms]
      case 'NORMAL':
        return [200, 300]; // [대기 200ms, 진동 300ms]
      case 'LOW':
        return undefined; // 진동 없음
      default:
        return [200, 300]; // 기본: [대기 200ms, 진동 300ms]
    }
  }

  /**
   * ============================================
   * 알림 타입별 아이콘 반환
   * ============================================
   */
  getNotificationIcon(type) {
    // Android는 smallIcon이 필수이며, drawable 폴더에 위치해야 함
    // 현재 커스텀 아이콘이 없으므로 앱 런처 아이콘 사용
    // TODO: drawable/ic_notification.xml 생성하여 적절한 알림 아이콘으로 교체
    return 'ic_launcher'; // 임시로 앱 런처 아이콘 사용
  }

  /**
   * ============================================
   * 알림 설정 가져오기 (Apollo Cache)
   * ============================================
   * Apollo cache에서 사용자의 알림 설정을 가져옵니다
   * 1분 캐시로 성능 최적화
   */
  async getNotificationSettings() {
    try {
      // 캐시 확인
      const now = Date.now();
      if (this.settingsCache && (now - this.settingsCacheTime) < this.SETTINGS_CACHE_TTL) {
        logger.info('[FCMIntegrationHandler] 📦 Using cached notification settings');
        return this.settingsCache;
      }

      // Apollo Client에서 설정 읽기 (비동기 함수 await 필수)
      const client = await getApolloClient();
      if (!client) {
        logger.warn('[FCMIntegrationHandler] ⚠️ Apollo Client not available');
        return this.getDefaultSettings();
      }

      const { data } = await client.query({
        query: M_GET_NOTIFICATIONS_SETTINGS,
        fetchPolicy: 'cache-first', // Apollo cache 우선
      });

      const settings = data?.mGetNotificationSettings?.settings;

      if (settings) {
        // 캐시 업데이트
        this.settingsCache = settings;
        this.settingsCacheTime = now;

        logger.info('[FCMIntegrationHandler] ✅ Notification settings loaded:', {
          promotions: settings.promotions,
          marketing: settings.marketing
        });

        return settings;
      }

      return this.getDefaultSettings();
    } catch (error) {
      logger.error('[FCMIntegrationHandler] ❌ Failed to load notification settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * ============================================
   * 기본 알림 설정 반환
   * ============================================
   */
  getDefaultSettings() {
    return {
      promotions: true,  // 기본적으로 프로모션 알림 활성화
      marketing: false   // 마케팅 알림은 비활성화
    };
  }

  /**
   * ============================================
   * 알림 타입 필터링 체크
   * ============================================
   * 사용자 설정에 따라 알림을 표시할지 결정
   *
   * @param {string} notificationType - 알림 타입 (CHAT, SYSTEM, PROMOTION, MARKETING)
   * @param {Object} settings - 사용자 알림 설정
   * @returns {boolean} 알림 표시 여부
   */
  shouldShowNotification(notificationType, settings) {
    switch (notificationType) {
      case 'CHAT':
        const showChat = settings?.chatMessages !== false;
        logger.info('[FCMIntegrationHandler] 💬 Chat notification check:', {
          type: notificationType,
          userSetting: settings?.chatMessages,
          shouldShow: showChat
        });
        return showChat;

      case 'SYSTEM':
        const showSystem = settings?.systemNotices !== false;
        logger.info('[FCMIntegrationHandler] 🔔 System notification check:', {
          type: notificationType,
          userSetting: settings?.systemNotices,
          shouldShow: showSystem
        });
        return showSystem;

      case 'PROMOTION':
        const showPromotion = settings?.promotions === true;
        logger.info('[FCMIntegrationHandler] 🎁 Promotion notification check:', {
          type: notificationType,
          userSetting: settings?.promotions,
          shouldShow: showPromotion
        });
        return showPromotion;

      case 'MARKETING':
        const showMarketing = settings?.marketing === true;
        logger.info('[FCMIntegrationHandler] 📢 Marketing notification check:', {
          type: notificationType,
          userSetting: settings?.marketing,
          shouldShow: showMarketing
        });
        return showMarketing;

      default:
        logger.warn('[FCMIntegrationHandler] ⚠️ Unknown notification type, showing by default:', notificationType);
        return true;
    }
  }

  /**
   * ============================================
   * 알림 설정 캐시 초기화
   * ============================================
   * 사용자가 알림 설정을 변경했을 때 호출하여 즉시 반영
   */
  clearSettingsCache() {
    this.settingsCache = null;
    this.settingsCacheTime = 0;
    logger.info('[FCMIntegrationHandler] 🔄 Notification settings cache cleared');
  }

  /**
   * ============================================
   * 서비스 정리
   * ============================================
   */
  cleanup() {
    // 모든 타이머 정리
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts.clear();

    // Set 초기화
    this.processedMessages.clear();

    // 캐시 초기화
    this.clearSettingsCache();

    console.log('[FCMIntegrationHandler] 🗑️ Cleanup completed');
  }
}

// Singleton 인스턴스 export
export default new FCMIntegrationHandler();
