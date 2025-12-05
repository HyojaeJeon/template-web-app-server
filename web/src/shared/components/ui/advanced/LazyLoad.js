'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 지연 로딩 컴포넌트 (WCAG 2.1 준수)
 * Intersection Observer를 사용한 성능 최적화
 * Local 테마 컬러와 다크모드 지원
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {React.ReactNode} props.children - 지연 로딩될 콘텐츠
 * @param {React.ReactNode} props.fallback - 로딩 중 표시될 콘텐츠
 * @param {React.ReactNode} props.placeholder - 지연 로딩 전 표시될 콘텐츠
 * @param {string} props.rootMargin - Intersection Observer rootMargin
 * @param {number} props.threshold - Intersection Observer threshold
 * @param {number} props.delay - 지연 시간 (ms)
 * @param {Function} props.onLoad - 로딩 완료 콜백
 * @param {Function} props.onError - 에러 콜백
 * @param {boolean} props.once - 한 번만 로딩할지 여부
 */
const LazyLoad = ({
  children,
  fallback = null,
  placeholder = null,
  rootMargin = '50px',
  threshold = 0.1,
  delay = 0,
  onLoad,
  onError,
  once = true,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState(null);
  
  const elementRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer 설정
  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    observer.observe(elementRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [rootMargin, threshold, once]);

  // 지연 로딩 실행
  useEffect(() => {
    if (!isVisible || hasLoaded) return;

    const loadContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 지연 시간 적용
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        setHasLoaded(true);
        
        if (onLoad) {
          onLoad();
        }
      } catch (err) {
        setError(err);
        if (onError) {
          onError(err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [isVisible, hasLoaded, delay, onLoad, onError]);

  // 재시도 함수
  const retry = useCallback(() => {
    setError(null);
    setHasLoaded(false);
    setIsVisible(true);
  }, []);

  return (
    <div
      ref={elementRef}
      className={`lazy-load-container ${className}`}
      role="region"
      aria-label="지연 로딩 영역"
      {...props}
    >
      {error ? (
        <div className="lazy-load-error text-center py-8">
          <div className="text-red-500 dark:text-red-400 mb-4">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-sm">콘텐츠 로딩에 실패했습니다.</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {error.message}
            </div>
          </div>
          <button
            onClick={retry}
            className="px-4 py-2 bg-mint-500 hover:bg-mint-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-mint-500/50"
          >
            다시 시도
          </button>
        </div>
      ) : hasLoaded ? (
        children
      ) : isLoading ? (
        fallback || (
          <div className="lazy-load-fallback flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin w-6 h-6 border-2 border-mint-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-gray-600 dark:text-gray-400">로딩 중...</div>
            </div>
          </div>
        )
      ) : (
        placeholder || (
          <div className="lazy-load-placeholder bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg h-48 flex items-center justify-center">
            <div className="text-gray-400 dark:text-gray-500 text-sm">
              콘텐츠 준비 중...
            </div>
          </div>
        )
      )}
    </div>
  );
};

/**
 * 지연 로딩 이미지 컴포넌트
 */
export const LazyImage = ({
  src,
  alt,
  placeholder,
  fallback,
  onLoad,
  onError,
  className = '',
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  
  const imgRef = useRef(null);

  // Intersection Observer로 뷰포트 진입 감지
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    if (onLoad) onLoad();
  }, [onLoad]);

  const handleError = useCallback((e) => {
    setError(true);
    if (onError) onError(e);
  }, [onError]);

  return (
    <div ref={imgRef} className={`lazy-image-container ${className}`}>
      {error ? (
        fallback || (
          <div className="lazy-image-error bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-2xl mb-2">🖼️</div>
              <div className="text-sm">이미지를 불러올 수 없습니다</div>
            </div>
          </div>
        )
      ) : (
        <>
          {isInView && (
            <img
              src={src}
              alt={alt}
              onLoad={handleLoad}
              onError={handleError}
              className={`lazy-image transition-opacity duration-300 ${
                loaded ? 'opacity-100' : 'opacity-0'
              }`}
              {...props}
            />
          )}
          {!loaded && !error && (
            placeholder || (
              <div className="lazy-image-placeholder bg-gray-100 dark:bg-gray-800 animate-pulse" style={{ ...props.style }}>
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <div className="text-center">
                    <div className="text-2xl mb-2">📷</div>
                    <div className="text-sm">로딩 중...</div>
                  </div>
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

/**
 * 지연 로딩 훅
 */
export const useLazyLoad = (options = {}) => {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    once = true
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return [elementRef, isVisible];
};

/**
 * Intersection Observer 훅
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);
  const elementRef = useRef(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      setEntry(entry);
    }, options);

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [options]);

  return [elementRef, isIntersecting, entry];
};

LazyLoad.Image = LazyImage;

export default LazyLoad;