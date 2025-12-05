'use client';

import React from 'react';

/**
 * PriceTag 컴포넌트 - 가격 태그
 * 
 * @component
 * @param {Object} props - 컴포넌트 속성
 * @param {number} props.price - 현재 가격
 * @param {number} [props.originalPrice] - 원래 가격 (할인 전)
 * @param {string} [props.currency='₫'] - 통화 단위
 * @param {string} [props.locale='vi-VN'] - 로케일 (숫자 포맷)
 * @param {number} [props.discount] - 할인율 (%)
 * @param {string} [props.variant='default'] - 태그 변형 (default, badge, ribbon, sticker, minimal)
 * @param {string} [props.size='md'] - 태그 크기 (xs, sm, md, lg, xl)
 * @param {string} [props.color] - 커스텀 색상
 * @param {boolean} [props.showSavings=false] - 절약 금액 표시 여부
 * @param {string} [props.label] - 추가 라벨 (예: "특가", "한정판매")
 * @param {string} [props.position='inline'] - 위치 (inline, absolute-top-right, absolute-top-left)
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {boolean} [props.animate=false] - 애니메이션 여부
 * 
 * @example
 * ```jsx
 * // 기본 가격 태그
 * <PriceTag 
 *   price={25000}
 *   originalPrice={30000}
 *   currency="₫"
 * />
 * 
 * // 할인 배지 스타일
 * <PriceTag
 *   price={45000}
 *   originalPrice={60000}
 *   variant="badge"
 *   showSavings={true}
 *   label="오늘만 특가"
 * />
 * ```
 */
const PriceTag = ({
  price,
  originalPrice,
  currency = '₫',
  locale = 'vi-VN',
  discount,
  variant = 'default',
  size = 'md',
  color,
  showSavings = false,
  label,
  position = 'inline',
  className = '',
  animate = false
}) => {
  // 할인율 계산
  const calculatedDiscount = discount || (originalPrice && price < originalPrice 
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0);
  
  // 절약 금액 계산
  const savings = originalPrice ? originalPrice - price : 0;

  // 사이즈별 스타일
  const sizeStyles = {
    xs: {
      price: 'text-xs',
      original: 'text-xs',
      discount: 'text-xs',
      padding: 'px-1.5 py-0.5',
      label: 'text-xs'
    },
    sm: {
      price: 'text-sm',
      original: 'text-xs',
      discount: 'text-sm',
      padding: 'px-2 py-1',
      label: 'text-xs'
    },
    md: {
      price: 'text-base',
      original: 'text-sm',
      discount: 'text-base',
      padding: 'px-3 py-1.5',
      label: 'text-sm'
    },
    lg: {
      price: 'text-lg',
      original: 'text-base',
      discount: 'text-lg',
      padding: 'px-4 py-2',
      label: 'text-base'
    },
    xl: {
      price: 'text-xl',
      original: 'text-lg',
      discount: 'text-xl',
      padding: 'px-5 py-2.5',
      label: 'text-lg'
    }
  };

  // 변형별 스타일
  const variantStyles = {
    default: 'flex items-baseline gap-2',
    badge: `inline-flex items-center gap-2 ${sizeStyles[size].padding} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg`,
    ribbon: `inline-flex items-center gap-2 ${sizeStyles[size].padding} bg-gradient-to-r from-red-500 to-pink-500 text-white clip-ribbon`,
    sticker: `inline-flex flex-col items-center ${sizeStyles[size].padding} bg-yellow-400 dark:bg-yellow-600 text-gray-900 dark:text-white rounded-full border-2 border-dashed border-gray-900 dark:border-white`,
    minimal: 'inline-flex items-baseline gap-1'
  };

  // 포지션별 스타일
  const positionStyles = {
    inline: '',
    'absolute-top-right': 'absolute top-2 right-2 z-10',
    'absolute-top-left': 'absolute top-2 left-2 z-10',
    'absolute-bottom-right': 'absolute bottom-2 right-2 z-10',
    'absolute-bottom-left': 'absolute bottom-2 left-2 z-10'
  };

  // 가격 포맷팅
  const formatPrice = (value) => {
    return value.toLocaleString(locale);
  };

  // 기본 스타일 렌더링
  const renderDefault = () => (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span className={`font-bold ${sizeStyles[size].price} text-[#2AC1BC] dark:text-[#00B14F] ${
        animate ? 'animate-pulse' : ''
      }`}>
        {formatPrice(price)}{currency}
      </span>
      {originalPrice && originalPrice > price && (
        <>
          <span className={`line-through ${sizeStyles[size].original} text-gray-400 dark:text-gray-500`}>
            {formatPrice(originalPrice)}{currency}
          </span>
          {calculatedDiscount > 0 && (
            <span className={`font-semibold ${sizeStyles[size].discount} text-red-600 dark:text-red-400`}>
              -{calculatedDiscount}%
            </span>
          )}
        </>
      )}
      {showSavings && savings > 0 && (
        <span className={`${sizeStyles[size].label} text-green-600 dark:text-green-400`}>
          (Tiết kiệm {formatPrice(savings)}{currency})
        </span>
      )}
    </div>
  );

  // 배지 스타일 렌더링
  const renderBadge = () => (
    <div className={`${variantStyles.badge} ${className} ${
      animate ? 'animate-bounce-once' : ''
    }`} style={color ? { backgroundColor: color, color: 'white' } : {}}>
      {label && <span className={`font-bold ${sizeStyles[size].label}`}>{label}</span>}
      <span className={`font-bold ${sizeStyles[size].price}`}>
        {formatPrice(price)}{currency}
      </span>
      {originalPrice && originalPrice > price && (
        <span className={`line-through ${sizeStyles[size].original} opacity-70`}>
          {formatPrice(originalPrice)}{currency}
        </span>
      )}
      {calculatedDiscount > 0 && (
        <span className={`ml-1 px-2 py-0.5 bg-white/20 rounded-md font-bold ${sizeStyles[size].discount}`}>
          -{calculatedDiscount}%
        </span>
      )}
    </div>
  );

  // 리본 스타일 렌더링
  const renderRibbon = () => (
    <div 
      className={`${variantStyles.ribbon} shadow-lg ${className} ${
        animate ? 'animate-slide-in-right' : ''
      }`}
      style={color ? { background: `linear-gradient(to right, ${color}, ${color}dd)` } : {}}
    >
      {calculatedDiscount > 0 && (
        <span className={`font-bold ${sizeStyles[size].discount}`}>
          -{calculatedDiscount}%
        </span>
      )}
      <span className={`font-bold ${sizeStyles[size].price}`}>
        {formatPrice(price)}{currency}
      </span>
      {label && <span className={sizeStyles[size].label}>• {label}</span>}
    </div>
  );

  // 스티커 스타일 렌더링
  const renderSticker = () => (
    <div 
      className={`${variantStyles.sticker} ${className} ${
        animate ? 'animate-rotate-once' : ''
      }`}
      style={color ? { backgroundColor: color } : {}}
    >
      {calculatedDiscount > 0 && (
        <div className={`font-black ${sizeStyles[size].discount}`}>
          {calculatedDiscount}%
        </div>
      )}
      <div className={`font-bold ${sizeStyles[size].label} uppercase`}>
        {label || 'SALE'}
      </div>
      <div className={`font-bold ${sizeStyles[size].price}`}>
        {formatPrice(price)}{currency}
      </div>
    </div>
  );

  // 미니멀 스타일 렌더링
  const renderMinimal = () => (
    <span className={`${variantStyles.minimal} ${className}`}>
      <span className={`font-medium ${sizeStyles[size].price} text-gray-900 dark:text-white`}>
        {formatPrice(price)}{currency}
      </span>
      {originalPrice && originalPrice > price && (
        <span className={`line-through ${sizeStyles[size].original} text-gray-400`}>
          {formatPrice(originalPrice)}{currency}
        </span>
      )}
    </span>
  );

  // 렌더링 함수 선택
  const renderContent = () => {
    switch (variant) {
      case 'badge':
        return renderBadge();
      case 'ribbon':
        return renderRibbon();
      case 'sticker':
        return renderSticker();
      case 'minimal':
        return renderMinimal();
      default:
        return renderDefault();
    }
  };

  return (
    <div 
      className={positionStyles[position]}
      role="text"
      aria-label={`가격: ${formatPrice(price)}${currency}${
        originalPrice ? `, 원래 가격: ${formatPrice(originalPrice)}${currency}` : ''
      }${calculatedDiscount ? `, ${calculatedDiscount}% 할인` : ''}`}
    >
      {renderContent()}
    </div>
  );
};

