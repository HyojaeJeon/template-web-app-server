'use client'

import { useState, useEffect, useRef, forwardRef } from 'react'

/**
 * Masonry - 메이슨리 레이아웃 컴포넌트 (WCAG 2.1 준수)
 * Pinterest 스타일의 그리드 레이아웃
 * 다크 테마 지원
 */
const Masonry = forwardRef(({
  children,
  columns = 3,
  gap = 16,
  breakpoints = {
    640: 2,
    768: 3,
    1024: 4,
    1280: 5
  },
  className = '',
  ...props
}, ref) => {
  const [columnCount, setColumnCount] = useState(columns)
  const containerRef = useRef(null)

  // 반응형 컬럼 수 계산
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth
      let cols = columns
      
      Object.entries(breakpoints)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([breakpoint, count]) => {
          if (width >= parseInt(breakpoint)) {
            cols = count
          }
        })
      
      setColumnCount(cols)
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [columns, breakpoints])

  // children을 컬럼별로 분배
  const distributeItems = () => {
    const cols = Array.from({ length: columnCount }, () => [])
    const items = Array.isArray(children) ? children : [children]
    
    items.forEach((child, index) => {
      const columnIndex = index % columnCount
      cols[columnIndex].push(child)
    })
    
    return cols
  }

  const columnItems = distributeItems()

  return (
    <div
      ref={ref || containerRef}
      className={`flex gap-${gap / 4} ${className}`}
      style={{ gap: `${gap}px` }}
      {...props}
    >
      {columnItems.map((column, colIndex) => (
        <div
          key={colIndex}
          className="flex-1 flex flex-col"
          style={{ gap: `${gap}px` }}
        >
          {column.map((item, itemIndex) => (
            <div key={`${colIndex}-${itemIndex}`}>
              {item}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
})

/**
 * MasonryItem - 메이슨리 아이템 컴포넌트
 */
export const MasonryItem = forwardRef(({
  children,
  className = '',
  onClick,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`
        break-inside-avoid
        transition-all duration-300
        ${onClick ? 'cursor-pointer hover:transform hover:scale-105' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
})

/**
 * DeliveryMasonryGallery - Local App 갤러리
 */
export const DeliveryMasonryGallery = forwardRef(({
  images = [],
  onImageClick,
  className = '',
  ...props
}, ref) => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  // 카테고리 추출
  const categories = ['all', ...new Set(images.map(img => img.category).filter(Boolean))]
  
  // 필터링된 이미지
  const filteredImages = selectedCategory === 'all' 
    ? images 
    : images.filter(img => img.category === selectedCategory)

  return (
    <div ref={ref} className={className} {...props}>
      {/* 카테고리 필터 */}
      {categories.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                px-4 py-2 rounded-full whitespace-nowrap
                transition-all duration-300
                ${selectedCategory === category
                  ? 'bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              {category === 'all' ? '전체' : category}
            </button>
          ))}
        </div>
      )}

      {/* 메이슨리 갤러리 */}
      <Masonry
        columns={3}
        gap={16}
        breakpoints={{
          640: 1,
          768: 2,
          1024: 3,
          1280: 4
        }}
      >
        {filteredImages.map((image, index) => (
          <MasonryItem
            key={image.id || index}
            onClick={() => onImageClick?.(image)}
          >
            <div className="
              relative
              overflow-hidden
              rounded-2xl
              bg-gray-200 dark:bg-gray-700
              shadow-lg
              group
              transition-all duration-300
              hover:shadow-xl
            ">
              {/* 이미지 */}
              <img
                src={image.src}
                alt={image.alt || ''}
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              
              {/* 오버레이 */}
              <div className="
                absolute inset-0
                bg-gradient-to-t from-black/60 to-transparent
                opacity-0 group-hover:opacity-100
                transition-opacity duration-300
                flex flex-col justify-end
                p-4
              ">
                {image.title && (
                  <h3 className="text-white font-bold text-lg mb-1">
                    {image.title}
                  </h3>
                )}
                {image.description && (
                  <p className="text-white/90 text-sm line-clamp-2">
                    {image.description}
                  </p>
                )}
                {image.stats && (
                  <div className="flex gap-4 mt-2">
                    {image.stats.likes && (
                      <span className="text-white text-sm flex items-center gap-1">
                        ❤️ {image.stats.likes}
                      </span>
                    )}
                    {image.stats.views && (
                      <span className="text-white text-sm flex items-center gap-1">
                        👁️ {image.stats.views}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 배지 */}
              {image.badge && (
                <span className="
                  absolute top-3 left-3
                  px-3 py-1
                  bg-gradient-to-r from-[#2AC1BC] to-[#00B14F]
                  text-white text-xs font-bold
                  rounded-full
                  shadow-lg
                ">
                  {image.badge}
                </span>
              )}
            </div>
          </MasonryItem>
        ))}
      </Masonry>
    </div>
  )
})

/**
 * ProductMasonry - 제품 메이슨리 레이아웃
 */
export const ProductMasonry = forwardRef(({
  products = [],
  onProductClick,
  className = '',
  ...props
}, ref) => {
  return (
    <Masonry
      ref={ref}
      columns={4}
      gap={20}
      breakpoints={{
        640: 2,
        768: 3,
        1024: 4,
        1280: 5
      }}
      className={className}
      {...props}
    >
      {products.map((product) => (
        <MasonryItem
          key={product.id}
          onClick={() => onProductClick?.(product)}
        >
          <div className="
            bg-white dark:bg-gray-800
            rounded-2xl
            overflow-hidden
            shadow-lg
            transition-all duration-300
            hover:shadow-xl
            hover:transform hover:-translate-y-1
            cursor-pointer
          ">
            {/* 이미지 컨테이너 - 높이가 다양함 */}
            <div 
              className="relative bg-gray-100 dark:bg-gray-700"
              style={{ height: product.imageHeight || 'auto' }}
            >
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
              
              {/* 할인 배지 */}
              {product.discount && (
                <span className="
                  absolute top-3 right-3
                  px-2 py-1
                  bg-red-500
                  text-white text-xs font-bold
                  rounded-lg
                ">
                  -{product.discount}%
                </span>
              )}
              
              {/* HOT 배지 */}
              {product.isHot && (
                <span className="
                  absolute top-3 left-3
                  px-2 py-1
                  bg-gradient-to-r from-orange-500 to-red-500
                  text-white text-xs font-bold
                  rounded-lg
                  animate-pulse
                ">
                  HOT 🔥
                </span>
              )}
            </div>

            {/* 제품 정보 */}
            <div className="p-4">
              <h3 className="font-bold text-gray-800 dark:text-white mb-1 line-clamp-2">
                {product.name}
              </h3>
              
              {product.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {product.description}
                </p>
              )}

              {/* 가격 */}
              <div className="flex items-center gap-2 mb-2">
                {product.originalPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    {product.originalPrice.toLocaleString()}đ
                  </span>
                )}
                <span className="text-lg font-bold text-[#2AC1BC]">
                  {product.price.toLocaleString()}đ
                </span>
              </div>

              {/* 평점 및 리뷰 */}
              {product.rating && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">⭐</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {product.rating}
                    </span>
                  </div>
                  {product.reviews && (
                    <span className="text-gray-500 dark:text-gray-400">
                      ({product.reviews} 리뷰)
                    </span>
                  )}
                </div>
              )}

              {/* 배달 정보 */}
              {product.deliveryInfo && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    🏍️ {product.deliveryInfo}
                  </span>
                </div>
              )}
            </div>
          </div>
        </MasonryItem>
      ))}
    </Masonry>
  )
})

Masonry.displayName = 'Masonry'
MasonryItem.displayName = 'MasonryItem'
DeliveryMasonryGallery.displayName = 'DeliveryMasonryGallery'
ProductMasonry.displayName = 'ProductMasonry'

export default Masonry