/**
 * Shared 유틸리티 통합 진입점
 * 모든 범용 유틸리티, 에러 시스템, 서비스를 중앙에서 관리
 */

// ========== 에러 시스템 (클라이언트별 독립) ==========
export { getMobileError } from './errorSystem/mobileErrorCodes.js';
export { getWebError } from './errorSystem/webErrorCodes.js';

// ========== 보안 유틸리티 ==========
export * from './utils/security/index.js';
export { 
  jwtManager,
  encryptionManager 
} from './utils/security/index.js';

// ========== 검증 유틸리티 ==========
export * from './utils/validators/index.js';
export { default as validators } from './utils/validators/index.js';

// ========== 시간 유틸리티 ==========
export { default as timeUtils } from './utils/utilities/TimeUtils.js';

// ========== 미들웨어 ==========
export * from './utils/middleware/index.js';

// ========== 서비스 ==========
export * from './utils/services/index.js';

// ========== GraphQL 모듈 ==========
export * from './graphql/dataloaders/index.js';
export * from './graphql/context/index.js';
// resolvers와 utils는 각 도메인별로 분산되어 있음

// ========== 통합 객체 ==========
// 주의: 기존 기본(default) 내보내기는 동적 import에 의존했기 때문에 제거되었습니다.
// 필요한 모듈은 위의 개별 export를 사용하세요.
