'use client';

import React from 'react';

/**
 * Timeline 컴포넌트
 * 
 * @component
 * @param {Object} props - 컴포넌트 속성
 * @param {Array} props.items - 타임라인 아이템 배열
 * @param {string} [props.variant='default'] - 스타일 변형 (default, colored, compact)
 * @param {string} [props.orientation='vertical'] - 방향 (vertical, horizontal)
 * @param {boolean} [props.showTime=true] - 시간 표시 여부
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {boolean} [props.animated=false] - 애니메이션 효과
 * 
 * @example
 * ```jsx
 * const items = [
 *   {
 *     id: 1,
 *     title: '주문 접수',
 *     description: '주문이 접수되었습니다',
 *     time: '10:30 AM',
 *     icon: '📦',
 *     status: 'completed',
 *     color: '#2AC1BC'
 *   },
 *   {
 *     id: 2,
 *     title: '조리 중',
 *     description: '음식을 준비하고 있습니다',
 *     time: '10:35 AM',
 *     icon: '🍳',
 *     status: 'active'
 *   }
 * ];
 * 
 * <Timeline items={items} variant="colored" />
 * ```
 */
const Timeline = ({
  items = [],
  variant = 'default',
  orientation = 'vertical',
  showTime = true,
  className = '',
  animated = false
}) => {
  const getStatusColor = (status, customColor) => {
    if (customColor) return customColor;
    
    switch (status) {
      case 'completed':
        return '#00B14F'; // Green
      case 'active':
        return '#2AC1BC'; // Mint
      case 'pending':
        return '#9CA3AF'; // Gray
      case 'error':
        return '#DA020E'; // Red
      case 'warning':
        return '#FFDD00'; // Gold
      default:
        return '#9CA3AF'; // Gray
    }
  };

  const getItemClasses = (status, index) => {
    const baseClasses = 'relative flex gap-4';
    const animationClass = animated ? `animate-fadeInUp animation-delay-${index}` : '';
    
    return `${baseClasses} ${animationClass}`;
  };

  const getDotClasses = (status) => {
    const baseClasses = 'w-4 h-4 rounded-full border-2 bg-white z-10';
    
    if (status === 'active') {
      return `${baseClasses} border-[#2AC1BC] shadow-lg animate-pulse`;
    }
    
    return baseClasses;
  };

  const getLineClasses = (isLast, status) => {
    const baseClasses = 'absolute left-2 top-6 w-0.5 h-full -ml-px';
    
    if (status === 'completed') {
      return `${baseClasses} bg-[#00B14F]`;
    }
    
    return `${baseClasses} bg-gray-200`;
  };

  if (orientation === 'horizontal') {
    return (
      <div className={`flex overflow-x-auto pb-4 ${className}`}>
        {items.map((item, index) => (
          <div key={item.id || index} className="flex flex-col items-center min-w-[150px] px-4">
            <div className="relative">
              {/* Horizontal Line */}
              {index < items.length - 1 && (
                <div 
                  className="absolute left-full top-1/2 w-full h-0.5 -translate-y-1/2"
                  style={{ backgroundColor: getStatusColor(item.status, item.color) }}
                />
              )}
              
              {/* Dot/Icon */}
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md"
                style={{ backgroundColor: getStatusColor(item.status, item.color) }}
              >
                {item.icon || index + 1}
              </div>
            </div>
            
            {/* Content */}
            <div className="mt-3 text-center">
              <h4 className="font-semibold text-gray-800">{item.title}</h4>
              {item.description && (
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              )}
              {showTime && item.time && (
                <span className="text-xs text-gray-500 mt-1">{item.time}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Vertical Timeline (default)
  return (
    <div className={`relative ${className}`}>
      {items.map((item, index) => (
        <div key={item.id || index} className={getItemClasses(item.status, index)}>
          {/* Line */}
          {index < items.length - 1 && (
            <div className={getLineClasses(index === items.length - 1, item.status)} />
          )}
          
          {/* Left Side - Time (optional) */}
          {showTime && variant !== 'compact' && (
            <div className="flex-shrink-0 w-20 text-right">
              <span className="text-sm text-gray-500">{item.time}</span>
            </div>
          )}
          
          {/* Center - Dot/Icon */}
          <div className="flex-shrink-0 relative">
            {variant === 'colored' ? (
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-110"
                style={{ backgroundColor: getStatusColor(item.status, item.color) }}
              >
                {item.icon && (
                  <span className="text-lg">{item.icon}</span>
                )}
              </div>
            ) : (
              <div 
                className={getDotClasses(item.status)}
                style={{ borderColor: getStatusColor(item.status, item.color) }}
              />
            )}
            
            {item.status === 'active' && variant === 'colored' && (
              <div 
                className="absolute inset-0 rounded-full animate-ping opacity-25"
                style={{ backgroundColor: getStatusColor(item.status, item.color) }}
              />
            )}
          </div>
          
          {/* Right Side - Content */}
          <div className="flex-1 pb-8">
            <div 
              className={`
                ${variant === 'compact' ? 'p-3' : 'p-4'}
                ${variant === 'colored' ? 'bg-gradient-to-r from-gray-50 to-white' : 'bg-white'}
                rounded-lg shadow-sm border border-gray-100
                hover:shadow-md transition-shadow
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className={`font-semibold ${item.status === 'active' ? 'text-[#2AC1BC]' : 'text-gray-800'}`}>
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  {item.details && (
                    <div className="mt-2 space-y-1">
                      {item.details.map((detail, idx) => (
                        <p key={idx} className="text-xs text-gray-500">
                          • {detail}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                
                {showTime && variant === 'compact' && item.time && (
                  <span className="text-xs text-gray-500 ml-3">{item.time}</span>
                )}
                
                {item.badge && (
                  <span 
                    className="ml-3 px-2 py-1 text-xs font-medium text-white rounded-full"
                    style={{ backgroundColor: getStatusColor(item.status, item.color) }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              
              {item.action && (
                <button 
                  className="mt-3 text-sm text-[#2AC1BC] hover:text-[#1FA09B] font-medium transition-colors"
                  onClick={item.action.onClick}
                >
                  {item.action.label} →
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Animation Styles (can be added to global CSS)
const animationStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeInUp {
    animation: fadeInUp 0.5s ease-out forwards;
  }

  .animation-delay-0 { animation-delay: 0ms; }
  .animation-delay-1 { animation-delay: 100ms; }
  .animation-delay-2 { animation-delay: 200ms; }
  .animation-delay-3 { animation-delay: 300ms; }
  .animation-delay-4 { animation-delay: 400ms; }
  .animation-delay-5 { animation-delay: 500ms; }
`;

export default Timeline;