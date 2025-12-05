// ===============================================
// 인증/인가 디렉티브
// Location: /shared/directives/auth.js
// Date: 2025-09-10
// ===============================================
// @auth, @hasRole, @isOwner 등 보안 관련 디렉티브
// ===============================================

import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver } from 'graphql';
import { AuthenticationError, ForbiddenError } from '@apollo/server/errors';

// @auth 디렉티브 - 로그인 필수
export function authDirective(directiveName = 'auth') {
  return {
    authDirectiveTypeDefs: `directive @${directiveName} on FIELD_DEFINITION`,
    
    authDirectiveTransformer: (schema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
          const authDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
          
          if (authDirective) {
            const { resolve = defaultFieldResolver } = fieldConfig;
            
            fieldConfig.resolve = async function (source, args, context, info) {
              if (!context.user) {
                throw new AuthenticationError('인증이 필요합니다');
              }
              return resolve(source, args, context, info);
            };
          }
          
          return fieldConfig;
        }
      })
  };
}

// @hasRole 디렉티브 - 특정 역할 필요
export function hasRoleDirective(directiveName = 'hasRole') {
  return {
    hasRoleDirectiveTypeDefs: `directive @${directiveName}(roles: [UserRoleEnum!]!) on FIELD_DEFINITION`,
    
    hasRoleDirectiveTransformer: (schema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
          const hasRoleDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
          
          if (hasRoleDirective) {
            const { roles } = hasRoleDirective;
            const { resolve = defaultFieldResolver } = fieldConfig;
            
            fieldConfig.resolve = async function (source, args, context, info) {
              if (!context.user) {
                throw new AuthenticationError('인증이 필요합니다');
              }
              
              if (!roles.includes(context.user.role)) {
                throw new ForbiddenError('권한이 없습니다');
              }
              
              return resolve(source, args, context, info);
            };
          }
          
          return fieldConfig;
        }
      })
  };
}

// @isOwner 디렉티브 - 소유자만 접근 가능
export function isOwnerDirective(directiveName = 'isOwner') {
  return {
    isOwnerDirectiveTypeDefs: `directive @${directiveName}(field: String = "userId") on FIELD_DEFINITION`,
    
    isOwnerDirectiveTransformer: (schema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
          const isOwnerDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
          
          if (isOwnerDirective) {
            const { field = 'userId' } = isOwnerDirective;
            const { resolve = defaultFieldResolver } = fieldConfig;
            
            fieldConfig.resolve = async function (source, args, context, info) {
              if (!context.user) {
                throw new AuthenticationError('인증이 필요합니다');
              }
              
              const result = await resolve(source, args, context, info);
              
              // 결과가 객체이고 소유자 필드가 있는 경우 체크
              if (result && typeof result === 'object') {
                const ownerId = result[field];
                if (ownerId && ownerId !== context.user.id) {
                  throw new ForbiddenError('접근 권한이 없습니다');
                }
              }
              
              return result;
            };
          }
          
          return fieldConfig;
        }
      })
  };
}

// @webAuth 디렉티브 - 점주/매니저 인증 (웹 클라이언트)
export function webAuthDirective(directiveName = 'webAuth') {
  return {
    webAuthDirectiveTypeDefs: `directive @${directiveName} on FIELD_DEFINITION`,

    webAuthDirectiveTransformer: (schema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
          const webAuthDirective = getDirective(schema, fieldConfig, directiveName)?.[0];

          if (webAuthDirective) {
            const { resolve = defaultFieldResolver } = fieldConfig;

            fieldConfig.resolve = async function (source, args, context, info) {
              if (!context.storeAccount) {
                throw new AuthenticationError('점주 인증이 필요합니다');
              }

              const validRoles = ['STORE_OWNER', 'STORE_MANAGER', 'ADMIN', 'SUPER_ADMIN'];
              if (!validRoles.includes(context.storeAccount.role)) {
                throw new ForbiddenError('점주 권한이 필요합니다');
              }

              return resolve(source, args, context, info);
            };
          }

          return fieldConfig;
        }
      })
  };
}

// 모든 디렉티브 통합 export
export function createAuthDirectives() {
  const { authDirectiveTypeDefs, authDirectiveTransformer } = authDirective();
  const { hasRoleDirectiveTypeDefs, hasRoleDirectiveTransformer } = hasRoleDirective();
  const { isOwnerDirectiveTypeDefs, isOwnerDirectiveTransformer } = isOwnerDirective();
  const { webAuthDirectiveTypeDefs, webAuthDirectiveTransformer } = webAuthDirective();

  return {
    typeDefs: [
      authDirectiveTypeDefs,
      hasRoleDirectiveTypeDefs,
      isOwnerDirectiveTypeDefs,
      webAuthDirectiveTypeDefs
    ].join('\n'),

    transformers: [
      authDirectiveTransformer,
      hasRoleDirectiveTransformer,
      isOwnerDirectiveTransformer,
      webAuthDirectiveTransformer
    ]
  };
}