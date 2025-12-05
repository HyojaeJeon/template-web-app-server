/**
 * GraphQL Server Setup
 * Apollo Server 기반 GraphQL 서버 설정
 */

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { GraphQLScalarType } from 'graphql';
import { GraphQLError } from 'graphql';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';

// Schema & Resolvers - 새로운 클라이언트별 구조 사용
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
// GraphQL 스키마와 리졸버는 캐시 시스템 초기화 후 동적으로 로드
import db from '../models/index.js';

// 스키마 파일 읽기 유틸리티
const readSchemaFile = (filePath) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    logger.warn('SchemaFileMissing', { path: fullPath });
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
};

// REST API has been fully migrated to GraphQL - all business logic uses GraphQL

// Socket.IO 설정 - UnifiedSocketServer 사용
import { UnifiedSocketServer } from '../shared/websocket/UnifiedSocketServer.js';
import { logger } from '../shared/utils/utilities/Logger.js';
import { buildCorsOptions } from '../shared/config/cors.js';

// 통합 캐시 시스템
import { initializeCacheSystem, checkCacheStatus } from '../shared/cache/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 커스텀 스칼라 타입 정의
const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'Date and time in ISO 8601 format',
  serialize(value) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return value;
    }
    throw new GraphQLError(`Value is not a valid DateTime: ${value}`);
  },
  parseValue(value) {
    if (typeof value === 'string') {
      return new Date(value);
    }
    throw new GraphQLError(`Value is not a valid DateTime string: ${value}`);
  },
  parseLiteral(ast) {
    if (ast.kind === 'StringValue') {
      return new Date(ast.value);
    }
    throw new GraphQLError(`Can only parse strings to DateTime but got a: ${ast.kind}`);
  },
});

// Safe JSON scalar parser (no reliance on `this` in arrow functions)
function parseLiteralJSON(ast) {
  switch (ast.kind) {
  case 'StringValue':
    try { return JSON.parse(ast.value); } catch { return ast.value; }
  case 'IntValue':
    return parseInt(ast.value, 10);
  case 'FloatValue':
    return parseFloat(ast.value);
  case 'BooleanValue':
    return ast.value;
  case 'ObjectValue': {
    const obj = {};
    for (const field of ast.fields) {
      obj[field.name.value] = parseLiteralJSON(field.value);
    }
    return obj;
  }
  case 'ListValue':
    return ast.values.map((v) => parseLiteralJSON(v));
  default:
    return null;
  }
}

const jsonScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON scalar type',
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    return parseLiteralJSON(ast);
  },
});

// Stacktrace를 5줄로 제한하는 유틸리티 함수
function limitStacktrace(stacktrace, limit = 5) {
  if (!stacktrace) return stacktrace;
  if (Array.isArray(stacktrace)) {
    return stacktrace.slice(0, limit);
  }
  if (typeof stacktrace === 'string') {
    return stacktrace.split('\n').slice(0, limit).join('\n');
  }
  return stacktrace;
}

// 클라이언트 감지 함수 (성능 최적화 - 캐싱 추가)
function detectClientType(req, tokenPayload = null) {
  // 캐시된 결과가 있으면 사용
  if (req._clientType) {
    return req._clientType;
  }

  // 1. 명시적 헤더 우선
  const clientType = req.headers['x-client-type'] || '';
  if (clientType === 'mobile' || clientType === 'web' || clientType === 'admin') {
    req._clientType = clientType; // 캐시
    return clientType;
  }

  // 2. 플랫폼 헤더 확인
  const platform = req.headers['x-platform'] || '';
  if (platform === 'ios' || platform === 'android') {
    req._clientType = 'mobile'; // 캐시
    return 'mobile';
  }
  if (platform === 'web') {
    req._clientType = 'web'; // 캐시
    return 'web';
  }

  // 3. 토큰의 audience 클레임 확인
  if (tokenPayload) {
    const aud = tokenPayload.aud;
    if (aud === 'mobile' || (Array.isArray(aud) && aud.includes('mobile'))) {
      req._clientType = 'mobile'; // 캐시
      return 'mobile';
    }
    if (aud === 'web' || (Array.isArray(aud) && aud.includes('web'))) {
      req._clientType = 'web'; // 캐시
      return 'web';
    }
    if (aud === 'admin' || (Array.isArray(aud) && aud.includes('admin'))) {
      req._clientType = 'admin'; // 캐시
      return 'admin';
    }
  }

  // 4. User-Agent 기반 감지 (최후 수단)
  const userAgent = req.headers['user-agent'] || '';
  if (userAgent.includes('React Native') || userAgent.includes('okhttp')) {
    req._clientType = 'mobile'; // 캐시
    return 'mobile';
  }
  if (userAgent.includes('Next.js')) {
    req._clientType = 'web'; // 캐시
    return 'web';
  }

  // 5. 안전한 기본값: null (모호한 경우 게스트/제한 모드)
  logger.warn('detectClientType:UnableToDetermine', {});
  req._clientType = null; // 캐시
  return null;
}

