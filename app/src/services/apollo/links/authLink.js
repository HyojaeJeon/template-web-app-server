/**
 * Auth Link
 * JWT 토큰과 언어 설정을 헤더에 추가
 */

import { setContext } from '@apollo/client/link/context';
import { getValidToken } from '@services/apollo/tokenManager';
import { decodeToken } from '@utils/tokenMonitor';
import { getStoredLanguage } from '@shared/i18n';
import logger from '@shared/utils/system/logger';

export const createAuthLink = () => {
  return setContext(async (_, { headers }) => {
    try {
      // 토큰 가져오기
      let token = await getValidToken();

      // 토큰 디버깅 정보 (개발 환경에서만)
      if (__DEV__ && token) {
        try {
          // JWT 토큰 디코딩해서 만료 시간 확인
          const payload = decodeToken(token);
          const exp = payload?.exp ? new Date(payload.exp * 1000) : null;
          const now = new Date();
          logger.warn('[AuthLink DEBUG] Token info:', {
            hasToken: !!token,
            tokenExp: exp ? exp.toISOString() : null,
            currentTime: now.toISOString(),
            isExpired: exp ? exp < now : false,
            operation: _?.operationName,
            tokenPreview: token.substring(0, 50) + '...'
          });
        } catch (decodeError) {
          logger.error('[AuthLink DEBUG] Token decode error:', decodeError);
        }
      }

      // 언어 설정 가져오기
      const language = await getStoredLanguage() || 'vi';

      // 기본 헤더 설정
      const authHeaders = {
        ...headers,
        'Accept-Language': language,
        'x-language': language,
        'Content-Language': language,
        'X-Platform': 'react-native',
        'X-Client-Type': 'mobile',
        'X-App-Version': '1.0.0',
        'Cache-Control': 'no-cache'
      };

      // Authorization 헤더 설정
      // 만료 여부와 관계없이 토큰은 그대로 전달하여
      // 서버(withMAuth)가 만료(TOKEN_EXPIRED)를 명확히 판단하도록 위임
      if (token) {
        // 일부 미들웨어/프록시는 대소문자 구분 없이 처리하지만, 호환성을 위해 모두 설정
        authHeaders.authorization = `Bearer ${token}`;
        authHeaders.Authorization = `Bearer ${token}`;
      }

      if (__DEV__) {
        logger.debug('Auth headers set:', {
          hasToken: !!token,
          language,
          operation: _?.operationName
        });
      }

      return {
        headers: authHeaders
      };
    } catch (error) {
      logger.error('Auth link error:', error);
      return { headers };
    }
  });
};
