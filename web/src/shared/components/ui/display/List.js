'use client';

import React from 'react';

/**
 * List 컴포넌트 - 다양한 레이아웃의 리스트
 * 
 * @component
 * @param {Object} props - 컴포넌트 속성
 * @param {Array} props.items - 리스트 아이템 배열
 * @param {string} [props.variant='default'] - 스타일 변형 (default, card, compact, divided)
 * @param {string} [props.layout='vertical'] - 레이아웃 (vertical, horizontal, grid)
 * @param {string} [props.size='md'] - 크기 (sm, md, lg)
 * @param {boolean} [props.hoverable=false] - 호버 효과
 * @param {boolean} [props.selectable=false] - 선택 가능 여부
 * @param {Array} [props.selectedItems=[]] - 선택된 아이템들
 * @param {Function} [props.onItemClick] - 아이템 클릭 핸들러
 * @param {Function} [props.onItemSelect] - 아이템 선택 핸들러
 * @param {Function} [props.renderItem] - 커스텀 아이템 렌더러
 * @param {React.ReactNode} [props.emptyMessage] - 빈 상태 메시지
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {boolean} [props.loading=false] - 로딩 상태
 * @param {number} [props.loadingItems=3] - 로딩 스켈레톤 개수
 * 
 * @example
 * ```jsx
 * const items = [
 *   {
 *     id: 1,
 *     title: '주문 #001',
 *     subtitle: '2024.01.20 10:30',
 *     description: '피자 1개, 콜라 2개',
 *     badge: { text: '배달중', color: 'green' },
 *     icon: '🛵',
 *     action: { label: '상세보기', onClick: () => {} }
 *   }
 * ];
 * 
 * <List 
 *   items={items} 
 *   variant="card"
 *   hoverable
 *   onItemClick={(item) => console.log(item)}
 * />
 * ```
 */
