/**
 * MenuItemCard 컴포넌트
 * Local 배달 앱용 메뉴 아이템 카드
 * WCAG 2.1 준수, 다크테마 지원
 */

import React, { useState } from 'react';
import {
  ClockIcon,
  ShoppingCartIcon,
  InformationCircleIcon,
  FireIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const MenuItemCard = ({
  id,
  name,
  description,
  price,
  originalPrice = null,
  image = null,
  category = '',
  isAvailable = true,
  isPopular = false,
  isNew = false,
  spicyLevel = 0, // 0-3: không cay, ít cay, cay, rất cay
  preparationTime = null, // in minutes (new field)
  cookingTime = null, // in minutes (legacy support)
  calories = null, // new field
  nutritionInfo = null, // updated field
  tags = [], // new field
  ingredients = [],
  allergens = [],
  stock = null,
  rating = null,
  reviewCount = 0,
  onAddToCart = null,
  onViewDetails = null,
  showNutrition = false,
  showIngredients = false,
  className = '',
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // 가격 포맷팅 (VND)
  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // 매운 정도 표시
  const getSpicyIndicator = () => {
    if (spicyLevel === 0) return null;
    return (
      <div className="flex items-center ml-2" title={`독 cay: ${spicyLevel}/3`}>
        {Array.from({ length: spicyLevel }, (_, i) => (
          <FireIcon key={i} className="w-4 h-4 text-red-500" />
        ))}
      </div>
    );
  };

  // 할인율 계산
  const getDiscountPercentage = () => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  // 재고 상태
  const getStockStatus = () => {
    if (stock === null) return null;
    if (stock === 0) return 'out_of_stock';
    if (stock <= 5) return 'low_stock';
    return 'in_stock';
  };

  // 평점 표시
  const renderRating = () => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center space-x-1">
        <div className="flex items-center">
          {Array.from({ length: 5 }, (_, i) => (
            i < Math.floor(rating) ? (
              <StarSolidIcon key={i} className="w-4 h-4 text-yellow-400" />
            ) : (
              <StarIcon key={i} className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            )
          ))}
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {rating.toFixed(1)} ({reviewCount})
        </span>
      </div>
    );
  };

  const handleAddToCart = () => {
    if (onAddToCart && isAvailable) {
      onAddToCart({
        id,
        name,
        price,
        quantity,
        image
      });
    }
  };

  const stockStatus = getStockStatus();
  const discountPercentage = getDiscountPercentage();

  return (
    <article
      className={`
        bg-white dark:bg-gray-800 
        border border-gray-200 dark:border-gray-700 
        rounded-lg shadow-sm hover:shadow-md 
        transition-all duration-200 
        ${!isAvailable ? 'opacity-60' : 'hover:border-[#2AC1BC] dark:hover:border-[#2AC1BC]'}
        ${className}
      `}
      aria-labelledby={`menu-item-${id}-name`}
      {...props}
    >
      {/* Image Container */}
      <div className="relative aspect-video rounded-t-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
        {image && !imageError ? (
          <img
            src={image}
            alt={`Hình ảnh món ${name}`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {isNew && (
            <span className="bg-[#00B14F] text-white text-xs font-medium px-2 py-1 rounded-full">
              MỚI
            </span>
          )}
          {isPopular && (
            <span className="bg-[#2AC1BC] text-white text-xs font-medium px-2 py-1 rounded-full">
              PHỔ BIẾN
            </span>
          )}
          {discountPercentage > 0 && (
            <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
              -{discountPercentage}%
            </span>
          )}
        </div>

        {/* Stock Status Badge */}
        {stockStatus && (
          <div className="absolute top-2 right-2">
            {stockStatus === 'out_of_stock' && (
              <span className="bg-red-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                HẾT HÀNG
              </span>
            )}
            {stockStatus === 'low_stock' && (
              <span className="bg-orange-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                SẮP HẾT
              </span>
            )}
          </div>
        )}

        {/* Cooking Time */}
        {cookingTime && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            {cookingTime} phút
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 
              id={`menu-item-${id}-name`}
              className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight"
            >
              <div className="flex items-center">
                {name}
                {getSpicyIndicator()}
              </div>
            </h3>
          </div>

          {/* Rating */}
          {renderRating()}

          {/* Category */}
          {category && (
            <span className="inline-block text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {category}
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
            {description}
          </p>
        )}

        {/* Ingredients */}
        {showIngredients && ingredients.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-500">
            <strong>Thành phần:</strong> {ingredients.slice(0, 3).join(', ')}
            {ingredients.length > 3 && '...'}
          </div>
        )}

        {/* Allergens */}
        {allergens.length > 0 && (
          <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div><strong>Lưu ý:</strong> {allergens.join(', ')}</div>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="inline-block text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-500">+{tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Meta info (Calories & Preparation Time) */}
        {(calories || preparationTime || cookingTime) && (
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
            {calories && (
              <div className="flex items-center space-x-1">
                <FireIcon className="w-4 h-4" />
                <span>{calories} kcal</span>
              </div>
            )}
            {(preparationTime || cookingTime) && (
              <div className="flex items-center space-x-1">
                <ClockIcon className="w-4 h-4" />
                <span>{preparationTime || cookingTime} phút</span>
              </div>
            )}
          </div>
        )}

        {/* Nutrition Info */}
        {showNutrition && nutritionInfo && (
          <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
            {nutritionInfo.calories && <div><strong>Calories:</strong> {nutritionInfo.calories}kcal</div>}
            {nutritionInfo.protein && <div><strong>Protein:</strong> {nutritionInfo.protein}g</div>}
            {nutritionInfo.carbs && <div><strong>Carbs:</strong> {nutritionInfo.carbs}g</div>}
            {nutritionInfo.fat && <div><strong>Fat:</strong> {nutritionInfo.fat}g</div>}
          </div>
        )}

        {/* Price Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-[#2AC1BC]">
              {formatPrice(price)}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {/* Stock indicator */}
          {stock !== null && stock > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              Còn {stock} món
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-2">
          {isAvailable && stockStatus !== 'out_of_stock' ? (
            <>
              {/* Quantity Selector */}
              <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] focus:ring-inset"
                  aria-label="Giảm số lượng"
                >
                  −
                </button>
                <span 
                  className="px-4 py-2 text-gray-900 dark:text-gray-100 min-w-[3rem] text-center"
                  aria-label={`Số lượng: ${quantity}`}
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] focus:ring-inset"
                  aria-label="Tăng số lượng"
                  disabled={stock !== null && quantity >= stock}
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 bg-[#2AC1BC] text-white py-2 px-4 rounded-lg font-medium hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={!onAddToCart}
                aria-label={`Thêm ${name} vào giỏ hàng`}
              >
                <ShoppingCartIcon className="w-4 h-4" />
                Thêm vào giỏ
              </button>
            </>
          ) : (
            <div className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 py-2 px-4 rounded-lg font-medium text-center cursor-not-allowed">
              {stockStatus === 'out_of_stock' ? 'Hết hàng' : 'Không có sẵn'}
            </div>
          )}

          {/* View Details Button */}
          {onViewDetails && (
            <button
              type="button"
              onClick={() => onViewDetails(id)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#2AC1BC] dark:hover:text-[#2AC1BC] focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-lg transition-colors"
              aria-label={`Xem chi tiết món ${name}`}
            >
              <InformationCircleIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default MenuItemCard;