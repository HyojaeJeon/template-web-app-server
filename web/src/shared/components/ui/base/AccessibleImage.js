/**
 * @fileoverview AccessibleImage - 접근성 이미지 컴포넌트 (WCAG 2.1 AA 준수)
 * 이미지 접근성을 위한 전용 컴포넌트
 * 
 * 접근성 기능:
 * - alt 속성 필수 제공
 * - 장식용 이미지 처리 (alt="", role="presentation")
 * - 로딩 상태 표시
 * - 에러 상태 처리
 * - 지연 로딩 지원
 * - 키보드 네비게이션 (클릭 가능한 경우)
 */

import React, { useState, useRef } from 'react';

const AccessibleImage = ({
  src,
  alt,
  decorative = false,
  title,
  width,
  height,
  className = '',
  loading = 'lazy',
  clickable = false,
  onClick,
  onLoad,
  onError,
  fallbackSrc,
  fallbackAlt = '이미지를 불러올 수 없습니다',
  showLoadingState = true,
  showErrorState = true,
  'data-testid': testId,
  ...rest
}) => {
  const [imageState, setImageState] = useState('loading');
  const [currentSrc, setCurrentSrc] = useState(src);
  const [currentAlt, setCurrentAlt] = useState(alt);
  const imgRef = useRef(null);

  const handleLoad = (e) => {
    setImageState('loaded');
    onLoad?.(e);
  };

  const handleError = (e) => {
    setImageState('error');
    
    // 폴백 이미지가 있는 경우
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setCurrentAlt(fallbackAlt);
      setImageState('loading');
      return;
    }
    
    onError?.(e);
  };

  const handleClick = (e) => {
    if (clickable && onClick) {
      onClick(e);
    }
  };

  const handleKeyDown = (e) => {
    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick(e);
    }
  };

  // 장식용 이미지인 경우
  if (decorative) {
    return (
      <img
        ref={imgRef}
        src={currentSrc}
        alt=""
        role="presentation"
        width={width}
        height={height}
        loading={loading}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        data-testid={testId}
        {...rest}
      />
    );
  }

  // alt가 제공되지 않은 경우 경고
  if (!alt && process.env.NODE_ENV === 'development') {
    console.warn('AccessibleImage: alt prop is required for non-decorative images');
  }

  const baseClasses = `
    accessible-image
    ${clickable ? 'cursor-pointer' : ''}
    ${clickable ? 'focus:outline-none focus:ring-2 focus:ring-vietnam-primary focus:ring-offset-2' : ''}
    ${className}
  `;

  // 로딩 상태
  if (imageState === 'loading' && showLoadingState) {
    return (
      <div 
        className={`
          accessible-image-loading
          bg-gray-200 animate-pulse
          flex items-center justify-center
          ${className}
        `}
        style={{ width, height }}
        role="img"
        aria-label={`${currentAlt} 로딩 중`}
        data-testid={testId}
      >
        <svg 
          className="w-6 h-6 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>
    );
  }

  // 에러 상태
  if (imageState === 'error' && showErrorState) {
    return (
      <div 
        className={`
          accessible-image-error
          bg-gray-100 border-2 border-dashed border-gray-300
          flex flex-col items-center justify-center p-4
          text-gray-500 text-center
          ${className}
        `}
        style={{ width, height }}
        role="img"
        aria-label={currentAlt || '이미지 로드 실패'}
        data-testid={testId}
      >
        <svg 
          className="w-8 h-8 mb-2 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <span className="text-sm">
          {currentAlt || '이미지를 불러올 수 없습니다'}
        </span>
      </div>
    );
  }

  // 정상 이미지
  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={currentAlt}
      title={title}
      width={width}
      height={height}
      loading={loading}
      className={baseClasses}
      onClick={clickable ? handleClick : undefined}
      onKeyDown={clickable ? handleKeyDown : undefined}
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'button' : undefined}
      onLoad={handleLoad}
      onError={handleError}
      data-testid={testId}
      {...rest}
    />
  );
};

AccessibleImage.displayName = 'AccessibleImage';

export default AccessibleImage;