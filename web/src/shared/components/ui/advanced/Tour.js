'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * 사용자 가이드 투어 컴포넌트 - Local App MVP 전용
 * 단계별 가이드, WCAG 2.1 준수, Local 테마 적용, 다크모드 지원
 * 
 * @param {boolean} isActive - 투어 활성/비활성 상태
 * @param {Array} steps - 투어 단계 목록
 * @param {number} currentStep - 현재 단계 인덱스
 * @param {Function} onNext - 다음 단계 콜백
 * @param {Function} onPrev - 이전 단계 콜백
 * @param {Function} onComplete - 투어 완료 콜백
 * @param {Function} onSkip - 투어 건너뛰기 콜백
 * @param {Object} options - 투어 옵션 설정
 */
const Tour = ({
  isActive = false,
  steps = [],
  currentStep = 0,
  onNext,
  onPrev,
  onComplete,
  onSkip,
  options = {},
  className = '',
  ...props
}) => {
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [highlightStyle, setHighlightStyle] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  const overlayRef = useRef(null);

  // 기본 옵션 설정
  const defaultOptions = {
    showProgress: true,
    showSkip: true,
    allowKeyboardNavigation: true,
    highlightPadding: 8,
    tooltipOffset: 10,
    animationDuration: 300,
    backdrop: true,
    ...options
  };

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // 요소 위치 계산
  const calculateElementPosition = useCallback((element) => {
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      width: rect.width,
      height: rect.height,
      right: rect.right + scrollLeft,
      bottom: rect.bottom + scrollTop
    };
  }, []);

  // 툴팁 위치 계산
  const calculateTooltipPosition = useCallback((targetRect, tooltipElement) => {
    if (!targetRect || !tooltipElement) return { x: 0, y: 0 };

    const tooltipRect = tooltipElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollTop = window.pageYOffset;
    const scrollLeft = window.pageXOffset;

    const placement = currentStepData?.placement || 'auto';
    const offset = defaultOptions.tooltipOffset;

    let x = 0;
    let y = 0;

    switch (placement) {
      case 'top':
        x = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        y = targetRect.top - tooltipRect.height - offset;
        break;
      case 'bottom':
        x = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        y = targetRect.bottom + offset;
        break;
      case 'left':
        x = targetRect.left - tooltipRect.width - offset;
        y = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        break;
      case 'right':
        x = targetRect.right + offset;
        y = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        break;
      default: // auto
        // 가장 적합한 위치 자동 선택
        const spaceTop = targetRect.top - scrollTop;
        const spaceBottom = viewportHeight - (targetRect.bottom - scrollTop);
        const spaceLeft = targetRect.left - scrollLeft;
        const spaceRight = viewportWidth - (targetRect.right - scrollLeft);

        if (spaceBottom >= tooltipRect.height + offset) {
          // 하단
          x = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
          y = targetRect.bottom + offset;
        } else if (spaceTop >= tooltipRect.height + offset) {
          // 상단
          x = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
          y = targetRect.top - tooltipRect.height - offset;
        } else if (spaceRight >= tooltipRect.width + offset) {
          // 우측
          x = targetRect.right + offset;
          y = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        } else {
          // 좌측
          x = targetRect.left - tooltipRect.width - offset;
          y = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        }
    }

    // 뷰포트 경계 조정
    x = Math.max(10, Math.min(x, viewportWidth - tooltipRect.width - 10));
    y = Math.max(10, Math.min(y, viewportHeight + scrollTop - tooltipRect.height - 10));

    return { x, y };
  }, [currentStepData, defaultOptions.tooltipOffset]);

  // 하이라이트 업데이트
  const updateHighlight = useCallback(() => {
    if (!isActive || !currentStepData) return;

    const targetElement = currentStepData.target 
      ? document.querySelector(currentStepData.target)
      : null;

    if (targetElement) {
      const rect = calculateElementPosition(targetElement);
      if (rect) {
        const padding = defaultOptions.highlightPadding;
        
        setHighlightStyle({
          position: 'absolute',
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + (padding * 2),
          height: rect.height + (padding * 2),
          transition: `all ${defaultOptions.animationDuration}ms ease-out`
        });

        // 툴팁 위치 업데이트
        if (tooltipRef.current) {
          const position = calculateTooltipPosition(rect, tooltipRef.current);
          setTooltipPosition(position);
        }

        // 요소를 뷰포트에 스크롤
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }
    }
  }, [
    isActive,
    currentStepData,
    calculateElementPosition,
    calculateTooltipPosition,
    defaultOptions.highlightPadding,
    defaultOptions.animationDuration
  ]);

  // 투어 활성화/단계 변경 시 업데이트
  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      updateHighlight();
    } else {
      setIsVisible(false);
    }
  }, [isActive, currentStep, updateHighlight]);

  // 윈도우 리사이즈 핸들링
  useEffect(() => {
    const handleResize = () => {
      if (isActive) {
        updateHighlight();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isActive, updateHighlight]);

  // 키보드 네비게이션
  useEffect(() => {
    if (!isActive || !defaultOptions.allowKeyboardNavigation) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          if (!isLastStep) {
            onNext?.();
          }
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          if (!isFirstStep) {
            onPrev?.();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onSkip?.();
          break;
        case 'Enter':
          e.preventDefault();
          if (isLastStep) {
            onComplete?.();
          } else {
            onNext?.();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isFirstStep, isLastStep, onNext, onPrev, onComplete, onSkip, defaultOptions.allowKeyboardNavigation]);

  // 오버레이 클릭 핸들러
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onSkip?.();
    }
  };

  if (!isActive || !isVisible || !currentStepData) return null;

  const tourContent = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      aria-describedby="tour-description"
      {...props}
    >
      {/* 백드롭 오버레이 */}
      {defaultOptions.backdrop && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" />
      )}

      {/* 하이라이트 컷아웃 */}
      {currentStepData.target && (
        <div 
          className="absolute pointer-events-none z-10"
          style={highlightStyle}
        >
          <div className="
            w-full h-full rounded-xl border-4 border-teal-500 dark:border-teal-400
            shadow-[0_0_0_4px_rgba(20,184,166,0.2),0_0_0_9999px_rgba(0,0,0,0.6)]
            dark:shadow-[0_0_0_4px_rgba(20,184,166,0.3),0_0_0_9999px_rgba(0,0,0,0.7)]
            transition-all duration-300
          " />
          
          {/* 펄스 애니메이션 */}
          <div className="absolute inset-0 rounded-xl border-4 border-teal-400 opacity-75 animate-ping" />
        </div>
      )}

      {/* 툴팁 */}
      <div
        ref={tooltipRef}
        className={`
          absolute z-20 w-80 max-w-sm pointer-events-auto
          bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700
          transform transition-all duration-300
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          ${className}
        `}
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y
        }}
      >
        {/* 툴팁 헤더 */}
        <div className="p-6 pb-4">
          {defaultOptions.showProgress && (
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {currentStep + 1} / {steps.length}
              </div>
              <div className="flex-1 mx-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </div>
              {defaultOptions.showSkip && (
                <button
                  onClick={onSkip}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                  aria-label="투어 건너뛰기"
                >
                  건너뛰기
                </button>
              )}
            </div>
          )}

          {currentStepData.title && (
            <h3 
              id="tour-title"
              className="text-xl font-bold text-gray-900 dark:text-white mb-2"
            >
              {currentStepData.title}
            </h3>
          )}
        </div>

        {/* 툴팁 내용 */}
        <div className="px-6 pb-4">
          {currentStepData.content && (
            <div 
              id="tour-description"
              className="text-gray-600 dark:text-gray-300 leading-relaxed"
            >
              {typeof currentStepData.content === 'string' ? (
                <p>{currentStepData.content}</p>
              ) : (
                currentStepData.content
              )}
            </div>
          )}

          {currentStepData.image && (
            <div className="mt-4">
              <img
                src={currentStepData.image}
                alt={currentStepData.imageAlt || '가이드 이미지'}
                className="w-full h-32 object-cover rounded-xl"
              />
            </div>
          )}
        </div>

        {/* 툴팁 액션 */}
        <div className="p-6 pt-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={onPrev}
                className="
                  px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400
                  hover:text-gray-900 dark:hover:text-white
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  rounded-lg transition-all duration-200
                  flex items-center gap-2
                "
                aria-label="이전 단계"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                이전
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* 단계 인디케이터 점 */}
            <div className="flex items-center gap-1 mx-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-300
                    ${
                      index === currentStep
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 scale-125'
                        : index < currentStep
                        ? 'bg-teal-300 dark:bg-teal-700'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }
                  `}
                />
              ))}
            </div>

            {isLastStep ? (
              <button
                onClick={onComplete}
                className="
                  px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500
                  hover:from-teal-600 hover:to-emerald-600
                  text-white font-semibold rounded-xl
                  transition-all duration-200
                  shadow-lg hover:shadow-xl
                  flex items-center gap-2
                "
              >
                완료
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={onNext}
                className="
                  px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500
                  hover:from-teal-600 hover:to-emerald-600
                  text-white font-semibold rounded-xl
                  transition-all duration-200
                  shadow-lg hover:shadow-xl
                  flex items-center gap-2
                "
              >
                다음
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 키보드 힌트 */}
        {defaultOptions.allowKeyboardNavigation && (
          <div className="px-6 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">←→</kbd>
                탐색
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Enter</kbd>
                진행
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Esc</kbd>
                종료
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(tourContent, document.body)
    : null;
};

// 투어 단계 타입 정의용 헬퍼
export const createTourStep = ({ 
  target, 
  title, 
  content, 
  placement = 'auto',
  image,
  imageAlt,
  ...rest 
}) => ({
  target,
  title,
  content,
  placement,
  image,
  imageAlt,
  ...rest
});

export default Tour;