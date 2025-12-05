# Server Development Rules

## Directory Structure
```
src/
├── config/              # 환경설정
├── dataloaders/         # DataLoader (N+1 방지)
├── graphql/
│   ├── clients/
│   │   ├── web/         # Web 클라이언트 (s prefix)
│   │   ├── mobile/      # Mobile 클라이언트 (m prefix)
│   │   └── admin/       # Admin 클라이언트 (a prefix)
│   ├── schemas/         # 공통 스키마
│   └── types/           # 공통 타입 리졸버
├── migrations/          # DB 마이그레이션
├── models/              # Sequelize 모델
└── shared/
    ├── cache/           # Redis 캐시
    ├── errorSystem/     # 에러 코드 정의
    ├── successSystem/   # 성공 코드 정의
    ├── utils/           # 유틸리티
    └── websocket/       # Socket.IO
```

## GraphQL Conventions

### Subscription 금지
- **GraphQL Subscription 절대 사용 금지**
- 실시간 기능은 Socket.IO 사용 (`src/shared/websocket/`)

### Prefix Rules
| Client | Prefix | Example |
|--------|--------|---------|
| Web    | `s`    | `sGetOrders`, `sCreateOrder` |
| Mobile | `m`    | `mGetOrders`, `mCreateOrder` |
| Admin  | `a`    | `aGetUsers`, `aCreateUser` |

### Resolver Structure
```javascript
// 파일 위치: src/graphql/clients/{client}/{domain}/resolvers.js
export default {
  Query: {
    sGetOrders: async (_, args, context) => { ... }
  },
  Mutation: {
    sCreateOrder: async (_, args, context) => { ... }
  }
};
```

### Schema Structure
```graphql
# 파일 위치: src/graphql/clients/{client}/{domain}/schema.js
type Query {
  sGetOrders(input: SGetOrdersInput!): SOrdersResponse!
}

type Mutation {
  sCreateOrder(input: SCreateOrderInput!): SOrderResponse!
}
```

### 파일 구조 규칙 (중요)
1. **도메인별 파일 1개씩만**: 각 도메인에 `schema.js`, `resolvers.js` 파일 하나씩만 유지
2. **수정 시 기존 파일 수정**: 새 파일 생성하지 말고 기존 파일에 추가/수정
3. **타입 정의 위치**:
   - Model 타입: `src/graphql/types/index.graphql`
   - ENUM 정의: `src/graphql/types/enums.graphql`

### 페이지네이션
- **PaginationInfo 타입만 사용** (새로운 페이지네이션 타입 생성 금지)
- 위치: `src/graphql/types/index.graphql`
```graphql
type PaginationInfo {
  total: Int!        # 전체 항목 수
  limit: Int!        # 페이지당 항목 수
  offset: Int!       # 건너뛴 항목 수
  hasMore: Boolean!  # 더 많은 항목 존재 여부
}
```

### 공통 타입 파일 위치
| 타입 종류 | 파일 위치 |
|----------|----------|
| Model 타입 (User, Order 등) | `src/graphql/types/index.graphql` |
| ENUM 정의 | `src/graphql/types/enums.graphql` |
| 페이지네이션 | `src/graphql/types/index.graphql` |
| Client Input/Response | `src/graphql/clients/{client}/{domain}/schema.js` |

### 스키마 작성 규칙
- **타입 일치**: 모든 필드명은 `/graphql/types/index.graphql`과 100% 일치
- **extend type 사용**: `extend type Query`, `extend type Mutation` 필수
```graphql
# Good
extend type Query {
  sGetOrders: SOrdersResponse!
}

# Bad - type Query 재정의 금지
type Query {
  sGetOrders: SOrdersResponse!
}
```

### 리졸버 작성 규칙
- **클라이언트별 Auth 래퍼 필수**:
  - Mobile: `withMAuth`
  - Web/Store: `withWAuth`
  - Admin: `withAAuth`
- **에러/성공 코드 필수**: 리졸버 구현 시 정확한 코드 및 메시지 작성
- **다국어 처리**: 한국어만 추가 (ko)
```javascript
// 예시
sCreateOrder: withWAuth(async (_, { input }, context) => {
  // 성공 시
  return { success: true, code: 'S_ORDER_CREATE_SUCCESS', order };

  // 실패 시 - 래퍼의 자동 처리 사용
  throw new CustomError('S_ORDER_INVALID_INPUT', { field: 'quantity' });
});
```