// 클라이언트별 스키마 구성 함수는 동적 import 이후로 이동됨

// GraphQL 서버 생성 함수
/**
 *
 */
export async function createGraphQLServer() {
  logger.info('📦 GraphQL 서버 생성 시작...');

  // Express 앱 생성
  const app = express();
  const httpServer = http.createServer(app);
  logger.info('✅ Express 앱 및 HTTP 서버 생성 완료');

  // 보안/성능 공통 미들웨어 적용 (최상단)
  const isProd = process.env.NODE_ENV === 'production';
  app.use(helmet({ contentSecurityPolicy: isProd ? undefined : false, crossOriginEmbedderPolicy: false }));
  app.use(compression());
  // 중앙 CORS 적용
  const corsOptions = buildCorsOptions();
  app.use(cors(corsOptions));

  // 통합 캐시 시스템 초기화 (스키마 생성 전에 수행)
  try {
    logger.info('🔄 Redis 캐시 시스템 초기화 중...');
    await initializeCacheSystem();
    const { checkRedisConnection } = await import('../config/redis.js');
    const redisStatus = await checkRedisConnection();
    if (redisStatus.status === 'OK') {
      logger.info('✅ Redis 연결 성공', {
        responseTime: `${redisStatus.responseTime}ms`
      });
    } else {
      logger.warn('⚠️ Redis 연결 실패 - 캐시 기능 제한됨');
    }
  } catch (e) {
    if (process.env.SOCKET_AUTH_BYPASS === '1' && process.env.NODE_ENV === 'development') {
      logger.warn('⚠️ Redis 초기화 건너뜀 (SOCKET_AUTH_BYPASS)');
    } else {
      logger.error('❌ Redis 캐시 시스템 초기화 실패', { error: e.message });
      throw e;
    }
  }

  // 캐시 시스템 초기화 완료 후 GraphQL 스키마와 리졸버 동적 로드
  const {
    mobileTypeDefs,
    webTypeDefs,
    adminTypeDefs,
    mobileResolvers,
    webClientResolvers,
    adminResolvers,
    createDataLoaderContext,
    createPerformancePlugin
  } = await import('./index.js');

  // 통합 스키마 생성 - Mobile과 Web 스키마를 모두 포함
  const customScalars = {
    DateTime: dateTimeScalar,
    JSON: jsonScalar,
  };

  const mobileSchema = {
    typeDefs: mobileTypeDefs,
    resolvers: {
      ...mobileResolvers,
      ...customScalars,
    },
  };

  const webSchema = {
    typeDefs: webTypeDefs,
    resolvers: {
      ...webClientResolvers,
      ...customScalars,
    },
  };

  const adminSchema = {
    typeDefs: adminTypeDefs,
    resolvers: {
      ...adminResolvers,
      ...customScalars,
    },
  };

  // 개발환경: 모바일/웹/Admin 스키마의 Query/Mutation 중복 필드 탐지 로깅
  if (process.env.NODE_ENV === 'development') {
    const extractFields = (sdl, typeName) => {
      try {
        const regex = new RegExp(`(?:extend\\s+)?type\\s+${typeName}\\s*\\{([\\s\\S]*?)\\}`, 'g');
        const fields = new Set();
        let m;
        while ((m = regex.exec(sdl)) !== null) {
          const block = m[1];
          block.split('\n').forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const nameMatch = trimmed.match(/^(\w+)\s*\(|^(\w+)\s*:/);
            const name = nameMatch ? (nameMatch[1] || nameMatch[2]) : null;
            if (name) fields.add(name);
          });
        }
        return fields;
      } catch {
        return new Set();
      }
    };

    const mQuery = extractFields(String(mobileSchema.typeDefs || ''), 'Query');
    const wQuery = extractFields(String(webSchema.typeDefs || ''), 'Query');
    const mMut = extractFields(String(mobileSchema.typeDefs || ''), 'Mutation');
    const wMut = extractFields(String(webSchema.typeDefs || ''), 'Mutation');

    const intersect = (a, b) => [...a].filter((x) => b.has(x));
    const dupQ = intersect(mQuery, wQuery);
    const dupM = intersect(mMut, wMut);

    if ((dupQ && dupQ.length) || (dupM && dupM.length)) {
      logger.debug('GraphQL SDL 경고: 중복 필드 가능성', {
        query: dupQ,
        mutation: dupM,
        note: 'unifiedResolvers에서 처리됨. 의도된 것인지 검토 권장.',
      });
    }
  }
  
  // 공통 타입 리졸버 import
  const { typeResolvers } = await import('./types/resolvers.js');

  // 전체 스키마 통합 (Mobile + Web + Admin) - mergeResolvers 사용
  const unifiedResolvers = mergeResolvers([
    mobileSchema.resolvers,
    webSchema.resolvers,
    adminSchema.resolvers,
    typeResolvers,  // 공통 타입 리졸버 추가
    {
      // Custom Scalars
      DateTime: dateTimeScalar,
      JSON: jsonScalar,

      Query: {
        // 🚨 클라이언트별 기본 쿼리 분기 처리
        health: async (parent, args, context, info) => {
          const { clientType } = context;
          if (clientType === 'web') {
            return 'Web GraphQL Server is healthy';
          } else {
            return 'Mobile GraphQL Server is healthy';
          }
        },

        // 클라이언트별 빈 상태 확인
        _empty: async (parent, args, context, info) => {
          const { clientType } = context;
          if (clientType === 'web') {
            return 'Web client schema loaded successfully';
          } else {
            return 'Mobile client schema loaded successfully';
          }
        },
      },

      // GraphQL Subscription 비활성화 - Socket.IO로 마이그레이션 완료
      // 모든 실시간 통신은 UnifiedSocketServer를 통해 처리됩니다
    }
  ]);
  
  // 스키마 명시적 병합으로 충돌 해결
  const mergedTypeDefs = mergeTypeDefs([mobileSchema.typeDefs, webSchema.typeDefs, adminSchema.typeDefs]);
  
  const server = new ApolloServer({
    typeDefs: mergedTypeDefs,
    resolvers: unifiedResolvers,
    // 스키마에 없는 리졸버 필드 무시 (businessNumber, preferredLanguage 등)
    resolverValidationOptions: {
      requireResolversToMatchSchema: 'ignore',
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),

      // ID 타입 정규화 플러그인 (GraphQL ID → 숫자) - Web 클라이언트 전용
      {
        async requestDidStart() {
          return {
            async didResolveOperation(requestContext) {
              // Web 클라이언트 요청만 처리 (Mobile 클라이언트는 영향 없음)
              if (requestContext.contextValue?.clientType !== 'web') {
                return; // Mobile 클라이언트 요청은 스킵
              }

              // args의 모든 *Id 필드를 숫자로 변환
              const normalizeIds = (obj) => {
                if (!obj || typeof obj !== 'object') return obj;

                if (Array.isArray(obj)) {
                  return obj.map(normalizeIds);
                }

                const normalized = {};
                for (const [key, value] of Object.entries(obj)) {
                  // *Id 필드이고 문자열이면 숫자로 변환
                  if (key.endsWith('Id') && typeof value === 'string' && /^\d+$/.test(value)) {
                    normalized[key] = parseInt(value, 10);
                  } else if (typeof value === 'object' && value !== null) {
                    normalized[key] = normalizeIds(value);
                  } else {
                    normalized[key] = value;
                  }
                }
                return normalized;
              };

              // 모든 변수를 정규화 (Web 요청만)
              if (requestContext.request.variables) {
                requestContext.request.variables = normalizeIds(requestContext.request.variables);
              }
            }
          };
        }
      },

      // 성능 최적화 플러그인 추가
      createPerformancePlugin(),
      // GraphQL 오류 로깅 플러그인 추가
      {
        async requestDidStart() {
          return {
            async willSendResponse(requestContext) {
              // 응답 전 오류 로깅
              if (requestContext.errors) {
                requestContext.errors.forEach((error) => {
                  logger.error('GraphQLError', {
                    timestamp: new Date().toISOString(),
                    operation: requestContext.request.operationName,
                    variableKeys: requestContext.request.variables ? Object.keys(requestContext.request.variables) : [],
                    message: error.message,
                    path: error.path,
                    code: error.extensions?.code,
                  });
                });
              }
            },
            async didEncounterErrors(requestContext) {
              // 오류 발생 시 상세 로깅
              logger.error('GraphQLRequestFailed', {
                timestamp: new Date().toISOString(),
                operation: requestContext.request.operationName,
                errorCount: requestContext.errors?.length || 0,
                errors: requestContext.errors?.map(err => ({
                  message: err.message,
                  code: err.extensions?.code,
                  path: err.path,
                })),
              });
            },
          };
        },
      },
    ],
    // 클라이언트별 스키마 동적 적용을 위한 확장 가능
    schemaHash: false,
    formatError: (err, req) => {
      
      // 순환 참조 에러 특별 처리
      if (err.message && err.message.includes('Converting circular structure to JSON')) {
        console.error('❌ Circular reference detected in GraphQL response');
        return {
          message: 'Internal server error: circular reference detected',
          extensions: {
            code: 'CIRCULAR_REFERENCE_ERROR',
            timestamp: new Date().toISOString(),
          },
        };
      }
      
      // 개발 환경에서는 상세한 에러 정보 반환 (순환 참조 제외, stacktrace 5줄 제한)
      if (process.env.NODE_ENV === 'development') {
        try {
          return {
            message: err.message,
            locations: err.locations,
            path: err.path,
            extensions: err.extensions ? {
              code: err.extensions.code,
              timestamp: new Date().toISOString(),
              // stacktrace는 순환 참조 없이 처리하고 5줄로 제한
              ...(err.extensions.stacktrace && { stacktrace: limitStacktrace(err.extensions.stacktrace, 5) }),
              ...(err.stack && { stack: limitStacktrace(err.stack, 5) }),
            } : undefined,
          };
        } catch (jsonError) {
          logger.error('ErrorFormattingGraphQLError', { message: jsonError.message });
          return {
            message: err.message || 'Internal server error',
            extensions: {
              code: 'FORMAT_ERROR',
              timestamp: new Date().toISOString(),
            },
          };
        }
      }
      
      // 운영 환경에서는 안전한 에러 메시지만 반환
      return {
        message: err.message || '서버 오류가 발생했습니다.',
        extensions: {
          code: err.extensions?.code || 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
        },
      };
    },
    introspection: process.env.NODE_ENV === 'development',
  });

  // GraphQL 서버 시작
  await server.start();
  
  // 캐시 워밍업 (선택적 - 프로덕션에서 권장)
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CACHE_WARMUP === 'true') {
    await warmupCache(server);
  }

  // CORS는 중앙화된 미들웨어에서 처리됨

  // Socket.IO 서버 설정 - UnifiedSocketServer 사용
  logger.info('🔄 Socket.IO 서버 초기화 중...');
  const unifiedSocketServer = new UnifiedSocketServer(httpServer);

  // Socket.IO 단일 소켓 초기화 대기 (중요!)
  await unifiedSocketServer.ready();
  logger.info('✅ Socket.IO 서버 연결 성공', {
    transport: 'WebSocket',
    cors: 'configured'
  });

  const io = unifiedSocketServer.io;

  // 모든 실시간 통신은 UnifiedSocketServer를 통해 처리됩니다

  // Express 미들웨어 설정 - JSON 파싱 에러 처리 추가
  app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf, encoding) => {
      // JSON 파싱 전에 유효성 검사
      if (buf && buf.length) {
        req.rawBody = buf;
      }
    }
  }));

  // JSON 파싱 에러 핸들링 미들웨어 (민감정보 마스킹)
  app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      const maskHeaders = (headers = {}) => {
        const h = { ...headers };
        ['authorization', 'cookie', 'set-cookie'].forEach((k) => {
          if (h[k] !== undefined) h[k] = '[REDACTED]';
          const lower = k.toLowerCase();
          if (h[lower] !== undefined) h[lower] = '[REDACTED]';
        });
        return h;
      };

      const safeHeaders = maskHeaders(req.headers || {});
      let raw = req.rawBody ? req.rawBody.toString() : '';
      if (raw && raw.length > 512) raw = raw.slice(0, 512) + '...<truncated>';
      raw = raw.replace(/Bearer\s+[A-Za-z0-9\-_.]+/g, 'Bearer [REDACTED]');

      logger.error('JSONParsingError', {
        error: error.message,
        body: raw || 'N/A',
        path: req.path,
        method: req.method,
        headers: safeHeaders,
      });

      return res.status(400).json({
        errors: [{
          message: 'Invalid JSON in request body',
          extensions: {
            code: 'JSON_PARSE_ERROR',
            details: error.message
          }
        }]
      });
    }
    next(error);
  });
  // GraphQL 요청/응답 최소 로깅 (PII 제거)
  app.use('/graphql', (req, res, next) => {
    const startTime = Date.now();
    const opName = req.body?.operationName || 'Unknown';
    const originalSend = res.send;
    res.send = function (data) {
      const duration = Date.now() - startTime;
      try {
        const payload = typeof data === 'string' ? JSON.parse(data) : data;
        if (payload?.errors?.length) {
          logger.error('GraphQLResponseError', {
            operation: opName,
            durationMs: duration,
            message: payload.errors[0]?.message,
            code: payload.errors[0]?.extensions?.code,
          });
        } else if (process.env.LOG_LEVEL === 'verbose') {
          logger.debug('GraphQLResponse', { operation: opName, durationMs: duration });
        }
      } catch (_) {
        // ignore parse errors in logging path
      }
      return originalSend.call(this, data);
    };
    next();
  });
  // 기본 GraphQL 레이트리미팅
  const graphqlLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false });
  
  app.use('/graphql', graphqlLimiter, expressMiddleware(server, {
    context: async ({ req }) => {
      try {
        // 토큰 갱신 요청인지 확인 (mRefreshToken은 만료된 토큰도 허용)
        const operationName = req.body?.operationName;
        const isRefreshTokenRequest = operationName === 'MRefreshToken' ||
                                      req.body?.query?.includes('mRefreshToken');

        // 토큰 디코드 (클라이언트 타입 감지용)
        let tokenPayload = null;
        const authorization = req.headers.authorization || '';
        if (authorization.startsWith('Bearer ')) {
          const token = authorization.substring(7).trim();
          if (token) {
            try {
              const jwt = await import('jsonwebtoken');
              // 만료 여부와 관계없이 디코드만 수행 (클라이언트 타입 감지용)
              tokenPayload = jwt.default.decode(token);
            } catch (decodeError) {
              // 디코드 실패는 무시 (게스트 요청일 수 있음)
            }
          }
        }

        // 클라이언트 타입 감지 (토큰 정보 활용)
        const clientType = detectClientType(req, tokenPayload);

        // 직접 JWT 인증 처리 (언어 감지보다 먼저)
        let user = null;
        if (!isRefreshTokenRequest) {
          // 일반 요청: 토큰 검증 - AuthMiddleware 직접 사용
          const { getUser } = await import('../shared/utils/auth/AuthMiddleware.js');
          const authResult = await getUser(req, clientType);

          // 만료된 토큰인 경우 특별 처리
          if (authResult?.isExpired === true) {
            user = authResult; // isExpired 플래그를 그대로 전달
          } else {
            user = authResult; // 정상 user 객체 또는 null
          }
        } else if (tokenPayload) {
          // 토큰 갱신 요청: 디코드된 정보 사용
          user = {
            id: tokenPayload.id,
            phone: tokenPayload.phone,
            isExpired: true  // 토큰 만료 상태 표시
          };
        }

        // 언어 감지 (Accept-Language, X-Language 헤더, 사용자 설정)
        const xLanguageHeader = req.headers['x-language'];
        const acceptLanguageHeader = req.headers['accept-language'];
        console.log('[GraphQL Context] Language headers:', {
          'x-language': xLanguageHeader,
          'accept-language': acceptLanguageHeader,
          'user.language': user?.language
        });
        const language = xLanguageHeader || acceptLanguageHeader?.split(',')[0]?.split('-')[0] || user?.language || 'vi';
        console.log('[GraphQL Context] Resolved language:', language);
        
        // ═══════════════════════════════════════════════════════════════════════════
        // 성능 최적화된 DataLoader 컨텍스트 생성
        // N+1 쿼리 문제 해결을 위한 배치 로딩 시스템
        // ═══════════════════════════════════════════════════════════════════════════
        const dataLoaderContext = await createDataLoaderContext();

        // Cart DataLoader 추가 생성
        let cartLoaders = {};
        try {
          const { createCartDataLoaders } = await import('../shared/graphql/dataloaders/cartDataLoaders.js');
          cartLoaders = createCartDataLoaders();
        } catch (error) {
          console.warn('Cart DataLoaders 생성 실패:', error);
        }

        // Enhanced Context 시스템 적용 (Settings DataLoader, 성능 모니터링 등)
        const { createEnhancedGraphQLContext } = await import('../shared/graphql/context/dataLoaderIntegration.js');

        // clientType에 따라 적절한 사용자 객체 설정
        const baseContext = {
          req,
          user: clientType === 'mobile' ? user : null,  // 모바일 앱 사용자
          storeAccount: clientType === 'web' ? user : null,  // 점주 계정
          adminAccount: clientType === 'admin' ? user : null,  // 관리자 계정
          io,
          clientType,
          language,
          isAuthenticated: !!user,
          loaders: {
            ...dataLoaderContext.loaders,
            ...cartLoaders  // Cart DataLoaders 추가
          },
          cache: dataLoaderContext.cache
        };

        // Enhanced Context 적용
        const enhancedContext = createEnhancedGraphQLContext(baseContext);
        
        // Context 생성 로깅 - 개발 환경에서만 상세히
        if (process.env.NODE_ENV === 'development' && process.env.LOG_LEVEL === 'verbose') {
          logger.debug('ContextReady', { operation: req.body?.operationName, userId: user?.id || null });
        }
        
        // Enhanced Context 반환 (Settings DataLoader, 성능 모니터링, 디버깅 포함)
        return enhancedContext;
      } catch (error) {
        logger.error('ContextError', {
          timestamp: new Date().toISOString(),
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
        
        // 토큰 갱신 요청인지 확인
        const operationName = req.body?.operationName;
        const isRefreshTokenRequest = operationName === 'MRefreshToken' ||
                                      req.body?.query?.includes('mRefreshToken');

        // JWT 만료 등의 GraphQL 에러는 토큰 갱신 요청이 아닌 경우만 전파
        if (!isRefreshTokenRequest && error instanceof GraphQLError &&
            (error.extensions?.code === 'ACCESS_TOKEN_EXPIRED' || error.extensions?.code === 2003)) {
          logger.debug('JWTExpired', {
            timestamp: new Date().toISOString(),
            code: error.extensions.code,
            message: error.message,
          });
          throw error; // Apollo Server가 직접 처리하도록 전파
        }

        // 클라이언트 타입과 언어 정보는 req에서 감지
        const clientType = detectClientType(req);
        const language = req.headers['x-language'] || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'vi';
        
        // ═══════════════════════════════════════════════════════════════════════════
        // 에러 케이스에도 Enhanced Context 제공 (선택적)
        // ═══════════════════════════════════════════════════════════════════════════
        let enhancedContext = null;
        try {
          const dataLoaderContext = await createDataLoaderContext();
          const { createEnhancedGraphQLContext } = await import('../shared/graphql/context/dataLoaderIntegration.js');

          const baseErrorContext = {
            user: null,
            req,
            io,
            clientType,
            language,
            isAuthenticated: false,
            loaders: dataLoaderContext?.loaders || {},
            cache: dataLoaderContext?.cache || new Map()
          };

          enhancedContext = createEnhancedGraphQLContext(baseErrorContext);
        } catch (loaderError) {
          logger.warn('EnhancedContextInitFailed', { error: loaderError.message });
          // Fallback to basic context
          enhancedContext = {
            user: null,
            req,
            io,
            clientType,
            language,
            isAuthenticated: false,
            loaders: {},
            cache: new Map()
          };
        }

        return enhancedContext;
      }
    },
  }));

  // 로컬 이미지 서빙 미들웨어 (개발 환경용)
  if (process.env.NODE_ENV === 'development') {
    app.use('/local-images', express.static(
      path.join(__dirname, '../../../docs/[배달K데이터]/stores'),
      {
        setHeaders: (res, filePath) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'public, max-age=3600');
        },
        fallthrough: false,
        index: false
      }
    ));
    logger.info('📸 로컬 이미지 서버 활성화', {
      path: '/local-images',
      directory: 'docs/[배달K데이터]/stores'
    });
  }

  // 헬스 체크 엔드포인트
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'duri-api',
      graphql: '/graphql',
    });
  });

  // 캐시 상태 확인 (이미 초기화됨)
  try {
    const cacheStatus = await checkCacheStatus();
    logger.info('CacheStatus', { initialized: cacheStatus.initialized });
  } catch (e) {
    logger.warn('CacheStatusUnavailable');
  }

  // Elasticsearch 초기화 (선택적 - 검색 기능용)
  try {
    logger.info('🔄 Elasticsearch 연결 시도 중...');
    const { default: elasticsearchService } = await import('../shared/elasticsearch/index.js');
    const esConnected = await elasticsearchService.initialize();
    if (esConnected) {
      const { checkElasticsearchConnection } = await import('../config/elasticsearch.js');
      const esStatus = await checkElasticsearchConnection();
      logger.info('✅ Elasticsearch 연결 성공', {
        cluster: esStatus.cluster_name,
        status: esStatus.cluster_status,
        nodes: esStatus.number_of_nodes
      });
    } else {
      logger.warn('⚠️ Elasticsearch 연결 실패 - 검색 기능 제한됨');
    }
  } catch (error) {
    logger.warn('⚠️ Elasticsearch 초기화 건너뜀', { reason: error.message });
  }

  return { app, httpServer, server, io };
}

