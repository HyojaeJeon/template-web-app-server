/**
 * Staff Domain Mutations (Stub)
 * TODO: 구현 필요
 */

import { gql } from '../gqlSetup.js';

// 첫 로그인 비밀번호 변경
export const S_CHANGE_PASSWORD_FIRST_LOGIN = gql`
  mutation SChangePasswordFirstLogin($currentPassword: String!, $newPassword: String!) {
    sChangePasswordFirstLogin(currentPassword: $currentPassword, newPassword: $newPassword) {
      success
      message
    }
  }
`;
