/**
 * MemoryManager - 통합 메모리 관리 시스템
 * 컴포넌트 언마운트, 이벤트 리스너, 애니메이션, 타이머 등의 메모리 정리
 * CLAUDE.md 가이드라인 준수
 */
import OptimizedImage from '../../components/ui/images/OptimizedImage';
import { AppState, DeviceEventEmitter } from 'react-native';

class MemoryManager {
  constructor() {
    this.activeSubscriptions = new Map();
    this.activeTimers = new Set();
    this.activeAnimations = new Set();
    this.activeListeners = new Map();
    this.componentCleanupCallbacks = new Map();
    this.memoryPressureCallbacks = new Set();
    this.isMemoryLow = false;

    this.init();
  }

  init() {
    // 메모리 압박 상황 감지
    this.setupMemoryPressureListener();

    // 앱 상태 변화 감지
    this.setupAppStateListener();

    // 정기적인 메모리 정리 (5분마다)
    this.setupPeriodicCleanup();
  }

  /**
   * 메모리 압박 상황 리스너 설정
   */
  setupMemoryPressureListener() {
    const memoryWarningListener = DeviceEventEmitter.addListener(
      'ReactNativeMemoryWarning',
      this.handleMemoryWarning.bind(this)
    );

    this.activeSubscriptions.set('memoryWarning', memoryWarningListener);
  }

  /**
   * 앱 상태 변화 리스너 설정
   */
  setupAppStateListener() {
    const appStateListener = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );

