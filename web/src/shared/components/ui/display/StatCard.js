'use client';

import React from 'react';

/**
 * StatCard 컴포넌트 - 통계 카드
 * 
 * @component
 * @param {Object} props - 컴포넌트 속성
 * @param {string} props.title - 통계 제목
 * @param {string|number} props.value - 통계 값
 * @param {string} [props.subtitle] - 부제목
 * @param {React.ReactNode} [props.icon] - 아이콘 요소
 * @param {string} [props.change] - 변화량 (예: "+12.5%")
 * @param {string} [props.changeType='increase'] - 변화 유형 (increase, decrease, neutral)
 * @param {string} [props.variant='default'] - 카드 변형 (default, bordered, elevated, colored)
 * @param {string} [props.size='md'] - 카드 크기 (sm, md, lg)
 * @param {string} [props.color] - 컬러 테마
 * @param {boolean} [props.loading=false] - 로딩 상태
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {Function} [props.onClick] - 클릭 이벤트 핸들러
 * @param {React.ReactNode} [props.footer] - 푸터 콘텐츠
 * @param {boolean} [props.animate=false] - 애니메이션 여부
 * 
 * @example
 * ```jsx
 * // 기본 통계 카드
 * <StatCard
 *   title="총 매출"
 *   value="₫5,234,000"
 *   change="+12.5%"
 *   changeType="increase"
 *   icon={<DollarIcon />}
 * />
 * 
 * // 커스텀 색상과 푸터
 * <StatCard
 *   title="신규 주문"
 *   value="45"
 *   subtitle="오늘"
 *   color="#2AC1BC"
 *   footer={<Link href="/orders">자세히 보기</Link>}
 * />
 * ```
 */
const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  change,
  changeType = 'neutral',
  variant = 'default',
  size = 'md',
  color,
  loading = false,
  className = '',
  onClick,
  footer,
  animate = false
}) => {
  const variantStyles = {
    default: 'bg-white dark:bg-gray-800',
    bordered: 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl',
    colored: `bg-gradient-to-br ${color ? '' : 'from-[#2AC1BC] to-[#00B14F]'} text-white`
  };

  const sizeStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const valueSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const changeColors = {
    increase: 'text-green-600 dark:text-green-400',
    decrease: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  };

  const changeIcons = {
    increase: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    decrease: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
    neutral: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12h10" />
      </svg>
    )
  };

  const cardContent = (
    <>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className={`font-medium ${
            variant === 'colored' 
              ? 'text-white/90' 
              : 'text-gray-600 dark:text-gray-400'
          } ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {title}
          </h3>
          
          {loading ? (
            <div className="mt-2 space-y-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
              {subtitle && (
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
              )}
            </div>
          ) : (
            <>
              <div className={`font-bold ${valueSizes[size]} ${
                variant === 'colored' 
                  ? 'text-white' 
                  : 'text-gray-900 dark:text-white'
              } mt-1 ${animate ? 'animate-fade-in' : ''}`}>
                {value}
              </div>
              
              {subtitle && (
                <p className={`${size === 'sm' ? 'text-xs' : 'text-sm'} ${
                  variant === 'colored'
                    ? 'text-white/80'
                    : 'text-gray-500 dark:text-gray-400'
                } mt-1`}>
                  {subtitle}
                </p>
              )}
            </>
          )}
        </div>

        {icon && (
          <div className={`${iconSizes[size]} ${
            variant === 'colored'
              ? 'text-white/80'
              : 'text-gray-400 dark:text-gray-500'
          } ${animate ? 'animate-bounce-once' : ''}`}>
            {icon}
          </div>
        )}
      </div>

      {change && !loading && (
        <div className={`flex items-center gap-1 mt-3 ${changeColors[changeType]}`}>
          {changeIcons[changeType]}
          <span className={`font-semibold ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {change}
          </span>
        </div>
      )}

      {footer && !loading && (
        <div className={`mt-4 pt-3 border-t ${
          variant === 'colored'
            ? 'border-white/20'
            : 'border-gray-200 dark:border-gray-700'
        }`}>
          {footer}
        </div>
      )}
    </>
  );

  const cardStyles = `
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    rounded-lg
    transition-all
    duration-200
    ${onClick ? 'cursor-pointer hover:shadow-md active:shadow-sm' : ''}
    ${className}
  `.trim();

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cardStyles}
        style={variant === 'colored' && color ? { background: color } : {}}
        aria-label={`${title}: ${value}`}
      >
        {cardContent}
      </button>
    );
  }

  return (
    <div 
      className={cardStyles}
      style={variant === 'colored' && color ? { background: color } : {}}
      role="article"
      aria-label={`${title}: ${value}`}
    >
      {cardContent}
    </div>
  );
};

/**
 * StatCardGroup - 통계 카드 그룹
 */
export const StatCardGroup = ({
  stats = [],
  columns = 4,
  gap = 'md',
  className = '',
  ...cardProps
}) => {
  const gapSizes = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  };

  return (
    <div className={`grid ${columnClasses[columns]} ${gapSizes[gap]} ${className}`}>
      {stats.map((stat, index) => (
        <StatCard
          key={stat.id || index}
          {...stat}
          {...cardProps}
        />
      ))}
    </div>
  );
};

/**
 * MiniStatCard - 미니 통계 카드
 */
export const MiniStatCard = ({
  label,
  value,
  icon,
  trend,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg ${className}`}>
      {icon && (
        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
      {trend && (
        <div className={`text-xs font-medium ${
          trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
        }`}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
  );
};

/**
 * ComparisonStatCard - 비교 통계 카드
 */
export const ComparisonStatCard = ({
  title,
  currentValue,
  previousValue,
  currentLabel = '이번 달',
  previousLabel = '지난 달',
  format = (val) => val,
  icon,
  className = ''
}) => {
  const change = previousValue ? ((currentValue - previousValue) / previousValue * 100).toFixed(1) : 0;
  const changeType = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral';

  return (
    <div className={`p-4 bg-white dark:bg-gray-800 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-700 dark:text-gray-300">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{currentLabel}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {format(currentValue)}
          </p>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{previousLabel}</p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {format(previousValue)}
            </p>
          </div>
          
          <div className={`flex items-center gap-1 ${
            changeType === 'increase' ? 'text-green-600' : 
            changeType === 'decrease' ? 'text-red-600' : 
            'text-gray-500'
          }`}>
            {changeType === 'increase' ? '↑' : changeType === 'decrease' ? '↓' : '→'}
            <span className="text-sm font-medium">{Math.abs(change)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;