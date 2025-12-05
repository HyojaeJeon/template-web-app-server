/**
 * Mobile App GraphQL Export
 * GraphQL 쿼리, 뮤테이션 통합 export
 *
 * @description
 * - Fragment 미사용
 * - M_ prefix (Mobile client)
 *
 * @author Template Project
 */

// GraphQL 설정
export { gql } from './gqlSetup';

// Types & Inputs
export * from './types/inputs';

// Auth 도메인
export * from './queries/auth';
export * from './mutations/auth';

// Profile 도메인
export * from './queries/profile';
export * from './mutations/profile';
