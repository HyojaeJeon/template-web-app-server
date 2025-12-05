/**
 * Profile Domain Mutations (M_ prefix)
 * Mobile 앱 프로필 관련 GraphQL Mutation 정의
 *
 * @description
 * - Fragment 미사용 (인라인 필드)
 * - M_ prefix: Export 변수명
 * - m prefix: Server operation name
 *
 * @author Template Project
 */

import { gql } from '@apollo/client';

// 프로필 업데이트
export const M_UPDATE_PROFILE = gql`
  mutation MUpdateProfile($input: MobileUpdateProfileInput!) {
    mUpdateProfile(input: $input) {
      success
      message
      user {
        id
        phone
        email
        fullName
        avatarUrl
        preferredLanguage
        updatedAt
      }
    }
  }
`;

// 언어 설정 변경
export const M_UPDATE_LANGUAGE = gql`
  mutation MUpdateLanguage($language: LanguageCodeEnum!) {
    mUpdateProfile(input: { preferredLanguage: $language }) {
      success
      message
      user {
        id
        preferredLanguage
      }
    }
  }
`;

// 이름 변경
export const M_UPDATE_NAME = gql`
  mutation MUpdateName($fullName: String!) {
    mUpdateProfile(input: { fullName: $fullName }) {
      success
      message
      user {
        id
        fullName
      }
    }
  }
`;

// 이메일 변경
export const M_UPDATE_EMAIL = gql`
  mutation MUpdateEmail($email: String!) {
    mUpdateProfile(input: { email: $email }) {
      success
      message
      user {
        id
        email
      }
    }
  }
`;

// 프로필 이미지 업로드
export const M_UPLOAD_PROFILE_IMAGE = gql`
  mutation MUploadProfileImage($input: MobileUploadProfileImageInput!) {
    mUploadProfileImage(input: $input) {
      success
      message
      imageUrl
      user {
        id
        avatarUrl
      }
    }
  }
`;

// 프로필 이미지 삭제
export const M_DELETE_PROFILE_IMAGE = gql`
  mutation MDeleteProfileImage {
    mDeleteProfileImage {
      success
      message
      user {
        id
        avatarUrl
      }
    }
  }
`;

// 계정 삭제 요청
export const M_REQUEST_ACCOUNT_DELETION = gql`
  mutation MRequestAccountDeletion($reason: String!) {
    mRequestAccountDeletion(reason: $reason) {
      success
      message
    }
  }
`;
