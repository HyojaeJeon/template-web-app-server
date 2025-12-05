/**
 * @fileoverview 지연 로딩 훅 - Intersection Observer를 활용한 성능 최적화
 * @description 화면에 들어오는 시점에 컴포넌트나 이미지를 로드하여 초기 로딩 성능을 개선
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 지연 로딩을 위한 커스텀 훅
 * 
 * @param {Object} options - 지연 로딩 옵션
 * @param {string} [options.rootMargin='100px'] - 루트 마진 설정
 * @param {number} [options.threshold=0.1] - 가시성 임계값
 * @param {boolean} [options.triggerOnce=true] - 한 번만 트리거 여부
 * @param {Function} [options.onLoad] - 로드 완료 콜백
 * @returns {Object} 지연 로딩 상태와 ref
 */
export const useLazyLoad = (options = {}) => {
  const {
    rootMargin = '100px',
    threshold = 0.1,
    triggerOnce = true,
    onLoad
  } = options;

  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(null);
  const elementRef = useRef(null);
  const observerRef = useRef(null);

  const handleIntersection = useCallback((entries) => {
    const [entry] = entries;
    
    if (entry.isIntersecting) {
      setIsInView(true);
      
      if (triggerOnce && observerRef.current) {
        observerRef.current.disconnect();
      }
      
      if (onLoad) {
        try {
          onLoad();
        } catch (err) {
          setError(err);
        }
      }
    }
  }, [triggerOnce, onLoad]);

  useEffect(() => {
    const element = elementRef.current;
    
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, rootMargin, threshold]);

  const load = useCallback(() => {
    setIsLoaded(true);
    if (onLoad) {
      try {
        onLoad();
      } catch (err) {
        setError(err);
      }
    }
  }, [onLoad]);

  const reset = useCallback(() => {
    setIsLoaded(false);
    setIsInView(false);
    setError(null);
  }, []);

  return {
    elementRef,
    isLoaded,
    isInView,
    error,
    load,
    reset
  };
};

/**
 * 이미지 지연 로딩 훅
 * 
 * @param {string} src - 이미지 소스 URL
 * @param {Object} options - 옵션
 * @returns {Object} 이미지 로딩 상태
 */
export const useLazyImage = (src, options = {}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(null);

  const { elementRef, isInView } = useLazyLoad({
    ...options,
    onLoad: () => {
      if (src && !imageSrc) {
        setImageLoading(true);
        setImageError(null);
        
        const img = new Image();
        img.onload = () => {
          setImageSrc(src);
          setImageLoading(false);
        };
        img.onerror = (err) => {
          setImageError(err);
          setImageLoading(false);
        };
        img.src = src;
      }
    }
  });

  return {
    elementRef,
    imageSrc,
    imageLoading,
    imageError,
    isInView
  };
};

export default useLazyLoad;