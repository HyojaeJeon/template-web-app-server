'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Carousel 컴포넌트 - 이미지 및 콘텐츠 슬라이더
 * 
 * @component
 * @param {Object} props - 컴포넌트 속성
 * @param {Array} props.items - 캐러셀 아이템 배열
 * @param {boolean} [props.autoPlay=false] - 자동 재생 여부
 * @param {number} [props.autoPlayInterval=3000] - 자동 재생 간격 (ms)
 * @param {boolean} [props.showIndicators=true] - 인디케이터 표시 여부
 * @param {boolean} [props.showArrows=true] - 화살표 표시 여부
 * @param {boolean} [props.loop=true] - 무한 루프 여부
 * @param {string} [props.variant='default'] - 캐러셀 변형 (default, cards, fullwidth)
 * @param {number} [props.slidesToShow=1] - 한 번에 보여줄 슬라이드 수
 * @param {number} [props.slidesToScroll=1] - 한 번에 스크롤할 슬라이드 수
 * @param {string} [props.gap='md'] - 슬라이드 간 간격
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {Function} [props.onChange] - 슬라이드 변경 콜백
 * @param {Function} [props.renderItem] - 커스텀 아이템 렌더러
 * 
 * @example
 * ```jsx
 * // 기본 이미지 캐러셀
 * <Carousel
 *   items={[
 *     { id: 1, image: '/image1.jpg', title: 'Slide 1' },
 *     { id: 2, image: '/image2.jpg', title: 'Slide 2' }
 *   ]}
 *   autoPlay
 *   showIndicators
 * />
 * 
 * // 카드 캐러셀
 * <Carousel
 *   variant="cards"
 *   slidesToShow={3}
 *   slidesToScroll={1}
 *   gap="lg"
 *   items={products}
 *   renderItem={(item) => <ProductCard {...item} />}
 * />
 * ```
 */
