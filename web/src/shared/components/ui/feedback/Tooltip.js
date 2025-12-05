'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/shared/i18n';
import { HelpCircle } from 'lucide-react';

/**
 * Tooltip 컴포넌트
 *
 * @description
 * 다국어를 지원하는 재사용 가능한 툴팁 컴포넌트입니다.
 * 접근성을 고려하여 ARIA 속성을 포함하며, 자동으로 위치를 조정합니다.
 *
 * @example
 * // 기본 사용
 * <Tooltip content="이것은 툴팁입니다" />
 *
 * @example
 * // 다국어 키 사용
 * <Tooltip translationKey="menu:tooltips.menuName" />
 *
 * @example
 * // 커스텀 아이콘
 * <Tooltip content="도움말" icon={<InfoIcon />} />
 *
 * @example
 * // 위치 지정
 * <Tooltip content="상단 툴팁" position="top" />
 */
export default function Tooltip({
  // 툴팁 내용 (직접 텍스트)
  content,
  // 번역 키 (우선순위: translationKey > content)
  translationKey,
  // 툴팁 위치 (기본: top)
  position = 'top',
  // 커스텀 아이콘
  icon = <HelpCircle className="w-4 h-4" />,
  // 아이콘 색상 클래스
  iconClassName = 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
  // 툴팁 배경 색상
  bgClassName = 'bg-gray-900 dark:bg-gray-700',
  // 툴팁 텍스트 색상
  textClassName = 'text-white dark:text-gray-100',
  // 최대 너비
  maxWidth = 'max-w-lg',
  // 추가 CSS 클래스
  className = '',
  // 툴팁 지연 시간 (ms)
  delay = 200,
  // 접근성을 위한 aria-label
  ariaLabel = '도움말 보기'
}) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState(position);
  const timeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  // 툴팁 내용 결정 (번역 키 우선)
  const tooltipContent = translationKey ? t(translationKey) : content;

  // 툴팁 위치 자동 조정
  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let newPosition = position;

      // 상단 공간 부족 시 하단으로
      if (position === 'top' && triggerRect.top < tooltipRect.height + 10) {
        newPosition = 'bottom';
      }

      // 하단 공간 부족 시 상단으로
      if (position === 'bottom' && viewportHeight - triggerRect.bottom < tooltipRect.height + 10) {
        newPosition = 'top';
      }

      // 좌측 공간 부족 시 우측으로
      if (position === 'left' && triggerRect.left < tooltipRect.width + 10) {
        newPosition = 'right';
      }

      // 우측 공간 부족 시 좌측으로
      if (position === 'right' && viewportWidth - triggerRect.right < tooltipRect.width + 10) {
        newPosition = 'left';
      }

      setTooltipPosition(newPosition);
    }
  }, [isVisible, position]);

  // 마우스 진입 시 지연 후 표시
  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  // 마우스 이탈 시 즉시 숨김
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // 포커스 시 즉시 표시 (키보드 접근성)
  const handleFocus = () => {
    setIsVisible(true);
  };

  // 블러 시 즉시 숨김
  const handleBlur = () => {
    setIsVisible(false);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 툴팁 위치별 CSS 클래스
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  // 화살표 위치별 CSS 클래스
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent'
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      {/* 트리거 아이콘 */}
      <button
        ref={triggerRef}
        type="button"
        className={`inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 rounded-full ${iconClassName}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={ariaLabel}
        aria-describedby={isVisible ? 'tooltip-content' : undefined}
      >
        {icon}
      </button>

      {/* 툴팁 내용 */}
      {isVisible && tooltipContent && (
        <div
          ref={tooltipRef}
          id="tooltip-content"
          role="tooltip"
          className={`absolute z-tooltip ${positionClasses[tooltipPosition]} px-4 py-3 text-sm rounded-lg shadow-xl ${bgClassName} ${textClassName} animate-in fade-in-0 zoom-in-95 duration-200`}
          style={{ maxWidth: '500px', minWidth: '200px' }}
        >
          {/* 툴팁 텍스트 */}
          <div className="relative">
            {tooltipContent}
          </div>

          {/* 화살표 */}
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses[tooltipPosition]}`}
            style={{
              borderTopColor: tooltipPosition === 'top' ? 'inherit' : 'transparent',
              borderBottomColor: tooltipPosition === 'bottom' ? 'inherit' : 'transparent',
              borderLeftColor: tooltipPosition === 'left' ? 'inherit' : 'transparent',
              borderRightColor: tooltipPosition === 'right' ? 'inherit' : 'transparent'
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * FormFieldTooltip - 폼 필드용 특화 툴팁
 *
 * @description
 * 폼 필드 라벨 옆에 표시하기 위한 특화된 툴팁입니다.
 * 일관된 스타일과 위치를 제공합니다.
 *
 * @example
 * <label className="flex items-center gap-2">
 *   메뉴명
 *   <FormFieldTooltip translationKey="menu:tooltips.menuName" />
 * </label>
 */
export function FormFieldTooltip({ translationKey, content, ...props }) {
  return (
    <Tooltip
      translationKey={translationKey}
      content={content}
      position="top"
      iconClassName="text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
      {...props}
    />
  );
}
