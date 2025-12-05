# Web Development Rules

## Directory Structure
```
src/
├── app/                 # Next.js App Router 페이지
├── config/              # 환경설정
├── features/            # 기능별 모듈 (auth 등)
├── gql/
│   ├── queries/         # GraphQL 쿼리
│   └── mutations/       # GraphQL 뮤테이션
├── lib/                 # 라이브러리 설정 (apolloClient 등)
├── middleware/          # Next.js 미들웨어
├── providers/           # Context Providers
└── shared/
    ├── apollo/          # Apollo 관련 유틸
    ├── components/
    │   └── ui/          # 재사용 UI 컴포넌트
    ├── constants/       # 상수 정의
    ├── contexts/        # React Context
    ├── hooks/           # Custom Hooks
    ├── messages/        # 에러/성공 메시지 코드
    └── utils/           # 유틸리티
```

## GraphQL Conventions

### Subscription 금지
- **GraphQL Subscription 절대 사용 금지**
- 실시간 기능은 Socket.IO 사용 (`src/providers/socketNamespaces/`)

### Query/Mutation Prefix
- **Web Client**: `s` prefix (Store의 약자)
- 예시: `S_GET_ORDERS`, `S_CREATE_ORDER`

### 필드 선택 규칙 (중요)
- **UI에서 실제 필요한 필드만 요청** (over-fetching 금지)
- 불필요한 필드 요청 시 성능 저하 발생
```javascript
// Good - 필요한 필드만 요청
query { sGetOrders { id status createdAt } }

// Bad - 모든 필드 요청
query { sGetOrders { id status createdAt customer { ... } items { ... } ... } }
```

### Query 작성
```javascript
// 파일 위치: src/gql/queries/{domain}.js
import { gql } from '@/gql/gqlSetup';

export const S_GET_ORDERS = gql`
  query SGetOrders($input: SGetOrdersInput!) {
    sGetOrders(input: $input) {
      success
      orders { id status }
    }
  }
`;
```

### Mutation 작성
```javascript
// 파일 위치: src/gql/mutations/{domain}.js
export const S_CREATE_ORDER = gql`
  mutation SCreateOrder($input: SCreateOrderInput!) {
    sCreateOrder(input: $input) {
      success
      order { id }
    }
  }
`;
```

## UI Components

### 재사용 컴포넌트 위치
```
src/shared/components/ui/
├── buttons/       # PrimaryButton, SecondaryButton, IconButton
├── inputs/        # TextInput, NumberInput, PasswordInput
├── modals/        # Modal, ConfirmModal
├── feedback/      # Toast, Loading, EmptyState
├── layout/        # Container, Card, Grid
└── navigation/    # Dropdown, Tabs, Breadcrumb
```

### 컴포넌트 사용 원칙
1. **기존 컴포넌트 우선 사용** - 새 컴포넌트 생성 전 기존 것 확인
2. **Props 활용** - 스타일/동작 변경은 props로 처리
3. **designTokens 사용** - 색상/크기는 `designTokens.js` 참조

## Message System

### 메시지 코드 체계
```
1xxxx: 에러 메시지
2xxxx: 성공 메시지
3xxxx: 정보/안내 메시지
4xxxx: 경고 메시지
5xxxx: 확인/질문 메시지
```

### 사용법
```javascript
import { MessageManager } from '@/shared/messages/MessageManager';
import { ERROR_CODES, SUCCESS_CODES } from '@/shared/messages/MessageCodes';

// 에러 메시지
MessageManager.showError(ERROR_CODES.ORDER_NOT_FOUND);

// 성공 메시지
MessageManager.showSuccess(SUCCESS_CODES.ORDER_CREATED);
```

## Toast System
```javascript
import { useToast } from '@/shared/hooks/ui/useToast';

const { showToast } = useToast();
showToast({ type: 'success', message: t('order.created') });
showToast({ type: 'error', message: t('order.failed') });
```

## Mutation Pattern

### Action Button 처리
```javascript
const [createOrder, { loading }] = useMutation(S_CREATE_ORDER, {
  onCompleted: (data) => {
    if (data.sCreateOrder.success) {
      // 버튼 비활성화 유지 (페이지 이동 또는 모달 종료까지)
      showToast({ type: 'success', message: t('order.success') });
      router.push('/orders');
    }
  },
  onError: (error) => {
    // 에러 토스트 후 버튼 다시 활성화
    showToast({ type: 'error', message: error.message });
  }
});

<Button disabled={loading || isSuccess} onClick={handleSubmit}>
  {t('common.submit')}
</Button>
```

### Cache Update (refetchQueries 없이)
```javascript
const [updateOrder] = useMutation(S_UPDATE_ORDER, {
  update(cache, { data }) {
    // 서버 응답 기반 캐시 직접 업데이트
    cache.modify({
      id: cache.identify(data.sUpdateOrder.order),
      fields: { status: () => data.sUpdateOrder.order.status }
    });
  }
});
```

## i18n (다국어)
```javascript
import { useTranslation } from 'next-i18next';

const { t } = useTranslation('common');
t('button.submit');  // 번역 키 사용
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
- 환경별 분기는 코드 내에서 `NODE_ENV`로 처리
- **API KEY 사용 금지** - 모든 API KEY는 서버에만 존재, 클라이언트는 서버 API 호출

## Development Checklist
- [ ] 서버 스키마/리졸버 확인 후 클라이언트 코드 작성
- [ ] 에러/성공 코드의 다국어 메시지 추가 확인
- [ ] 기존 UI 컴포넌트 재사용 여부 확인
- [ ] Action 버튼 성공 시 비활성화 유지
- [ ] 실패 시 토스트 표시 후 버튼 재활성화
