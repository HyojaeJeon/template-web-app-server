/**
 * Mobile Client GraphQL Schema
 * Location: /graphql/clients/mobile/schema.js
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import resolvers from './resolvers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadSchema = () => {
  try {
    // 공통 타입 로드
    const scalarsPath = join(__dirname, '../../types/scalars.graphql');
    const enumsPath = join(__dirname, '../../types/enums.graphql');
    const baseTypesPath = join(__dirname, '../../types/index.graphql');

    // Base schema (Query, Mutation types)
    const baseSchemaPath = join(__dirname, './base-schema.graphql');

    // Mobile auth 스키마
    const authSchemaPath = join(__dirname, './auth/schema.graphql');

    // 스키마 파일 읽기
    const scalars = readFileSync(scalarsPath, 'utf8');
    const enums = readFileSync(enumsPath, 'utf8');
    const baseTypes = readFileSync(baseTypesPath, 'utf8');
    const baseSchema = readFileSync(baseSchemaPath, 'utf8');
    const authSchema = readFileSync(authSchemaPath, 'utf8');

    // 스키마 병합
    return `
${scalars}
${enums}
${baseTypes}
${baseSchema}
${authSchema}
    `;
  } catch (error) {
    console.error('[모바일 스키마] 스키마 로드 실패:', error);
    throw new Error(`모바일 스키마 로드 실패: ${error.message}`);
  }
};

export const typeDefs = loadSchema();
export { resolvers };
export default { typeDefs, resolvers };
