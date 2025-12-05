'use client';

import React, { useState } from 'react';

/**
 * Avatar 컴포넌트
 * 
 * @component
 * @param {Object} props - 컴포넌트 속성
 * @param {string} [props.src] - 이미지 URL
 * @param {string} [props.alt] - 이미지 대체 텍스트
 * @param {string} [props.name] - 사용자 이름 (이미지가 없을 때 이니셜 표시)
 * @param {string} [props.size='md'] - 크기 (xs, sm, md, lg, xl, 2xl)
 * @param {string} [props.shape='circle'] - 모양 (circle, square, rounded)
 * @param {string} [props.status] - 상태 표시 (online, offline, away, busy)
 * @param {string} [props.statusPosition='bottom-right'] - 상태 위치
 * @param {boolean} [props.showBorder=false] - 테두리 표시
 * @param {string} [props.borderColor='#2AC1BC'] - 테두리 색상
 * @param {string} [props.backgroundColor] - 배경색 (이미지 없을 때)
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {Function} [props.onClick] - 클릭 이벤트 핸들러
 * @param {React.ReactNode} [props.badge] - 배지 요소
 * @param {boolean} [props.loading=false] - 로딩 상태
 * 
 * @example
 * ```jsx
 * <Avatar 
 *   src="/profile.jpg" 
 *   name="John Doe" 
 *   size="lg" 
 *   status="online"
 * />
 * ```
 */
const Avatar = ({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  status,
  statusPosition = 'bottom-right',
  showBorder = false,
  borderColor = '#2AC1BC',
  backgroundColor,
  className = '',
  onClick,
  badge,
  loading = false
}) => {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };

  const shapes = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-lg'
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };

  const statusPositions = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0'
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5'
  };

  // 이름으로부터 이니셜 생성
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // 이름으로부터 배경색 생성 (일관된 색상 생성)
  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    if (!name) return '#9CA3AF';
    
    const colors = [
      '#2AC1BC', // Mint
      '#00B14F', // Green
      '#3B82F6', // Blue
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#F59E0B', // Amber
      '#10B981', // Emerald
      '#6366F1'  // Indigo
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const containerClasses = `
    relative inline-flex items-center justify-center
    ${sizes[size]}
    ${shapes[shape]}
    ${showBorder ? 'ring-2' : ''}
    ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}
    ${className}
  `;

  const containerStyle = showBorder ? { '--tw-ring-color': borderColor } : {};

  const renderContent = () => {
    if (loading) {
      return (
        <div 
          className={`
            ${sizes[size]} 
            ${shapes[shape]} 
            bg-gray-200 
            animate-pulse
          `}
        />
      );
    }

    if (src && !imageError) {
      return (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={`
            ${sizes[size]} 
            ${shapes[shape]} 
            object-cover
          `}
          onError={() => setImageError(true)}
        />
      );
    }

    // 이미지가 없거나 로드 실패 시 이니셜 표시
    return (
      <div 
        className={`
          ${sizes[size]} 
          ${shapes[shape]}
          flex items-center justify-center
          text-white font-semibold
          select-none
        `}
        style={{ backgroundColor: getBackgroundColor() }}
      >
        {getInitials(name)}
      </div>
    );
  };

  return (
    <div 
      className={containerClasses}
      style={containerStyle}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      } : undefined}
    >
      {renderContent()}
      
      {/* Status Indicator */}
      {status && (
        <span 
          className={`
            absolute
            ${statusPositions[statusPosition]}
            ${statusSizes[size]}
            ${statusColors[status]}
            border-2 border-white
            ${shapes[shape] === 'rounded-full' ? 'rounded-full' : 'rounded'}
          `}
          aria-label={`Status: ${status}`}
        >
          {status === 'online' && (
            <span className="absolute inset-0 rounded-full animate-ping bg-green-500 opacity-75" />
          )}
        </span>
      )}
      
      {/* Badge */}
      {badge && (
        <div className="absolute -top-1 -right-1">
          {badge}
        </div>
      )}
    </div>
  );
};

export default Avatar;