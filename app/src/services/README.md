# Services 디렉토리 구조 설명

## 📁 디렉토리 구조

```
services/
├── notifications/              # 푸시 알림 (FCM 기반)
│   ├── FCMService.js          # Firebase Cloud Messaging 서비스
│   └── FCMIntegrationHandler.js # Socket.IO와 FCM 통합 처리
├── realtime/                  # 실시간 통신 (Socket.IO 기반)
│   ├── SocketManager.js       # Socket.IO 클라이언트 관리
│   ├── handlers/             # 도메인별 실시간 이벤트 핸들러
│   │   ├── ChatHandler.js
│   │   └── NotificationHandler.js
│   ├── hooks/               # React Hooks
│   │   └── useRealtime.js
│   ├── constants/           # 이벤트 상수
│   │   └── events.js
│   └── index.js            # 통합 진입점
├── apollo/                  # GraphQL 클라이언트
├── auth/                   # 인증 서비스
└── location/               # 위치 서비스
```

## 🎯 notifications vs realtime 구분 이유

### 1. **notifications/** - 푸시 알림 시스템
- **목적**: 앱이 백그라운드 또는 종료 상태일 때 알림 전달
- **기술**: Firebase Cloud Messaging (FCM) + Notifee
- **사용 시나리오**:
  - 앱이 종료된 상태에서 알림 수신
  - 백그라운드에서 채팅 메시지 알림
  - 시스템 공지사항 알림
- **특징**:
  - 디바이스 토큰 기반
  - 플랫폼별(iOS/Android) 처리 필요
  - 배터리 효율적
  - 오프라인 상태에서도 수신 가능

### 2. **realtime/** - 실시간 통신 시스템
- **목적**: 앱이 활성 상태일 때 실시간 데이터 동기화
- **기술**: Socket.IO WebSocket
- **사용 시나리오**:
  - 실시간 채팅
  - 즉각적인 상태 변경 반영
- **특징**:
  - 양방향 통신
  - 낮은 지연시간
  - 실시간 이벤트 스트림
  - 활성 연결 필요

## 🔄 상호 보완 관계

```
사용자 시나리오:
1. 앱 활성 상태 → realtime (Socket.IO) 사용
2. 앱 백그라운드 → notifications (FCM) 사용
3. 앱 재활성화 → realtime 재연결 + 놓친 이벤트 동기화
```

### 통합 전략
```javascript
// 앱이 활성화될 때
if (appState === 'active') {
  // Socket.IO로 실시간 업데이트
  realtimeService.connect();
  realtimeService.on('chat:received', handleChatMessage);
} else {
  // FCM으로 푸시 알림
  FCMService.onMessage(handlePushNotification);
}
```

## 🚨 주의사항

### 중복 처리 방지
- 같은 이벤트가 Socket.IO와 FCM 양쪽에서 중복 수신되지 않도록 주의
- 서버에서 앱 상태를 추적하여 적절한 채널로만 전송

### 에너지 효율
- Socket.IO는 배터리 소모가 크므로 필요한 경우에만 연결
- 백그라운드에서는 FCM만 사용하여 배터리 절약

### 연결 상태 관리
```javascript
// 연결 상태에 따른 폴백
if (realtimeService.isConnected()) {
  // 실시간 업데이트
} else {
  // 폴백: REST API 또는 FCM 의존
}
```

## 🔗 관련 문서

- [Socket.IO 공식 문서](https://socket.io/docs/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Notifee 문서](https://notifee.app/)