const Carousel = ({
  items = [],
  autoPlay = false,
  autoPlayInterval = 3000,
  showIndicators = true,
  showArrows = true,
  loop = true,
  variant = 'default',
  slidesToShow = 1,
  slidesToScroll = 1,
  gap = 'md',
  className = '',
  onChange,
  renderItem
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);

  const gapSizes = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const variantStyles = {
    default: 'rounded-lg overflow-hidden',
    cards: 'py-4',
    fullwidth: 'w-full'
  };

  const totalSlides = items.length;
  const maxIndex = Math.max(0, totalSlides - slidesToShow);

  // 자동 재생
  useEffect(() => {
    if (autoPlay && totalSlides > 1) {
      intervalRef.current = setInterval(() => {
        handleNext();
      }, autoPlayInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoPlay, autoPlayInterval, currentIndex, totalSlides]);

  // 슬라이드 변경 콜백
  useEffect(() => {
    if (onChange) {
      onChange(currentIndex);
    }
  }, [currentIndex, onChange]);

  const handlePrevious = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const newIndex = currentIndex - slidesToScroll;
    
    if (newIndex < 0) {
      if (loop) {
        setCurrentIndex(maxIndex);
      } else {
        setCurrentIndex(0);
      }
    } else {
      setCurrentIndex(newIndex);
    }
    
    setTimeout(() => setIsTransitioning(false), 300);
  }, [currentIndex, slidesToScroll, loop, maxIndex, isTransitioning]);

  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const newIndex = currentIndex + slidesToScroll;
    
    if (newIndex > maxIndex) {
      if (loop) {
        setCurrentIndex(0);
      } else {
        setCurrentIndex(maxIndex);
      }
    } else {
      setCurrentIndex(newIndex);
    }
    
    setTimeout(() => setIsTransitioning(false), 300);
  }, [currentIndex, slidesToScroll, loop, maxIndex, isTransitioning]);

  const handleIndicatorClick = (index) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // 터치 이벤트 핸들러
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrevious();
    }
  };

  // 마우스 호버 시 자동 재생 일시 정지
  const handleMouseEnter = () => {
    if (autoPlay && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (autoPlay) {
      intervalRef.current = setInterval(() => {
        handleNext();
      }, autoPlayInterval);
    }
  };

  // 기본 아이템 렌더러
  const defaultRenderItem = (item, index) => {
    if (item.image) {
      return (
        <div className="relative w-full h-full">
          <img
            src={item.image}
            alt={item.title || `Slide ${index + 1}`}
            className="w-full h-full object-cover"
          />
          {item.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <h3 className="text-white text-lg font-semibold">{item.title}</h3>
              {item.description && (
                <p className="text-white/80 text-sm mt-1">{item.description}</p>
              )}
            </div>
          )}
        </div>
      );
    }
    return item.content || null;
  };

  const slideWidth = 100 / slidesToShow;
  const translateX = -(currentIndex * slideWidth);

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">캐러셀 아이템이 없습니다</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative ${variantStyles[variant]} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="region"
      aria-roledescription="carousel"
      aria-label="이미지 캐러셀"
    >
      {/* 메인 컨테이너 */}
      <div className="relative overflow-hidden">
        <div
          className={`flex transition-transform duration-300 ease-in-out ${gapSizes[gap]}`}
          style={{ transform: `translateX(${translateX}%)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {items.map((item, index) => (
            <div
              key={item.id || index}
              className="flex-shrink-0"
              style={{ width: `${slideWidth}%` }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${totalSlides}`}
            >
              {renderItem ? renderItem(item, index) : defaultRenderItem(item, index)}
            </div>
          ))}
        </div>
      </div>

      {/* 화살표 */}
      {showArrows && totalSlides > slidesToShow && (
        <>
          <button
            onClick={handlePrevious}
            disabled={!loop && currentIndex === 0}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all ${
              !loop && currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="이전 슬라이드"
          >
            <svg className="w-5 h-5 text-gray-800 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            disabled={!loop && currentIndex >= maxIndex}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all ${
              !loop && currentIndex >= maxIndex ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="다음 슬라이드"
          >
            <svg className="w-5 h-5 text-gray-800 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* 인디케이터 */}
      {showIndicators && totalSlides > 1 && (
        <div 
          className="flex justify-center items-center gap-2 mt-4"
          role="tablist"
          aria-label="슬라이드 선택"
        >
          {Array.from({ length: Math.ceil(totalSlides / slidesToScroll) }).map((_, index) => (
            <button
              key={index}
              onClick={() => handleIndicatorClick(index * slidesToScroll)}
              className={`transition-all duration-300 ${
                Math.floor(currentIndex / slidesToScroll) === index
                  ? 'w-8 h-2 bg-[#2AC1BC] dark:bg-[#00B14F]'
                  : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              } rounded-full`}
              role="tab"
              aria-selected={Math.floor(currentIndex / slidesToScroll) === index}
              aria-label={`슬라이드 그룹 ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * TestimonialCarousel - 후기 전용 캐러셀
 */
export const TestimonialCarousel = ({ testimonials = [], className = '' }) => {
  const renderTestimonial = (item) => (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex items-start gap-4">
        {item.avatar && (
          <img 
            src={item.avatar} 
            alt={item.name} 
            className="w-12 h-12 rounded-full object-cover"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">{item.name}</h4>
            {item.rating && (
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg 
                    key={i} 
                    className={`w-4 h-4 ${i < item.rating ? 'fill-current' : 'fill-gray-300'}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-300 italic">"{item.content}"</p>
          {item.date && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{item.date}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Carousel
      items={testimonials}
      variant="cards"
      renderItem={renderTestimonial}
      className={className}
      autoPlay
      showArrows={false}
    />
  );
};

/**
 * ProductCarousel - 상품 전용 캐러셀
 */
export const ProductCarousel = ({ 
  products = [], 
  slidesToShow = 4,
  className = '',
  onProductClick 
}) => {
  const renderProduct = (item) => (
    <div 
      className="p-2 cursor-pointer"
      onClick={() => onProductClick && onProductClick(item)}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
        {item.image && (
          <div className="aspect-square mb-3 overflow-hidden rounded-md">
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{item.name}</h4>
        {item.price && (
          <p className="text-[#2AC1BC] font-bold">{item.price.toLocaleString('vi-VN')} ₫</p>
        )}
        {item.originalPrice && (
          <p className="text-sm text-gray-500 line-through">
            {item.originalPrice.toLocaleString('vi-VN')} ₫
          </p>
        )}
        {item.discount && (
          <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-600 text-xs rounded">
            -{item.discount}%
          </span>
        )}
      </div>
    </div>
  );

  return (
    <Carousel
      items={products}
      variant="cards"
      slidesToShow={slidesToShow}
      slidesToScroll={1}
      renderItem={renderProduct}
      className={className}
      loop
    />
  );
};

export default Carousel;