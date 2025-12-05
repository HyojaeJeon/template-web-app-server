'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function Masonry({
  items = [], // 렌더링할 아이템 배열
  columnWidth = 300, // 기본 컬럼 너비
  gap = 16, // 아이템 간 간격
  minColumns = 1, // 최소 컬럼 수
  maxColumns = 5, // 최대 컬럼 수
  breakpoints = { // 반응형 브레이크포인트
    1536: 5,
    1280: 4,
    1024: 3,
    768: 2,
    640: 1
  },
  renderItem, // 아이템 렌더링 함수
  onItemClick,
  className = '',
  animated = true, // 애니메이션 활성화
  loadMore, // 무한 스크롤용 함수
  hasMore = false, // 더 로드할 아이템이 있는지
  loader, // 로딩 컴포넌트
  endMessage // 모든 아이템 로드 완료 메시지
}) {
  const [columns, setColumns] = useState(1);
  const [columnHeights, setColumnHeights] = useState([]);
  const containerRef = useRef(null);
  const itemRefs = useRef({});
  const [isLoading, setIsLoading] = useState(false);
  const [displayItems, setDisplayItems] = useState([]);

  // 컬럼 수 계산
  const calculateColumns = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const windowWidth = window.innerWidth;

    // 브레이크포인트 기반 컬럼 수 결정
    let cols = 1;
    const sortedBreakpoints = Object.entries(breakpoints).sort((a, b) => b[0] - a[0]);
    
    for (const [breakpoint, columnCount] of sortedBreakpoints) {
      if (windowWidth >= Number(breakpoint)) {
        cols = columnCount;
        break;
      }
    }

    // 컨테이너 너비 기반 조정
    const possibleCols = Math.floor((containerWidth + gap) / (columnWidth + gap));
    cols = Math.min(Math.max(possibleCols, minColumns), Math.min(cols, maxColumns));

    setColumns(cols);
    setColumnHeights(new Array(cols).fill(0));
  }, [columnWidth, gap, minColumns, maxColumns, breakpoints]);

  // 아이템 위치 계산
  const calculateItemPositions = useCallback(() => {
    if (!containerRef.current || columns === 0) return;

    const heights = new Array(columns).fill(0);
    const positions = [];

    items.forEach((item, index) => {
      // 가장 낮은 컬럼 찾기
      const shortestColumn = heights.indexOf(Math.min(...heights));
      const itemElement = itemRefs.current[index];

      if (itemElement) {
        const x = shortestColumn * (columnWidth + gap);
        const y = heights[shortestColumn];

        positions.push({ x, y, column: shortestColumn });

        // 아이템 스타일 적용
        itemElement.style.transform = `translate(${x}px, ${y}px)`;
        itemElement.style.width = `${columnWidth}px`;
        
        if (animated) {
          itemElement.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out';
          itemElement.style.opacity = '1';
        }

        // 컬럼 높이 업데이트
        heights[shortestColumn] += itemElement.offsetHeight + gap;
      }
    });

    setColumnHeights(heights);

    // 컨테이너 높이 설정
    const maxHeight = Math.max(...heights);
    containerRef.current.style.height = `${maxHeight}px`;
  }, [items, columns, columnWidth, gap, animated]);

  // 리사이즈 핸들러
  useEffect(() => {
    calculateColumns();

    const handleResize = debounce(() => {
      calculateColumns();
    }, 300);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateColumns]);

  // 아이템 위치 업데이트
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateItemPositions();
    }, 100);

    return () => clearTimeout(timer);
  }, [items, columns, calculateItemPositions]);

  // 이미지 로드 완료 시 재계산
  const handleImageLoad = useCallback(() => {
    calculateItemPositions();
  }, [calculateItemPositions]);

  // 무한 스크롤
  useEffect(() => {
    if (!loadMore || !hasMore) return;

    const handleScroll = debounce(() => {
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= documentHeight - 200 && !isLoading && hasMore) {
        setIsLoading(true);
        loadMore().finally(() => setIsLoading(false));
      }
    }, 200);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, hasMore, isLoading]);

  // 아이템 렌더링
  const renderMasonryItem = (item, index) => {
    const content = renderItem ? renderItem(item, index) : (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        {item.content || `Item ${index + 1}`}
      </div>
    );

    return (
      <div
        key={item.id || index}
        ref={(el) => {
          itemRefs.current[index] = el;
        }}
        className={`absolute top-0 left-0 ${animated ? 'opacity-0' : ''}`}
        style={{ position: 'absolute' }}
        onClick={() => onItemClick && onItemClick(item, index)}
        onLoad={handleImageLoad} // 이미지 로드 시 재계산
        role="listitem"
        tabIndex={onItemClick ? 0 : -1}
        onKeyDown={(e) => {
          if (onItemClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onItemClick(item, index);
          }
        }}
      >
        {content}
      </div>
    );
  };

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ position: 'relative', minHeight: '100px' }}
        role="list"
        aria-label="메이슨리 레이아웃"
      >
        {items.map(renderMasonryItem)}
      </div>

      {/* 로더 */}
      {isLoading && loader && (
        <div className="flex justify-center py-8">
          {loader}
        </div>
      )}

      {/* 완료 메시지 */}
      {!hasMore && endMessage && items.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {endMessage}
        </div>
      )}
    </div>
  );
}

// 디바운스 유틸리티
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 프리셋 메이슨리 아이템 컴포넌트
export function MasonryCard({ title, image, description, tags, onClick }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300"
      onClick={onClick}
    >
      {image && (
        <div className="relative">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          )}
          <img
            src={image}
            alt={title}
            className={`w-full h-auto ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      )}
      
      <div className="p-4">
        {title && (
          <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        )}
        
        {description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">
            {description}
          </p>
        )}
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 이미지 갤러리용 메이슨리 아이템
export function MasonryImage({ src, alt, caption, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1);

  return (
    <div
      className="relative group cursor-pointer overflow-hidden rounded-lg"
      onClick={onClick}
      style={{ paddingBottom: `${100 / aspectRatio}%` }}
    >
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover ${
          loaded ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-300 group-hover:scale-105 transition-transform duration-300`}
        onLoad={(e) => {
          setLoaded(true);
          setAspectRatio(e.target.naturalWidth / e.target.naturalHeight);
        }}
      />
      
      {caption && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-sm">{caption}</p>
        </div>
      )}
    </div>
  );
}