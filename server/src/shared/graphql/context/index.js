/**
 * GraphQL Context 모듈 통합 진입점
 * 모든 Context 관련 모듈을 중앙에서 관리하고 export
 */

// Settings Context
export * from './settingsContext.js';

/**
 * 통합 Context 객체
 * 모든 Context 모듈을 하나의 객체로 구성
 */
export default {
  settings: () => import('./settingsContext.js')
};