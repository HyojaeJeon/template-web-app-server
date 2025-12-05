/**
 * FCM (Firebase Cloud Messaging) 서비스
 * 푸시 알림 관리를 위한 통합 서비스
 */

import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import Config from 'react-native-config';
import notifee from '@notifee/react-native';
import { getApolloClient } from '@services/apollo/apolloClient';
import { M_REGISTER_FCM_TOKEN, M_UPDATE_FCM_TOKEN, M_REMOVE_FCM_TOKEN } from '@gql/mutations/fcm';
import { getDeviceInfo, getPlatformType, getDeviceLanguage, getDeviceTimezone } from '@shared/utils/deviceInfo';
// import notificationService from '@services/notifications/notificationService'; // 파일이 존재하지 않음
import i18n from '@shared/i18n';

class FCMService {
  constructor() {
    this.fcmToken = null;
    this.messageListener = null;
    this.notificationOpenedListener = null;
    this.notificationListener = null;
  }

  /**
   * 안전한 문자열 변환 헬퍼 함수
   * ReadableNativeMap, 객체, 기타 타입을 안전하게 문자열로 변환
   */
  safeGetString(value, defaultValue = '') {
    if (typeof value === 'string') {
      return value;
    }

    if (value === null || value === undefined) {
      return defaultValue;
    }

    if (typeof value === 'object') {
      try {
        // ReadableNativeMap이나 일반 객체를 JSON 문자열로 변환
        return JSON.stringify(value);
      } catch (error) {
        console.warn('Failed to stringify object:', error);
        return defaultValue;
      }
    }

    // 숫자, 불린 등을 문자열로 변환
    return String(value);
  }

  /**
   * 안전한 숫자 변환 헬퍼 함수
   */
  safeGetNumber(value, defaultValue = 0) {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    }

    if (typeof value === 'object' && value !== null) {
      try {
        const parsed = parseInt(JSON.stringify(value), 10);
        return isNaN(parsed) ? defaultValue : parsed;
      } catch (error) {
        console.warn('Failed to convert object to number:', error);
        return defaultValue;
      }
    }

