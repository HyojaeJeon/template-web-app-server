/**
 * Admin GraphQL 통합
 * 슈퍼관리자 GraphQL 스키마 및 리졸버 통합 (템플릿 - auth, users only)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { adminResolvers } from './resolvers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ===============================================
// GraphQL 스키마 파일 로드
// ===============================================

// 공통 타입 (scalars, enums)
const scalarsSchema = readFileSync(join(__dirname, '../../types/scalars.graphql'), 'utf8');
const enumsSchema = readFileSync(join(__dirname, '../../types/enums.graphql'), 'utf8');

// Admin 공통 타입 스키마 (Query, Mutation 포함)
const typesSchema = readFileSync(join(__dirname, 'types.graphql'), 'utf8');

// 도메인 스키마 (auth, users만)
const authSchema = readFileSync(join(__dirname, 'auth', 'schema.graphql'), 'utf8');
const usersSchema = readFileSync(join(__dirname, 'users', 'schema.graphql'), 'utf8');

// ===============================================
// Admin GraphQL 스키마 통합
// ===============================================

export const adminTypeDefs = `
${scalarsSchema}
${enumsSchema}
${typesSchema}
${authSchema}
${usersSchema}
`;

// Admin GraphQL 리졸버
export { adminResolvers };

export default {
  typeDefs: adminTypeDefs,
  resolvers: adminResolvers
};
