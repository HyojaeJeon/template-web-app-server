/**
 * @fileoverview 크기 조절 가능 컴포넌트 - WCAG 2.1 준수
 * 마우스와 키보드로 크기를 조절할 수 있는 패널 컴포넌트
 * Local App 테마 색상 및 접근성 지원
 * 
 * @version 1.0.0
 * @author DeliveryVN Team
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * 크기 조절 가능 컴포넌트
 * @param {Object} props
 * @param {React.ReactNode} props.children - 자식 컴포넌트
 * @param {number} [props.width=300] - 초기 너비
 * @param {number} [props.height=200] - 초기 높이
 * @param {number} [props.minWidth=100] - 최소 너비
 * @param {number} [props.minHeight=100] - 최소 높이
 * @param {number} [props.maxWidth] - 최대 너비
 * @param {number} [props.maxHeight] - 최대 높이
 * @param {Array} [props.handles=['right', 'bottom', 'corner']] - 조절 핸들 위치
 * @param {Function} [props.onResize] - 크기 변경 콜백
 * @param {Function} [props.onResizeStart] - 크기 조절 시작 콜백
 * @param {Function} [props.onResizeEnd] - 크기 조절 완료 콜백
 * @param {boolean} [props.disabled=false] - 비활성화 상태
 * @param {number} [props.step=1] - 키보드 조절 단위 (픽셀)
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {string} [props.ariaLabel] - 접근성 레이블
 * @returns {JSX.Element}
 */
