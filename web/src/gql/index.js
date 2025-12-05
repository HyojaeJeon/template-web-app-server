/**
 * Web Client GraphQL Export
 * GraphQL 쿼리, 뮤테이션 통합 export
 *
 * @description
 * - Fragment 미사용
 * - W_ prefix (Web client)
 *
 * @author Template Project
 */

// GraphQL 설정
export { gql } from './gqlSetup.js';

// 기본 쿼리
export * from './queries/basic.js';

// Auth 도메인
export * from './queries/auth.js';
export * from './mutations/auth.js';
