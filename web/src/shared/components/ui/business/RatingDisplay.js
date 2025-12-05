/**
 * RatingDisplay 컴포넌트
 * Local 배달 앱용 평점 표시 컴포넌트
 * WCAG 2.1 준수, 다크테마 지원
 */

import React, { useMemo } from 'react';

const STAR_TYPES = {
  FILLED: 'filled',
  HALF: 'half',
  EMPTY: 'empty'
};

const DISPLAY_SIZES = {
  XS: 'xs',
  SM: 'sm', 
  MD: 'md',
  LG: 'lg',
  XL: 'xl'
};

const DISPLAY_VARIANTS = {
  DEFAULT: 'default',
  COMPACT: 'compact',
  DETAILED: 'detailed',
  BADGE: 'badge'
};

const RatingDisplay = ({
  rating = 0,
  maxRating = 5,
  reviewCount = 0,
  size = DISPLAY_SIZES.MD,
  variant = DISPLAY_VARIANTS.DEFAULT,
  showCount = true,
  showNumericRating = true,
  precision = 1, // 0 = integer only, 1 = one decimal, 2 = two decimals
  isInteractive = false,
  onRatingClick = null,
  customStarIcon = null,
  colorScheme = 'default', // default, vietnam, custom
  className = '',
  ...props
}) => {
  // 별 아이콘 선택
  const getStarIcon = (type) => {
    if (customStarIcon) return customStarIcon;

    const icons = {
      [STAR_TYPES.FILLED]: '★',
      [STAR_TYPES.HALF]: '⯨',
      [STAR_TYPES.EMPTY]: '☆'
    };

    return icons[type];
  };

  // 색상 스키마
  const getColorClasses = () => {
    const schemes = {
      default: {
        filled: 'text-yellow-400',
        half: 'text-yellow-400',
        empty: 'text-gray-300 dark:text-gray-600'
      },
      vietnam: {
        filled: 'text-[#2AC1BC]',
        half: 'text-[#2AC1BC]',
        empty: 'text-gray-300 dark:text-gray-600'
      }
    };

    return schemes[colorScheme] || schemes.default;
  };

  // 크기 클래스
  const getSizeClasses = () => {
    const sizes = {
      [DISPLAY_SIZES.XS]: {
        star: 'text-xs',
        text: 'text-xs',
        spacing: 'space-x-0.5'
      },
      [DISPLAY_SIZES.SM]: {
        star: 'text-sm',
        text: 'text-sm',
        spacing: 'space-x-1'
      },
      [DISPLAY_SIZES.MD]: {
        star: 'text-base',
        text: 'text-sm',
        spacing: 'space-x-1'
      },
      [DISPLAY_SIZES.LG]: {
        star: 'text-lg',
        text: 'text-base',
        spacing: 'space-x-2'
      },
      [DISPLAY_SIZES.XL]: {
        star: 'text-xl',
        text: 'text-lg',
        spacing: 'space-x-2'
      }
    };

    return sizes[size] || sizes[DISPLAY_SIZES.MD];
  };

  // 별 배열 생성
  const stars = useMemo(() => {
    const starArray = [];
    const clampedRating = Math.max(0, Math.min(rating, maxRating));
    
    for (let i = 1; i <= maxRating; i++) {
      if (clampedRating >= i) {
        starArray.push(STAR_TYPES.FILLED);
      } else if (clampedRating >= i - 0.5) {
        starArray.push(STAR_TYPES.HALF);
      } else {
        starArray.push(STAR_TYPES.EMPTY);
      }
    }
    
    return starArray;
  }, [rating, maxRating]);

  // 평점 포맷팅
  const formatRating = (value) => {
    if (precision === 0) return Math.round(value).toString();
    return value.toFixed(precision);
  };

  // 리뷰 수 포맷팅
  const formatReviewCount = (count) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const colorClasses = getColorClasses();
  const sizeClasses = getSizeClasses();

  // 별 클릭 핸들러
  const handleStarClick = (starIndex) => {
    if (isInteractive && onRatingClick) {
      onRatingClick(starIndex + 1);
    }
  };

  // 배지 변형
  if (variant === DISPLAY_VARIANTS.BADGE) {
    return (
      <div
        className={`
          inline-flex items-center bg-yellow-100 dark:bg-yellow-900/20 
          text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full
          ${sizeClasses.text} ${className}
        `}
        role="img"
        aria-label={`평점 ${formatRating(rating)}점 ${maxRating}점 만점${reviewCount > 0 ? `, ${reviewCount}개 리뷰` : ''}`}
        {...props}
      >
        <span className={`${sizeClasses.star} mr-1`} aria-hidden="true">
          {getStarIcon(STAR_TYPES.FILLED)}
        </span>
        <span className="font-medium">
          {formatRating(rating)}
        </span>
        {showCount && reviewCount > 0 && (
          <span className="ml-1 opacity-75">
            ({formatReviewCount(reviewCount)})
          </span>
        )}
      </div>
    );
  }

  // 컴팩트 변형
  if (variant === DISPLAY_VARIANTS.COMPACT) {
    return (
      <div
        className={`inline-flex items-center ${sizeClasses.spacing} ${className}`}
        role="img"
        aria-label={`평점 ${formatRating(rating)}점 ${maxRating}점 만점${reviewCount > 0 ? `, ${reviewCount}개 리뷰` : ''}`}
        {...props}
      >
        <span className={`${sizeClasses.star} ${colorClasses.filled}`} aria-hidden="true">
          {getStarIcon(STAR_TYPES.FILLED)}
        </span>
        {showNumericRating && (
          <span className={`font-medium text-gray-900 dark:text-gray-100 ${sizeClasses.text}`}>
            {formatRating(rating)}
          </span>
        )}
        {showCount && reviewCount > 0 && (
          <span className={`text-gray-600 dark:text-gray-400 ${sizeClasses.text}`}>
            ({formatReviewCount(reviewCount)})
          </span>
        )}
      </div>
    );
  }

  // 상세 변형
  if (variant === DISPLAY_VARIANTS.DETAILED) {
    return (
      <div className={`space-y-2 ${className}`} {...props}>
        {/* Stars and Rating */}
        <div className={`flex items-center ${sizeClasses.spacing}`}>
          <div 
            className={`flex items-center ${isInteractive ? 'cursor-pointer' : ''}`}
            role={isInteractive ? 'slider' : 'img'}
            aria-label={`평점 ${formatRating(rating)}점 ${maxRating}점 만점`}
            aria-valuenow={isInteractive ? rating : undefined}
            aria-valuemin={isInteractive ? 0 : undefined}
            aria-valuemax={isInteractive ? maxRating : undefined}
          >
            {stars.map((starType, index) => (
              <button
                key={index}
                type={isInteractive ? 'button' : undefined}
                onClick={isInteractive ? () => handleStarClick(index) : undefined}
                className={`
                  ${sizeClasses.star} ${colorClasses[starType]}
                  ${isInteractive ? 'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] focus:ring-offset-1 dark:focus:ring-offset-gray-800 rounded' : ''}
                  transition-transform duration-150
                `}
                aria-label={isInteractive ? `${index + 1}점 평가하기` : undefined}
                tabIndex={isInteractive ? 0 : -1}
                disabled={!isInteractive}
              >
                {getStarIcon(starType)}
              </button>
            ))}
          </div>

          {showNumericRating && (
            <span className={`font-semibold text-gray-900 dark:text-gray-100 ${sizeClasses.text} ml-2`}>
              {formatRating(rating)}
            </span>
          )}
        </div>

        {/* Review Count and Additional Info */}
        {showCount && reviewCount > 0 && (
          <div className={`flex items-center justify-between ${sizeClasses.text} text-gray-600 dark:text-gray-400`}>
            <span>
              {formatReviewCount(reviewCount)} đánh giá
            </span>
            {rating > 0 && (
              <span>
                {rating >= 4.5 ? '우수함' : rating >= 4 ? '좋음' : rating >= 3 ? '보통' : rating >= 2 ? '부족' : '개선 필요'}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // 기본 변형
  return (
    <div
      className={`inline-flex items-center ${sizeClasses.spacing} ${className}`}
      role={isInteractive ? 'slider' : 'img'}
      aria-label={`평점 ${formatRating(rating)}점 ${maxRating}점 만점${reviewCount > 0 ? `, ${reviewCount}개 리뷰` : ''}`}
      aria-valuenow={isInteractive ? rating : undefined}
      aria-valuemin={isInteractive ? 0 : undefined}
      aria-valuemax={isInteractive ? maxRating : undefined}
      {...props}
    >
      {/* Stars */}
      <div className={`flex items-center ${isInteractive ? 'cursor-pointer' : ''}`}>
        {stars.map((starType, index) => (
          <button
            key={index}
            type={isInteractive ? 'button' : undefined}
            onClick={isInteractive ? () => handleStarClick(index) : undefined}
            className={`
              ${sizeClasses.star} ${colorClasses[starType]}
              ${isInteractive ? 'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] focus:ring-offset-1 dark:focus:ring-offset-gray-800 rounded' : ''}
              transition-transform duration-150
            `}
            aria-label={isInteractive ? `${index + 1}점 평가하기` : undefined}
            tabIndex={isInteractive ? 0 : -1}
            disabled={!isInteractive}
          >
            {getStarIcon(starType)}
          </button>
        ))}
      </div>

      {/* Numeric Rating */}
      {showNumericRating && (
        <span className={`font-medium text-gray-900 dark:text-gray-100 ${sizeClasses.text}`}>
          {formatRating(rating)}
        </span>
      )}

      {/* Review Count */}
      {showCount && reviewCount > 0 && (
        <span className={`text-gray-600 dark:text-gray-400 ${sizeClasses.text}`}>
          ({formatReviewCount(reviewCount)})
        </span>
      )}
    </div>
  );
};

// 사전 정의된 평점 표시 변형
export const CompactRating = (props) => (
  <RatingDisplay variant={DISPLAY_VARIANTS.COMPACT} {...props} />
);

export const DetailedRating = (props) => (
  <RatingDisplay variant={DISPLAY_VARIANTS.DETAILED} {...props} />
);

export const BadgeRating = (props) => (
  <RatingDisplay variant={DISPLAY_VARIANTS.BADGE} {...props} />
);

export const InteractiveRating = (props) => (
  <RatingDisplay isInteractive={true} {...props} />
);

// Export constants
export { STAR_TYPES, DISPLAY_SIZES, DISPLAY_VARIANTS };
export default RatingDisplay;