/**
 * Measure - 요소 크기 측정 컴포넌트
 * Local 테마 적용, 다크 모드 지원, WCAG 2.1 준수
 */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

const Measure = ({
  children,
  onResize = null,
  bounds = ['width', 'height'], // 'width', 'height', 'top', 'left', 'right', 'bottom'
  includeMargin = false,
  includePadding = false,
  debounceTime = 100,
  disabled = false,
  className = '',
  ...props
}) => {
  const [measurements, setMeasurements] = useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  });
  
  const elementRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // 요소 크기 측정 함수
  const measureElement = useCallback(() => {
    if (!elementRef.current || disabled) return;

    const element = elementRef.current;
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    // 기본 측정값
    let newMeasurements = {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom
    };

    // 마진 포함 계산
    if (includeMargin) {
      const marginTop = parseFloat(computedStyle.marginTop) || 0;
      const marginRight = parseFloat(computedStyle.marginRight) || 0;
      const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
      const marginLeft = parseFloat(computedStyle.marginLeft) || 0;

      newMeasurements.width += marginLeft + marginRight;
      newMeasurements.height += marginTop + marginBottom;
      newMeasurements.top -= marginTop;
      newMeasurements.left -= marginLeft;
      newMeasurements.right += marginRight;
      newMeasurements.bottom += marginBottom;
    }

    // 패딩 제외 계산
    if (!includePadding) {
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;

      newMeasurements.width -= paddingLeft + paddingRight;
      newMeasurements.height -= paddingTop + paddingBottom;
      newMeasurements.top += paddingTop;
      newMeasurements.left += paddingLeft;
      newMeasurements.right -= paddingRight;
      newMeasurements.bottom -= paddingBottom;
    }

    // 요청된 bounds만 필터링
    const filteredMeasurements = {};
    bounds.forEach(bound => {
      if (bound in newMeasurements) {
        filteredMeasurements[bound] = newMeasurements[bound];
      }
    });

    // 이전 측정값과 비교하여 변경된 경우에만 업데이트
    const hasChanged = bounds.some(bound => 
      Math.abs((measurements[bound] || 0) - (filteredMeasurements[bound] || 0)) > 0.5
    );

    if (hasChanged) {
      setMeasurements(prev => ({ ...prev, ...filteredMeasurements }));
      
      if (onResize) {
        onResize(filteredMeasurements);
      }
    }
  }, [bounds, includeMargin, includePadding, disabled, measurements, onResize]);

  // 디바운스된 측정 함수
  const debouncedMeasure = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      measureElement();
    }, debounceTime);
  }, [measureElement, debounceTime]);

  // ResizeObserver 설정
  useEffect(() => {
    if (!elementRef.current || disabled) return;

    // 초기 측정
    measureElement();

    // ResizeObserver 생성
    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(() => {
        debouncedMeasure();
      });

      resizeObserverRef.current.observe(elementRef.current);
    } else {
      // ResizeObserver가 없는 경우 window resize 이벤트 사용
      const handleResize = () => {
        debouncedMeasure();
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [disabled, measureElement, debouncedMeasure]);

  // children이 함수인 경우 측정값을 전달
  const renderChildren = () => {
    if (typeof children === 'function') {
      return children(measurements);
    }

    // React.cloneElement를 사용하여 measurements를 props로 전달
    if (React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...children.props,
        measurements,
        ref: elementRef
      });
    }

    return children;
  };

  return (
    <div
      ref={typeof children === 'function' ? elementRef : null}
      className={className}
      {...props}
    >
      {renderChildren()}
    </div>
  );
};

Measure.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.func
  ]).isRequired,
  onResize: PropTypes.func,
  bounds: PropTypes.arrayOf(PropTypes.oneOf([
    'width', 'height', 'top', 'left', 'right', 'bottom'
  ])),
  includeMargin: PropTypes.bool,
  includePadding: PropTypes.bool,
  debounceTime: PropTypes.number,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

// Hook 버전
export const useMeasure = (bounds = ['width', 'height'], options = {}) => {
  const {
    includeMargin = false,
    includePadding = false,
    debounceTime = 100,
    disabled = false
  } = options;

  const [measurements, setMeasurements] = useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  });

  const elementRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  const measureElement = useCallback(() => {
    if (!elementRef.current || disabled) return;

    const element = elementRef.current;
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    let newMeasurements = {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom
    };

    if (includeMargin) {
      const marginTop = parseFloat(computedStyle.marginTop) || 0;
      const marginRight = parseFloat(computedStyle.marginRight) || 0;
      const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
      const marginLeft = parseFloat(computedStyle.marginLeft) || 0;

      newMeasurements.width += marginLeft + marginRight;
      newMeasurements.height += marginTop + marginBottom;
      newMeasurements.top -= marginTop;
      newMeasurements.left -= marginLeft;
      newMeasurements.right += marginRight;
      newMeasurements.bottom += marginBottom;
    }

    if (!includePadding) {
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;

      newMeasurements.width -= paddingLeft + paddingRight;
      newMeasurements.height -= paddingTop + paddingBottom;
      newMeasurements.top += paddingTop;
      newMeasurements.left += paddingLeft;
      newMeasurements.right -= paddingRight;
      newMeasurements.bottom -= paddingBottom;
    }

    const filteredMeasurements = {};
    bounds.forEach(bound => {
      if (bound in newMeasurements) {
        filteredMeasurements[bound] = newMeasurements[bound];
      }
    });

    setMeasurements(prev => ({ ...prev, ...filteredMeasurements }));
  }, [bounds, includeMargin, includePadding, disabled]);

  const debouncedMeasure = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      measureElement();
    }, debounceTime);
  }, [measureElement, debounceTime]);

  useEffect(() => {
    if (!elementRef.current || disabled) return;

    measureElement();

    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(() => {
        debouncedMeasure();
      });

      resizeObserverRef.current.observe(elementRef.current);
    } else {
      const handleResize = () => {
        debouncedMeasure();
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [disabled, measureElement, debouncedMeasure]);

  return [elementRef, measurements];
};

// 특정 차원만 측정하는 특화된 훅들
export const useWidth = (options) => {
  const [ref, measurements] = useMeasure(['width'], options);
  return [ref, measurements.width];
};

export const useHeight = (options) => {
  const [ref, measurements] = useMeasure(['height'], options);
  return [ref, measurements.height];
};

export const useSize = (options) => {
  const [ref, measurements] = useMeasure(['width', 'height'], options);
  return [ref, { width: measurements.width, height: measurements.height }];
};

export const usePosition = (options) => {
  const [ref, measurements] = useMeasure(['top', 'left', 'right', 'bottom'], options);
  return [ref, {
    top: measurements.top,
    left: measurements.left,
    right: measurements.right,
    bottom: measurements.bottom
  }];
};

export default Measure;