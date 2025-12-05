'use client';

import React from 'react';
import Avatar from './Avatar';

/**
 * AvatarGroup 컴포넌트 - 여러 아바타를 스택 형태로 표시
 * 
 * @component
 * @param {Object} props - 컴포넌트 속성
 * @param {Array} props.users - 사용자 정보 배열
 * @param {number} [props.max=5] - 최대 표시 개수
 * @param {string} [props.size='md'] - 아바타 크기 (xs, sm, md, lg, xl, 2xl)
 * @param {string} [props.shape='circle'] - 아바타 모양 (circle, square, rounded)
 * @param {boolean} [props.showBorder=true] - 테두리 표시
 * @param {string} [props.borderColor='white'] - 테두리 색상
 * @param {string} [props.spacing='stacked'] - 간격 (stacked, separated, tight)
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {Function} [props.onMoreClick] - 더보기 클릭 핸들러
 * @param {string} [props.moreStyle='count'] - 더보기 스타일 (count, icon, custom)
 * @param {React.ReactNode} [props.customMore] - 커스텀 더보기 요소
 * 
 * @example
 * ```jsx
 * const users = [
 *   { id: 1, name: 'John Doe', src: '/john.jpg', status: 'online' },
 *   { id: 2, name: 'Jane Smith', src: '/jane.jpg' },
 *   { id: 3, name: 'Bob Johnson' },
 *   { id: 4, name: 'Alice Brown' },
 *   { id: 5, name: 'Charlie Wilson' },
 *   { id: 6, name: 'David Lee' }
 * ];
 * 
 * <AvatarGroup users={users} max={4} size="md" />
 * ```
 */
const AvatarGroup = ({
  users = [],
  max = 5,
  size = 'md',
  shape = 'circle',
  showBorder = true,
  borderColor = 'white',
  spacing = 'stacked',
  className = '',
  onMoreClick,
  moreStyle = 'count',
  customMore
}) => {
  const visibleUsers = users.slice(0, max);
  const remainingCount = Math.max(0, users.length - max);
  const remainingUsers = users.slice(max);

  const spacingStyles = {
    stacked: '-ml-3 first:ml-0',
    separated: 'ml-1 first:ml-0',
    tight: '-ml-4 first:ml-0'
  };

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

  const getTooltipContent = () => {
    if (remainingUsers.length === 0) return null;
    
    return remainingUsers.map(user => user.name).join(', ');
  };

  const renderMoreIndicator = () => {
    if (remainingCount === 0) return null;

    if (customMore) {
      return customMore;
    }

    const moreClasses = `
      ${sizes[size]}
      ${shapes[shape]}
      ${showBorder ? 'ring-2 ring-white' : ''}
      ${spacingStyles[spacing]}
      ${onMoreClick ? 'cursor-pointer hover:opacity-90' : ''}
      bg-gradient-to-br from-gray-400 to-gray-500
      text-white font-semibold
      flex items-center justify-center
      z-10
      shadow-md
      transition-all
      ${onMoreClick ? 'hover:scale-105' : ''}
    `;

    const moreContent = () => {
      switch (moreStyle) {
        case 'icon':
          return (
            <svg 
              className="w-1/2 h-1/2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
              />
            </svg>
          );
        case 'count':
        default:
          return `+${remainingCount}`;
      }
    };

    return (
      <div
        className={moreClasses}
        onClick={onMoreClick}
        role={onMoreClick ? 'button' : undefined}
        tabIndex={onMoreClick ? 0 : undefined}
        title={getTooltipContent()}
        onKeyDown={onMoreClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onMoreClick(remainingUsers);
          }
        } : undefined}
      >
        {moreContent()}
      </div>
    );
  };

  return (
    <div className={`flex items-center ${className}`}>
      {visibleUsers.map((user, index) => (
        <div
          key={user.id || index}
          className={`
            ${spacingStyles[spacing]}
            ${showBorder ? 'ring-2' : ''}
            ${shapes[shape]}
            relative
            transition-all hover:z-20
          `}
          style={{ 
            '--tw-ring-color': borderColor,
            zIndex: visibleUsers.length - index
          }}
        >
          <Avatar
            src={user.src}
            alt={user.alt}
            name={user.name}
            size={size}
            shape={shape}
            status={user.status}
            backgroundColor={user.backgroundColor}
            onClick={user.onClick}
            loading={user.loading}
          />
        </div>
      ))}
      
      {renderMoreIndicator()}
    </div>
  );
};

/**
 * AvatarGroupWithTooltip - 호버 시 모든 사용자 정보를 툴팁으로 표시
 */
export const AvatarGroupWithTooltip = ({
  users = [],
  max = 5,
  size = 'md',
  className = '',
  ...props
}) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="relative inline-flex">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <AvatarGroup
          users={users}
          max={max}
          size={size}
          className={className}
          {...props}
        />
      </div>
      
      {showTooltip && users.length > max && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-800 text-white text-sm rounded-lg py-2 px-3 max-w-xs">
            <div className="font-semibold mb-1">모든 사용자 ({users.length}명)</div>
            <div className="text-xs space-y-0.5">
              {users.map((user, idx) => (
                <div key={user.id || idx}>{user.name}</div>
              ))}
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-800"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarGroup;