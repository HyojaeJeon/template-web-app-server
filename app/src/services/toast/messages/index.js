// 모든 메시지 카테고리를 통합하여 export
import { AUTH_MESSAGES } from '@services/toast/messages/auth';
import { PROFILE_MESSAGES } from '@services/toast/messages/profile';
import { NETWORK_MESSAGES } from '@services/toast/messages/network';
import { VALIDATION_MESSAGES } from '@services/toast/messages/validation';
import { COMMON_MESSAGES } from '@services/toast/messages/common';

// 모든 메시지를 하나의 객체로 통합
export const TOAST_MESSAGES = {
  ...AUTH_MESSAGES,
  ...PROFILE_MESSAGES,
  ...NETWORK_MESSAGES,
  ...VALIDATION_MESSAGES,
  ...COMMON_MESSAGES,
};

// 메시지 코드 존재 여부 확인
export const hasMessageCode = (code) => {
  return code in TOAST_MESSAGES;
};

// 메시지 코드로부터 타입 추출
export const getMessageType = (code) => {
  return TOAST_MESSAGES[code]?.type || 'info';
};

// 지원 언어 목록
export const SUPPORTED_LANGUAGES = ['ko', 'vi', 'en'];

// 개별 카테고리 export (필요한 경우)
export {
  AUTH_MESSAGES,
  PROFILE_MESSAGES,
  NETWORK_MESSAGES,
  VALIDATION_MESSAGES,
  COMMON_MESSAGES,
};
