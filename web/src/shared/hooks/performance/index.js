/**
 * @fileoverview 성능 최적화 훅 통합 인덱스
 * @description 모든 성능 관련 훅들을 중앙에서 관리하고 내보냄
 */

// 지연 로딩 관련
export { 
  useLazyLoad, 
  useLazyImage 
} from './useLazyLoad';

// 가상 리스트 관련
export { 
  useVirtualList, 
  useVirtualTable 
} from './useVirtualList';

// 메모이제이션 관련
export { 
  useMemoizedCallback,
  useDebouncedMemoizedCallback,
  useThrottledMemoizedCallback,
  useConditionalMemoizedCallback
} from './useMemoizedCallback';

// 쓰로틀 상태 관련
export { 
  useThrottledState,
  useThrottledSearch,
  useThrottledScroll
} from './useThrottledState';

// 디바운스 상태 관련
export { 
  useDebouncedState,
  useDebouncedSearch,
  useDebouncedAPI
} from './useDebouncedState';

// 유휴 콜백 관련
export { 
  useIdleCallback,
  useIdleBatch,
  useIdlePrefetch
} from './useIdleCallback';

// 웹 워커 관련
export { 
  useWorker,
  useCalculationWorker,
  useImageWorker,
  useWorkerPool
} from './useWorker';

// 성능 모니터링을 위한 통합 훅
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    memoryUsage: 0
  });

  const updateMetrics = useCallback(() => {
    const now = performance.now();
    
    setMetrics(prev => {
      const renderCount = prev.renderCount + 1;
      const renderTime = now - prev.lastRenderTime;
      const averageRenderTime = prev.averageRenderTime === 0 
        ? renderTime 
        : (prev.averageRenderTime + renderTime) / 2;

      return {
        renderCount,
        lastRenderTime: now,
        averageRenderTime,
        memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0
      };
    });
  }, []);

  useEffect(() => {
    updateMetrics();
  });

  return metrics;
};