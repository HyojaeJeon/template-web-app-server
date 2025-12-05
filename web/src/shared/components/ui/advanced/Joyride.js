'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * 온보딩 튜토리얼 컴포넌트 - Local App MVP 전용
 * 새 사용자 온보딩, 기능 소개, WCAG 2.1 준수, Local 테마 적용, 다크모드 지원
 * 
 * @param {boolean} isActive - 온보딩 활성/비활성 상태
 * @param {Array} steps - 온보딩 단계 목록
 * @param {Function} onComplete - 온보딩 완료 콜백
 * @param {Function} onSkip - 온보딩 건너뛰기 콜백
 * @param {Object} options - 온보딩 옵션 설정
 */
const Joyride = ({
  isActive = false,
  steps = [],
  onComplete,
  onSkip,
  options = {},
  className = '',
  ...props
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [highlightStyle, setHighlightStyle] = useState({});
  const [progress, setProgress] = useState(0);
  const tooltipRef = useRef(null);

  // 기본 옵션 설정
  const defaultOptions = {
    showProgress: true,
    showSkip: true,
    autoNext: false,
    autoNextDelay: 3000,
    allowKeyboardNavigation: true,
    highlightPadding: 12,
    tooltipOffset: 20,
    animationDuration: 400,
    backdrop: true,
    spotlightClicks: false,
    continuous: true,
    showWelcome: true,
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

  // 툴팁 위치 계산 (Tour.js보다 더 지능적)
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
    let finalPlacement = placement;

    if (placement === 'auto') {
      // 가장 공간이 많은 방향을 자동 선택
      const spaces = {
        top: targetRect.top - scrollTop,
        bottom: viewportHeight - (targetRect.bottom - scrollTop),
        left: targetRect.left - scrollLeft,
        right: viewportWidth - (targetRect.right - scrollLeft)
      };

      finalPlacement = Object.keys(spaces).reduce((a, b) => 
        spaces[a] > spaces[b] ? a : b
      );
    }

    switch (finalPlacement) {
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
    }

    // 뷰포트 경계 조정 (더 스마트한 조정)
    const margin = 16;
    
    if (x < margin) {
      x = margin;
    } else if (x + tooltipRect.width > viewportWidth - margin) {
      x = viewportWidth - tooltipRect.width - margin;
    }

    if (y < scrollTop + margin) {
      y = scrollTop + margin;
    } else if (y + tooltipRect.height > viewportHeight + scrollTop - margin) {
      y = viewportHeight + scrollTop - tooltipRect.height - margin;
    }

    return { x, y };
  }, [currentStepData, defaultOptions.tooltipOffset]);

  // 하이라이트 및 툴팁 업데이트
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
          transition: `all ${defaultOptions.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
        });

        // 스무스 스크롤
        setTimeout(() => {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
        }, 100);
      }
    }
  }, [
    isActive,
    currentStepData,
    calculateElementPosition,
    defaultOptions.highlightPadding,
    defaultOptions.animationDuration
  ]);

  // 툴팁 위치 업데이트
  const updateTooltipPosition = useCallback(() => {
    if (!tooltipRef.current || !currentStepData) return;

    if (currentStepData.target) {
      const targetElement = document.querySelector(currentStepData.target);
      if (targetElement) {
        const rect = calculateElementPosition(targetElement);
        if (rect) {
          const position = calculateTooltipPosition(rect, tooltipRef.current);
          setTooltipPosition(position);
        }
      }
    } else {
      // 중앙 정렬 (환영 메시지 등)
      const rect = tooltipRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: (window.innerWidth - rect.width) / 2,
        y: (window.innerHeight - rect.height) / 2 + window.pageYOffset
      });
    }
  }, [currentStepData, calculateElementPosition, calculateTooltipPosition]);

  // 다음 단계로 이동
  const goNext = useCallback(() => {
    if (isLastStep) {
      onComplete?.();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLastStep, onComplete]);

  // 이전 단계로 이동
  const goPrev = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  }, [isFirstStep]);

  // 자동 진행
  useEffect(() => {
    if (!isActive || !defaultOptions.autoNext || !currentStepData?.autoNext) return;

    const timer = setTimeout(() => {
      goNext();
    }, defaultOptions.autoNextDelay);

    return () => clearTimeout(timer);
  }, [
    isActive,
    currentStep,
    currentStepData,
    defaultOptions.autoNext,
    defaultOptions.autoNextDelay,
    goNext
  ]);

  // 진행률 업데이트
  useEffect(() => {
    const newProgress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;
    setProgress(newProgress);
  }, [currentStep, steps.length]);

  // 온보딩 상태 변경 처리
  useEffect(() => {
    if (isActive && steps.length > 0) {
      setIsVisible(true);
      setCurrentStep(0);
      updateHighlight();
      
      // 약간의 지연 후 툴팁 위치 업데이트
      setTimeout(updateTooltipPosition, 100);
    } else {
      setIsVisible(false);
    }
  }, [isActive, steps.length, updateHighlight, updateTooltipPosition]);

  // 단계 변경 시 업데이트
  useEffect(() => {
    if (isVisible) {
      updateHighlight();
      setTimeout(updateTooltipPosition, 200);
    }
  }, [currentStep, isVisible, updateHighlight, updateTooltipPosition]);

  // 키보드 네비게이션
  useEffect(() => {
    if (!isActive || !defaultOptions.allowKeyboardNavigation) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Space':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'Escape':
          e.preventDefault();
          onSkip?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, goNext, goPrev, onSkip, defaultOptions.allowKeyboardNavigation]);

  // 윈도우 리사이즈 핸들링
  useEffect(() => {
    const handleResize = () => {
      if (isActive) {
        updateHighlight();
        updateTooltipPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', updateTooltipPosition);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updateTooltipPosition);
    };
  }, [isActive, updateHighlight, updateTooltipPosition]);

  if (!isActive || !isVisible || steps.length === 0) return null;

  const joyrideContent = (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="joyride-title"
      aria-describedby="joyride-description"
      {...props}
    >
      {/* 백드롭 */}
      {defaultOptions.backdrop && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-500" />
      )}

      {/* 스포트라이트 하이라이트 */}
      {currentStepData?.target && (
        <div 
          className="absolute z-10 pointer-events-none"
          style={highlightStyle}
        >
          {/* 메인 하이라이트 */}
          <div className="
            w-full h-full rounded-2xl 
            shadow-[0_0_0_8px_rgba(20,184,166,0.3),0_0_0_9999px_rgba(0,0,0,0.7)]
            dark:shadow-[0_0_0_8px_rgba(20,184,166,0.4),0_0_0_9999px_rgba(0,0,0,0.8)]
            transition-all duration-400
          " />
          
          {/* 글로우 이펙트 */}
          <div className="absolute inset-0 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl border-4 border-teal-400/60 animate-pulse" />
            <div className="absolute inset-2 rounded-xl border-2 border-teal-300/40 animate-pulse" 
                 style={{ animationDelay: '0.5s' }} />
          </div>

          {/* 클릭 가능한 오버레이 */}
          {defaultOptions.spotlightClicks && (
            <div 
              className="absolute inset-0 pointer-events-auto cursor-pointer"
              onClick={() => {
                const element = document.querySelector(currentStepData.target);
                if (element && typeof element.click === 'function') {
                  element.click();
                }
              }}
            />
          )}
        </div>
      )}

      {/* 툴팁 */}
      <div
        ref={tooltipRef}
        className={`
          absolute z-20 pointer-events-auto
          bg-white dark:bg-gray-900 rounded-3xl shadow-2xl 
          border border-gray-200 dark:border-gray-700
          transform transition-all duration-400 ease-out
          ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
          ${className}
        `}
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          width: currentStepData?.width || '400px',
          maxWidth: '90vw'
        }}
      >
        {/* 툴팁 헤더 */}
        <div className="p-8 pb-6">
          {/* 진행률 표시 */}
          {defaultOptions.showProgress && (
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                단계 {currentStep + 1} / {steps.length}
              </div>
              <div className="flex-1 mx-6">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 rounded-full transition-all duration-500 ease-out shadow-sm"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {Math.round(progress)}%
              </div>
            </div>
          )}

          {/* 타이틀 */}
          {currentStepData?.title && (
            <h2 
              id="joyride-title"
              className="text-2xl font-bold text-gray-900 dark:text-white mb-3"
            >
              {currentStepData.title}
            </h2>
          )}

          {/* 서브타이틀 */}
          {currentStepData?.subtitle && (
            <h3 className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              {currentStepData.subtitle}
            </h3>
          )}
        </div>

        {/* 툴팁 내용 */}
        <div className="px-8 pb-6">
          {currentStepData?.content && (
            <div 
              id="joyride-description"
              className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6"
            >
              {typeof currentStepData.content === 'string' ? (
                <p className="text-base">{currentStepData.content}</p>
              ) : (
                currentStepData.content
              )}
            </div>
          )}

          {/* 이미지 */}
          {currentStepData?.image && (
            <div className="mb-6">
              <img
                src={currentStepData.image}
                alt={currentStepData.imageAlt || '온보딩 이미지'}
                className="w-full h-48 object-cover rounded-2xl shadow-lg"
              />
            </div>
          )}

          {/* 팁/힌트 */}
          {currentStepData?.tip && (
            <div className="mb-6 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-2xl border border-teal-200 dark:border-teal-700">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-teal-800 dark:text-teal-200 text-sm mb-1">
                    💡 유용한 팁
                  </div>
                  <div className="text-sm text-teal-700 dark:text-teal-300">
                    {currentStepData.tip}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!isFirstStep && (
                <button
                  onClick={goPrev}
                  className="
                    px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400
                    hover:text-gray-900 dark:hover:text-white
                    hover:bg-gray-100 dark:hover:bg-gray-800
                    rounded-xl transition-all duration-200
                    flex items-center gap-2
                  "
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  이전
                </button>
              )}

              {defaultOptions.showSkip && (
                <button
                  onClick={onSkip}
                  className="
                    px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400
                    hover:text-gray-700 dark:hover:text-gray-300
                    hover:bg-gray-100 dark:hover:bg-gray-800
                    rounded-xl transition-all duration-200
                  "
                >
                  건너뛰기
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* 자동 진행 카운트다운 */}
              {currentStepData?.autoNext && defaultOptions.autoNext && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.ceil(defaultOptions.autoNextDelay / 1000)}초 후 자동 진행
                </div>
              )}

              {isLastStep ? (
                <button
                  onClick={onComplete}
                  className="
                    px-8 py-3 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500
                    hover:from-teal-600 hover:via-emerald-600 hover:to-green-600
                    text-white font-bold rounded-xl text-base
                    transition-all duration-200
                    shadow-lg hover:shadow-xl
                    flex items-center gap-3
                  "
                >
                  시작하기
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={goNext}
                  className="
                    px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500
                    hover:from-teal-600 hover:to-emerald-600
                    text-white font-semibold rounded-xl text-base
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
        </div>

        {/* 키보드 힌트 */}
        {defaultOptions.allowKeyboardNavigation && (
          <div className="px-8 pb-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">Space</kbd>
                다음
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">←</kbd>
                이전
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">Esc</kbd>
                종료
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(joyrideContent, document.body)
    : null;
};

// 온보딩 단계 생성 헬퍼
export const createOnboardingStep = ({
  target,
  title,
  subtitle,
  content,
  tip,
  image,
  imageAlt,
  placement = 'auto',
  width = '400px',
  autoNext = false,
  ...rest
}) => ({
  target,
  title,
  subtitle,
  content,
  tip,
  image,
  imageAlt,
  placement,
  width,
  autoNext,
  ...rest
});

export default Joyride;