/**
 * Auth Domain Mutations (W_ prefix)
 * Web 클라이언트 인증 관련 GraphQL Mutation 정의
 *
 * @description
 * - Fragment 미사용 (인라인 필드)
 * - W_ prefix: Export 변수명
 * - w prefix: Server operation name
 *
 * @author Template Project
 */

import { gql } from '../gqlSetup.js';

// ===============================================
// 계정 관리 Mutations
// ===============================================

// 로그인 (이메일 + 비밀번호)
export const W_LOGIN = gql`
  mutation WLogin($input: WebLoginInput!) {
    wLogin(input: $input) {
      success
      message
      accessToken
      refreshToken
      expiresIn
      account {
        id
        email
        name
        phone
        role
        status
        profileImage
        permissions
        language
        lastLoginAt
        createdAt
        updatedAt
      }
    }
  }
`;

// 토큰 갱신
export const W_REFRESH_TOKEN = gql`
  mutation WRefreshToken($refreshToken: String!) {
    wRefreshToken(refreshToken: $refreshToken) {
      success
      message
      accessToken
      refreshToken
      expiresIn
    }
  }
`;

// 로그아웃
export const W_LOGOUT = gql`
  mutation WLogout {
    wLogout {
      success
      message
    }
  }
`;

// ===============================================
// 프로필 관리 Mutations
// ===============================================

// 비밀번호 변경
export const W_CHANGE_PASSWORD = gql`
  mutation WChangePassword($input: WebChangePasswordInput!) {
    wChangePassword(input: $input) {
      success
      message
    }
  }
`;

// 비밀번호 리셋 요청
export const W_REQUEST_PASSWORD_RESET = gql`
  mutation WRequestPasswordReset($email: String!) {
    wRequestPasswordReset(email: $email) {
      success
      message
    }
  }
`;

// 비밀번호 리셋
export const W_RESET_PASSWORD = gql`
  mutation WResetPassword($input: WebPasswordResetInput!) {
    wResetPassword(input: $input) {
      success
      message
    }
  }
`;

// 프로필 업데이트
export const W_UPDATE_PROFILE = gql`
  mutation WUpdateProfile($input: WebUpdateProfileInput!) {
    wUpdateProfile(input: $input) {
      success
      message
      account {
        id
        email
        name
        phone
        profileImage
        language
        updatedAt
      }
    }
  }
`;

// 계정 비활성화
export const W_DEACTIVATE_ACCOUNT = gql`
  mutation WDeactivateAccount {
    wDeactivateAccount {
      success
      message
    }
  }
`;

// ===============================================
// Store Account Mutations (S_ prefix)
// ===============================================

// 이메일 로그인
export const S_LOGIN_WITH_EMAIL = gql`
  mutation SLoginWithEmail($email: String!, $password: String!) {
    sLoginWithEmail(email: $email, password: $password) {
      success
      message
      accessToken
      refreshToken
      account {
        id
        email
        name
        phone
        role
        status
      }
    }
  }
`;

// 전화번호 로그인
export const S_LOGIN_WITH_PHONE = gql`
  mutation SLoginWithPhone($phone: String!, $password: String!) {
    sLoginWithPhone(phone: $phone, password: $password) {
      success
      message
      accessToken
      refreshToken
      account {
        id
        email
        name
        phone
        role
        status
      }
    }
  }
`;

// 매장 계정 등록
export const S_REGISTER_STORE_ACCOUNT = gql`
  mutation SRegisterStoreAccount($input: RegisterStoreAccountInput!) {
    registerStoreAccount(input: $input) {
      success
      message
      accessToken
      refreshToken
      store {
        id
        name
        status
      }
    }
  }
`;
