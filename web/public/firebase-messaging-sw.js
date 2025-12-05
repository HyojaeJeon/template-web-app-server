/**
 * firebase-messaging-sw.js - Firebase 서비스 워커
 * Local App MVP - 백그라운드 푸시 알림 처리
 * 
 * @description
 * - 백그라운드 FCM 메시지 처리
 * - 알림 클릭 이벤트 처리
 * - 딥링크 라우팅
 * - Local어 우선 알림 표시
 */

// Firebase 스크립트 import
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Firebase 설정
const firebaseConfig = {
  apiKey: "your-firebase-api-key-here",
  authDomain: "template.firebaseapp.com",
  projectId: "template",
  storageBucket: "template.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-firebase-app-id"
};

// Firebase 앱 초기화
firebase.initializeApp(firebaseConfig);

// Firebase 메시징 인스턴스
const messaging = firebase.messaging();

// 백그라운드 메시지 수신 처리
messaging.onBackgroundMessage((payload) => {
  console.log('📨 백그라운드 FCM 메시지 수신:', payload);
  
  const { notification, data } = payload;
  
  // Local어 메시지 우선 표시
  const notificationTitle = data?.titleVi || notification?.title || '새로운 알림';
  const notificationBody = data?.bodyVi || notification?.body || '새로운 메시지가 도착했습니다';
  
  // 알림 옵션 설정
  const notificationOptions = {
    body: notificationBody,
    icon: data?.icon || '/icons/notification-icon.svg',
    badge: '/icons/badge-icon.svg',
    image: notification?.image,
    tag: data?.tag || `sw-${Date.now()}`,
    data: {
      ...data,
      timestamp: Date.now(),
      originalPayload: payload
    },
    requireInteraction: data?.requireInteraction === 'true',
    actions: parseNotificationActions(data?.actions),
    vibrate: parseVibrationPattern(data?.vibrationPattern),
    silent: data?.silent === 'true'
  };
  
  // 알림 표시
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 이벤트 처리
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ 알림 클릭:', event.notification.data);
  
  event.notification.close();
  
  const data = event.notification.data;
  const action = event.action;
  
  // 액션 버튼 클릭 처리
  if (action) {
    handleNotificationAction(action, data);
  } else {
    // 알림 본체 클릭 시 딥링크 처리
    const deepLink = data?.deepLink;
    if (deepLink) {
      handleDeepLink(deepLink, data);
    } else {
      // 기본 동작: 앱 포커스
      focusOrOpenApp();
    }
  }
});

// 알림 닫기 이벤트 처리
self.addEventListener('notificationclose', (event) => {
  console.log('❌ 알림 닫기:', event.notification.data);
  
  // 알림 통계 업데이트 (선택적)
  const data = event.notification.data;
  if (data?.notificationId) {
    trackNotificationEvent('dismissed', data.notificationId);
  }
});

/**
 * 알림 액션 파싱
 */
function parseNotificationActions(actionsString) {
  if (!actionsString) return [];
  
  try {
    const actions = JSON.parse(actionsString);
    return actions.map(action => ({
      action: action.id,
      title: action.titleVi || action.title,
      icon: action.icon
    })).slice(0, 2); // 최대 2개 액션만 지원
  } catch (error) {
    console.warn('알림 액션 파싱 실패:', error);
    return [];
  }
}

/**
 * 진동 패턴 파싱
 */
function parseVibrationPattern(patternString) {
  if (!patternString) return [200, 100, 200];
  
  try {
    return JSON.parse(patternString);
  } catch (error) {
    return [200, 100, 200];
  }
}

/**
 * 알림 액션 처리
 */
function handleNotificationAction(action, data) {
  console.log(`🎯 액션 처리: ${action}`, data);
  
  // 액션별 처리 로직
  switch (action) {
    case 'accept_order':
      openApp(`/orders/${data.orderId}?action=accept`);
      break;
      
    case 'reject_order':
      openApp(`/orders/${data.orderId}?action=reject`);
      break;
      
    case 'view_order':
      openApp(`/orders/${data.orderId}`);
      break;
      
    case 'reconnect_pos':
      openApp('/settings/pos?action=reconnect');
      break;
      
    case 'check_pos':
      openApp('/settings/pos');
      break;
      
    case 'view_inventory':
      if (data.itemId) {
        openApp(`/inventory/${data.itemId}`);
      } else {
        openApp('/inventory');
      }
      break;
      
    default:
      console.warn(`알 수 없는 액션: ${action}`);
      focusOrOpenApp();
  }
}

/**
 * 딥링크 처리
 */
function handleDeepLink(deepLink, data) {
  console.log(`🔗 딥링크 처리: ${deepLink}`, data);
  
  // 딥링크별 라우팅
  switch (deepLink) {
    case 'new_order':
      openApp(data.orderId ? `/orders/${data.orderId}` : '/orders');
      break;
      
    case 'order_status':
      openApp(data.orderId ? `/orders/${data.orderId}` : '/orders');
      break;
      
    case 'pos_alert':
      openApp('/settings/pos');
      break;
      
    case 'inventory_alert':
      openApp(data.itemId ? `/inventory/${data.itemId}` : '/inventory');
      break;
      
    case 'review_alert':
      openApp(data.reviewId ? `/reviews/${data.reviewId}` : '/reviews');
      break;
      
    case 'sales_milestone':
      openApp('/analytics/revenue');
      break;
      
    case 'system_announcement':
      openApp(data.announcementId ? `/announcements/${data.announcementId}` : '/announcements');
      break;
      
    default:
      console.warn(`알 수 없는 딥링크: ${deepLink}`);
      openApp('/dashboard');
  }
}

/**
 * 앱 열기 또는 포커스
 */
function focusOrOpenApp() {
  return clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(clientList => {
    if (clientList.length > 0) {
      // 이미 열린 창이 있으면 포커스
      return clientList[0].focus();
    } else {
      // 새 창 열기
      return clients.openWindow('/');
    }
  });
}

/**
 * 특정 URL로 앱 열기
 */
function openApp(url) {
  const fullUrl = url.startsWith('http') ? url : `${self.location.origin}${url}`;
  
  return clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(clientList => {
    // 같은 URL을 가진 창이 이미 있는지 확인
    for (const client of clientList) {
      if (client.url === fullUrl && 'focus' in client) {
        return client.focus();
      }
    }
    
    // 기존 창을 새 URL로 네비게이트하거나 새 창 열기
    if (clientList.length > 0) {
      return clientList[0].navigate(fullUrl).then(() => clientList[0].focus());
    } else {
      return clients.openWindow(fullUrl);
    }
  });
}

/**
 * 알림 이벤트 추적
 */
function trackNotificationEvent(eventType, notificationId) {
  // 선택적: 알림 통계를 서버로 전송
  fetch('/api/notifications/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      eventType,
      notificationId,
      timestamp: Date.now()
    })
  }).catch(error => {
    console.warn('알림 이벤트 추적 실패:', error);
  });
}

// 서비스 워커 설치 및 활성화
self.addEventListener('install', (event) => {
  console.log('🔧 Firebase 서비스 워커 설치됨');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Firebase 서비스 워커 활성화됨');
  event.waitUntil(clients.claim());
});