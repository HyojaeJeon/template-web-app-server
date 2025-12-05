'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronUpIcon, ArrowUpIcon } from '@heroicons/react/24/outline';

export default function BackToTop({
  threshold = 300, // 스크롤 위치가 이 값 이상일 때 버튼 표시
  smooth = true,
  position = 'bottom-right', // bottom-right, bottom-left, bottom-center
  offset = { x: 20, y: 20 }, // 화면 모서리로부터의 거리
  showProgress = false, // 스크롤 진행률 표시
  variant = 'circle', // circle, square, rounded, pill
  size = 'md', // sm, md, lg, xl
  icon = 'chevron', // chevron, arrow, custom
  customIcon,
  className = '',
  darkMode = true,
  animate = true, // 애니메이션 효과
  tooltip = '맨 위로', // 툴팁 텍스트
  onScroll,
  onClick
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  // 스크롤 이벤트 핸들러
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // 가시성 체크
      setIsVisible(scrollTop > threshold);
      
      // 진행률 계산
      if (showProgress && scrollHeight > 0) {
        const progress = (scrollTop / scrollHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
      
      // 콜백 실행
      if (onScroll) {
        onScroll(scrollTop, scrollHeight);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 초기 상태 설정

    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, showProgress, onScroll]);

  // 맨 위로 스크롤
  const scrollToTop = useCallback(() => {
    setIsClicked(true);
    
    if (onClick) {
      onClick();
    }
    
    if (smooth) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo(0, 0);
    }
    
    // 클릭 애니메이션 리셋
    setTimeout(() => {
      setIsClicked(false);
    }, 300);
  }, [smooth, onClick]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Home') {
        e.preventDefault();
        scrollToTop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollToTop]);

  // 위치 스타일
  const getPositionStyles = () => {
    const positions = {
      'bottom-right': `bottom-[${offset.y}px] right-[${offset.x}px]`,
      'bottom-left': `bottom-[${offset.y}px] left-[${offset.x}px]`,
      'bottom-center': `bottom-[${offset.y}px] left-1/2 -translate-x-1/2`
    };
    
    // Tailwind 클래스로 직접 설정
    switch(position) {
      case 'bottom-left':
        return 'bottom-5 left-5';
      case 'bottom-center':
        return 'bottom-5 left-1/2 -translate-x-1/2';
      case 'bottom-right':
      default:
        return 'bottom-5 right-5';
    }
  };

  // 크기 스타일
  const getSizeStyles = () => {
    const sizes = {
      sm: { button: 'w-10 h-10', icon: 'w-4 h-4', text: 'text-xs' },
      md: { button: 'w-12 h-12', icon: 'w-5 h-5', text: 'text-sm' },
      lg: { button: 'w-14 h-14', icon: 'w-6 h-6', text: 'text-base' },
      xl: { button: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-lg' }
    };
    return sizes[size] || sizes.md;
  };

  // 변형 스타일
  const getVariantStyles = () => {
    const variants = {
      circle: 'rounded-full',
      square: 'rounded-none',
      rounded: 'rounded-lg',
      pill: 'rounded-full px-6'
    };
    return variants[variant] || variants.circle;
  };

  // 아이콘 컴포넌트 선택
  const getIcon = () => {
    const sizeStyles = getSizeStyles();
    
    if (customIcon) {
      return customIcon;
    }
    
    switch(icon) {
      case 'arrow':
        return <ArrowUpIcon className={sizeStyles.icon} />;
      case 'chevron':
      default:
        return <ChevronUpIcon className={sizeStyles.icon} />;
    }
  };

  const sizeStyles = getSizeStyles();

  if (!isVisible) return null;

  return (
    <div className={`fixed ${getPositionStyles()} z-50 ${className}`}>
      {/* 진행률 표시 (외부 링) */}
      {showProgress && (
        <svg
          className="absolute inset-0 -rotate-90 pointer-events-none"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="48"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="50"
            cy="50"
            r="48"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 48}`}
            strokeDashoffset={`${2 * Math.PI * 48 * (1 - scrollProgress / 100)}`}
            className="text-blue-600 dark:text-blue-400 transition-all duration-300"
          />
        </svg>
      )}

      {/* 버튼 */}
      <button
        onClick={scrollToTop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative flex items-center justify-center
          ${sizeStyles.button}
          ${getVariantStyles()}
          ${animate ? 'transition-all duration-300' : ''}
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          ${isHovered ? 'scale-110' : 'scale-100'}
          ${isClicked ? 'scale-95' : ''}
          bg-gradient-to-r from-blue-600 to-indigo-600 
          hover:from-blue-700 hover:to-indigo-700
          dark:from-blue-500 dark:to-indigo-500
          dark:hover:from-blue-600 dark:hover:to-indigo-600
          text-white shadow-lg hover:shadow-xl
          focus:outline-none focus:ring-4 focus:ring-blue-500/50
        `}
        aria-label={tooltip || '맨 위로 이동'}
        title={tooltip || '맨 위로 이동'}
      >
        {/* 아이콘 */}
        <span className={`
          ${animate && isHovered ? 'animate-bounce' : ''}
          transition-transform duration-300
        `}>
          {getIcon()}
        </span>

        {/* 진행률 텍스트 (중앙) */}
        {showProgress && variant === 'circle' && (
          <span className={`
            absolute inset-0 flex items-center justify-center
            ${sizeStyles.text} font-semibold
          `}>
            {Math.round(scrollProgress)}%
          </span>
        )}
      </button>

      {/* 툴팁 */}
      {tooltip && isHovered && (
        <div className={`
          absolute ${position.includes('right') ? 'right-full mr-3' : 'left-full ml-3'}
          top-1/2 -translate-y-1/2
          px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg
          whitespace-nowrap pointer-events-none
          opacity-0 ${isHovered ? 'opacity-100' : ''}
          transition-opacity duration-200
        `}>
          {tooltip}
          <div className={`
            absolute top-1/2 -translate-y-1/2
            ${position.includes('right') ? 'left-full' : 'right-full'}
            w-0 h-0
            ${position.includes('right')
              ? 'border-l-[6px] border-l-gray-900 dark:border-l-gray-700'
              : 'border-r-[6px] border-r-gray-900 dark:border-r-gray-700'
            }
            border-y-[6px] border-y-transparent
          `} />
        </div>
      )}

      {/* 맥동 효과 */}
      {animate && (
        <span className="absolute inset-0 rounded-full animate-ping bg-blue-600/30 dark:bg-blue-400/30 pointer-events-none" />
      )}
    </div>
  );
}