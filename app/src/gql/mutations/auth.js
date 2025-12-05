/**
 * Auth Domain Mutations (M_ prefix)
 * Mobile 앱 인증 관련 GraphQL Mutation 정의
 *
 * @description
 * - Fragment 미사용 (인라인 필드)
 * - M_ prefix: Export 변수명
 * - m prefix: Server operation name
 *
 * @author Template Project
 */

import { gql } from '@apollo/client';

// ===============================================
// 회원가입/로그인 Mutations
// ===============================================

// 전화번호 회원가입
export const M_REGISTER = gql`
  mutation MRegister($input: MobileRegisterInput!) {
    mRegister(input: $input) {
      success
      message
      accessToken
      refreshToken
      isNewUser
      user {
        id
        phone
        phoneVerified
        email
        fullName
        avatarUrl
        preferredLanguage
        createdAt
        updatedAt
      }
    }
  }
`;

// 전화번호 로그인
export const M_LOGIN_WITH_PHONE = gql`
  mutation MLoginWithPhone($input: MobileLoginInput!) {
    mLoginWithPhone(input: $input) {
      success
      message
      accessToken
      refreshToken
      isNewUser
      requiresPhoneVerification
      user {
        id
        phone
        phoneVerified
        email
        fullName
        avatarUrl
        preferredLanguage
        createdAt
        updatedAt
      }
    }
  }
`;

// 소셜 로그인
export const M_SOCIAL_LOGIN = gql`
  mutation MSocialLogin($input: MobileSocialLoginInput!) {
    mSocialLogin(input: $input) {
      success
      message
      accessToken
      refreshToken
      isNewUser
      user {
        id
        phone
        email
        fullName
        avatarUrl
        preferredLanguage
        createdAt
        updatedAt
      }
    }
  }
`;

// ===============================================
// OTP 인증 Mutations
// ===============================================

// OTP 코드 전송
export const M_SEND_OTP = gql`
  mutation MSendOTP($phone: String!) {
    mSendOTP(phone: $phone) {
      success
      message
      expiresIn
    }
  }
`;

// OTP 코드 검증
export const M_VERIFY_OTP = gql`
  mutation MVerifyOTP($input: MobileVerifyOTPInput!) {
    mVerifyOTP(input: $input) {
      success
      message
      verified
    }
  }
`;

// ===============================================
// 토큰 관리 Mutations
// ===============================================

// 토큰 갱신
export const M_REFRESH_TOKEN = gql`
  mutation MRefreshToken($refreshToken: String!) {
    mRefreshToken(refreshToken: $refreshToken) {
      success
      message
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

// 로그아웃
export const M_LOGOUT = gql`
  mutation MLogout {
    mLogout {
      success
      message
    }
  }
`;

// ===============================================
// 비밀번호 관리 Mutations
// ===============================================

// 비밀번호 변경
export const M_CHANGE_PASSWORD = gql`
  mutation MChangePassword($currentPassword: String!, $newPassword: String!) {
    mChangePassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      success
      message
    }
  }
`;

// 비밀번호 리셋 요청
export const M_REQUEST_PASSWORD_RESET = gql`
  mutation MRequestPasswordReset($input: MobilePasswordResetRequestInput!) {
    mRequestPasswordReset(input: $input) {
      success
      message
      expiresIn
    }
  }
`;

// 비밀번호 리셋
export const M_RESET_PASSWORD = gql`
  mutation MResetPassword($input: MobilePasswordResetInput!) {
    mResetPassword(input: $input) {
      success
      message
    }
  }
`;

// ===============================================
// 계정 관리 Mutations
// ===============================================

// 푸시 토큰 업데이트
export const M_UPDATE_PUSH_TOKEN = gql`
  mutation MUpdatePushToken($pushToken: String!) {
    mUpdatePushToken(pushToken: $pushToken) {
      success
      message
    }
  }
`;

// 계정 비활성화
export const M_DEACTIVATE_ACCOUNT = gql`
  mutation MDeactivateAccount($reason: String) {
    mDeactivateAccount(reason: $reason) {
      success
      message
    }
  }
`;

// 계정 삭제
export const M_DELETE_ACCOUNT = gql`
  mutation MDeleteAccount($password: String, $reason: String) {
    mDeleteAccount(password: $password, reason: $reason) {
      success
      message
    }
  }
`;
