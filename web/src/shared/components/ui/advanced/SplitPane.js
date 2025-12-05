/**
 * @fileoverview 분할 패널 컴포넌트 - WCAG 2.1 준수
 * 두 개의 패널을 크기 조절 가능한 분할선으로 나누는 컴포넌트
 * Local App 테마 색상 및 접근성 지원
 * 
 * @version 1.0.0
 * @author DeliveryVN Team
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * 분할 패널 컴포넌트
 * @param {Object} props
 * @param {React.ReactNode} props.children - 자식 컴포넌트들 (정확히 2개)
 * @param {string} [props.direction='horizontal'] - 분할 방향 (horizontal, vertical)
 * @param {number|string} [props.defaultSize='50%'] - 첫 번째 패널의 기본 크기
 * @param {number|string} [props.minSize=0] - 첫 번째 패널의 최소 크기
 * @param {number|string} [props.maxSize='100%'] - 첫 번째 패널의 최대 크기
 * @param {number} [props.splitSize=4] - 분할선 두께 (픽셀)
 * @param {Function} [props.onSplitChange] - 분할 위치 변경 콜백
 * @param {Function} [props.onSplitStart] - 분할 시작 콜백
 * @param {Function} [props.onSplitEnd] - 분할 완료 콜백
 * @param {boolean} [props.disabled=false] - 분할 비활성화
 * @param {boolean} [props.allowResize=true] - 크기 조절 허용
 * @param {number} [props.step=10] - 키보드 조절 단위 (픽셀)
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {string} [props.ariaLabel] - 접근성 레이블
 * @returns {JSX.Element}
 */
