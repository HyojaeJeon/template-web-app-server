/**
 * HTTP Link with Upload Support
 * GraphQL 엔드포인트 설정 및 플랫폼별 URL 관리
 * apollo-upload-client를 사용하여 파일 업로드 지원
 *
 * ⚠️ 중요: 매 요청마다 serverConfigVar()에서 동적으로 URL을 가져옵니다.
 * 이를 통해 설정 화면에서 서버 환경을 변경하면 즉시 적용됩니다.
 */

import { createUploadLink } from 'apollo-upload-client';
import { Platform } from 'react-native';
import logger from '@shared/utils/system/logger';
import { getServerUrl, serverConfigVar, SERVER_ENV } from '../serverConfig';

/**
 * 플랫폼별 엔드포인트 URL 가져오기
 * serverConfig에서 설정을 읽어서 URL 결정
 * ⚠️ 매 요청마다 호출되어 동적으로 URL 반환
 */
const getEndpointUrl = () => {
  const config = serverConfigVar();
  const url = getServerUrl(config);

  if (__DEV__) {
    const envLabel = config.serverEnv === SERVER_ENV.SIMULATOR
      ? (Platform.OS === 'ios' ? '🖥️ iOS Simulator' : '🤖 Android Emulator')
      : config.serverEnv === SERVER_ENV.REAL_DEVICE
        ? '📱 Real Device'
        : config.serverEnv === SERVER_ENV.PRODUCTION
          ? '🚀 Production'
          : '🔧 Custom';

    console.log(`${envLabel} - GraphQL endpoint:`, {
      platform: Platform.OS,
      serverEnv: config.serverEnv,
      url,
    });
  }

  return url;
};

export const createHttpLink = () => {
  // 초기 URL (실제로는 매 요청마다 동적으로 결정됨)
  const initialUri = getEndpointUrl();

  if (__DEV__) {
    logger.info('GraphQL endpoint (initial):', {
      platform: Platform.OS,
      uri: initialUri
    });
  }

  // createUploadLink는 파일 업로드를 지원하는 Apollo Link
  // 자동으로 multipart/form-data를 처리하고 GraphQL Multipart Request 스펙을 따름
  return createUploadLink({
    // 초기 URI 설정 (하지만 실제 요청은 fetch에서 동적 URL 사용)
    uri: initialUri,
    // 추가 fetch 옵션
    fetchOptions: {
      credentials: 'include'
    },
    // ⚠️ 동적 URL: 매 요청마다 serverConfigVar()에서 현재 설정을 읽어 URL 결정
    fetch: (_originalUri, options) => {
      // 🔄 매 요청마다 현재 설정에서 URL을 동적으로 가져옴
      const dynamicUri = getEndpointUrl();

      if (__DEV__) {
        logger.debug('GraphQL request (dynamic URL):', {
          dynamicUri,
          method: options.method,
          hasAuth: !!options.headers?.authorization,
          contentType: options.headers?.['content-type'],
          bodySize: options.body?.length
        });

        // 요청 본문 로깅 (개발 모드에서만)
        if (options.body) {
          try {
            const body = JSON.parse(options.body);
            logger.debug('GraphQL request body:', {
              operationName: body.operationName,
              query: body.query?.substring(0, 200) + '...',
              variablesCount: Object.keys(body.variables || {}).length
            });
          } catch (e) {
            logger.debug('GraphQL request body (raw):', options.body?.substring?.(0, 200));
          }
        }
      }

      // 🎯 동적 URL로 fetch 실행
      return fetch(dynamicUri, options)
        .then(response => {
          if (__DEV__) {
            if (!response.ok) {
              logger.warn('GraphQL response error:', {
                url: dynamicUri,
                status: response.status,
                statusText: response.statusText
              });
            } else {
              logger.debug('GraphQL response success:', {
                url: dynamicUri,
                status: response.status
              });
            }
          }
          return response;
        })
        .catch(error => {
          logger.error('GraphQL fetch error:', {
            url: dynamicUri,
            error: error.message
          });
          throw error;
        });
    }
  });
};

// 동적 URL을 사용하는 createHttpLink (설정 변경 시 호출)
export const createDynamicHttpLink = () => {
  return createHttpLink();
};