// 서버 시작 함수
/**
 *
 * @param port
 */
export async function startGraphQLServer(port = 4000) {
  try {
    // 데이터베이스 초기화 (개발 시 BYPASS 허용)
    if (process.env.SOCKET_AUTH_BYPASS === '1' && process.env.NODE_ENV === 'development') {
      logger.warn('⚠️ DB 초기화 건너뜀 (SOCKET_AUTH_BYPASS)');
    } else {
      logger.info('🔄 MySQL 데이터베이스 연결 중...');
      const { initializeDatabase } = await import('../config/database.js');
      await initializeDatabase();
      logger.info('✅ MySQL 데이터베이스 연결 성공', {
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'delivery_mvp_test'
      });

      // Sequelize 모델 초기화 추가
      logger.info('🔄 Sequelize 모델 초기화 중...');
      const models = await import('../models/index.js');
      await models.default.initializeModels();
      logger.info('✅ Sequelize 모델 초기화 완료');
    }

    const { app, httpServer } = await createGraphQLServer();

    await new Promise((resolve) => {
      httpServer.listen(port, '0.0.0.0', resolve);  // 모든 네트워크 인터페이스에서 수신
    });
    
    // 서버 시작 요약 로그
    logger.info('='.repeat(60));
    logger.info('🚀 GraphQL API Server Started Successfully');
    logger.info('='.repeat(60));

    try {
      const { checkCacheStatus } = await import('../shared/cache/index.js');
      const { checkElasticsearchConnection } = await import('../config/elasticsearch.js');
      const cache = await checkCacheStatus();
      const es = await checkElasticsearchConnection();

      logger.info('🔧 서비스 상태:', {
        '🗺️ Database (MySQL)': '✅ 연결됨',
        '🔴 Redis Cache': cache?.initialized ? '✅ 연결됨' : '⚠️ 미연결',
        '🔍 Elasticsearch': es?.status === 'OK' ? '✅ 연결됨' : '⚠️ 미연결',
        '🌐 Socket.IO': '✅ 연결됨'
      });

      logger.info('🌍 엔드포인트:', {
        'GraphQL': `http://localhost:${port}/graphql`,
        'Health Check': `http://localhost:${port}/health`,
        'WebSocket': `ws://localhost:${port}`,
        'Environment': process.env.NODE_ENV || 'development'
      });
    } catch (_) {
      logger.info('🌍 엔드포인트:', {
        'GraphQL': `http://localhost:${port}/graphql`,
        'Health Check': `http://localhost:${port}/health`,
        'WebSocket': `ws://localhost:${port}`,
        'Environment': process.env.NODE_ENV || 'development'
      });
    }

    logger.info('='.repeat(60))
    
    return { app, httpServer };
  } catch (error) {
    logger.error('GraphQL 서버 시작 실패', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

export default { createGraphQLServer, startGraphQLServer };