/**
 * PriceRange 컴포넌트 - 가격 범위 표시
 */
export const PriceRange = ({
  minPrice,
  maxPrice,
  currency = '₫',
  locale = 'vi-VN',
  size = 'md',
  className = ''
}) => {
  const sizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const formatPrice = (value) => {
    return value.toLocaleString(locale);
  };

  return (
    <div className={`flex items-center gap-1 ${sizeStyles[size]} ${className}`}>
      <span className="font-medium text-gray-900 dark:text-white">
        {formatPrice(minPrice)}{currency}
      </span>
      <span className="text-gray-500">~</span>
      <span className="font-medium text-gray-900 dark:text-white">
        {formatPrice(maxPrice)}{currency}
      </span>
    </div>
  );
};

/**
 * PriceComparison 컴포넌트 - 가격 비교
 */
export const PriceComparison = ({
  items = [],
  highlightIndex = 0,
  currency = '₫',
  locale = 'vi-VN',
  className = ''
}) => {
  const formatPrice = (value) => {
    return value.toLocaleString(locale);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, index) => {
        const isHighlighted = index === highlightIndex;
        return (
          <div
            key={item.id || index}
            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
              isHighlighted
                ? 'border-[#2AC1BC] bg-[#2AC1BC]/5 dark:border-[#00B14F] dark:bg-[#00B14F]/5'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex-1">
              <h4 className={`font-medium ${
                isHighlighted ? 'text-[#2AC1BC] dark:text-[#00B14F]' : 'text-gray-900 dark:text-white'
              }`}>
                {item.name}
              </h4>
              {item.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {item.description}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className={`font-bold text-lg ${
                isHighlighted ? 'text-[#2AC1BC] dark:text-[#00B14F]' : 'text-gray-900 dark:text-white'
              }`}>
                {formatPrice(item.price)}{currency}
              </div>
              {item.originalPrice && item.originalPrice > item.price && (
                <div className="text-sm">
                  <span className="line-through text-gray-400">
                    {formatPrice(item.originalPrice)}{currency}
                  </span>
                  <span className="ml-2 text-red-600 dark:text-red-400 font-medium">
                    -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                  </span>
                </div>
              )}
              {isHighlighted && (
                <div className="mt-1">
                  <span className="inline-block px-2 py-1 bg-[#2AC1BC] dark:bg-[#00B14F] text-white text-xs rounded-full">
                    Đề xuất
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 애니메이션 스타일 (Tailwind config에 추가 필요)
const animationStyles = `
  @keyframes bounce-once {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes slide-in-right {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes rotate-once {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .animate-bounce-once {
    animation: bounce-once 0.5s ease-in-out;
  }
  
  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }
  
  .animate-rotate-once {
    animation: rotate-once 0.5s ease-in-out;
  }
  
  .clip-ribbon {
    clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%);
  }
`;

export default PriceTag;