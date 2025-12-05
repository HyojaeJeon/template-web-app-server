/**
 * Auth Domain Queries (M_ prefix)
 * Mobile 앱 인증 관련 GraphQL Query 정의
 *
 * @description
 * - Fragment 미사용 (인라인 필드)
 * - M_ prefix: Export 변수명
 * - m prefix: Server operation name
 *
 * @author Template Project
 */

import { gql } from '@apollo/client';

// 현재 로그인한 사용자 프로필 조회
export const M_GET_PROFILE = gql`
  query MGetProfile {
    mGetProfile {
      id
      phone
      phoneVerified
      email
      fullName
      avatarUrl
      preferredLanguage
      address
      createdAt
      updatedAt
    }
  }
`;

// 전화번호 중복 확인
export const M_CHECK_PHONE_EXISTS = gql`
  query MCheckPhoneExists($input: MobileCheckPhoneInput!) {
    mCheckPhoneExists(input: $input)
  }
`;

// 토큰 유효성 검증
export const M_VALIDATE_TOKEN = gql`
  query MValidateToken {
    mValidateToken {
      valid
      accessToken
      refreshToken
      user {
        id
        phone
        email
        fullName
        avatarUrl
        preferredLanguage
      }
    }
  }
`;

// 서버 상태 확인
export const HEALTH_CHECK = gql`
  query HealthCheck {
    health
  }
`;
