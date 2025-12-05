/**
 * Redux 미들웨어 모음
 * @description 인증 관련 미들웨어
 */

// 인증 상태 변경 미들웨어
export const authMiddleware = (store) => (next) => (action) => {
  // 인증 관련 액션 처리
  if (action.type?.startsWith('auth/')) {
    // 로그아웃 시 상태 초기화 등 처리 가능
    if (action.type === 'auth/logout') {
      console.log('User logged out');
    }
  }
  return next(action);
};

// 개발환경 로깅 미들웨어
export const devLoggingMiddleware = (store) => (next) => (action) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Action:', action.type);
  }
  return next(action);
};
