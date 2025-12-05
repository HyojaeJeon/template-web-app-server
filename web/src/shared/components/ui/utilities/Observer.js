/**
 * Intersection Observer 컴포넌트 (점주용)
 * 화면 진입/이탈 감지, WCAG 2.1 준수, Local 테마 적용
 */
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

const Observer = ({
  children,
  onIntersect,
  onIntersectOnce,
  onEnter,
  onLeave,
  threshold = 0.1,
  rootMargin = '0px',
  root = null,
  triggerOnce = false,
  disabled = false,
  as = 'div',
  className = '',
  animateOnIntersect = false,
  animationClass = 'animate-fade-in-up',
  animationDelay = 0,
  trackProgress = false,
  onProgressChange,
  ...props
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const targetRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer 생성 및 관리
  const createObserver = useCallback(() => {
    if (disabled || !targetRef.current) return;

    // 기존 Observer 정리
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 새 Observer 생성
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const { isIntersecting, intersectionRatio } = entry;
          
          setIsIntersecting(isIntersecting);
          setIntersectionRatio(intersectionRatio);

          // 진행률 추적
          if (trackProgress && onProgressChange) {
            onProgressChange(intersectionRatio);
          }

          // 처음 교차 시
          if (isIntersecting && !hasIntersected) {
            setHasIntersected(true);
            if (onIntersectOnce) {
              onIntersectOnce(entry);
            }
          }

          // 교차 상태 변화 콜백
          if (onIntersect) {
            onIntersect(entry, isIntersecting);
          }

          // 진입/이탈 콜백
          if (isIntersecting && onEnter) {
            onEnter(entry);
          } else if (!isIntersecting && onLeave) {
            onLeave(entry);
          }

          // 애니메이션 처리
          if (animateOnIntersect) {
            if (isIntersecting) {
              setTimeout(() => setIsVisible(true), animationDelay);
            } else if (!triggerOnce || !hasIntersected) {
              setIsVisible(false);
            }
          }

          // 한 번만 실행하는 경우 Observer 해제
          if (triggerOnce && isIntersecting) {
            observerRef.current?.disconnect();
          }
        });
      },
      {
        root,
        rootMargin,
        threshold: Array.isArray(threshold) ? threshold : [threshold]
      }
    );

    observerRef.current.observe(targetRef.current);
  }, [
    disabled, 
    threshold, 
    rootMargin, 
    root, 
    triggerOnce, 
    hasIntersected,
    onIntersect,
    onIntersectOnce, 
    onEnter, 
    onLeave,
    animateOnIntersect,
    animationDelay,
    trackProgress,
    onProgressChange
  ]);

  // Observer 설정 및 정리
  useEffect(() => {
    createObserver();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [createObserver]);

  // 컴포넌트 타입 결정
  const Component = as;

  return (
    <Component
      ref={targetRef}
      className={`
        ${className}
        ${animateOnIntersect && isVisible ? animationClass : ''}
        ${isIntersecting ? 'is-intersecting' : ''}
        ${hasIntersected ? 'has-intersected' : ''}
      `}
      data-intersection-ratio={intersectionRatio}
      {...props}
    >
      {typeof children === 'function' 
        ? children({ 
            isIntersecting, 
            hasIntersected, 
            intersectionRatio,
            isVisible
          })
        : children
      }
    </Component>
  );
};

// LazyLoad용 Observer
export const LazyObserver = ({
  children,
  placeholder,
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
  fallback,
  ...props
}) => {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleIntersectOnce = useCallback(async () => {
    if (hasLoaded || isLoading) return;

    setIsLoading(true);

    try {
      // children이 함수인 경우 (lazy loading 함수)
      if (typeof children === 'function') {
        await children();
      }
      
      setHasLoaded(true);
      setIsLoading(false);
      
      if (onLoad) {
        onLoad();
      }
    } catch (error) {
      setHasError(true);
      setIsLoading(false);
      
      if (onError) {
        onError(error);
      }
    }
  }, [children, hasLoaded, isLoading, onLoad, onError]);

  if (hasError) {
    return fallback || (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <p>로딩 중 오류가 발생했습니다</p>
      </div>
    );
  }

  if (hasLoaded) {
    return typeof children === 'function' ? null : children;
  }

  return (
    <Observer
      onIntersectOnce={handleIntersectOnce}
      threshold={threshold}
      rootMargin={rootMargin}
      triggerOnce={true}
      className={className}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="w-6 h-6 border-2 border-vietnam-mint border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">로딩 중...</span>
        </div>
      ) : (
        placeholder || (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse h-32" />
        )
      )}
    </Observer>
  );
};

