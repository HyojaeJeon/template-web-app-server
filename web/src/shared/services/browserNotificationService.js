/**
 * 브라우저 알림 서비스
 * - 점주용 웹 시스템의 브라우저 Push 알림 관리
 * - 채팅 알림, 주문 알림 등 통합 관리
 * - 알림 권한 요청 및 상태 관리
 * - 사운드 알림과 연동
 */

'use client';

class BrowserNotificationService {
  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    this.activeNotifications = new Map();
    this.soundEnabled = true;
    this.vibrationEnabled = true;
    this.maxNotifications = 5; // 최대 동시 표시 알림 수
    
    // 오디오 컨텍스트 준비
    this.audioContext = null;
    this.notificationSounds = {
      chat: '/sounds/chat-notification.mp3',
      order: '/sounds/order-notification.mp3',
      urgent: '/sounds/urgent-notification.mp3',
      success: '/sounds/success-notification.mp3',
      warning: '/sounds/warning-notification.mp3'
    };

    this.initializeAudioContext();
  }

  /**
   * 오디오 컨텍스트 초기화
   */
  initializeAudioContext() {
    try {
      if (typeof window !== 'undefined' && window.AudioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
    } catch (error) {
      console.warn('Audio context initialization failed:', error);
    }
  }

  /**
   * 브라우저 알림 지원 확인
   */
  isNotificationSupported() {
    return this.isSupported;
  }

  /**
   * 알림 권한 요청
   */
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Browser notifications are not supported');
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        // 권한 승인 시 테스트 알림 표시
        this.showTestNotification();
      }
      
      return permission;
    } catch (error) {
      console.error('Permission request failed:', error);
      return 'denied';
    }
  }

  /**
   * 테스트 알림 표시
   */
  showTestNotification() {
    this.showNotification({
      title: '알림이 활성화되었습니다',
      message: '이제 실시간 알림을 받을 수 있습니다.',
      type: 'success',
      duration: 3000
    });
  }

  /**
   * 알림 표시
   */
  async showNotification({
    title,
    message,
    type = 'info', // 'info', 'success', 'warning', 'error', 'chat', 'order'
    icon = '/icons/info-notification.svg',
    badge = '/icons/badge-96x96.svg',
    tag = null,
    data = null,
    actions = [],
    duration = 0, // 0 = 자동 닫기 없음
    requireInteraction = false,
    silent = false,
    vibrate = null,
    onClick = null,
    onClose = null,
    onAction = null
  }) {
    // 권한 확인
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    // 최대 알림 수 제한
    if (this.activeNotifications.size >= this.maxNotifications) {
      this.clearOldestNotification();
    }

    // 알림 옵션 구성
    const options = {
      body: message,
      icon: this.getIconForType(type, icon),
      badge,
      tag: tag || `notification-${Date.now()}`,
      data: { ...data, type, timestamp: Date.now() },
      requireInteraction,
      silent: silent || !this.soundEnabled,
      vibrate: vibrate || (this.vibrationEnabled ? [200, 100, 200] : undefined),
      actions: actions.map(action => ({
        action: action.id,
        title: action.title,
        icon: action.icon
      }))
    };

    try {
      // 브라우저 알림 생성
      const notification = new Notification(title, options);
      
      // 알림 ID로 관리
      const notificationId = options.tag;
      this.activeNotifications.set(notificationId, {
        notification,
        timestamp: Date.now(),
        type
      });

      // 이벤트 리스너 설정
      notification.onclick = (event) => {
        event.preventDefault();
        notification.close();
        this.activeNotifications.delete(notificationId);
        
        if (onClick) {
          onClick(event);
        } else {
          // 기본 동작: 창 포커스
          if (window.parent) {
            window.parent.focus();
          }
          window.focus();
        }
      };

      notification.onclose = (event) => {
        this.activeNotifications.delete(notificationId);
        if (onClose) {
          onClose(event);
        }
      };

      notification.onerror = (event) => {
        console.error('Notification error:', event);
        this.activeNotifications.delete(notificationId);
      };

      // 사용자 액션 처리 (Chrome, Firefox 지원)
      if ('addEventListener' in notification && actions.length > 0) {
        notification.addEventListener('notificationclick', (event) => {
          const action = event.action;
          if (action && onAction) {
            onAction(action, event);
          }
        });
      }

      // 사운드 재생
      if (!silent && this.soundEnabled) {
        this.playNotificationSound(type);
      }

      // 자동 닫기
      if (duration > 0) {
        setTimeout(() => {
          if (this.activeNotifications.has(notificationId)) {
            notification.close();
          }
        }, duration);
      }

      return notification;

    } catch (error) {
      console.error('Failed to show notification:', error);
      return null;
    }
  }

  /**
   * 채팅 알림 표시 (특화 메서드)
   */
  showChatNotification({
    customerName,
    message,
    chatroomId,
    isVip = false,
    orderNumber = null,
    onReply = null
  }) {
    const title = isVip ? `👑 VIP 고객 ${customerName}님` : `${customerName}님`;
    const actions = [
      {
        id: 'reply',
        title: '답장하기',
        icon: '/icons/reply.svg'
      },
      {
        id: 'view',
        title: '채팅방 보기',
        icon: '/icons/view.svg'
      }
    ];

    if (orderNumber) {
      actions.push({
        id: 'order',
        title: '주문 보기',
        icon: '/icons/order-new.svg'
      });
    }

    return this.showNotification({
      title,
      message: message.length > 50 ? `${message.substring(0, 50)}...` : message,
      type: isVip ? 'urgent' : 'chat',
      tag: `chat-${chatroomId}`,
      data: { chatroomId, customerName, orderNumber },
      actions,
      requireInteraction: isVip,
      onClick: () => {
        // 채팅방으로 이동
        window.location.hash = `#/chat/rooms/${chatroomId}`;
      },
      onAction: (actionId) => {
        switch (actionId) {
          case 'reply':
            if (onReply) {
              onReply(chatroomId);
            } else {
              window.location.hash = `#/chat/rooms/${chatroomId}`;
            }
            break;
          case 'view':
            window.location.hash = `#/chat/rooms/${chatroomId}`;
            break;
          case 'order':
            if (orderNumber) {
              window.location.hash = `#/orders/${orderNumber}`;
            }
            break;
        }
      }
    });
  }

  /**
   * 주문 알림 표시
   */
  showOrderNotification({
    orderNumber,
    customerName,
    status,
    amount,
    items = [],
    onView = null
  }) {
    const statusText = {
      'PENDING': '새로운 주문',
      'CONFIRMED': '주문 확인됨',
      'PREPARING': '조리 중',
      'READY': '픽업 준비 완료',
      'DELIVERING': '배달 중',
      'COMPLETED': '주문 완료',
      'REJECTED': '주문 거절됨'
    }[status] || '주문 업데이트';

    const itemsText = items.length > 0 
      ? items.slice(0, 2).map(item => item.name).join(', ') + (items.length > 2 ? ` 외 ${items.length - 2}개` : '')
      : '';

    return this.showNotification({
      title: `${statusText} - ${orderNumber}`,
      message: `${customerName}님 | ${amount} | ${itemsText}`,
      type: status === 'PENDING' ? 'urgent' : 'order',
      tag: `order-${orderNumber}`,
      data: { orderNumber, customerName, status, amount },
      actions: [
        {
          id: 'view',
          title: '주문 보기',
          icon: '/icons/order-new.svg'
        },
        {
          id: 'chat',
          title: '채팅하기',
          icon: '/icons/chat-notification.svg'
        }
      ],
      requireInteraction: status === 'PENDING',
      onClick: () => {
        window.location.hash = `#/orders/${orderNumber}`;
      },
      onAction: (actionId) => {
        switch (actionId) {
          case 'view':
            if (onView) {
              onView(orderNumber);
            } else {
              window.location.hash = `#/orders/${orderNumber}`;
            }
            break;
          case 'chat':
            window.location.hash = `#/chat/customer/${customerName}`;
            break;
        }
      }
    });
  }

  /**
   * 시스템 알림 표시
   */
  showSystemNotification({
    title,
    message,
    level = 'info', // 'info', 'warning', 'error', 'success'
    persistent = false,
    onDismiss = null
  }) {
    return this.showNotification({
      title: `[시스템] ${title}`,
      message,
      type: level,
      tag: `system-${Date.now()}`,
      duration: persistent ? 0 : 5000,
      requireInteraction: level === 'error',
      actions: level === 'error' ? [
        {
          id: 'dismiss',
          title: '확인',
          icon: '/icons/info.svg'
        }
      ] : [],
      onAction: (actionId) => {
        if (actionId === 'dismiss' && onDismiss) {
          onDismiss();
        }
      }
    });
  }

  /**
   * 타입별 아이콘 가져오기
   */
  getIconForType(type, fallback) {
    const typeIcons = {
      chat: '/icons/chat-notification.svg',
      order: '/icons/order-notification.svg',
      urgent: '/icons/critical-alert.svg',
      success: '/icons/info.svg',
      warning: '/icons/warning.svg',
      error: '/icons/error.svg',
      info: '/icons/info-notification.svg'
    };

    return typeIcons[type] || fallback;
  }

  /**
   * 사운드 재생
   */
  async playNotificationSound(type) {
    if (!this.soundEnabled || !this.audioContext) return;

    try {
      const soundUrl = this.notificationSounds[type] || this.notificationSounds.chat;
      
      // HTML5 오디오로 대체 (더 호환성 높음)
      const audio = new Audio(soundUrl);
      audio.volume = 0.5;
      await audio.play();
      
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  /**
   * 가장 오래된 알림 제거
   */
  clearOldestNotification() {
    let oldestId = null;
    let oldestTime = Date.now();

    this.activeNotifications.forEach((value, key) => {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestId = key;
      }
    });

    if (oldestId) {
      const notification = this.activeNotifications.get(oldestId);
      if (notification) {
        notification.notification.close();
        this.activeNotifications.delete(oldestId);
      }
    }
  }

  /**
   * 모든 알림 제거
   */
  clearAllNotifications() {
    this.activeNotifications.forEach((value) => {
      value.notification.close();
    });
    this.activeNotifications.clear();
  }

  /**
   * 특정 태그의 알림 제거
   */
  clearNotificationByTag(tag) {
    if (this.activeNotifications.has(tag)) {
      const notification = this.activeNotifications.get(tag);
      notification.notification.close();
      this.activeNotifications.delete(tag);
    }
  }

  /**
   * 사운드 설정
   */
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }

  /**
   * 진동 설정
   */
  setVibrationEnabled(enabled) {
    this.vibrationEnabled = enabled;
  }

  /**
   * 알림 설정 가져오기
   */
  getSettings() {
    return {
      supported: this.isSupported,
      permission: this.permission,
      soundEnabled: this.soundEnabled,
      vibrationEnabled: this.vibrationEnabled,
      activeCount: this.activeNotifications.size,
      maxNotifications: this.maxNotifications
    };
  }

  /**
   * 알림 통계 가져오기
   */
  getStatistics() {
    const typeCount = {};
    this.activeNotifications.forEach((value) => {
      typeCount[value.type] = (typeCount[value.type] || 0) + 1;
    });

    return {
      totalActive: this.activeNotifications.size,
      byType: typeCount,
      oldestNotification: Math.min(...Array.from(this.activeNotifications.values()).map(v => v.timestamp))
    };
  }

  /**
   * 서비스 정리
   */
  destroy() {
    this.clearAllNotifications();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

// 싱글톤 인스턴스 생성
const browserNotificationService = new BrowserNotificationService();

// 명시적으로 browserNotificationService를 named export로도 추가
export { browserNotificationService };

export default browserNotificationService;

// 개별 메서드들도 export (편의성)
export const {
  showNotification,
  showChatNotification,
  showOrderNotification,
  showSystemNotification,
  requestPermission,
  clearAllNotifications,
  clearNotificationByTag,
  setSoundEnabled,
  setVibrationEnabled,
  getSettings,
  getStatistics
} = browserNotificationService;