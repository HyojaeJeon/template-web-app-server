/**
 * Profile Domain Queries (M_ prefix)
 * Mobile 앱 프로필 관련 GraphQL Query 정의
 *
 * @description
 * - Fragment 미사용 (인라인 필드)
 * - M_ prefix: Export 변수명
 * - m prefix: Server operation name
 *
 * @author Template Project
 */

import { gql } from '@apollo/client';

// 내 프로필 조회
export const M_GET_MY_PROFILE = gql`
  query MGetMyProfile {
    mGetMyProfile {
      id
      phone
      phoneVerified
      email
      emailVerified
      fullName
      avatarUrl
      preferredLanguage
      address
      createdAt
      updatedAt
    }
  }
`;

// 언어 설정 조회
export const M_GET_LANGUAGE_PREFERENCE = gql`
  query MGetLanguagePreference {
    mGetMyProfile {
      id
      preferredLanguage
    }
  }
`;
