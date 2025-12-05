/**
 * Auth Domain Queries (W_ prefix)
 * Web 클라이언트 인증 관련 GraphQL Query 정의
 *
 * @description
 * - Fragment 미사용 (인라인 필드)
 * - W_ prefix: Export 변수명
 * - w prefix: Server operation name
 *
 * @author Template Project
 */

import { gql } from '../gqlSetup.js';

// 현재 로그인한 계정 정보 조회
export const W_GET_ME = gql`
  query WGetMe {
    wGetMe {
      id
      email
      name
      phone
      role
      status
      profileImage
      permissions
      language
      notificationsEnabled
      lastLoginAt
      createdAt
      updatedAt
    }
  }
`;

// 토큰 유효성 검증
export const W_VALIDATE_TOKEN = gql`
  query WValidateToken {
    wValidateToken {
      valid
      account {
        id
        email
        name
        role
        status
      }
    }
  }
`;
