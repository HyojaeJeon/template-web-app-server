/**
 * Toast Service
 * Toast 메시지 정의 및 유틸리티 함수
 */

// 메시지 카테고리 import
import { AUTH_MESSAGES } from './messages/auth';
import { PROFILE_MESSAGES } from './messages/profile';
import { NETWORK_MESSAGES } from './messages/network';
import { VALIDATION_MESSAGES } from './messages/validation';
import { COMMON_MESSAGES } from './messages/common';

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

// 메시지 가져오기
import i18n from '@shared/i18n';

// 메시지 가져오기
export const getMessage = (code) => {
  const message = TOAST_MESSAGES[code];
  if (!message) return null;

  const namespace = code.split('_')[0].toLowerCase();

  return {
    ...message,
    text: i18n.t(`${namespace}:toast.${code}`)
  };
};

// 지원 언어 목록
export const SUPPORTED_LANGUAGES = ['ko', 'vi', 'en'];

// 개별 카테고리 export
export {
  AUTH_MESSAGES,
  PROFILE_MESSAGES,
  NETWORK_MESSAGES,
  VALIDATION_MESSAGES,
  COMMON_MESSAGES,
};
