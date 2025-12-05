/**
 * 대시보드 전용 카드 컴포넌트
 * 통계 표시, 차트 영역, KPI 지표 최적화
 */
'use client';

import React from 'react';
import Card from './Card';

/**
 * 통계 카드 컴포넌트
 */
export const StatCard = ({
  title,
  value,
  change,
  changeType = 'percentage', // 'percentage', 'absolute', 'currency'
  trend = 'up', // 'up', 'down', 'neutral'
  icon,
  description,
  tooltip, // 툴팁 컴포넌트 (선택)
  loading = false,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  // 트렌드에 따른 색상
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600 dark:text-green-400';
      case 'down': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  // 트렌드 아이콘
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // 변화량 포맷팅
  const formatChange = (change) => {
    if (!change) return null;
    
    switch (changeType) {
      case 'percentage':
        return `${Math.abs(change)}%`;
      case 'currency':
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(Math.abs(change));
      case 'absolute':
      default:
        return Math.abs(change).toLocaleString('vi-VN');
    }
  };

  return (
    <Card
      variant={variant}
      size={size}
      hoverable
      className={`relative ${className}`}
      loading={loading}
      {...props}
    >
      <div className="flex items-start justify-between h-full">
        <div className="flex-1 min-w-0">
          {/* 제목 */}
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-600 dark:text-gray-400 text-sm">
              {title}
            </h3>
            {tooltip}
          </div>

          {/* 값 */}
          <div className="font-bold text-2xl text-gray-900 dark:text-white mt-1">
            {loading ? (
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-8 w-24"></div>
            ) : (
              value
            )}
          </div>

          {/* 변화량과 설명 */}
          <div className="flex items-center gap-1 mt-3 text-gray-600 dark:text-gray-400">
            {change !== null && change !== undefined && (
              <>
                {getTrendIcon()}
                <span className="font-semibold text-sm">
                  {formatChange(change)}
                </span>
              </>
            )}

            {description && (
              <span className="text-sm ml-1">
                {description}
              </span>
            )}
          </div>
        </div>

        {/* 아이콘 */}
        {icon && (
          <div className="w-10 h-10 text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

/**
 * 차트 카드 컴포넌트
 */
export const ChartCard = ({
  title,
  subtitle,
  chart,
  legend,
  actions,
  headerActions,
  loading = false,
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  return (
    <Card
      variant={variant}
      hoverable
      className={`${className}`}
      loading={loading}
      {...props}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        
        {headerActions && (
          <div className="flex items-center space-x-2 ml-4">
            {headerActions}
          </div>
        )}
      </div>

      {/* 차트 영역 */}
      <div className="mb-6">
        {loading ? (
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-64 w-full"></div>
        ) : chart ? (
          <div className="w-full h-64">
            {chart}
          </div>
        ) : (
          children
        )}
      </div>

      {/* 범례 */}
      {legend && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {legend}
        </div>
      )}

      {/* 액션 버튼들 */}
      {actions && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          {actions}
        </div>
      )}
    </Card>
  );
};

/**
 * 콘텐츠 카드 컴포넌트 (일반 내용)
 */
export const ContentCard = ({
  title,
  subtitle,
  content,
  actions,
  icon,
  badge,
  status,
  timestamp,
  author,
  loading = false,
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  // 상태별 색상
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <Card
      variant={variant}
      hoverable
      className={`${className}`}
      loading={loading}
      {...props}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          {icon && (
            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-400">
                {icon}
              </span>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {title}
              </h3>
              {badge && (
                <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 rounded-full">
                  {badge}
                </span>
              )}
              {status && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                  {status}
                </span>
              )}
            </div>
            
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {timestamp && (
          <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
            {timestamp}
          </span>
        )}
      </div>

      {/* 내용 */}
      <div className="mb-4">
        {content ? (
          <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {content}
          </div>
        ) : (
          children
        )}
      </div>

      {/* 작성자 정보 */}
      {author && (
        <div className="flex items-center space-x-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
          <span>작성자:</span>
          <span className="font-medium">{author}</span>
        </div>
      )}

      {/* 액션 버튼들 */}
      {actions && (
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          {actions}
        </div>
      )}
    </Card>
  );
};

/**
 * 액션 카드 컴포넌트 (버튼이 포함된 카드)
 */
export const ActionCard = ({
  title,
  description,
  primaryAction,
  secondaryAction,
  icon,
  variant = 'default',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) => {
  return (
    <Card
      variant={variant}
      hoverable={!disabled}
      className={`${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
      loading={loading}
      {...props}
    >
      <div className="text-center">
        {/* 아이콘 */}
        {icon && (
          <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-3xl text-primary-600 dark:text-primary-400">
              {icon}
            </span>
          </div>
        )}

        {/* 제목 */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>

        {/* 설명 */}
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {description}
          </p>
        )}

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-3">
          {primaryAction && (
            <button
              className="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled || loading}
              {...primaryAction}
            >
              {primaryAction.children}
            </button>
          )}
          
          {secondaryAction && (
            <button
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled || loading}
              {...secondaryAction}
            >
              {secondaryAction.children}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

/**
 * 메인 대시보드 카드 컴포넌트 (모든 서브 컴포넌트를 포함)
 */
const DashboardCard = (props) => {
  return <Card {...props} />;
};

// 서브 컴포넌트들을 메인 컴포넌트에 첨부
DashboardCard.Stat = StatCard;
DashboardCard.Chart = ChartCard;
DashboardCard.Content = ContentCard;
DashboardCard.Action = ActionCard;

export default DashboardCard;