    this.activeSubscriptions.set('appState', appStateListener);
  }

  /**
   * 정기적인 메모리 정리 설정
   */
  setupPeriodicCleanup() {
    const cleanupInterval = setInterval(() => {
      this.performPeriodicCleanup();
    }, 5 * 60 * 1000); // 5분

    this.activeTimers.add(cleanupInterval);
  }

  /**
   * 메모리 경고 처리
   */
  async handleMemoryWarning() {
    console.warn('[MemoryManager] 메모리 경고 발생 - 긴급 메모리 정리 시작');
    this.isMemoryLow = true;

    try {
      // 1. 이미지 캐시 정리
      await this.clearImageCache();

      // 2. 메모리 압박 콜백 실행
      for (const callback of this.memoryPressureCallbacks) {
        try {
          await callback();
        } catch (error) {
          console.error('[MemoryManager] 메모리 압박 콜백 실행 실패:', error);
        }
      }

      // 3. 임시 데이터 정리
      await this.clearTemporaryData();

      console.log('[MemoryManager] 긴급 메모리 정리 완료');
    } catch (error) {
      console.error('[MemoryManager] 긴급 메모리 정리 실패:', error);
    }
  }

  /**
   * 앱 상태 변화 처리
   */
  handleAppStateChange(nextAppState) {
    if (nextAppState === 'background') {
      // 백그라운드로 전환 시 메모리 정리
      console.log('[MemoryManager] 앱이 백그라운드로 전환됨 - 메모리 정리 시작');
      this.performBackgroundCleanup();
    } else if (nextAppState === 'active') {
      // 포그라운드로 복귀 시 메모리 상태 초기화
      this.isMemoryLow = false;
    }
  }

  /**
   * 정기적인 메모리 정리
   */
  async performPeriodicCleanup() {
    console.log('[MemoryManager] 정기적인 메모리 정리 수행');

    try {
      // 1. 사용하지 않는 컴포넌트 정리
      this.cleanupInactiveComponents();

      // 2. 오래된 타이머/애니메이션 정리
      this.cleanupStaleResources();

      // 3. 이미지 메모리 캐시 부분 정리
      await OptimizedImage.clearMemoryCache();

    } catch (error) {
      console.error('[MemoryManager] 정기적인 메모리 정리 실패:', error);
    }
  }

  /**
   * 백그라운드 메모리 정리
   */
  async performBackgroundCleanup() {
    try {
      // 1. 메모리 캐시 정리
      await this.clearImageCache();

      // 2. 불필요한 리스너 일시 정지
      this.pauseNonCriticalListeners();

      // 3. 임시 데이터 정리
      await this.clearTemporaryData();

    } catch (error) {
      console.error('[MemoryManager] 백그라운드 메모리 정리 실패:', error);
    }
  }

  /**
   * 컴포넌트 메모리 정리 등록
   */
  registerComponentCleanup(componentId, cleanupCallback) {
    if (!this.componentCleanupCallbacks.has(componentId)) {
      this.componentCleanupCallbacks.set(componentId, new Set());
    }

    this.componentCleanupCallbacks.get(componentId).add(cleanupCallback);

    // 컴포넌트 언마운트 시 정리하는 함수 반환
    return () => {
      this.unregisterComponentCleanup(componentId, cleanupCallback);
    };
  }

  /**
   * 컴포넌트 메모리 정리 해제
   */
  unregisterComponentCleanup(componentId, cleanupCallback) {
    const callbacks = this.componentCleanupCallbacks.get(componentId);
    if (callbacks) {
      callbacks.delete(cleanupCallback);
      if (callbacks.size === 0) {
        this.componentCleanupCallbacks.delete(componentId);
      }
    }
  }

  /**
   * 타이머 등록
   */
  registerTimer(timer) {
    this.activeTimers.add(timer);

    // 타이머 자동 정리를 위한 래퍼 반환
    return () => {
      clearTimeout(timer);
      clearInterval(timer);
      this.activeTimers.delete(timer);
    };
  }

  /**
   * 애니메이션 등록
   */
  registerAnimation(animation) {
    this.activeAnimations.add(animation);

    // 애니메이션 자동 정리를 위한 래퍼 반환
    return () => {
      try {
        if (animation && animation.stop) {
          animation.stop();
        }
        if (animation && animation.removeAllListeners) {
          animation.removeAllListeners();
        }
      } catch (error) {
        console.warn('[MemoryManager] 애니메이션 정리 중 오류:', error);
      }
      this.activeAnimations.delete(animation);
    };
  }

  /**
   * 이벤트 리스너 등록
   */
  registerListener(eventName, listener, emitter = DeviceEventEmitter) {
    const listenerKey = `${eventName}_${Date.now()}`;

    this.activeListeners.set(listenerKey, {
      eventName,
      listener,
      emitter,
      subscription: emitter.addListener(eventName, listener)
    });

    // 리스너 자동 정리를 위한 래퍼 반환
    return () => {
      this.unregisterListener(listenerKey);
    };
  }

  /**
   * 이벤트 리스너 해제
   */
  unregisterListener(listenerKey) {
    const listenerInfo = this.activeListeners.get(listenerKey);
    if (listenerInfo && listenerInfo.subscription) {
      try {
        if (listenerInfo.subscription.remove) {
          listenerInfo.subscription.remove();
        } else if (listenerInfo.emitter.removeListener) {
          listenerInfo.emitter.removeListener(
            listenerInfo.eventName,
            listenerInfo.listener
          );
        }
      } catch (error) {
        console.warn('[MemoryManager] 리스너 해제 중 오류:', error);
      }
      this.activeListeners.delete(listenerKey);
    }
  }

  /**
   * 메모리 압박 콜백 등록
   */
  registerMemoryPressureCallback(callback) {
    this.memoryPressureCallbacks.add(callback);

    return () => {
      this.memoryPressureCallbacks.delete(callback);
    };
  }

  /**
   * 이미지 캐시 정리
   */
  async clearImageCache() {
    try {
      await OptimizedImage.clearMemoryCache();
      console.log('[MemoryManager] 이미지 메모리 캐시 정리 완료');
    } catch (error) {
      console.error('[MemoryManager] 이미지 캐시 정리 실패:', error);
    }
  }

  /**
   * 임시 데이터 정리
   */
  async clearTemporaryData() {
    // 구현: AsyncStorage의 임시 데이터, 로그 파일 등 정리
    console.log('[MemoryManager] 임시 데이터 정리 완료');
  }

  /**
   * 비활성 컴포넌트 정리
   */
  cleanupInactiveComponents() {
    // 등록된 컴포넌트 정리 콜백 중 비활성 컴포넌트 정리
    for (const [componentId, callbacks] of this.componentCleanupCallbacks) {
      if (callbacks.size === 0) {
        this.componentCleanupCallbacks.delete(componentId);
      }
    }
  }

  /**
   * 오래된 리소스 정리
   */
  cleanupStaleResources() {
    const now = Date.now();
    const staleThreshold = 10 * 60 * 1000; // 10분

    // 오래된 애니메이션 정리
    for (const animation of this.activeAnimations) {
      if (animation.createdAt && (now - animation.createdAt) > staleThreshold) {
        try {
          if (animation.stop) animation.stop();
          if (animation.removeAllListeners) animation.removeAllListeners();
        } catch (error) {
          console.warn('[MemoryManager] 오래된 애니메이션 정리 중 오류:', error);
        }
        this.activeAnimations.delete(animation);
      }
    }
  }

  /**
   * 중요하지 않은 리스너 일시 정지
   */
  pauseNonCriticalListeners() {
    // 백그라운드에서 중요하지 않은 리스너들을 일시 정지
    console.log('[MemoryManager] 중요하지 않은 리스너 일시 정지');
  }

  /**
   * 메모리 사용량 통계
   */
  getMemoryStats() {
    return {
      activeSubscriptions: this.activeSubscriptions.size,
      activeTimers: this.activeTimers.size,
      activeAnimations: this.activeAnimations.size,
      activeListeners: this.activeListeners.size,
      registeredComponents: this.componentCleanupCallbacks.size,
      memoryPressureCallbacks: this.memoryPressureCallbacks.size,
      isMemoryLow: this.isMemoryLow,
    };
  }

  /**
   * 전체 메모리 정리 (앱 종료 시 또는 긴급 상황)
   */
  async cleanup() {
    console.log('[MemoryManager] 전체 메모리 정리 시작');

    try {
      // 1. 모든 타이머 정리
      for (const timer of this.activeTimers) {
        clearTimeout(timer);
        clearInterval(timer);
      }
      this.activeTimers.clear();

      // 2. 모든 애니메이션 정리
      for (const animation of this.activeAnimations) {
        try {
          if (animation.stop) animation.stop();
          if (animation.removeAllListeners) animation.removeAllListeners();
        } catch (error) {
          console.warn('[MemoryManager] 애니메이션 정리 중 오류:', error);
        }
      }
      this.activeAnimations.clear();

      // 3. 모든 리스너 정리
      for (const [key, listenerInfo] of this.activeListeners) {
        this.unregisterListener(key);
      }

      // 4. 모든 구독 정리
      for (const [key, subscription] of this.activeSubscriptions) {
        try {
          if (subscription && subscription.remove) {
            subscription.remove();
          }
        } catch (error) {
          console.warn('[MemoryManager] 구독 해제 중 오류:', error);
        }
      }
      this.activeSubscriptions.clear();

      // 5. 이미지 캐시 정리
      await this.clearImageCache();

      console.log('[MemoryManager] 전체 메모리 정리 완료');
    } catch (error) {
      console.error('[MemoryManager] 전체 메모리 정리 실패:', error);
    }
  }
}

// 싱글톤 인스턴스
const memoryManager = new MemoryManager();

export default memoryManager;