### 절대 금지 사항
| 금지 항목 | 이유 |
|----------|------|
| `type Query` 재정의 | `extend type Query`만 사용 |
| 도메인별 ENUM 정의 | 중앙 집중식 (`enums.graphql`)만 |
| 공통 에러 코드 | 클라이언트별 분리 (S_, M_, A_) |
| 직접 에러 던지기 | Auth 래퍼의 자동 처리 사용 |
| `git checkout` 임의 실행 | 별도 요청 없이 절대 금지 |

## Error/Success Code System

### Error Codes
- 위치: `src/shared/errorSystem/{client}/{domain}/`
- 형식: `{prefix}_{DOMAIN}_{ERROR_NAME}`
```javascript
// 예시: src/shared/errorSystem/web/auth/errors.js
export const S_AUTH_INVALID_CREDENTIALS = {
  code: 'S_AUTH_INVALID_CREDENTIALS',
  message: { ko: '..', en: '..', vi: '..' }
};
```

### Success Codes
- 위치: `src/shared/successSystem/{client}/{domain}/`
- 형식: `{prefix}_{DOMAIN}_{SUCCESS_NAME}`

## Development Rules

### 1. New Domain 추가 시
1. `src/graphql/clients/{client}/{domain}/` 폴더 생성
2. `schema.js`, `resolvers.js` 파일 생성
3. `src/graphql/clients/{client}/resolvers.js`에 import 추가
4. `src/graphql/clients/{client}/schema.js`에 schema 병합

### 2. Sequelize Model 기준
- 쿼리/뮤테이션 오류 시 **모델 정의 및 연관관계**를 기준으로 수정
- 클라이언트 코드는 서버 구현에 맞춤

### 3. DataLoader 사용
- N+1 문제 방지를 위해 반드시 DataLoader 사용
- 위치: `src/dataloaders/`

### 4. Redis 캐시 (필수)
- **자주 이용되는 데이터는 Redis 캐시 적용 필수**
- 위치: `src/shared/cache/`
- 캐시 대상: 설정 데이터, 자주 조회되는 목록, 변경 빈도 낮은 데이터
```javascript
// 예시: src/shared/cache/clients/{client}/domains/
import { cacheGet, cacheSet } from '@shared/cache/core';

const CACHE_KEY = 'stores:list';
const CACHE_TTL = 300; // 5분

// 캐시 조회 → 없으면 DB 조회 → 캐시 저장
let data = await cacheGet(CACHE_KEY);
if (!data) {
  data = await Store.findAll();
  await cacheSet(CACHE_KEY, data, CACHE_TTL);
}
```

### 5. Response Format
```javascript
// 성공 응답
return {
  success: true,
  code: 'S_ORDER_CREATE_SUCCESS',
  data: { ... }
};

// 에러 응답
throw new GraphQLError(message, {
  extensions: { code: 'S_ORDER_NOT_FOUND' }
});
```

## Language
- **순수 JavaScript만 사용** (TypeScript 사용 금지)
- `.ts`, `.tsx` 파일 생성 금지

## Naming Convention
| 대상 | 규칙 | 예시 |
|-----|------|------|
| 변수명 | camelCase | `userName`, `orderList` |
| 파일명 | camelCase | `userService.js`, `orderUtils.js` |
| DB 테이블명 | camelCase | `users`, `orderItems` |
| DB 필드명 | camelCase | `userId`, `createdAt` |
| ENUM 값 | 영문 대문자 | `PENDING`, `COMPLETED`, `CANCELLED` |
| 클래스/모델 | PascalCase | `UserModel`, `OrderService` |
| 컴포넌트 | PascalCase | `UserProfile.js`, `OrderList.js` |

**금지**:
- `snake_case` 사용 금지 (`user_name` X)
- `kebab-case` 사용 금지 (`user-service.js` X)

## Environment
- **`.env` 파일 하나만 사용** (`.env.local`, `.env.development` 등 금지)
- 환경별 분기는 코드 내에서 `NODE_ENV`로 처리
- **모든 API KEY는 서버에만 존재** (클라이언트에 API KEY 노출 금지)
