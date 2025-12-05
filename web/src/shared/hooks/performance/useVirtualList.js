/**
 * @fileoverview 가상 리스트 훅 - 대용량 데이터 리스트 성능 최적화
 * @description 뷰포트에 보이는 항목만 렌더링하여 메모리 사용량과 렌더링 성능을 개선
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * 가상 리스트를 위한 커스텀 훅
 * 
 * @param {Object} options - 가상 리스트 옵션
 * @param {Array} options.items - 전체 아이템 배열
 * @param {number} [options.itemHeight=50] - 각 아이템의 높이
 * @param {number} [options.containerHeight=400] - 컨테이너 높이
 * @param {number} [options.overscan=5] - 여분으로 렌더링할 아이템 수
 * @param {Function} [options.getItemHeight] - 동적 아이템 높이 계산 함수
 * @returns {Object} 가상 리스트 상태와 메서드
 */
export const useVirtualList = (options = {}) => {
  const {
    items = [],
    itemHeight = 50,
    containerHeight = 400,
    overscan = 5,
    getItemHeight
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const itemHeights = useRef(new Map());

  // 동적 높이 계산
  const getHeight = useCallback((index) => {
    if (getItemHeight) {
      const cachedHeight = itemHeights.current.get(index);
      if (cachedHeight !== undefined) {
        return cachedHeight;
      }
      const height = getItemHeight(items[index], index);
      itemHeights.current.set(index, height);
      return height;
    }
    return itemHeight;
  }, [getItemHeight, items, itemHeight]);

  // 전체 높이 계산
  const totalHeight = useMemo(() => {
    if (getItemHeight) {
      let total = 0;
      for (let i = 0; i < items.length; i++) {
        total += getHeight(i);
      }
      return total;
    }
    return items.length * itemHeight;
  }, [items.length, itemHeight, getItemHeight, getHeight]);

  // 시작 인덱스 계산
  const startIndex = useMemo(() => {
    if (getItemHeight) {
      let offset = 0;
      let index = 0;
      
      while (offset < scrollTop && index < items.length) {
        offset += getHeight(index);
        index++;
      }
      
      return Math.max(0, index - 1 - overscan);
    }
    
    return Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  }, [scrollTop, itemHeight, overscan, getItemHeight, getHeight, items.length]);

  // 끝 인덱스 계산
  const endIndex = useMemo(() => {
    if (getItemHeight) {
      let offset = 0;
      let index = startIndex;
      
      for (let i = 0; i < startIndex; i++) {
        offset += getHeight(i);
      }
      
      while (offset < scrollTop + containerHeight && index < items.length) {
        offset += getHeight(index);
        index++;
      }
      
      return Math.min(items.length - 1, index + overscan);
    }
    
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    return Math.min(items.length - 1, startIndex + visibleCount + overscan);
  }, [startIndex, containerHeight, itemHeight, overscan, items.length, getItemHeight, getHeight, scrollTop]);

  // 가시 아이템들 계산
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i]) {
        result.push({
          index: i,
          item: items[i],
          style: getItemHeight ? null : {
            position: 'absolute',
            top: i * itemHeight,
            height: itemHeight,
            width: '100%'
          }
        });
      }
    }
    return result;
  }, [startIndex, endIndex, items, itemHeight, getItemHeight]);

  // 동적 높이용 스타일 계산
  const getDynamicItemStyle = useCallback((index) => {
    if (!getItemHeight) return null;
    
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getHeight(i);
    }
    
    return {
      position: 'absolute',
      top: offset,
      height: getHeight(index),
      width: '100%'
    };
  }, [getItemHeight, getHeight]);

  // 스크롤 핸들러
  const handleScroll = useCallback((event) => {
    setScrollTop(event.target.scrollTop);
  }, []);

  // 특정 인덱스로 스크롤
  const scrollToIndex = useCallback((index) => {
    if (!containerRef.current) return;
    
    let offset = 0;
    if (getItemHeight) {
      for (let i = 0; i < index; i++) {
        offset += getHeight(i);
      }
    } else {
      offset = index * itemHeight;
    }
    
    containerRef.current.scrollTop = offset;
  }, [itemHeight, getItemHeight, getHeight]);

  // 리스트 리셋
  const resetList = useCallback(() => {
    setScrollTop(0);
    itemHeights.current.clear();
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  // 성능 메트릭
  const metrics = useMemo(() => ({
    totalItems: items.length,
    visibleItems: visibleItems.length,
    renderRatio: items.length > 0 ? (visibleItems.length / items.length) * 100 : 0,
    memoryOptimization: items.length > 0 ? 100 - ((visibleItems.length / items.length) * 100) : 0
  }), [items.length, visibleItems.length]);

  return {
    containerRef,
    visibleItems,
    totalHeight,
    handleScroll,
    scrollToIndex,
    resetList,
    getDynamicItemStyle,
    metrics,
    startIndex,
    endIndex
  };
};

/**
 * 가상 테이블을 위한 커스텀 훅
 * 
 * @param {Object} options - 가상 테이블 옵션
 * @returns {Object} 가상 테이블 상태와 메서드
 */
export const useVirtualTable = (options = {}) => {
  const {
    rows = [],
    rowHeight = 50,
    headerHeight = 40,
    ...virtualOptions
  } = options;

  const virtualList = useVirtualList({
    ...virtualOptions,
    items: rows,
    itemHeight: rowHeight
  });

  const containerStyle = useMemo(() => ({
    height: (virtualOptions.containerHeight || 400) + headerHeight,
    overflow: 'auto'
  }), [virtualOptions.containerHeight, headerHeight]);

  const contentStyle = useMemo(() => ({
    height: virtualList.totalHeight + headerHeight,
    position: 'relative'
  }), [virtualList.totalHeight, headerHeight]);

  return {
    ...virtualList,
    containerStyle,
    contentStyle,
    headerHeight
  };
};

export default useVirtualList;