const Resizable = ({
  children,
  width = 300,
  height = 200,
  minWidth = 100,
  minHeight = 100,
  maxWidth,
  maxHeight,
  handles = ['right', 'bottom', 'corner'],
  onResize,
  onResizeStart,
  onResizeEnd,
  disabled = false,
  step = 1,
  className = '',
  ariaLabel,
  ...props
}) => {
  const containerRef = useRef(null);
  const [currentSize, setCurrentSize] = useState({ width, height });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeData, setResizeData] = useState(null);

  // 초기 크기가 변경될 때 업데이트
  useEffect(() => {
    setCurrentSize({ width, height });
  }, [width, height]);

  // 크기 제한 함수
  const constrainSize = useCallback((newWidth, newHeight) => {
    const constrainedWidth = Math.max(
      minWidth,
      maxWidth ? Math.min(maxWidth, newWidth) : newWidth
    );
    const constrainedHeight = Math.max(
      minHeight,
      maxHeight ? Math.min(maxHeight, newHeight) : newHeight
    );

    return { width: constrainedWidth, height: constrainedHeight };
  }, [minWidth, minHeight, maxWidth, maxHeight]);

  // 마우스 다운 핸들러
  const handleMouseDown = useCallback((e, handle) => {
    if (disabled) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;

    setIsResizing(true);
    setResizeData({
      handle,
      startX,
      startY,
      startWidth,
      startHeight
    });

    onResizeStart?.({ width: startWidth, height: startHeight });

    // 글로벌 이벤트 리스너 추가
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // 텍스트 선택 방지
    document.body.style.userSelect = 'none';
  }, [disabled, onResizeStart]);

  // 마우스 이동 핸들러
  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !resizeData) return;

    const deltaX = e.clientX - resizeData.startX;
    const deltaY = e.clientY - resizeData.startY;

    let newWidth = resizeData.startWidth;
    let newHeight = resizeData.startHeight;

    // 핸들 위치에 따른 크기 계산
    switch (resizeData.handle) {
      case 'right':
        newWidth = resizeData.startWidth + deltaX;
        break;
      case 'bottom':
        newHeight = resizeData.startHeight + deltaY;
        break;
      case 'corner':
        newWidth = resizeData.startWidth + deltaX;
        newHeight = resizeData.startHeight + deltaY;
        break;
      case 'left':
        newWidth = resizeData.startWidth - deltaX;
        break;
      case 'top':
        newHeight = resizeData.startHeight - deltaY;
        break;
      case 'top-left':
        newWidth = resizeData.startWidth - deltaX;
        newHeight = resizeData.startHeight - deltaY;
        break;
      case 'top-right':
        newWidth = resizeData.startWidth + deltaX;
        newHeight = resizeData.startHeight - deltaY;
        break;
      case 'bottom-left':
        newWidth = resizeData.startWidth - deltaX;
        newHeight = resizeData.startHeight + deltaY;
        break;
    }

    const constrainedSize = constrainSize(newWidth, newHeight);
    setCurrentSize(constrainedSize);
    onResize?.(constrainedSize);
  }, [isResizing, resizeData, constrainSize, onResize]);

  // 마우스 업 핸들러
  const handleMouseUp = useCallback(() => {
    if (!isResizing) return;

    setIsResizing(false);
    setResizeData(null);

    // 글로벌 이벤트 리스너 제거
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // 텍스트 선택 복원
    document.body.style.userSelect = '';

    onResizeEnd?.(currentSize);
  }, [isResizing, currentSize, onResizeEnd, handleMouseMove]);

  // 키보드 핸들러
  const handleKeyDown = useCallback((e, handle) => {
    if (disabled) return;

    let deltaX = 0;
    let deltaY = 0;

    // 방향키에 따른 이동량 계산
    switch (e.key) {
      case 'ArrowRight':
        deltaX = step;
        break;
      case 'ArrowLeft':
        deltaX = -step;
        break;
      case 'ArrowDown':
        deltaY = step;
        break;
      case 'ArrowUp':
        deltaY = -step;
        break;
      default:
        return;
    }

    e.preventDefault();

    let newWidth = currentSize.width;
    let newHeight = currentSize.height;

    // 핸들에 따른 크기 조절
    switch (handle) {
      case 'right':
        newWidth += deltaX;
        break;
      case 'bottom':
        newHeight += deltaY;
        break;
      case 'corner':
        newWidth += deltaX;
        newHeight += deltaY;
        break;
      case 'left':
        newWidth -= deltaX;
        break;
      case 'top':
        newHeight -= deltaY;
        break;
    }

    const constrainedSize = constrainSize(newWidth, newHeight);
    setCurrentSize(constrainedSize);
    onResize?.(constrainedSize);
  }, [disabled, step, currentSize, constrainSize, onResize]);

  // 핸들 렌더링 함수
  const renderHandle = useCallback((handle) => {
    const handleProps = {
      onMouseDown: (e) => handleMouseDown(e, handle),
      onKeyDown: (e) => handleKeyDown(e, handle),
      tabIndex: disabled ? -1 : 0,
      role: 'button',
      'aria-label': `크기 조절 핸들 (${handle})`,
      className: `
        absolute bg-mint-600 hover:bg-mint-700 focus:bg-mint-700 
        focus:ring-2 focus:ring-mint-500 focus:ring-opacity-50 focus:outline-none
        transition-colors duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${isResizing ? 'bg-mint-700' : ''}
      `
    };

    switch (handle) {
      case 'right':
        return (
          <div
            key="right"
            {...handleProps}
            className={`${handleProps.className} top-0 right-0 w-1 h-full cursor-ew-resize`}
            style={{ right: '-2px' }}
          />
        );

      case 'bottom':
        return (
          <div
            key="bottom"
            {...handleProps}
            className={`${handleProps.className} bottom-0 left-0 w-full h-1 cursor-ns-resize`}
            style={{ bottom: '-2px' }}
          />
        );

      case 'corner':
        return (
          <div
            key="corner"
            {...handleProps}
            className={`${handleProps.className} bottom-0 right-0 w-3 h-3 cursor-nw-resize`}
            style={{ bottom: '-1px', right: '-1px' }}
          >
            {/* 코너 핸들 아이콘 */}
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 12 12"
              aria-hidden="true"
            >
              <path d="M0 12L12 0v12H0z" />
              <path d="M5 7l1-1v4H2v-1l3-2z" fill="rgba(255,255,255,0.7)" />
            </svg>
          </div>
        );

      case 'left':
        return (
          <div
            key="left"
            {...handleProps}
            className={`${handleProps.className} top-0 left-0 w-1 h-full cursor-ew-resize`}
            style={{ left: '-2px' }}
          />
        );

      case 'top':
        return (
          <div
            key="top"
            {...handleProps}
            className={`${handleProps.className} top-0 left-0 w-full h-1 cursor-ns-resize`}
            style={{ top: '-2px' }}
          />
        );

      case 'top-left':
        return (
          <div
            key="top-left"
            {...handleProps}
            className={`${handleProps.className} top-0 left-0 w-3 h-3 cursor-nw-resize`}
            style={{ top: '-1px', left: '-1px' }}
          />
        );

      case 'top-right':
        return (
          <div
            key="top-right"
            {...handleProps}
            className={`${handleProps.className} top-0 right-0 w-3 h-3 cursor-ne-resize`}
            style={{ top: '-1px', right: '-1px' }}
          />
        );

      case 'bottom-left':
        return (
          <div
            key="bottom-left"
            {...handleProps}
            className={`${handleProps.className} bottom-0 left-0 w-3 h-3 cursor-ne-resize`}
            style={{ bottom: '-1px', left: '-1px' }}
          />
        );

      default:
        return null;
    }
  }, [handleMouseDown, handleKeyDown, disabled, isResizing]);

  // 정리 효과
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={`
        relative border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800
        ${isResizing ? 'select-none' : ''} ${className}
      `}
      style={{
        width: currentSize.width,
        height: currentSize.height,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight
      }}
      role="region"
      aria-label={ariaLabel || '크기 조절 가능한 패널'}
      {...props}
    >
      {/* 콘텐츠 */}
      <div className="w-full h-full overflow-auto p-4">
        {children}
      </div>

      {/* 크기 조절 핸들들 */}
      {!disabled && handles.map(handle => renderHandle(handle))}

      {/* 크기 표시 */}
      {isResizing && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-none">
          {Math.round(currentSize.width)} × {Math.round(currentSize.height)}
        </div>
      )}

      {/* 스크린 리더를 위한 상태 정보 */}
      <div className="sr-only" aria-live="polite">
        {isResizing && `크기 조절 중: 너비 ${Math.round(currentSize.width)}픽셀, 높이 ${Math.round(currentSize.height)}픽셀`}
      </div>
    </div>
  );
};

export default Resizable;