const SplitPane = ({
  children,
  direction = 'horizontal',
  defaultSize = '50%',
  minSize = 0,
  maxSize = '100%',
  splitSize = 4,
  onSplitChange,
  onSplitStart,
  onSplitEnd,
  disabled = false,
  allowResize = true,
  step = 10,
  className = '',
  ariaLabel,
  ...props
}) => {
  const containerRef = useRef(null);
  const splitterRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentSize, setCurrentSize] = useState(defaultSize);
  const [dragStart, setDragStart] = useState(null);

  // 자식 컴포넌트 개수 검증
  const childrenArray = React.Children.toArray(children);
  if (childrenArray.length !== 2) {
    console.error('SplitPane: 정확히 2개의 자식 컴포넌트가 필요합니다.');
    return null;
  }

  const isHorizontal = direction === 'horizontal';

  // 크기 값을 픽셀로 변환
  const convertToPixels = useCallback((value, containerSize) => {
    if (typeof value === 'string' && value.endsWith('%')) {
      return (parseInt(value) / 100) * containerSize;
    }
    return parseInt(value) || 0;
  }, []);

  // 크기 제한 함수
  const constrainSize = useCallback((newSize) => {
    if (!containerRef.current) return newSize;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerSize = isHorizontal ? containerRect.width : containerRect.height;

    const minPixels = convertToPixels(minSize, containerSize);
    const maxPixels = convertToPixels(maxSize, containerSize);

    return Math.max(minPixels, Math.min(maxPixels, newSize));
  }, [minSize, maxSize, isHorizontal, convertToPixels]);

  // 마우스 다운 핸들러
  const handleMouseDown = useCallback((e) => {
    if (disabled || !allowResize) return;

    e.preventDefault();
    e.stopPropagation();

    const containerRect = containerRef.current.getBoundingClientRect();
    const currentPosition = isHorizontal ? e.clientX : e.clientY;
    const containerStart = isHorizontal ? containerRect.left : containerRect.top;
    const containerSize = isHorizontal ? containerRect.width : containerRect.height;

    const currentPixelSize = convertToPixels(currentSize, containerSize);

    setIsDragging(true);
    setDragStart({
      position: currentPosition,
      size: currentPixelSize,
      containerStart,
      containerSize
    });

    onSplitStart?.(currentPixelSize);

    // 글로벌 이벤트 리스너 추가
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // 텍스트 선택 방지
    document.body.style.userSelect = 'none';
    document.body.style.cursor = isHorizontal ? 'ew-resize' : 'ns-resize';
  }, [disabled, allowResize, isHorizontal, currentSize, convertToPixels, onSplitStart]);

  // 마우스 이동 핸들러
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragStart) return;

    const currentPosition = isHorizontal ? e.clientX : e.clientY;
    const delta = currentPosition - dragStart.position;
    const newSize = dragStart.size + delta;

    const constrainedSize = constrainSize(newSize);
    const percentage = (constrainedSize / dragStart.containerSize) * 100;

    setCurrentSize(`${percentage}%`);
    onSplitChange?.(constrainedSize, `${percentage}%`);
  }, [isDragging, dragStart, isHorizontal, constrainSize, onSplitChange]);

  // 마우스 업 핸들러
  const handleMouseUp = useCallback(() => {
    if (!isDragging || !dragStart) return;

    setIsDragging(false);
    setDragStart(null);

    // 글로벌 이벤트 리스너 제거
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // 스타일 복원
    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    const containerSize = dragStart.containerSize;
    const currentPixelSize = convertToPixels(currentSize, containerSize);
    onSplitEnd?.(currentPixelSize, currentSize);
  }, [isDragging, dragStart, currentSize, convertToPixels, onSplitEnd, handleMouseMove]);

  // 키보드 핸들러
  const handleKeyDown = useCallback((e) => {
    if (disabled || !allowResize) return;

    let delta = 0;

    if (isHorizontal) {
      if (e.key === 'ArrowLeft') delta = -step;
      else if (e.key === 'ArrowRight') delta = step;
    } else {
      if (e.key === 'ArrowUp') delta = -step;
      else if (e.key === 'ArrowDown') delta = step;
    }

    if (delta === 0) return;

    e.preventDefault();

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerSize = isHorizontal ? containerRect.width : containerRect.height;
    const currentPixelSize = convertToPixels(currentSize, containerSize);
    
    const newSize = constrainSize(currentPixelSize + delta);
    const percentage = (newSize / containerSize) * 100;

    setCurrentSize(`${percentage}%`);
    onSplitChange?.(newSize, `${percentage}%`);
  }, [disabled, allowResize, isHorizontal, step, currentSize, convertToPixels, constrainSize, onSplitChange]);

  // 더블 클릭으로 기본 크기로 리셋
  const handleDoubleClick = useCallback(() => {
    if (disabled || !allowResize) return;

    setCurrentSize(defaultSize);
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerSize = isHorizontal ? containerRect.width : containerRect.height;
    const defaultPixelSize = convertToPixels(defaultSize, containerSize);
    
    onSplitChange?.(defaultPixelSize, defaultSize);
  }, [disabled, allowResize, defaultSize, isHorizontal, convertToPixels, onSplitChange]);

  // 터치 이벤트 핸들러들
  const handleTouchStart = useCallback((e) => {
    if (disabled || !allowResize) return;

    e.preventDefault();
    
    const touch = e.touches[0];
    const mockEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => {},
      stopPropagation: () => {}
    };
    
    handleMouseDown(mockEvent);
  }, [disabled, allowResize, handleMouseDown]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;

    e.preventDefault();
    
    const touch = e.touches[0];
    const mockEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY
    };
    
    handleMouseMove(mockEvent);
  }, [isDragging, handleMouseMove]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    handleMouseUp();
  }, [handleMouseUp]);

  // 정리 효과
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={`
        flex ${isHorizontal ? 'flex-row' : 'flex-col'} w-full h-full
        ${isDragging ? 'select-none' : ''} ${className}
      `}
      role="region"
      aria-label={ariaLabel || '분할 패널'}
      {...props}
    >
      {/* 첫 번째 패널 */}
      <div
        className="overflow-auto bg-white dark:bg-gray-800"
        style={{
          [isHorizontal ? 'width' : 'height']: currentSize,
          [isHorizontal ? 'height' : 'width']: '100%'
        }}
      >
        {childrenArray[0]}
      </div>

      {/* 분할선 */}
      <div
        ref={splitterRef}
        className={`
          relative flex items-center justify-center bg-gray-200 dark:bg-gray-700
          ${allowResize && !disabled ? 'hover:bg-mint-300 dark:hover:bg-mint-700' : ''}
          ${isDragging ? 'bg-mint-400 dark:bg-mint-600' : ''}
          ${allowResize && !disabled ? (isHorizontal ? 'cursor-ew-resize' : 'cursor-ns-resize') : 'cursor-default'}
          ${disabled ? 'opacity-50' : ''}
          transition-colors duration-200
        `}
        style={{
          [isHorizontal ? 'width' : 'height']: `${splitSize}px`,
          [isHorizontal ? 'height' : 'width']: '100%'
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        tabIndex={allowResize && !disabled ? 0 : -1}
        role="separator"
        aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
        aria-label={`패널 크기 조절 (현재: ${currentSize})`}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={typeof currentSize === 'string' && currentSize.endsWith('%') 
          ? parseInt(currentSize) 
          : 50}
      >
        {/* 분할선 핸들 아이콘 */}
        <div className="flex items-center justify-center">
          {isHorizontal ? (
            <div className="flex flex-col space-y-1">
              <div className="w-1 h-4 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
              <div className="w-1 h-4 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
              <div className="w-1 h-4 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
            </div>
          ) : (
            <div className="flex flex-row space-x-1">
              <div className="w-4 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
              <div className="w-4 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
              <div className="w-4 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
            </div>
          )}
        </div>

        {/* 크기 표시 툴팁 */}
        {isDragging && (
          <div className={`
            absolute z-10 px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded pointer-events-none
            ${isHorizontal ? 'top-full left-1/2 transform -translate-x-1/2 mt-1' : 'left-full top-1/2 transform -translate-y-1/2 ml-1'}
          `}>
            {currentSize}
          </div>
        )}
      </div>

      {/* 두 번째 패널 */}
      <div
        className="flex-1 overflow-auto bg-white dark:bg-gray-800"
        style={{
          [isHorizontal ? 'width' : 'height']: `calc(100% - ${currentSize} - ${splitSize}px)`,
          [isHorizontal ? 'height' : 'width']: '100%'
        }}
      >
        {childrenArray[1]}
      </div>

      {/* 스크린 리더를 위한 상태 정보 */}
      <div className="sr-only" aria-live="polite">
        {isDragging && `패널 크기 조절 중: 첫 번째 패널 ${currentSize}`}
      </div>
    </div>
  );
};

export default SplitPane;