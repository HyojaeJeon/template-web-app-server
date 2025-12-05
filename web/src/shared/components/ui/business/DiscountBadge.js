/**
 * DiscountBadge 컴포넌트
 * Local 배달 앱용 할인 배지 컴포넌트
 * WCAG 2.1 준수, 다크테마 지원
 */

import React from 'react';

const DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  AMOUNT: 'amount',
  BOGO: 'bogo', // Buy One Get One
  FREE_SHIPPING: 'free_shipping',
  NEW_USER: 'new_user',
  LOYALTY: 'loyalty',
  FLASH_SALE: 'flash_sale',
  HAPPY_HOUR: 'happy_hour'
};

const BADGE_VARIANTS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
  INFO: 'info'
};

const BADGE_SIZES = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl'
};

const DiscountBadge = ({
  type = DISCOUNT_TYPES.PERCENTAGE,
  value = 0,
  variant = BADGE_VARIANTS.DANGER,
  size = BADGE_SIZES.MD,
  isAnimated = false,
  showIcon = true,
  customText = null,
  originalPrice = null,
  discountedPrice = null,
  expiryTime = null,
  isFlashing = false,
  className = '',
  ...props
}) => {
  // 할인 텍스트 생성
  const getDiscountText = () => {
    if (customText) return customText;

    switch (type) {
      case DISCOUNT_TYPES.PERCENTAGE:
        return `-${value}%`;
      
      case DISCOUNT_TYPES.AMOUNT:
        return `-${new Intl.NumberFormat('vi-VN').format(value)}₫`;
      
      case DISCOUNT_TYPES.BOGO:
        return 'MUA 1 TẶNG 1';
      
      case DISCOUNT_TYPES.FREE_SHIPPING:
        return 'MIỄN PHÍ SHIP';
      
      case DISCOUNT_TYPES.NEW_USER:
        return 'KHÁCH MỚI';
      
      case DISCOUNT_TYPES.LOYALTY:
        return 'THÀNH VIÊN VIP';
      
      case DISCOUNT_TYPES.FLASH_SALE:
        return 'FLASH SALE';
      
      case DISCOUNT_TYPES.HAPPY_HOUR:
        return 'HAPPY HOUR';
      
      default:
        return `${value}% OFF`;
    }
  };

  // 아이콘 선택
  const getIcon = () => {
    if (!showIcon) return null;

    const icons = {
      [DISCOUNT_TYPES.PERCENTAGE]: '🏷️',
      [DISCOUNT_TYPES.AMOUNT]: '💰',
      [DISCOUNT_TYPES.BOGO]: '🎁',
      [DISCOUNT_TYPES.FREE_SHIPPING]: '🚚',
      [DISCOUNT_TYPES.NEW_USER]: '🌟',
      [DISCOUNT_TYPES.LOYALTY]: '👑',
      [DISCOUNT_TYPES.FLASH_SALE]: '⚡',
      [DISCOUNT_TYPES.HAPPY_HOUR]: '🎉'
    };

    return icons[type] || '🏷️';
  };

  // 색상 변형 클래스
  const getVariantClasses = () => {
    const variants = {
      [BADGE_VARIANTS.PRIMARY]: 'bg-[#2AC1BC] text-white border-[#2AC1BC]',
      [BADGE_VARIANTS.SECONDARY]: 'bg-[#00B14F] text-white border-[#00B14F]',
      [BADGE_VARIANTS.SUCCESS]: 'bg-green-600 text-white border-green-600',
      [BADGE_VARIANTS.WARNING]: 'bg-yellow-500 text-white border-yellow-500',
      [BADGE_VARIANTS.DANGER]: 'bg-red-600 text-white border-red-600',
      [BADGE_VARIANTS.INFO]: 'bg-blue-600 text-white border-blue-600'
    };

    return variants[variant] || variants[BADGE_VARIANTS.DANGER];
  };

  // 크기 클래스
  const getSizeClasses = () => {
    const sizes = {
      [BADGE_SIZES.XS]: 'text-xs px-1.5 py-0.5 min-h-[1.25rem]',
      [BADGE_SIZES.SM]: 'text-sm px-2 py-1 min-h-[1.5rem]',
      [BADGE_SIZES.MD]: 'text-sm px-3 py-1.5 min-h-[2rem]',
      [BADGE_SIZES.LG]: 'text-base px-4 py-2 min-h-[2.5rem]',
      [BADGE_SIZES.XL]: 'text-lg px-5 py-3 min-h-[3rem]'
    };

    return sizes[size] || sizes[BADGE_SIZES.MD];
  };

  // 만료 시간 계산
  const getTimeRemaining = () => {
    if (!expiryTime) return null;
    
    const now = new Date();
    const expiry = new Date(expiryTime);
    const diff = expiry - now;
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // 저장된 금액 계산
  const getSavedAmount = () => {
    if (!originalPrice || !discountedPrice) return null;
    return originalPrice - discountedPrice;
  };

  const timeRemaining = getTimeRemaining();
  const savedAmount = getSavedAmount();
  const icon = getIcon();
  const discountText = getDiscountText();

  return (
    <div
      className={`
        inline-flex items-center justify-center
        font-bold rounded-full border-2
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${isAnimated ? 'animate-pulse' : ''}
        ${isFlashing ? 'animate-ping' : ''}
        transition-all duration-200
        ${className}
      `}
      role="img"
      aria-label={`Khuyến mãi: ${discountText}${savedAmount ? `, tiết kiệm ${new Intl.NumberFormat('vi-VN').format(savedAmount)}₫` : ''}${timeRemaining ? `, còn ${timeRemaining}` : ''}`}
      {...props}
    >
      {/* Icon */}
      {icon && (
        <span 
          className={`${size === BADGE_SIZES.XS ? 'mr-1' : 'mr-1.5'}`}
          role="img"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}

      {/* Main Text */}
      <span className="whitespace-nowrap">
        {discountText}
      </span>

      {/* Time Remaining */}
      {timeRemaining && (
        <span 
          className={`ml-1.5 text-xs opacity-90 ${size === BADGE_SIZES.XS ? 'hidden' : ''}`}
          aria-label={`Còn lại ${timeRemaining}`}
        >
          {timeRemaining}
        </span>
      )}
    </div>
  );
};

// 사전 정의된 할인 배지 변형
export const FlashSaleBadge = (props) => (
  <DiscountBadge
    type={DISCOUNT_TYPES.FLASH_SALE}
    variant={BADGE_VARIANTS.DANGER}
    isAnimated={true}
    isFlashing={true}
    {...props}
  />
);

export const NewUserBadge = (props) => (
  <DiscountBadge
    type={DISCOUNT_TYPES.NEW_USER}
    variant={BADGE_VARIANTS.PRIMARY}
    {...props}
  />
);

export const FreeShippingBadge = (props) => (
  <DiscountBadge
    type={DISCOUNT_TYPES.FREE_SHIPPING}
    variant={BADGE_VARIANTS.SUCCESS}
    {...props}
  />
);

export const LoyaltyBadge = (props) => (
  <DiscountBadge
    type={DISCOUNT_TYPES.LOYALTY}
    variant={BADGE_VARIANTS.WARNING}
    {...props}
  />
);

export const HappyHourBadge = (props) => (
  <DiscountBadge
    type={DISCOUNT_TYPES.HAPPY_HOUR}
    variant={BADGE_VARIANTS.INFO}
    isAnimated={true}
    {...props}
  />
);

// 할인 배지 그룹 컴포넌트
export const DiscountBadgeGroup = ({
  discounts = [],
  maxVisible = 3,
  className = '',
  orientation = 'horizontal', // horizontal | vertical
  ...props
}) => {
  const visibleDiscounts = discounts.slice(0, maxVisible);
  const hiddenCount = Math.max(0, discounts.length - maxVisible);

  return (
    <div
      className={`
        flex items-center
        ${orientation === 'vertical' ? 'flex-col space-y-2' : 'flex-wrap gap-2'}
        ${className}
      `}
      role="group"
      aria-label="Danh sách khuyến mãi"
      {...props}
    >
      {visibleDiscounts.map((discount, index) => (
        <DiscountBadge
          key={discount.id || index}
          {...discount}
        />
      ))}

      {/* More indicator */}
      {hiddenCount > 0 && (
        <div className="inline-flex items-center justify-center bg-gray-500 text-white text-xs font-medium px-2 py-1 rounded-full">
          +{hiddenCount} khuyến mãi khác
        </div>
      )}
    </div>
  );
};

// Export constants
export { DISCOUNT_TYPES, BADGE_VARIANTS, BADGE_SIZES };
export default DiscountBadge;