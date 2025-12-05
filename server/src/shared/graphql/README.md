# GraphQL Shared Modules

이 디렉토리는 GraphQL 관련 공유 모듈들을 체계적으로 관리하는 중앙 집중식 구조입니다.

## 📁 디렉토리 구조

```
src/shared/graphql/
├── dataloaders/          # DataLoader 모듈들
├── context/              # GraphQL Context 모듈들
├── resolvers/            # 공통 Resolver 모듈들
├── utils/                # GraphQL 유틸리티 함수들
└── README.md            # 이 문서
```

## 🔧 모듈 설명

### DataLoaders (`/dataloaders`)
GraphQL N+1 쿼리 문제 해결을 위한 DataLoader 모듈들을 관리합니다.

**포함 모듈:**
- `analyticsDataLoaders.js` - 분석 데이터 로더
- `authDataLoaders.js` - 인증 관련 데이터 로더
- `cartDataLoaders.js` - 장바구니 데이터 로더
- `chatCommunicationDataLoaders.js` - 채팅 통신 데이터 로더
- `customerDataLoaders.js` - 고객 데이터 로더
- `deliveryLogisticsDataLoaders.js` - 배송 물류 데이터 로더
- `favoritesDataLoaders.js` - 즐겨찾기 데이터 로더
- `financeDataLoaders.js` - 금융 데이터 로더
- `paymentCouponDataLoaders.js` - 결제 쿠폰 데이터 로더
- `posIntegrationDataLoaders.js` - POS 통합 데이터 로더
- `printDataLoaders.js` - 인쇄 데이터 로더
- `reviewFeedbackDataLoaders.js` - 리뷰 피드백 데이터 로더
- `settingsDataLoaders.js` - 설정 데이터 로더
- `storeMenuDataLoaders.js` - 매장 메뉴 데이터 로더

### Context (`/context`)
GraphQL Context 객체 구성에 필요한 모듈들을 관리합니다.

**포함 모듈:**
- `settingsContext.js` - 설정 컨텍스트

### Resolvers (`/resolvers`)
~~공통으로 사용되는 GraphQL Resolver 함수들을 관리합니다.~~

**⚠️ 변경 사항 (2025-09-17):**
- 공통 리졸버들이 각 도메인별 리졸버로 이동됨
- `userTypeResolvers.js` → Mobile/Store auth 도메인으로 통합
- 이제 빈 디렉토리로 제거됨

### Utils (`/utils`)
GraphQL 관련 유틸리티 함수들을 관리합니다.

**현재 상태:** 향후 확장을 위한 기본 구조만 준비

## 📦 사용 방법

### 개별 모듈 Import
```javascript
// 특정 DataLoader 가져오기
import { favoritesDataLoaders } from '@shared/graphql/dataloaders';

// 특정 Context 가져오기
import { settingsContext } from '@shared/graphql/context';

// 특정 Resolver 가져오기
import { userTypeResolvers } from '@shared/graphql/resolvers';
```

### 통합 모듈 Import
```javascript
// 전체 GraphQL 모듈 가져오기
import sharedGraphQL from '@shared/graphql';

// 사용 예시
const dataLoaders = await sharedGraphQL.dataloaders;
const context = await sharedGraphQL.context;
const resolvers = await sharedGraphQL.resolvers;
```

### Shared Index를 통한 Import
```javascript
// 메인 shared index를 통한 접근
import shared from '@shared';

// GraphQL 모듈 접근
const graphqlModules = await shared.graphql;
const dataLoaders = await graphqlModules.dataloaders;
```

## 🎯 아키텍처 원칙

### 1. 중앙 집중식 관리
- 모든 GraphQL 공통 모듈을 한 곳에서 관리
- 일관된 export/import 패턴 유지

### 2. 모듈 독립성
- 각 모듈은 독립적으로 동작 가능
- 순환 참조 방지

### 3. 확장성
- 새로운 모듈 추가 시 기존 구조에 영향 없음
- index.js 파일을 통한 표준화된 export

### 4. 성능 최적화
- Dynamic import를 통한 지연 로딩
- 필요한 모듈만 선택적 로드

## 🔄 마이그레이션 히스토리

### 2025-09-17: GraphQL Shared 모듈 재구조화
- **이전 위치:** `/server/src/graphql/shared/`
- **새 위치:** `/server/src/shared/graphql/`
- **변경 사항:**
  1. DataLoader 모듈들을 중앙 집중식으로 이동
  2. 각 하위 디렉토리에 index.js 생성
  3. 메인 shared/index.js에 GraphQL 모듈 export 추가
  4. 구조 문서화 완료

### 개선 사항
- ✅ 일관된 모듈 구조
- ✅ 표준화된 export 패턴
- ✅ 향후 확장 용이성
- ✅ 중앙 집중식 관리

## 📝 향후 계획

### 단기 계획
- [ ] GraphQL 스키마 유틸리티 추가
- [ ] 공통 필드 리졸버 구현
- [ ] 에러 처리 리졸버 표준화

### 장기 계획
- [ ] GraphQL 성능 모니터링 도구
- [ ] 자동화된 DataLoader 생성 도구
- [ ] GraphQL 스키마 검증 도구

## 🤝 기여 가이드라인

새로운 모듈을 추가할 때는 다음 규칙을 따라주세요:

1. **파일명:** camelCase 사용 (예: `newModuleDataLoaders.js`)
2. **Export:** 모든 함수/객체를 named export로 제공
3. **문서화:** JSDoc 주석으로 함수 설명 추가
4. **Index 업데이트:** 해당 디렉토리의 index.js에 export 추가
5. **테스트:** 가능한 경우 단위 테스트 작성

## ⚠️ 주의사항

- 이 디렉토리의 모듈들은 **공통 모듈**입니다
- 클라이언트별 특화 로직은 각각의 clients 디렉토리에서 관리
- 순환 참조를 피하기 위해 의존성 그래프 확인 필요
- 성능에 민감한 DataLoader는 캐시 전략 고려