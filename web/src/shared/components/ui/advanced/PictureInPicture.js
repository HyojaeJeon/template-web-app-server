/**
 * PictureInPicture.js - 화면 속 화면(PIP) 모드 컴포넌트
 * Local App MVP - 웹 관리자 시스템
 * 
 * @description
 * - 동영상이나 콘텐츠를 작은 창으로 분리하여 다른 작업과 동시에 볼 수 있는 PIP 기능 제공
 * - Local 테마 색상 적용 및 다크 모드 지원
 * - WCAG 2.1 접근성 준수 (키보드 네비게이션, ARIA 라벨)
 * - 드래그 앤 드롭으로 위치 이동 가능
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';

export const PictureInPicture = ({
  children,
  isActive = false,
  onToggle,
  position = 'bottom-right',
  size = 'medium',
  isDraggable = true,
  className = '',
  ariaLabel = 'Picture in Picture 창',
  ...props
}) => {
  const [isPiPActive, setIsPiPActive] = useState(isActive);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const pipRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // PIP 지원 여부 확인
  const supportsPiP = 'pictureInPictureEnabled' in document;

  // 크기 클래스 매핑
  const sizeClasses = {
    small: 'w-48 h-32',
    medium: 'w-64 h-40',
    large: 'w-80 h-48',
    xl: 'w-96 h-60'
  };

  // 위치 클래스 매핑
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  };

  // PIP 모드 토글
  const handleTogglePiP = () => {
    const newState = !isPiPActive;
    setIsPiPActive(newState);
    onToggle?.(newState);
  };

  // 드래그 시작
  const handleMouseDown = (e) => {
    if (!isDraggable) return;
    
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - dragPosition.x,
      y: e.clientY - dragPosition.y
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 드래그 중
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newPosition = {
      x: e.clientX - dragStartPos.current.x,
      y: e.clientY - dragStartPos.current.y
    };
    
    setDragPosition(newPosition);
  };

  // 드래그 종료
  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleTogglePiP();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTogglePiP();
    }
  };

  // 컴포넌트 언마운트 시 이벤트 리스너 정리
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // PIP가 활성화되지 않은 경우 일반 컨테이너로 렌더링
  if (!isPiPActive) {
    return (
      <div className={`relative ${className}`} {...props}>
        {children}
        {supportsPiP && (
          <button
            onClick={handleTogglePiP}
            onKeyDown={handleKeyDown}
            className={`
              absolute top-2 right-2 z-10
              bg-primary-600 hover:bg-primary-700 
              dark:bg-primary-500 dark:hover:bg-primary-600
              text-white px-3 py-1 rounded-md text-sm
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              dark:focus:ring-offset-gray-800
            `}
            aria-label="Picture in Picture 모드로 전환"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h6a1 1 0 100-2H3zm0 4a1 1 0 000 2h4a1 1 0 100-2H3z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  // PIP 모드 스타일
  const pipStyle = isDraggable && (dragPosition.x !== 0 || dragPosition.y !== 0) 
    ? {
        transform: `translate(${dragPosition.x}px, ${dragPosition.y}px)`,
        position: 'fixed',
        top: 'auto',
        left: 'auto',
        right: 'auto',
        bottom: 'auto'
      }
    : {};

  return (
    <>
      {/* PIP 컨테이너 */}
      <div
        ref={pipRef}
        className={`
          fixed z-50 
          ${sizeClasses[size]}
          ${isDraggable && (dragPosition.x === 0 && dragPosition.y === 0) ? positionClasses[position] : ''}
          bg-white dark:bg-gray-800 
          border border-gray-200 dark:border-gray-700
          rounded-lg shadow-2xl
          overflow-hidden
          ${isDragging ? 'cursor-grabbing' : isDraggable ? 'cursor-grab' : ''}
          ${className}
        `}
        style={pipStyle}
        onMouseDown={handleMouseDown}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        {...props}
      >
        {/* PIP 헤더 */}
        <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Picture in Picture
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            {/* 최소화 버튼 */}
            <button
              onClick={() => {/* 최소화 로직 */}}
              className={`
                w-6 h-6 rounded hover:bg-gray-200 dark:hover:bg-gray-600
                flex items-center justify-center text-gray-500 dark:text-gray-400
                focus:outline-none focus:ring-1 focus:ring-primary-500
              `}
              aria-label="최소화"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* 닫기 버튼 */}
            <button
              onClick={handleTogglePiP}
              onKeyDown={handleKeyDown}
              className={`
                w-6 h-6 rounded hover:bg-red-100 dark:hover:bg-red-900
                flex items-center justify-center text-gray-500 hover:text-red-600 
                dark:text-gray-400 dark:hover:text-red-400
                focus:outline-none focus:ring-1 focus:ring-red-500
              `}
              aria-label="Picture in Picture 모드 종료"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* PIP 콘텐츠 */}
        <div className="p-4 h-full">
          {children}
        </div>
      </div>
      
      {/* 백드롭 (선택사항) */}
      <div className="fixed inset-0 bg-black bg-opacity-10 dark:bg-opacity-20 z-40" />
    </>
  );
};

// Hook for PiP functionality
export const usePictureInPicture = (initialState = false) => {
  const [isActive, setIsActive] = useState(initialState);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const toggle = () => setIsActive(prev => !prev);
  const activate = () => setIsActive(true);
  const deactivate = () => setIsActive(false);
  
  const updatePosition = (newPosition) => {
    setPosition(newPosition);
  };

  return {
    isActive,
    position,
    toggle,
    activate,
    deactivate,
    updatePosition
  };
};

export default PictureInPicture;