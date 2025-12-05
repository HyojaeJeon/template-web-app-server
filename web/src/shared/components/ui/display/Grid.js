'use client';

import React from 'react';

/**
 * Grid 컴포넌트 - 반응형 그리드 레이아웃
 * 
 * @component
 * @param {Object} props - 컴포넌트 속성
 * @param {React.ReactNode} props.children - 그리드 아이템들
 * @param {number|Object} [props.cols=1] - 열 개수 (number 또는 breakpoint 객체)
 * @param {string} [props.gap='md'] - 간격 크기 (xs, sm, md, lg, xl, 2xl)
 * @param {string} [props.rowGap] - 행 간격 (gap과 별도 설정 시)
 * @param {string} [props.colGap] - 열 간격 (gap과 별도 설정 시)
 * @param {string} [props.align='stretch'] - 아이템 정렬 (start, center, end, stretch)
 * @param {string} [props.justify='stretch'] - 아이템 정렬 (start, center, end, stretch, between, around)
 * @param {boolean} [props.autoFit=false] - auto-fit 사용 여부
 * @param {boolean} [props.autoFill=false] - auto-fill 사용 여부
 * @param {string} [props.minChildWidth] - 최소 아이템 너비 (autoFit/autoFill과 함께 사용)
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {boolean} [props.dense=false] - 빈 공간 채우기
 * 
 * @example
 * ```jsx
 * // 기본 그리드
 * <Grid cols={3} gap="lg">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </Grid>
 * 
 * // 반응형 그리드
 * <Grid 
 *   cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
 *   gap="md"
 * >
 *   {items.map(item => <Card key={item.id}>{item.name}</Card>)}
 * </Grid>
 * 
 * // Auto-fit 그리드
 * <Grid autoFit minChildWidth="250px" gap="lg">
 *   {items.map(item => <Card key={item.id}>{item.name}</Card>)}
 * </Grid>
 * ```
 */
const Grid = ({
  children,
  cols = 1,
  gap = 'md',
  rowGap,
  colGap,
  align = 'stretch',
  justify = 'stretch',
  autoFit = false,
  autoFill = false,
  minChildWidth = '200px',
  className = '',
  dense = false
}) => {
  const gapSizes = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
    '2xl': 'gap-10'
  };

  const rowGapSizes = {
    xs: 'gap-y-1',
    sm: 'gap-y-2',
    md: 'gap-y-4',
    lg: 'gap-y-6',
    xl: 'gap-y-8',
    '2xl': 'gap-y-10'
  };

  const colGapSizes = {
    xs: 'gap-x-1',
    sm: 'gap-x-2',
    md: 'gap-x-4',
    lg: 'gap-x-6',
    xl: 'gap-x-8',
    '2xl': 'gap-x-10'
  };

  const alignItems = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifyContent = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    stretch: 'justify-stretch',
    between: 'justify-between',
    around: 'justify-around'
  };

  // 반응형 컬럼 클래스 생성
  const getColClasses = () => {
    if (autoFit || autoFill) {
      return '';
    }

    if (typeof cols === 'number') {
      return `grid-cols-${cols}`;
    }

    if (typeof cols === 'object') {
      const classes = [];
      if (cols.base) classes.push(`grid-cols-${cols.base}`);
      if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
      if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
      if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
      if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
      if (cols['2xl']) classes.push(`2xl:grid-cols-${cols['2xl']}`);
      return classes.join(' ');
    }

    return 'grid-cols-1';
  };

  // Gap 클래스 생성
  const getGapClasses = () => {
    if (rowGap && colGap) {
      return `${rowGapSizes[rowGap]} ${colGapSizes[colGap]}`;
    }
    if (rowGap) {
      return `${rowGapSizes[rowGap]} gap-x-0`;
    }
    if (colGap) {
      return `${colGapSizes[colGap]} gap-y-0`;
    }
    return gapSizes[gap];
  };

  // Auto-fit/Auto-fill 스타일
  const getAutoStyle = () => {
    if (autoFit) {
      return {
        gridTemplateColumns: `repeat(auto-fit, minmax(${minChildWidth}, 1fr))`
      };
    }
    if (autoFill) {
      return {
        gridTemplateColumns: `repeat(auto-fill, minmax(${minChildWidth}, 1fr))`
      };
    }
    return {};
  };

  const gridClasses = `
    grid
    ${getColClasses()}
    ${getGapClasses()}
    ${alignItems[align]}
    ${justifyContent[justify]}
    ${dense ? 'grid-flow-dense' : ''}
    ${className}
  `.trim();

  return (
    <div 
      className={gridClasses}
      style={getAutoStyle()}
    >
      {children}
    </div>
  );
};

/**
 * GridItem 컴포넌트 - 그리드 아이템 with span 설정
 */
export const GridItem = ({
  children,
  colSpan = 1,
  rowSpan = 1,
  colStart,
  colEnd,
  rowStart,
  rowEnd,
  className = ''
}) => {
  const getSpanClasses = () => {
    const classes = [];
    
    if (colSpan) classes.push(`col-span-${colSpan}`);
    if (rowSpan) classes.push(`row-span-${rowSpan}`);
    if (colStart) classes.push(`col-start-${colStart}`);
    if (colEnd) classes.push(`col-end-${colEnd}`);
    if (rowStart) classes.push(`row-start-${rowStart}`);
    if (rowEnd) classes.push(`row-end-${rowEnd}`);
    
    return classes.join(' ');
  };

  return (
    <div className={`${getSpanClasses()} ${className}`}>
      {children}
    </div>
  );
};

/**
 * ResponsiveGrid 컴포넌트 - 미리 정의된 반응형 그리드 패턴
 */
export const ResponsiveGrid = ({
  children,
  pattern = 'default',
  gap = 'md',
  className = ''
}) => {
  const patterns = {
    default: { base: 1, sm: 2, md: 3, lg: 4 },
    cards: { base: 1, sm: 2, md: 3, lg: 3 },
    products: { base: 2, sm: 3, md: 4, lg: 5 },
    gallery: { base: 2, sm: 3, md: 4, lg: 6 },
    sidebar: { base: 1, md: 2 }, // 1열 모바일, 2열(사이드바+메인) 데스크톱
    asymmetric: { base: 1, md: 3 } // 비대칭 레이아웃
  };

  return (
    <Grid 
      cols={patterns[pattern]}
      gap={gap}
      className={className}
    >
      {children}
    </Grid>
  );
};

/**
 * MasonryGrid 컴포넌트 - 간단한 메이슨리 레이아웃 (CSS Grid 기반)
 */
export const MasonryGrid = ({
  children,
  cols = 3,
  gap = 'md',
  className = ''
}) => {
  // 각 컬럼에 아이템 분배
  const columns = Array.from({ length: cols }, () => []);
  React.Children.forEach(children, (child, index) => {
    columns[index % cols].push(child);
  });

  const gapSizes = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
    '2xl': 'gap-10'
  };

  return (
    <div className={`grid grid-cols-${cols} ${gapSizes[gap]} ${className}`}>
      {columns.map((column, colIndex) => (
        <div key={colIndex} className={`flex flex-col ${gapSizes[gap]}`}>
          {column.map((item, itemIndex) => (
            <div key={`${colIndex}-${itemIndex}`}>{item}</div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Grid;