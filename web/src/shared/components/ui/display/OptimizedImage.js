'use client';

import { useState, useEffect } from 'react';
import { ImageIcon, AlertCircle } from 'lucide-react';

/**
 * 이미지 로딩 실패 시 자동 fallback 처리하는 최적화된 이미지 컴포넌트
 */
export function OptimizedImage({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  width,
  height,
  objectFit = 'cover',
  fallbackType = 'placeholder', // 'placeholder' | 'error' | 'custom'
  fallbackContent,
  onLoad,
  onError,
  loading = 'lazy',
  ...props
}) {
  const [imageState, setImageState] = useState('loading'); // 'loading' | 'loaded' | 'error'
  const [imageSrc, setImageSrc] = useState(src);

  // src prop이 변경되면 imageSrc state도 업데이트
  useEffect(() => {
    if (src) {
      setImageSrc(src);
      setImageState('loading');
    }
  }, [src]);

  const handleImageLoad = (e) => {
    setImageState('loaded');
    onLoad?.(e);
  };

  const handleImageError = (e) => {
    setImageState('error');
    
    // 첫 번째 fallback: placeholder-food.jpg
    if (imageSrc === src) {
      setImageSrc('/images/placeholder-food.jpg');
      return;
    }
    
    // 두 번째 fallback: 기본 placeholder 또는 SVG
    if (imageSrc === '/images/placeholder-food.jpg') {
      setImageSrc('/images/default-placeholder.jpg');
      return;
    }
    
    // 최종 fallback: SVG 또는 컴포넌트로 처리
    onError?.(e);
  };

  // SVG Placeholder 생성
  const generatePlaceholderSVG = (width = 300, height = 200, type = 'food') => {
    const bgColor = type === 'food' ? '#f3f4f6' : '#e5e7eb';
    const iconColor = type === 'food' ? '#9ca3af' : '#6b7280';
    
    const svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bgColor}"/>
        <g transform="translate(${width/2 - 24}, ${height/2 - 24})">
          ${type === 'food' ? `
            <path fill="${iconColor}" d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V19C3 20.11 3.89 21 5 21H11V19H5V3H13V9H21ZM23 15V21C23 22.11 22.11 23 21 23H15C13.89 23 13 22.11 13 21V15C13 13.89 13.89 13 15 13H21C22.11 13 23 13.89 23 15ZM21 15H15V21H21V15Z"/>
          ` : `
            <path fill="${iconColor}" d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/>
          `}
        </g>
        <text x="50%" y="${height - 20}" text-anchor="middle" fill="${iconColor}" font-family="system-ui" font-size="12">
          ${type === 'food' ? '이미지 없음' : 'No Image'}
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  };

  // 이미지 로딩 실패 시 표시할 컴포넌트
  const ErrorFallback = () => {
    if (fallbackContent) {
      return fallbackContent;
    }

    const containerStyle = {
      width: width || '100%',
      height: height || '200px',
      backgroundColor: '#f3f4f6',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      border: '1px dashed #d1d5db'
    };

    if (fallbackType === 'error') {
      return (
        <div style={containerStyle} className={`${fallbackClassName} text-gray-500`}>
          <AlertCircle size={32} className="mb-2" />
          <span className="text-sm">이미지 로드 실패</span>
        </div>
      );
    }

    // placeholder 타입
    return (
      <div style={containerStyle} className={`${fallbackClassName} text-gray-400`}>
        <ImageIcon size={32} className="mb-2" />
        <span className="text-sm">이미지 없음</span>
      </div>
    );
  };

  // 이미지 로딩이 최종적으로 실패한 경우
  if (imageState === 'error' && imageSrc === '/images/default-placeholder.jpg') {
    return <ErrorFallback />;
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={{
        objectFit,
        width,
        height,
        opacity: imageState === 'loading' ? 0.7 : 1,
        transition: 'opacity 0.3s ease'
      }}
      onLoad={handleImageLoad}
      onError={handleImageError}
      loading={loading}
      {...props}
    />
  );
}

/**
 * 음식 이미지 전용 컴포넌트
 */
export function FoodImage({ 
  src, 
  alt, 
  className = '', 
  size = 'md',
  ...props 
}) {
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} ${className} rounded-lg object-cover`}
      fallbackType="placeholder"
      fallbackClassName="bg-gray-100 dark:bg-gray-700"
      {...props}
    />
  );
}

/**
 * 카드용 이미지 컴포넌트 (aspect ratio 고정)
 */
export function CardImage({ 
  src, 
  alt, 
  className = '', 
  aspectRatio = 'video', // 'square' | 'video' | 'portrait'
  ...props 
}) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]'
  };

  return (
    <div className={`${aspectClasses[aspectRatio]} bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        fallbackType="placeholder"
        fallbackClassName="w-full h-full flex items-center justify-center"
        {...props}
      />
    </div>
  );
}

export default OptimizedImage;