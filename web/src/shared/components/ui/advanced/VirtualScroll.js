'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

/**
 * 가상 스크롤 컴포넌트 (WCAG 2.1 준수)
 * Local 테마 컬러와 다크모드 지원
 * 대용량 데이터 처리에 최적화
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Array} props.items - 렌더링할 아이템 배열
 * @param {Function} props.renderItem - 아이템 렌더링 함수
 * @param {number} props.itemHeight - 고정 아이템 높이 (픽셀)
 * @param {Function} props.getItemHeight - 동적 아이템 높이 함수
 * @param {number} props.containerHeight - 컨테이너 높이
 * @param {number} props.overscan - 버퍼 아이템 수
 * @param {Function} props.keyExtractor - 키 추출 함수
 * @param {Function} props.onScroll - 스크롤 이벤트 핸들러
 * @param {boolean} props.showScrollIndicator - 스크롤 표시기 표시 여부
 */
const VirtualScroll = ({
  items = [],
  renderItem,
  itemHeight = 50,
  getItemHeight,
  containerHeight = 400,
  overscan = 5,
  keyExtractor,
  onScroll,
  showScrollIndicator = true,
  className = '',
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const containerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const itemHeightCache = useRef(new Map());
  const measureElementRef = useRef(null);

  // 키 추출 함수
  const getKey = useCallback((item, index) => {
    if (keyExtractor) {
      return keyExtractor(item, index);
    }
    return item.id || item.key || index;
  }, [keyExtractor]);

  // 아이템 높이 계산
  const getItemHeightValue = useCallback((index) => {
    if (getItemHeight) {
      const cached = itemHeightCache.current.get(index);
      if (cached !== undefined) return cached;
      
      const height = getItemHeight(items[index], index);
      itemHeightCache.current.set(index, height);
      return height;
    }
    return itemHeight;
  }, [getItemHeight, items, itemHeight]);

  // 전체 높이 계산
  const totalHeight = useMemo(() => {
    if (getItemHeight) {
      let height = 0;
      for (let i = 0; i < items.length; i++) {
        height += getItemHeightValue(i);
      }
      return height;
    }
    return items.length * itemHeight;
  }, [items.length, itemHeight, getItemHeight, getItemHeightValue]);

  // 시작 인덱스 계산
  const startIndex = useMemo(() => {
    if (getItemHeight) {
      let height = 0;
      let index = 0;
      while (index < items.length && height < scrollTop) {
        height += getItemHeightValue(index);
        index++;
      }
      return Math.max(0, index - 1);
    }
    return Math.floor(scrollTop / itemHeight);
  }, [scrollTop, itemHeight, getItemHeight, items.length, getItemHeightValue]);

  // 종료 인덱스 계산
  const endIndex = useMemo(() => {
    if (getItemHeight) {
      let height = 0;
      let index = startIndex;
      while (index < items.length && height < containerHeight) {
        height += getItemHeightValue(index);
        index++;
      }
      return Math.min(items.length - 1, index + overscan);
    }
    const visibleItems = Math.ceil(containerHeight / itemHeight);
    return Math.min(items.length - 1, startIndex + visibleItems + overscan);
  }, [startIndex, containerHeight, itemHeight, getItemHeight, items.length, overscan, getItemHeightValue]);

  // 오프셋 계산
  const offsetY = useMemo(() => {
    if (getItemHeight) {
      let offset = 0;
      for (let i = 0; i < startIndex; i++) {
        offset += getItemHeightValue(i);
      }
      return offset;
    }
    return startIndex * itemHeight;
  }, [startIndex, itemHeight, getItemHeight, getItemHeightValue]);

  // 보이는 아이템들
  const visibleItems = useMemo(() => {
    const visible = [];
    for (let i = Math.max(0, startIndex - overscan); i <= Math.min(items.length - 1, endIndex + overscan); i++) {
      visible.push({
        index: i,
        item: items[i],
        key: getKey(items[i], i),
        height: getItemHeightValue(i)
      });
    }
    return visible;
  }, [startIndex, endIndex, overscan, items, getKey, getItemHeightValue]);

  // 스크롤 핸들러
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    if (onScroll) {
      onScroll(e);
    }

    // 스크롤 종료 감지
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [onScroll]);

  // 키보드 네비게이션
  const handleKeyDown = useCallback((e) => {
    const { key, ctrlKey } = e;
    let newFocusedIndex = focusedIndex;

    switch (key) {
      case 'ArrowDown':
        e.preventDefault();
        newFocusedIndex = Math.min(items.length - 1, focusedIndex + 1);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        newFocusedIndex = Math.max(0, focusedIndex - 1);
        break;
        
      case 'PageDown':
        e.preventDefault();
        const pageSize = Math.floor(containerHeight / itemHeight);
        newFocusedIndex = Math.min(items.length - 1, focusedIndex + pageSize);
        break;
        
      case 'PageUp':
        e.preventDefault();
        const pageSizeUp = Math.floor(containerHeight / itemHeight);
        newFocusedIndex = Math.max(0, focusedIndex - pageSizeUp);
        break;
        
      case 'Home':
        e.preventDefault();
        newFocusedIndex = 0;
        break;
        
      case 'End':
        e.preventDefault();
        newFocusedIndex = items.length - 1;
        break;
        
      default:
        return;
    }

    setFocusedIndex(newFocusedIndex);
    scrollToIndex(newFocusedIndex);
  }, [focusedIndex, items.length, containerHeight, itemHeight]);

  // 인덱스로 스크롤
  const scrollToIndex = useCallback((index) => {
    if (!containerRef.current) return;
    
    let targetScrollTop = 0;
    if (getItemHeight) {
      for (let i = 0; i < index; i++) {
        targetScrollTop += getItemHeightValue(i);
      }
    } else {
      targetScrollTop = index * itemHeight;
    }

    containerRef.current.scrollTop = targetScrollTop;
  }, [getItemHeight, getItemHeightValue, itemHeight]);

  // 부드러운 스크롤
  const scrollToIndexSmooth = useCallback((index) => {
    if (!containerRef.current) return;
    
    let targetScrollTop = 0;
    if (getItemHeight) {
      for (let i = 0; i < index; i++) {
        targetScrollTop += getItemHeightValue(i);
      }
    } else {
      targetScrollTop = index * itemHeight;
    }

    containerRef.current.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
  }, [getItemHeight, getItemHeightValue, itemHeight]);

  // 스크롤 위치 계산
  const scrollPercentage = useMemo(() => {
    if (totalHeight <= containerHeight) return 0;
    return (scrollTop / (totalHeight - containerHeight)) * 100;
  }, [scrollTop, totalHeight, containerHeight]);

  // 캐시 정리
  useEffect(() => {
    itemHeightCache.current.clear();
  }, [items.length]);

  return (
    <div 
      className={`virtual-scroll-container relative ${className}`}
      style={{ height: containerHeight }}
      {...props}
    >
      {/* 스크롤 가능한 영역 */}
      <div
        ref={containerRef}
        className="virtual-scroll-viewport h-full overflow-auto focus:outline-none focus:ring-2 focus:ring-mint-500/50"
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="listbox"
        aria-label={`가상 스크롤 리스트, 총 ${items.length}개 항목`}
        aria-activedescendant={focusedIndex >= 0 ? `virtual-item-${focusedIndex}` : undefined}
      >
        {/* 전체 높이를 만들기 위한 스페이서 */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* 렌더링되는 아이템들 */}
          <div
            className="virtual-items"
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            {visibleItems.map(({ item, index, key, height }) => (
              <div
                key={key}
                id={`virtual-item-${index}`}
                className={`virtual-item ${focusedIndex === index ? 'focused' : ''}`}
                style={{ height: getItemHeight ? height : itemHeight }}
                role="option"
                aria-selected={focusedIndex === index}
                aria-posinset={index + 1}
                aria-setsize={items.length}
              >
                {renderItem ? renderItem(item, index) : (
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    {typeof item === 'string' ? item : JSON.stringify(item)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 스크롤 표시기 */}
      {showScrollIndicator && items.length > 0 && (
        <div className="absolute right-1 top-1 bottom-1 w-2 bg-gray-200 dark:bg-gray-700 rounded-full">
          <div
            className="bg-mint-500 rounded-full transition-all duration-150"
            style={{
              height: `${Math.max(20, (containerHeight / totalHeight) * 100)}%`,
              transform: `translateY(${scrollPercentage}%)`
            }}
          />
        </div>
      )}

      {/* 스크롤 컨트롤 버튼 */}
      <div className="absolute right-3 top-2 flex flex-col gap-1 opacity-75 hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => scrollToIndexSmooth(0)}
          className="p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-mint-500/50"
          aria-label="맨 위로 스크롤"
        >
          <ChevronUpIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          type="button"
          onClick={() => scrollToIndexSmooth(items.length - 1)}
          className="p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-mint-500/50"
          aria-label="맨 아래로 스크롤"
        >
          <ChevronDownIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* 로딩 오버레이 */}
      {isScrolling && (
        <div className="absolute inset-0 bg-gray-900/10 dark:bg-gray-100/10 pointer-events-none">
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/75 text-white text-xs rounded">
            스크롤 중...
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-2xl mb-2">📋</div>
            <div className="text-sm">표시할 항목이 없습니다</div>
          </div>
        </div>
      )}

      {/* 접근성 안내 */}
      <div className="sr-only" aria-live="polite">
        화살표 키로 항목 탐색, Page Up/Down으로 페이지 단위 이동, Home/End로 처음/마지막으로 이동
      </div>
    </div>
  );
};

/**
 * 가상 스크롤 훅
 */
export const useVirtualScroll = (items, options = {}) => {
  const {
    containerHeight = 400,
    itemHeight = 50,
    overscan = 5
  } = options;

  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(items.length - 1, startIndex + visibleItems + overscan);

  const visibleData = items.slice(
    Math.max(0, startIndex - overscan),
    endIndex + 1
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleData,
    totalHeight,
    offsetY,
    scrollTop,
    setScrollTop,
    startIndex,
    endIndex
  };
};

export default VirtualScroll;