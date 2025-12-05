# Mobile App Development Rules

## Directory Structure
```
src/
├── config/              # 환경설정
├── features/            # 기능별 모듈
├── gql/
│   ├── queries/         # GraphQL 쿼리
│   ├── mutations/       # GraphQL 뮤테이션
│   └── types/           # Input 타입 정의
├── navigation/
│   ├── navigators/      # Stack/Tab Navigators
│   ├── stacks/          # 스택별 네비게이션
│   └── config/          # 네비게이션 설정
├── providers/           # Context Providers
├── services/
│   └── apollo/          # Apollo Client 설정
├── store/               # Redux Store
└── shared/
    ├── components/
    │   └── ui/          # 재사용 UI 컴포넌트
    ├── constants/       # 상수 정의
    ├── design/          # 디자인 토큰
    └── utils/           # 유틸리티
```

## GraphQL Conventions

### Subscription 금지
- **GraphQL Subscription 절대 사용 금지**
- 실시간 기능은 Socket.IO 사용 (`src/services/socket/`)

### Query/Mutation Prefix
- **Mobile Client**: `m` prefix (Mobile의 약자)
- 예시: `M_GET_PROFILE`, `M_UPDATE_PROFILE`

### 필드 선택 규칙 (중요)
- **UI에서 실제 필요한 필드만 요청** (over-fetching 금지)
- 불필요한 필드 요청 시 성능 저하 발생
```javascript
// Good - 필요한 필드만 요청
query { mGetProfile { id fullName avatarUrl } }

// Bad - 모든 필드 요청
query { mGetProfile { id fullName phone email addresses { ... } ... } }
```

### Query 작성
```javascript
// 파일 위치: src/gql/queries/{domain}.js
import { gql } from '../gqlSetup';

export const M_GET_PROFILE = gql`
  query MGetProfile {
    mGetProfile {
      success
      user { id fullName phone }
    }
  }
`;
```

### Mutation 작성
```javascript
// 파일 위치: src/gql/mutations/{domain}.js
export const M_UPDATE_PROFILE = gql`
  mutation MUpdateProfile($input: MUpdateProfileInput!) {
    mUpdateProfile(input: $input) {
      success
      user { id fullName }
    }
  }
`;
```

### Export Pattern
```javascript
// src/gql/index.js에서 통합 export
export * from './queries/auth';
export * from './mutations/auth';
```

## UI Components

### 재사용 컴포넌트 위치
```
src/shared/components/ui/
├── buttons/       # Button, IconButton
├── cards/         # Card, ListCard
├── feedback/      # Toast, Loading, EmptyState
├── images/        # Avatar, Image
├── inputs/        # TextInput, SearchInput
├── layout/        # Container, SafeArea
├── lists/         # FlatList wrappers
├── modals/        # Modal, BottomSheet
└── navigation/    # Header, TabBar
```

### 컴포넌트 사용 원칙
1. **기존 컴포넌트 우선 사용**
2. **Props로 스타일/동작 커스터마이징**
3. **NativeWind (Tailwind) 스타일링**

## Toast System
```javascript
import { useToast } from '@shared/hooks/useToast';

const { showToast } = useToast();
showToast({ type: 'success', message: t('profile.updated') });
showToast({ type: 'error', message: t('profile.updateFailed') });
```

## Mutation Pattern

### Action Button 처리
```javascript
const [updateProfile, { loading }] = useMutation(M_UPDATE_PROFILE, {
  onCompleted: (data) => {
    if (data.mUpdateProfile.success) {
      // 버튼 비활성화 유지
      showToast({ type: 'success', message: t('success') });
      navigation.goBack();
    }
  },
  onError: (error) => {
    // 에러 토스트 후 버튼 재활성화
    showToast({ type: 'error', message: error.message });
  }
});

<Button
  disabled={loading || isSuccess}
  onPress={handleSubmit}
  title={t('common.save')}
/>
```

### Cache Update
```javascript
const [updateCart] = useMutation(M_UPDATE_CART, {
  update(cache, { data }) {
    // 서버 응답 기반 캐시 업데이트 (refetchQueries 없이)
    cache.modify({
      fields: {
        mGetCart() {
          return data.mUpdateCart.cart;
        }
      }
    });
  }
});
```

## i18n (다국어)
```javascript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
t('button.submit');
```

## Navigation
```javascript
// 스택 정의: src/navigation/stacks/
// 네비게이터: src/navigation/navigators/
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();
navigation.navigate('Profile');
navigation.goBack();
```

## Path Aliases
```javascript
import Component from '@shared/components/ui/Button';
import { useAuth } from '@shared/hooks/useAuth';
import { M_GET_PROFILE } from '@gql/queries/profile';
import { colors } from '@shared/design/tokens';
```

## Language
- **순수 JavaScript만 사용** (TypeScript 사용 금지)
- `.ts`, `.tsx` 파일 생성 금지

## Naming Convention
| 대상 | 규칙 | 예시 |
|-----|------|------|
| 변수명 | camelCase | `userName`, `orderList` |
| 파일명 | camelCase | `userService.js`, `useAuth.js` |
| ENUM 값 | 영문 대문자 | `PENDING`, `COMPLETED` |
| 컴포넌트 | PascalCase | `UserProfile.js`, `OrderList.js` |

**금지**:
- `snake_case` 사용 금지 (`user_name` X)
- `kebab-case` 사용 금지 (`user-service.js` X)

## Environment
- **`.env` 파일 하나만 사용** (`.env.local`, `.env.development` 등 금지)
- 환경별 분기는 코드 내에서 `__DEV__` 또는 환경 변수로 처리
- **API KEY 사용 금지** - 모든 API KEY는 서버에만 존재, 클라이언트는 서버 API 호출

## Development Checklist
- [ ] 서버 m prefix 쿼리/뮤테이션 확인
- [ ] 기존 UI 컴포넌트 재사용 여부 확인
- [ ] 에러/성공 메시지 다국어 추가
- [ ] Action 버튼 성공 시 비활성화 유지
- [ ] 실패 시 토스트 후 버튼 재활성화
- [ ] Apollo Cache 직접 업데이트 (refetchQueries 지양)
