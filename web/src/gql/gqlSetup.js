/**
 * GraphQL Setup for Store Client
 * graphql-tag를 사용하여 Fragment 완벽 지원
 * delivery-app과 동일한 패턴
 */
import { gql } from 'graphql-tag';

// graphql-tag를 직접 export (Fragment 완벽 지원)
export { gql };
export default gql;