const List = ({
  items = [],
  variant = 'default',
  layout = 'vertical',
  size = 'md',
  hoverable = false,
  selectable = false,
  selectedItems = [],
  onItemClick,
  onItemSelect,
  renderItem,
  emptyMessage = '데이터가 없습니다',
  className = '',
  loading = false,
  loadingItems = 3
}) => {
  const sizeStyles = {
    sm: {
      padding: 'p-2',
      gap: 'gap-2',
      text: 'text-sm',
      title: 'text-sm',
      subtitle: 'text-xs'
    },
    md: {
      padding: 'p-4',
      gap: 'gap-3',
      text: 'text-base',
      title: 'text-base',
      subtitle: 'text-sm'
    },
    lg: {
      padding: 'p-5',
      gap: 'gap-4',
      text: 'text-lg',
      title: 'text-lg',
      subtitle: 'text-base'
    }
  };

  const variantStyles = {
    default: {
      container: 'bg-white dark:bg-gray-800',
      item: 'border-b border-gray-200 dark:border-gray-700 last:border-0',
      hover: 'hover:bg-gray-50 dark:hover:bg-gray-750'
    },
    card: {
      container: 'space-y-3',
      item: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
      hover: 'hover:shadow-md hover:border-[#2AC1BC] dark:hover:border-[#2AC1BC]'
    },
    compact: {
      container: 'bg-white dark:bg-gray-800',
      item: 'border-b border-gray-100 dark:border-gray-700 last:border-0',
      hover: 'hover:bg-gray-50 dark:hover:bg-gray-750'
    },
    divided: {
      container: 'divide-y divide-gray-200 dark:divide-gray-700',
      item: 'bg-white dark:bg-gray-800',
      hover: 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-white dark:hover:from-gray-750 dark:hover:to-gray-800'
    }
  };

  const layoutStyles = {
    vertical: 'flex flex-col',
    horizontal: 'flex flex-row overflow-x-auto gap-4',
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
  };

  const isItemSelected = (item) => {
    return selectedItems.some(selected => selected.id === item.id);
  };

  const handleItemClick = (item, event) => {
    if (selectable && event) {
      event.preventDefault();
      handleItemSelect(item);
    } else if (onItemClick) {
      onItemClick(item);
    }
  };

  const handleItemSelect = (item) => {
    if (!onItemSelect) return;
    
    const isSelected = isItemSelected(item);
    if (isSelected) {
      onItemSelect(selectedItems.filter(i => i.id !== item.id));
    } else {
      onItemSelect([...selectedItems, item]);
    }
  };

  const renderLoadingSkeleton = () => {
    return Array(loadingItems).fill(0).map((_, index) => (
      <div key={index} className={`${variantStyles[variant].item} ${sizeStyles[size].padding} animate-pulse`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          </div>
        </div>
      </div>
    ));
  };

  const renderDefaultItem = (item, index) => {
    const itemClasses = `
      ${variantStyles[variant].item}
      ${sizeStyles[size].padding}
      ${hoverable ? variantStyles[variant].hover : ''}
      ${onItemClick || selectable ? 'cursor-pointer' : ''}
      ${isItemSelected(item) ? 'bg-[#2AC1BC]/10 dark:bg-[#2AC1BC]/20 border-[#2AC1BC]' : ''}
      transition-all duration-200
    `;

    return (
      <div
        key={item.id || index}
        className={itemClasses}
        onClick={(e) => handleItemClick(item, e)}
        role={onItemClick || selectable ? 'button' : undefined}
        tabIndex={onItemClick || selectable ? 0 : undefined}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && (onItemClick || selectable)) {
            e.preventDefault();
            handleItemClick(item, e);
          }
        }}
      >
        <div className={`flex items-start ${sizeStyles[size].gap}`}>
          {/* Checkbox for selectable */}
          {selectable && (
            <input
              type="checkbox"
              checked={isItemSelected(item)}
              onChange={() => handleItemSelect(item)}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 w-4 h-4 text-[#2AC1BC] rounded focus:ring-[#2AC1BC] dark:bg-gray-700 dark:border-gray-600"
            />
          )}

          {/* Icon/Avatar */}
          {item.icon && (
            <div className="flex-shrink-0">
              {typeof item.icon === 'string' ? (
                <div className="w-10 h-10 bg-gradient-to-br from-[#2AC1BC]/20 to-[#00B14F]/20 dark:from-[#2AC1BC]/30 dark:to-[#00B14F]/30 rounded-full flex items-center justify-center">
                  <span className="text-lg">{item.icon}</span>
                </div>
              ) : (
                item.icon
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {item.title && (
                  <h4 className={`font-semibold ${sizeStyles[size].title} text-gray-900 dark:text-gray-100`}>
                    {item.title}
                  </h4>
                )}
                {item.subtitle && (
                  <p className={`${sizeStyles[size].subtitle} text-gray-500 dark:text-gray-400 mt-0.5`}>
                    {item.subtitle}
                  </p>
                )}
                {item.description && (
                  <p className={`${sizeStyles[size].text} text-gray-600 dark:text-gray-300 mt-2`}>
                    {item.description}
                  </p>
                )}

                {/* Tags */}
                {item.tags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map((tag, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action */}
                {item.action && (
                  <button
                    className="mt-2 text-sm text-[#2AC1BC] hover:text-[#1FA09B] dark:text-[#2AC1BC] dark:hover:text-[#5ED4D0] font-medium transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      item.action.onClick();
                    }}
                  >
                    {item.action.label} →
                  </button>
                )}
              </div>

              {/* Badge */}
              {item.badge && (
                <div className="flex-shrink-0 ml-3">
                  <span 
                    className={`
                      inline-flex px-2 py-1 text-xs font-semibold rounded-full
                      ${item.badge.color === 'green' ? 'bg-[#00B14F]/10 text-[#00B14F] dark:bg-[#00B14F]/20' : ''}
                      ${item.badge.color === 'mint' ? 'bg-[#2AC1BC]/10 text-[#2AC1BC] dark:bg-[#2AC1BC]/20' : ''}
                      ${item.badge.color === 'red' ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' : ''}
                      ${item.badge.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' : ''}
                      ${!item.badge.color ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' : ''}
                    `}
                  >
                    {item.badge.text}
                  </span>
                </div>
              )}

              {/* Right Content */}
              {item.rightContent && (
                <div className="flex-shrink-0 ml-3">
                  {item.rightContent}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`${layoutStyles[layout]} ${variantStyles[variant].container} ${className}`}>
        {renderLoadingSkeleton()}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`${layoutStyles[layout]} ${variantStyles[variant].container} ${className}`}>
      {items.map((item, index) => 
        renderItem ? renderItem(item, index) : renderDefaultItem(item, index)
      )}
    </div>
  );
};

export default List;