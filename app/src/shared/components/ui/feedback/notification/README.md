# Notification Components

## 📁 구조

```
notification/
├── NotificationBadge.js    # 알림 개수 배지
├── NotificationItem.js     # 개별 알림 아이템
├── NotificationCenter.js   # 알림 센터 컨테이너
└── index.js               # Export 통합
```

## 🎯 통합 목적

알림 관련 UI 컴포넌트들을 한 곳에 모아 관리하여:
- 유지보수 용이성 향상
- 일관된 알림 UI/UX 제공
- 재사용성 극대화

## 📊 컴포넌트 분류

### Shared UI Components (여기에 위치)
`/shared/components/ui/feedback/notification/`
- **NotificationBadge**: 알림 개수 표시 배지
- **NotificationItem**: 개별 알림 아이템 UI
- **NotificationCenter**: 알림 목록 컨테이너

### Feature-Specific Components (각 feature에 유지)
`/features/notification/`
- **NotificationScreen**: 전체 알림 화면
- **NotificationList**: 알림 목록 비즈니스 로직
- **NotificationCard**: 알림 카드 (feature 특화)
- **NotificationSettingsScreen**: 알림 설정 화면

`/features/chat/`
- **ChatNotification**: 채팅 전용 알림
- **NotificationSettings**: 채팅 알림 설정

`/features/home/`
- **NotificationBell**: Next.js 점주앱용 (레거시)

## 🔧 사용 방법

### Import 방법
```javascript
// 개별 import
import { NotificationBadge } from '@shared/components/ui/feedback/notification';

// feedback 폴더를 통한 import
import { NotificationBadge, NotificationItem } from '@shared/components/ui/feedback';

// 전체 UI를 통한 import
import { NotificationBadge, NotificationItem } from '@shared/components/ui';
```

### 사용 예시
```javascript
import React from 'react';
import { View } from 'react-native';
import { NotificationBadge, NotificationCenter } from '@shared/components/ui';

const MyComponent = () => {
  return (
    <View>
      <NotificationBadge count={5} />
      <NotificationCenter notifications={notificationList} />
    </View>
  );
};
```

## 🎨 디자인 원칙

1. **일관성**: 모든 알림 컴포넌트는 동일한 디자인 시스템 따름
2. **접근성**: WCAG 2.1 표준 준수
3. **성능**: React.memo를 통한 최적화
4. **다국어**: i18n 지원 (한국어/베트남어/영어)

## 🔄 마이그레이션 가이드

기존 코드에서 마이그레이션 시:
```javascript
// ❌ 기존 (분산된 import)
import NotificationBadge from '@shared/components/ui/feedback/NotificationBadge';

// ✅ 개선 (중앙화된 import)
import { NotificationBadge } from '@shared/components/ui/feedback/notification';
// 또는
import { NotificationBadge } from '@shared/components/ui';
```

## 📱 관련 시스템

### 실시간 알림 (Socket.IO)
- `/services/realtime/handlers/NotificationHandler.js`
- 앱이 활성 상태일 때 실시간 알림 처리

### 푸시 알림 (FCM)
- `/services/notifications/orderNotificationHandler.js`
- 앱이 백그라운드/종료 상태일 때 푸시 알림 처리

### Redux Store
- `/store/slices/notificationSlice.js`
- 알림 상태 관리

## 🚨 주의사항

1. **feature 컴포넌트와 혼동 금지**: features/notification의 컴포넌트는 화면 단위, 여기는 UI 컴포넌트
2. **비즈니스 로직 분리**: UI 컴포넌트에는 순수 UI 로직만 포함
3. **Props 타입 체크**: PropTypes 또는 주석으로 명확한 props 정의