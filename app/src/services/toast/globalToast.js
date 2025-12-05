/**
 * Global Toast Service
 * React Context 외부에서 Toast를 표시할 수 있는 전역 서비스
 *
 * React Native 환경에서는 Node.js의 EventEmitter를 사용할 수 없으므로
 * 간단한 콜백 패턴으로 구현합니다.
 */
class GlobalToastService {
  constructor() {
    this.showToastFunc = null;
    this.pendingToasts = []; // ToastProvider 등록 전 대기 중인 Toast들
  }

  /**
   * ToastProvider에서 showToast 함수 등록
   */
  registerToast(showToastFunc) {
    this.showToastFunc = showToastFunc;

    // 등록 시 대기 중이던 Toast들을 모두 표시
    if (showToastFunc && this.pendingToasts.length > 0) {
      this.pendingToasts.forEach(({ message, options }) => {
        showToastFunc(message, options);
      });
      this.pendingToasts = [];
    }
  }

  /**
   * 전역에서 Toast 표시
   */
  show(message, options = {}) {
    if (this.showToastFunc) {
      this.showToastFunc(message, options);
    } else {
      // ToastProvider가 아직 등록되지 않은 경우 대기열에 추가
      this.pendingToasts.push({ message, options });

      // 대기열이 너무 커지지 않도록 최대 10개로 제한
      if (this.pendingToasts.length > 10) {
        this.pendingToasts.shift();
      }
    }
  }

  /**
   * 성공 Toast
   */
  success(message, options = {}) {
    this.show(message, { ...options, type: 'success' });
  }

  /**
   * 에러 Toast
   */
  error(message, options = {}) {
    this.show(message, { ...options, type: 'error' });
  }

  /**
   * 경고 Toast
   */
  warning(message, options = {}) {
    this.show(message, { ...options, type: 'warning' });
  }

  /**
   * 정보 Toast
   */
  info(message, options = {}) {
    this.show(message, { ...options, type: 'info' });
  }

  /**
   * 대기 중인 Toast 개수 반환 (디버깅용)
   */
  getPendingCount() {
    return this.pendingToasts.length;
  }

  /**
   * 대기 중인 Toast 모두 삭제
   */
  clearPending() {
    this.pendingToasts = [];
  }
}

// 싱글톤 인스턴스
const globalToast = new GlobalToastService();

export default globalToast;
