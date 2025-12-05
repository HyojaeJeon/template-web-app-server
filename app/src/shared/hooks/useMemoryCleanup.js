/**
 * useMemoryCleanup Hook
 * 컴포넌트별 메모리 정리를 자동화하는 커스텀 훅
 * CLAUDE.md 가이드라인 준수
 */
import { useEffect, useRef, useCallback } from 'react';
import memoryManager from '@shared/utils/memory/MemoryManager';

export const useMemoryCleanup = (componentName = 'Unknown') => {
  const componentId = useRef(`${componentName}_${Date.now()}_${Math.random()}`);
  const cleanupFunctions = useRef(new Set());
  const timers = useRef(new Set());
  const animations = useRef(new Set());
  const listeners = useRef(new Set());

  // 타이머 등록 및 자동 정리
  const registerTimer = useCallback((timer) => {
    timers.current.add(timer);

    const cleanup = memoryManager.registerTimer(timer);
    cleanupFunctions.current.add(cleanup);

    return () => {
      cleanup();
      timers.current.delete(timer);
      cleanupFunctions.current.delete(cleanup);
    };
  }, []);

  // 애니메이션 등록 및 자동 정리
  const registerAnimation = useCallback((animation) => {
    animations.current.add(animation);

    const cleanup = memoryManager.registerAnimation(animation);
    cleanupFunctions.current.add(cleanup);

    return () => {
      cleanup();
      animations.current.delete(animation);
      cleanupFunctions.current.delete(cleanup);
    };
  }, []);

  // 이벤트 리스너 등록 및 자동 정리
  const registerListener = useCallback((eventName, listener, emitter) => {
    const cleanup = memoryManager.registerListener(eventName, listener, emitter);
    cleanupFunctions.current.add(cleanup);
    listeners.current.add({ eventName, listener, cleanup });

    return () => {
      cleanup();
      listeners.current.delete({ eventName, listener, cleanup });
      cleanupFunctions.current.delete(cleanup);
    };
  }, []);

  // 수동 정리 함수 등록
  const registerCleanup = useCallback((cleanupFunction) => {
    cleanupFunctions.current.add(cleanupFunction);

    return () => {
      cleanupFunctions.current.delete(cleanupFunction);
    };
  }, []);

  // 즉시 정리 실행
  const cleanupNow = useCallback(() => {
    console.log(`[useMemoryCleanup] ${componentName} 즉시 정리 실행`);

    for (const cleanup of cleanupFunctions.current) {
      try {
        cleanup();
      } catch (error) {
        console.warn(`[useMemoryCleanup] ${componentName} 정리 중 오류:`, error);
      }
    }

    cleanupFunctions.current.clear();
    timers.current.clear();
    animations.current.clear();
    listeners.current.clear();
  }, [componentName]);

  // 메모리 사용량 조회
  const getMemoryUsage = useCallback(() => {
    return {
      componentId: componentId.current,
      componentName,
      activeTimers: timers.current.size,
      activeAnimations: animations.current.size,
      activeListeners: listeners.current.size,
      totalCleanupFunctions: cleanupFunctions.current.size,
    };
  }, [componentName]);

  // 컴포넌트 언마운트 시 자동 정리
  useEffect(() => {
    const componentCleanup = () => {
      console.log(`[useMemoryCleanup] ${componentName} 컴포넌트 언마운트 - 메모리 정리 시작`);
      cleanupNow();
    };

    // 메모리 매니저에 컴포넌트 정리 함수 등록
    const unregister = memoryManager.registerComponentCleanup(
      componentId.current,
      componentCleanup
    );

    return () => {
      unregister();
      componentCleanup();
    };
  }, [componentName, cleanupNow]);

  return {
    registerTimer,
    registerAnimation,
    registerListener,
    registerCleanup,
    cleanupNow,
    getMemoryUsage,
    componentId: componentId.current,
  };
};

// setTimeout/setInterval 래퍼 훅
export const useTimeout = (callback, delay, dependencies = []) => {
  const { registerTimer } = useMemoryCleanup('useTimeout');
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const timer = setTimeout(() => savedCallback.current(), delay);
      const cleanup = registerTimer(timer);

      return cleanup;
    }
  }, [delay, registerTimer, ...dependencies]);
};

export const useInterval = (callback, delay, dependencies = []) => {
  const { registerTimer } = useMemoryCleanup('useInterval');
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const timer = setInterval(() => savedCallback.current(), delay);
      const cleanup = registerTimer(timer);

      return cleanup;
    }
  }, [delay, registerTimer, ...dependencies]);
};

// 애니메이션 래퍼 훅
export const useAnimatedValue = (initialValue = 0) => {
  const { registerAnimation } = useMemoryCleanup('useAnimatedValue');
  const animatedValueRef = useRef(null);

  useEffect(() => {
    // React Native의 Animated.Value는 동적 import 필요
    import('react-native').then(({ Animated }) => {
      const animatedValue = new Animated.Value(initialValue);
      animatedValue.createdAt = Date.now(); // 메모리 매니저용 타임스탬프

      animatedValueRef.current = animatedValue;
      const cleanup = registerAnimation(animatedValue);

      return cleanup;
    });
  }, [initialValue, registerAnimation]);

  return animatedValueRef.current;
};

export default useMemoryCleanup;