    return defaultValue;
  }

  /**
   * 안전한 객체 변환 헬퍼 함수
   */
  safeGetObject(value, defaultValue = {}) {
    if (typeof value === 'object' && value !== null) {
      try {
        // ReadableNativeMap을 일반 객체로 변환하기 위해 JSON 과정을 거침
        return JSON.parse(JSON.stringify(value));
      } catch (error) {
        console.warn('Failed to convert to plain object:', error);
        return defaultValue;
      }
    }

    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        return defaultValue;
      }
    }

    return defaultValue;
  }

  /**
   * FCM 초기화
   */
  async initialize() {
    try {
      console.log('🚀 [FCMService] FCM Service 초기화 시작');

      // 권한 체크 및 요청
      console.log('🔐 [FCMService] 권한 체크 시작...');
      const hasPermission = await this.checkPermission();
      console.log('🔐 [FCMService] 권한 체크 결과:', hasPermission);

      if (!hasPermission) {
        console.warn('⚠️ [FCMService] FCM 권한 없음, 초기화 중단');
        return false;
      }

      // iOS: 원격 알림 등록 (getToken 호출 전 필수!)
      if (Platform.OS === 'ios') {
        console.log('📱 [FCMService] iOS 원격 알림 등록 시작...');
        await this.registerForRemoteNotifications();
        console.log('✅ [FCMService] iOS 원격 알림 등록 완료');
      }

      // FCM 토큰 가져오기 및 서버 등록
      console.log('🔑 [FCMService] FCM 토큰 가져오기 시작...');
      const token = await this.getToken();

      if (!token) {
        console.warn('⚠️ [FCMService] FCM 토큰 발급 실패, 초기화 계속 진행');
      } else {
        console.log('✅ [FCMService] FCM 토큰 발급 성공');
      }

      // 푸시 알림 채널 생성 (Android)
      console.log('📢 [FCMService] 알림 채널 생성 시작...');
      await this.createNotificationChannel();

      // 리스너 등록
      console.log('👂 [FCMService] 리스너 등록 시작...');
      this.registerListeners();

      // 백그라운드 메시지 핸들러 등록
      console.log('🔄 [FCMService] 백그라운드 핸들러 등록 시작...');
      this.registerBackgroundHandler();

      console.log('✅ [FCMService] FCM Service 초기화 완료');
      return true;
    } catch (error) {
      console.error('❌ [FCMService] FCM 초기화 최종 오류:', {
        error,
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      return false;
    }
  }

  /**
   * 권한 체크 및 요청
   */
  async checkPermission() {
    try {
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ FCM 권한 승인됨');
        return true;
      } else {
        console.log('⚠️ FCM 권한 없음, 권한 요청 시작');
        return await this.requestPermission();
      }
    } catch (error) {
      console.error('❌ FCM 권한 체크 실패:', error);
      return false;
    }
  }

  /**
   * 권한 요청
   */
  async requestPermission() {
    try {
      if (Platform.OS === 'android') {
        // Android 13+ 알림 권한 요청
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: i18n.t('permission:notifications.title'),
              message: i18n.t('permission:notifications.message'),
              buttonNeutral: i18n.t('common:actions.later'),
              buttonNegative: i18n.t('common:actions.deny'),
              buttonPositive: i18n.t('common:actions.allow')}
          );

          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Android 알림 권한 승인');
            return true;
          }
        }
        return true; // Android 13 미만은 자동 승인
      } else {
        // iOS 권한 요청
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('iOS 알림 권한 승인');
          await this.registerForRemoteNotifications();
        }

        return enabled;
      }
    } catch (error) {
      console.error('권한 요청 실패:', error);
      return false;
    }
  }

  /**
   * iOS 원격 알림 등록
   */
  async registerForRemoteNotifications() {
    if (Platform.OS === 'ios') {
      try {
        // iOS 시뮬레이터는 APNs를 지원하지 않으므로 타임아웃 설정
        const registerPromise = messaging().registerDeviceForRemoteMessages();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('SIMULATOR_TIMEOUT')), 3000);
        });

        await Promise.race([registerPromise, timeoutPromise]);
        console.log('✅ [FCMService] iOS 원격 알림 등록 완료 (실제 디바이스)');
      } catch (error) {
        if (error.message === 'SIMULATOR_TIMEOUT' || error.code === 'messaging/unknown-error') {
          console.warn('⚠️ [FCMService] iOS 시뮬레이터 감지 - 원격 알림 등록 건너뜀');
          console.warn('⚠️ [FCMService] 실제 iOS 디바이스에서 테스트하거나 Android 에뮬레이터를 사용하세요');
          // 시뮬레이터에서는 에러를 무시하고 계속 진행
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * FCM 토큰 가져오기 및 서버 등록
   */
  async getToken() {
    try {
      console.log('🔑 [FCMService] FCM 토큰 발급 시작');

      // 저장된 토큰 확인
      let fcmToken = await AsyncStorage.getItem('fcmToken');
      console.log('📦 [FCMService] AsyncStorage에서 토큰 확인:', fcmToken ? '토큰 존재' : '토큰 없음');

      if (!fcmToken) {
        console.log('🔧 [FCMService] Firebase messaging().getToken() 호출 시도...');

        // 새 토큰 발급
        try {
          fcmToken = await messaging().getToken();
          console.log('✅ [FCMService] messaging().getToken() 성공:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'null');
        } catch (getTokenError) {
          console.error('❌ [FCMService] messaging().getToken() 실패:', {
            error: getTokenError,
            message: getTokenError?.message,
            code: getTokenError?.code,
            stack: getTokenError?.stack
          });
          throw getTokenError;
        }

        if (fcmToken) {
          console.log('✅ [FCMService] 새 FCM 토큰 발급 성공:', fcmToken.substring(0, 20) + '...');

          // 서버에 토큰 등록
          console.log('📤 [FCMService] 서버에 FCM 토큰 등록 시도...');
          const result = await this.registerFCMToken(fcmToken);

          if (!result.success) {
            console.error('⚠️ [FCMService] FCM 토큰 서버 등록 실패, 로컬에만 저장');
            console.error('⚠️ [FCMService] 등록 실패 상세:', result.error);
            // 실패해도 토큰은 저장 (나중에 재시도 가능)
            await AsyncStorage.setItem('fcmToken', fcmToken);
            this.fcmToken = fcmToken;
          }
        } else {
          console.error('❌ [FCMService] FCM 토큰 발급 실패 - messaging().getToken()이 null 반환');
        }
      } else {
        this.fcmToken = fcmToken;
        console.log('📱 [FCMService] 저장된 FCM 토큰 사용:', fcmToken.substring(0, 20) + '...');

        // 저장된 토큰도 서버에 업데이트 (lastUsedAt 갱신)
        console.log('🔄 [FCMService] 서버에 FCM 토큰 업데이트 시도...');
        await this.updateFCMToken(fcmToken);
      }

      console.log('✅ [FCMService] getToken() 완료, 반환값:', fcmToken ? '토큰 있음' : 'null');
      return fcmToken;
    } catch (error) {
      console.error('❌ [FCMService] FCM 토큰 가져오기 최종 실패:', {
        error,
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      return null;
    }
  }

  /**
   * 토큰 리프레시 리스너
   */
  registerTokenRefreshListener() {
    return messaging().onTokenRefresh(async (fcmToken) => {
      console.log('🔄 FCM 토큰 갱신:', fcmToken?.substring(0, 20) + '...');

      // 서버에 업데이트된 토큰 전송
      const result = await this.updateFCMToken(fcmToken);

      if (result.success) {
        console.log('✅ FCM 토큰 갱신 및 서버 업데이트 완료');
      } else {
        console.error('⚠️ FCM 토큰 갱신 실패, 로컬에만 저장');
        // 실패해도 로컬에는 저장
        await AsyncStorage.setItem('fcmToken', fcmToken);
        this.fcmToken = fcmToken;
      }
    });
  }

  /**
   * 서버에 FCM 토큰 등록
   * Apollo Client를 사용하여 GraphQL Mutation 실행
   */
  async registerFCMToken(token) {
    try {
      console.log('🚀 FCM 토큰 서버 등록 시작:', token?.substring(0, 20) + '...');

      // 인증 토큰 확인 - 없으면 등록 건너뜀 (나중에 재시도)
      const { getValidToken } = require('@services/apollo/tokenManager');
      const authToken = await getValidToken();

      if (!authToken) {
        console.warn('⚠️ [FCMService] 인증 토큰 없음, FCM 등록 건너뜀 (로그인 후 재시도)');
        // 토큰만 로컬에 저장하고 반환 (나중에 updateFCMToken으로 재시도)
        await AsyncStorage.setItem('fcmToken', token);
        this.fcmToken = token;
        return { success: false, error: 'No auth token', needsRetry: true };
      }

      // 디바이스 정보 수집
      const deviceInfo = await getDeviceInfo();
      const platform = getPlatformType();
      const language = getDeviceLanguage();
      const timezone = getDeviceTimezone();

      console.log('📱 디바이스 정보:', {
        platform,
        language,
        timezone,
        brand: deviceInfo.brand,
        model: deviceInfo.model,
      });

      // Apollo Client 가져오기
      const client = await getApolloClient();

      // FCM 토큰 등록 Mutation 실행
      const { data, errors } = await client.mutate({
        mutation: M_REGISTER_FCM_TOKEN,
        variables: {
          input: {
            token,
            platform,
            language,
            timezone,
            deviceInfo,
          },
        },
      });

      if (errors) {
        console.error('❌ FCM 토큰 등록 실패 (GraphQL 에러):', errors);
        return { success: false, error: errors };
      }

      if (data?.mRegisterFCMToken?.success) {
        console.log('✅ FCM 토큰 서버 등록 성공:', data.mRegisterFCMToken.message);

        // AsyncStorage에 토큰 저장
        await AsyncStorage.setItem('fcmToken', token);
        this.fcmToken = token;

        return { success: true, data: data.mRegisterFCMToken };
      } else {
        console.error('❌ FCM 토큰 등록 실패:', data?.mRegisterFCMToken?.message);
        return { success: false, message: data?.mRegisterFCMToken?.message };
      }
    } catch (error) {
      console.error('❌ FCM 토큰 서버 등록 오류:', error);
      return { success: false, error };
    }
  }

  /**
   * 서버에 FCM 토큰 업데이트
   */
  async updateFCMToken(token) {
    try {
      console.log('🔄 FCM 토큰 서버 업데이트 시작');

      // 인증 토큰 확인 - 없으면 업데이트 건너뜀
      const { getValidToken } = require('@services/apollo/tokenManager');
      const authToken = await getValidToken();

      if (!authToken) {
        console.warn('⚠️ [FCMService] 인증 토큰 없음, FCM 업데이트 건너뜀');
        return { success: false, error: 'No auth token', needsRetry: true };
      }

      // 디바이스 정보 수집 (선택적)
      const deviceInfo = await getDeviceInfo();

      // Apollo Client 가져오기
      const client = await getApolloClient();

      // FCM 토큰 업데이트 Mutation 실행
      const { data, errors } = await client.mutate({
        mutation: M_UPDATE_FCM_TOKEN,
        variables: {
          input: {
            token,
            deviceInfo,
          },
        },
      });

      if (errors) {
        console.error('❌ FCM 토큰 업데이트 실패 (GraphQL 에러):', errors);

        // 토큰을 찾을 수 없는 경우, 새로 등록 시도
        const errorCode = errors[0]?.extensions?.errorCode;
        const errorMessage = errors[0]?.message;

        console.log('🔍 [DEBUG] Error details:', {
          errorCode,
          errorMessage,
          fullExtensions: errors[0]?.extensions
        });

        // M8058 에러 또는 "토큰을 찾을 수 없습니다" 메시지 확인
        if (errorCode === 'M8058' || errorMessage?.includes('토큰을 찾을 수 없습니다')) {
          console.log('⚠️ 토큰이 서버에 없음, 새로 등록 시도...');
          return await this.registerFCMToken(token);
        }

        return { success: false, error: errors };
      }

      if (data?.mUpdateFCMToken?.success) {
        console.log('✅ FCM 토큰 서버 업데이트 성공:', data.mUpdateFCMToken.message);

        // AsyncStorage에 토큰 저장
        await AsyncStorage.setItem('fcmToken', token);
        this.fcmToken = token;

        return { success: true, data: data.mUpdateFCMToken };
      } else {
        console.error('❌ FCM 토큰 업데이트 실패:', data?.mUpdateFCMToken?.message);

        // 토큰을 찾을 수 없는 경우, 새로 등록 시도
        console.log('⚠️ 토큰이 서버에 없음, 새로 등록 시도...');
        return await this.registerFCMToken(token);
      }
    } catch (error) {
      console.error('❌ FCM 토큰 서버 업데이트 오류:', error);

      // 업데이트 실패 시 등록 시도
      console.log('⚠️ 업데이트 실패, 새로 등록 시도...');
      return await this.registerFCMToken(token);
    }
  }

  /**
   * 서버에서 FCM 토큰 제거 (로그아웃 시)
   */
  async unregisterFCMToken() {
    try {
      console.log('🗑️ FCM 토큰 서버 제거 시작');

      const token = await AsyncStorage.getItem('fcmToken');
      if (!token) {
        console.log('⚠️ 저장된 FCM 토큰 없음, 제거 생략');
        return { success: true };
      }

      // Apollo Client 가져오기
      const client = await getApolloClient();

      // FCM 토큰 제거 Mutation 실행
      const { data, errors } = await client.mutate({
        mutation: M_REMOVE_FCM_TOKEN,
        variables: {
          input: {
            token,
          },
        },
      });

      if (errors) {
        console.error('❌ FCM 토큰 제거 실패 (GraphQL 에러):', errors);
        return { success: false, error: errors };
      }

      if (data?.mRemoveFCMToken?.success) {
        console.log('✅ FCM 토큰 서버 제거 성공:', data.mRemoveFCMToken.message);

        // AsyncStorage에서 토큰 삭제
        await AsyncStorage.removeItem('fcmToken');
        this.fcmToken = null;

        return { success: true, data: data.mRemoveFCMToken };
      } else {
        console.error('❌ FCM 토큰 제거 실패:', data?.mRemoveFCMToken?.message);
        return { success: false, message: data?.mRemoveFCMToken?.message };
      }
    } catch (error) {
      console.error('❌ FCM 토큰 서버 제거 오류:', error);
      return { success: false, error };
    }
  }

  /**
   * 레거시 메서드 (하위 호환성)
   * @deprecated registerFCMToken 사용 권장
   */
  async sendTokenToServer(token) {
    console.warn('⚠️ sendTokenToServer는 deprecated입니다. registerFCMToken 사용을 권장합니다.');
    return await this.registerFCMToken(token);
  }

  /**
   * 알림 채널 생성 (Android) - Notifee 사용
   */
  async createNotificationChannel() {
    if (Platform.OS === 'android') {
      try {
        // 기본 알림 채널
        const defaultChannelId = await notifee.createChannel({
          id: 'default-channel',
          name: '알림',
          description: '일반 알림',
          importance: 4, // AndroidImportance.HIGH
          sound: 'default',
          vibration: true,
          vibrationPattern: [300, 500]
        });
        console.log(`기본 알림 채널 생성: ${defaultChannelId}`);

        // 채팅 채널
        const chatChannelId = await notifee.createChannel({
          id: 'chat-channel',
          name: '채팅 알림',
          description: '채팅 관련 알림',
          importance: 4, // AndroidImportance.HIGH
          sound: 'default',
          vibration: true,
          vibrationPattern: [300, 300]
        });
        console.log(`채팅 알림 채널 생성: ${chatChannelId}`);
      } catch (error) {
        console.error('알림 채널 생성 실패:', error);
      }
    }
  }

  /**
   * 메시지 리스너 등록
   */
  registerListeners() {
    console.log('🎧 FCM 리스너 등록 시작');

    // 포그라운드 메시지 수신
    this.messageListener = messaging().onMessage(async (remoteMessage) => {
      console.log('📩 FCM 포그라운드 메시지 수신:', {
        messageId: remoteMessage?.messageId,
        hasNotification: !!remoteMessage?.notification,
        hasData: !!remoteMessage?.data,
        notificationTitle: remoteMessage?.notification?.title,
        dataType: typeof remoteMessage?.data});

      try {
        // ============================================
        // FCMIntegrationHandler를 통한 통합 처리
        // ============================================
        // Socket.IO와의 중복 체크 및 우선순위 관리
        const FCMIntegrationHandler = (await import('./FCMIntegrationHandler')).default;
        const result = await FCMIntegrationHandler.handleFCMMessage(remoteMessage);

        if (!result.success) {
          console.log('[FCMService] ⏭️ FCM message skipped:', result.reason);
          return;
        }

        console.log('[FCMService] ✅ FCM message processed:', result.source);

      } catch (error) {
        console.error('[ERROR] FCM 포그라운드 메시지 처리 실패:', error);
      }
    });

    // 백그라운드에서 알림 클릭 시
    this.notificationOpenedListener = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('👆 FCM 백그라운드 알림 클릭:', {
        messageId: remoteMessage?.messageId,
        hasData: !!remoteMessage?.data,
        dataType: typeof remoteMessage?.data});

      try {
        this.handleNotificationOpen(remoteMessage);
      } catch (error) {
        console.error('[ERROR] FCM 백그라운드 알림 클릭 처리 실패:', error);
      }
    });

    // 앱이 종료된 상태에서 알림 클릭으로 앱 실행 시
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('[API] FCM 종료 상태 알림으로 앱 실행:', {
            messageId: remoteMessage?.messageId,
            hasData: !!remoteMessage?.data,
            dataType: typeof remoteMessage?.data});

          try {
            this.handleNotificationOpen(remoteMessage);
          } catch (error) {
            console.error('[ERROR] FCM 종료 상태 알림 처리 실패:', error);
          }
        } else {
          console.log('[INFO] 알림으로 앱 실행되지 않음');
        }
      })
      .catch((error) => {
        console.error('[ERROR] FCM getInitialNotification 실패:', error);
      });

    // 토큰 리프레시 리스너
    this.registerTokenRefreshListener();

    console.log('[SUCCESS] FCM 리스너 등록 완료');
  }

  /**
   * 백그라운드 메시지 핸들러 등록
   */
  registerBackgroundHandler() {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('백그라운드 메시지 수신:', remoteMessage);

      // 백그라운드에서 필요한 처리
      // 예: 데이터 업데이트, 배지 카운트 업데이트 등
      await this.updateBadgeCount(remoteMessage);
    });
  }

  /**
   * 로컬 알림 표시
   */
  async showLocalNotification(remoteMessage) {
    try {
      console.log('🔔 FCM 로컬 알림 표시 시작:', {
        hasNotification: !!remoteMessage?.notification,
        hasData: !!remoteMessage?.data,
        notificationType: typeof remoteMessage?.notification,
        dataType: typeof remoteMessage?.data});

      const { notification, data } = remoteMessage || {};

      // 안전한 데이터 변환
      const safeData = this.safeGetObject(data, {});
      const safeNotification = this.safeGetObject(notification, {});

      // 안전한 문자열 추출
      const title = this.safeGetString(safeNotification?.title || notification?.title, '알림');
      const body = this.safeGetString(safeNotification?.body || notification?.body, '');
      const channelId = this.safeGetString(safeData?.channelId || data?.channelId, 'default-channel');

      console.log('🔔 처리된 알림 데이터:', {
        title,
        body: body.substring(0, 50) + (body.length > 50 ? '...' : ''),
        channelId,
        dataKeys: Object.keys(safeData)});

      await notifee.displayNotification({
        title,
        body,
        data: safeData,
        android: {
          channelId,
          smallIcon: 'ic_notification',
          largeIcon: null,
          priority: 4, // AndroidPriority.HIGH
          visibility: 1, // AndroidVisibility.PUBLIC
          importance: 4, // AndroidImportance.HIGH
          sound: 'default',
          vibrationPattern: [300, 500],  // ✅ 짝수 개 패턴: [on, off]
          pressAction: {
            id: 'default'},
          style: {
            type: 1, // AndroidStyle.BIGTEXT
            text: body}},
        ios: {
          sound: 'default',
          criticalVolume: 1.0}});

      console.log('[SUCCESS] FCM 로컬 알림 표시 완료');
    } catch (error) {
      console.error('[ERROR] FCM 로컬 알림 표시 실패:', error);

      // 기본 알림이라도 표시 시도
      try {
        await notifee.displayNotification({
          title: '알림',
          body: '새로운 알림이 도착했습니다.',
          android: {
            channelId: 'default-channel',
            smallIcon: 'ic_notification',
            sound: 'default',
            vibrationPattern: [300, 300],  // ✅ 짝수 개 패턴: [on, off]
            pressAction: {
              id: 'default'}},
          ios: {
            sound: 'default'}});
      } catch (fallbackError) {
        console.error('[ERROR] 기본 알림도 실패:', fallbackError);
      }
    }
  }

  /**
   * 알림 클릭 처리
   */
  handleNotificationOpen(remoteMessage) {
    try {
      console.log('👆 FCM 알림 클릭 처리 시작:', {
        hasData: !!remoteMessage?.data,
        dataType: typeof remoteMessage?.data});

      const { data } = remoteMessage || {};

      if (!data) {
        console.log('[WARNING] 알림 클릭 데이터 없음');
        return;
      }

      // 안전한 데이터 변환
      const safeData = this.safeGetObject(data, {});
      const notificationType = this.safeGetString(safeData.type || data.type, '');

      console.log('👆 처리된 클릭 데이터:', {
        type: notificationType,
        dataKeys: Object.keys(safeData)});

      // 알림 타입에 따른 화면 이동
      switch (notificationType) {
        case 'CHAT':
          const chatRoomId = this.safeGetString(safeData.chatRoomId || data.chatRoomId, '');
          if (chatRoomId) {
            console.log('📱 채팅 화면으로 이동:', chatRoomId);
            // TODO: Navigate to chat room
          } else {
            console.warn('[WARNING] 채팅룸 ID 없음');
          }
          break;

        case 'SYSTEM':
          console.log('📱 시스템 알림:', notificationType);
          break;

        default:
          console.log('[INFO] 알림 타입:', notificationType);
      }

      console.log('[SUCCESS] FCM 알림 클릭 처리 완료');
    } catch (error) {
      console.error('[ERROR] FCM 알림 클릭 처리 실패:', error);
    }
  }

  /**
   * 배지 카운트 업데이트
   */
  async updateBadgeCount(remoteMessage) {
    try {
      console.log('🔢 FCM 배지 카운트 업데이트 시작');

      const { data } = remoteMessage || {};

      if (!data) {
        console.log('[WARNING] 배지 카운트 데이터 없음');
        return;
      }

      // 안전한 데이터 변환
      const safeData = this.safeGetObject(data, {});
      const badgeCountValue = safeData.badgeCount || data.badgeCount;

      if (badgeCountValue === undefined) {
        console.log('[WARNING] 배지 카운트 값 없음');
        return;
      }

      // 안전한 숫자 변환
      const count = this.safeGetNumber(badgeCountValue, 0);

      console.log('🔢 처리된 배지 카운트:', count);

      if (Platform.OS === 'ios') {
        await notifee.setBadgeCount(count);
        console.log('🍎 iOS 배지 카운트 설정 완료:', count);
      }

      // 로컬 스토리지에 저장
      await AsyncStorage.setItem('badgeCount', count.toString());
      console.log('💾 배지 카운트 로컬 저장 완료:', count);

      console.log('[SUCCESS] FCM 배지 카운트 업데이트 완료');
    } catch (error) {
      console.error('[ERROR] FCM 배지 카운트 업데이트 실패:', error);
    }
  }

  /**
   * 알림 설정 업데이트
   */
  async updateNotificationSettings(settings) {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));

      // 서버에 설정 동기화
      const response = await fetch(Config.REACT_APP_GRAPHQL_ENDPOINT || (__DEV__ ? 'http://10.0.2.2:4000/graphql' : 'https://api.yourapp.com/graphql'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`},
        body: JSON.stringify({
          query: `
            mutation UpdateNotificationSettings($settings: NotificationSettingsInput!) {
              updateNotificationSettings(settings: $settings) {
                success
                message
              }
            }
          `,
          variables: { settings }})});

      const result = await response.json();
      console.log('알림 설정 업데이트:', result.data);
    } catch (error) {
      console.error('알림 설정 업데이트 실패:', error);
    }
  }

  /**
   * 특정 토픽 구독
   */
  async subscribeToTopic(topic) {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`토픽 구독 성공: ${topic}`);
    } catch (error) {
      console.error(`토픽 구독 실패 (${topic}):`, error);
    }
  }

  /**
   * 특정 토픽 구독 해제
   */
  async unsubscribeFromTopic(topic) {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`토픽 구독 해제: ${topic}`);
    } catch (error) {
      console.error(`토픽 구독 해제 실패 (${topic}):`, error);
    }
  }

  /**
   * 서비스 정리
   */
  cleanup() {
    if (this.messageListener) {
      this.messageListener();
    }
    if (this.notificationOpenedListener) {
      this.notificationOpenedListener();
    }
    if (this.notificationListener) {
      this.notificationListener();
    }
  }
}

export default new FCMService();
