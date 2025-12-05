/**
 * 통합 서비스 모듈
 * 모든 비즈니스 로직 서비스를 중앙에서 관리
 */

// 알림 서비스                                                       // 푸시/이메일/SMS
export { default as NotificationService } from './NotificationService.js';

// 보안 모니터링                                                     // 보안 감시
export { default as SecurityMonitoringService } from './SecurityMonitoringService.js';

// 외부 API 서비스                                                   // 써드파티 연동
export { default as GooglePlacesService } from './GooglePlacesService.js';

// 검색 서비스                                                       // Elasticsearch
export { default as SearchService } from './SearchService.js';

// 리포트 서비스                                                     // 통계/분석
export { default as ReportService } from './ReportService.js';

// 매장 서비스                                                       // 매장 관리
export { default as StoreService } from './StoreService.js';

// 기본 내보내기                                                     // 서비스 통합 객체
export default {
  notification: NotificationService,
  security: SecurityMonitoringService,
  googlePlaces: GooglePlacesService,
  search: SearchService,
  report: ReportService,
  store: StoreService
};