// Visibility 변화 추적용 Observer
export const VisibilityObserver = ({
  children,
  onVisibilityChange,
  threshold = [0, 0.25, 0.5, 0.75, 1],
  className = '',
  reportInterval = 1000,
  minVisibleTime = 1000,
  ...props
}) => {
  const [visibilityHistory, setVisibilityHistory] = useState([]);
  const lastReportTime = useRef(Date.now());
  const visibleStartTime = useRef(null);
  const reportTimer = useRef(null);

  const handleIntersect = useCallback((entry, isIntersecting) => {
    const now = Date.now();
    const visibilityData = {
      timestamp: now,
      isVisible: isIntersecting,
      intersectionRatio: entry.intersectionRatio,
      boundingClientRect: entry.boundingClientRect,
      rootBounds: entry.rootBounds
    };

    // 가시성 기록 업데이트
    setVisibilityHistory(prev => [...prev.slice(-49), visibilityData]);

    // 가시성 변화 콜백
    if (onVisibilityChange) {
      onVisibilityChange(visibilityData);
    }

    // 가시성 시작/종료 시간 추적
    if (isIntersecting && !visibleStartTime.current) {
      visibleStartTime.current = now;
    } else if (!isIntersecting && visibleStartTime.current) {
      const visibleDuration = now - visibleStartTime.current;
      
      if (visibleDuration >= minVisibleTime) {
        // 최소 시간 이상 가시 상태였음
        if (onVisibilityChange) {
          onVisibilityChange({
            type: 'visibility-duration',
            duration: visibleDuration,
            timestamp: now
          });
        }
      }
      
      visibleStartTime.current = null;
    }

    // 주기적 리포트
    if (isIntersecting && now - lastReportTime.current >= reportInterval) {
      lastReportTime.current = now;
      
      if (onVisibilityChange) {
        onVisibilityChange({
          type: 'visibility-report',
          duration: visibleStartTime.current ? now - visibleStartTime.current : 0,
          timestamp: now,
          intersectionRatio: entry.intersectionRatio
        });
      }
    }
  }, [onVisibilityChange, reportInterval, minVisibleTime]);

  return (
    <Observer
      onIntersect={handleIntersect}
      threshold={threshold}
      className={className}
      {...props}
    >
      {typeof children === 'function' 
        ? children({ visibilityHistory })
        : children
      }
    </Observer>
  );
};

// 진행률 추적용 Observer (스크롤 기반)
export const ProgressObserver = ({
  children,
  onProgress,
  direction = 'vertical', // vertical | horizontal
  className = '',
  showProgress = false,
  progressClassName = '',
  ...props
}) => {
  const [progress, setProgress] = useState(0);

  const handleProgressChange = useCallback((intersectionRatio) => {
    const progressValue = Math.round(intersectionRatio * 100);
    setProgress(progressValue);
    
    if (onProgress) {
      onProgress(progressValue, intersectionRatio);
    }
  }, [onProgress]);

  return (
    <div className={`relative ${className}`}>
      {showProgress && (
        <div className={`absolute top-0 left-0 bg-vietnam-mint transition-all duration-150 ${progressClassName} ${
          direction === 'vertical' ? 'w-1 h-full origin-top' : 'h-1 w-full origin-left'
        }`} style={{
          [direction === 'vertical' ? 'transform' : 'transform']: 
            direction === 'vertical' 
              ? `scaleY(${progress / 100})`
              : `scaleX(${progress / 100})`
        }} />
      )}
      
      <Observer
        onProgressChange={handleProgressChange}
        trackProgress={true}
        threshold={Array.from({ length: 21 }, (_, i) => i * 0.05)} // 0부터 1까지 0.05 간격
        {...props}
      >
        {typeof children === 'function' 
          ? children({ progress })
          : children
        }
      </Observer>
    </div>
  );
};

// 무한 스크롤용 Observer
export const InfiniteScrollObserver = ({
  onLoadMore,
  hasMore = true,
  loading = false,
  threshold = 0.1,
  rootMargin = '100px',
  className = '',
  loader,
  endMessage,
  ...props
}) => {
  const handleIntersect = useCallback((entry, isIntersecting) => {
    if (isIntersecting && hasMore && !loading && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  if (!hasMore) {
    return endMessage || (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <p>더 이상 불러올 데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <Observer
      onIntersect={handleIntersect}
      threshold={threshold}
      rootMargin={rootMargin}
      className={className}
      {...props}
    >
      {loading ? (
        loader || (
          <div className="flex items-center justify-center p-4">
            <div className="w-6 h-6 border-2 border-vietnam-mint border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              더 불러오는 중...
            </span>
          </div>
        )
      ) : (
        <div className="h-1" aria-hidden="true" />
      )}
    </Observer>
  );
};

export default Observer;