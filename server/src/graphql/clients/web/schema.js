/**
 * Web Client GraphQL Schema
 * Location: /graphql/clients/web/schema.js
 * Purpose: Web 클라이언트 GraphQL 스키마 통합 (템플릿 - auth only)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 모든 GraphQL 스키마 파일을 로드하는 함수
 */
const loadSchema = () => {
  try {
    // 공통 타입 로드
    const scalarsPath = join(__dirname, '../../types/scalars.graphql');
    const enumsPath = join(__dirname, '../../types/enums.graphql');
    const baseTypesPath = join(__dirname, '../../types/index.graphql');

    // Base schema (Query, Mutation types)
    const baseSchemaPath = join(__dirname, './base-schema.graphql');

    // Web auth 스키마
    const authSchemaPath = join(__dirname, './auth/schema.graphql');

    // 스키마 파일 읽기
    const scalarsSchema = readFileSync(scalarsPath, 'utf8');
    const enumsSchema = readFileSync(enumsPath, 'utf8');
    const baseTypesSchema = readFileSync(baseTypesPath, 'utf8');
    const baseSchema = readFileSync(baseSchemaPath, 'utf8');
    const authSchema = readFileSync(authSchemaPath, 'utf8');

    // 스키마 병합
    return `
${scalarsSchema}
${enumsSchema}
${baseTypesSchema}
${baseSchema}
${authSchema}
    `;
  } catch (error) {
    console.error('[Web 스키마] 스키마 로드 실패:', error);
    throw new Error(`Web 스키마 로드 실패: ${error.message}`);
  }
};

export const typeDefs = loadSchema();
export default typeDefs;
