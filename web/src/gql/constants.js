/**
 * GraphQL 쿼리 변수 상수
 * Apollo Cache 키 통일을 위해 공통 변수 정의
 */

// ✅ 채팅 대시보드 쿼리 초기 변수 생성 함수
// filter를 동적으로 받을 수 있도록 함수로 변경
export const getChatDashboardVars = (filter = {}) => ({
  limit: 20,
  offset: 0,
  filter
});

// ✅ 기본 변수 (하위 호환성 유지)
export const CHAT_DASHBOARD_VARS = getChatDashboardVars();
