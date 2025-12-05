/**
 * Menu Management Redux Slice
 * Menu state management for the application
 *
 * Features:
 * - Currency formatting
 * - Food categories and allergen information
 * - Real-time inventory management
 * - Popularity and rating-based recommendations
 * - Local food preference analysis
 */
import { createSlice } from '@reduxjs/toolkit';

// Food categories
export const VIETNAMESE_CATEGORIES = {
  PHO: 'pho',              // Rice noodles
  COM: 'com',              // Rice dishes
  BUN: 'bun',              // Vermicelli dishes
  BANH_MI: 'banh_mi',      // Sandwiches
  DRINKS: 'drinks',        // Beverages
  DESSERTS: 'desserts',    // Desserts
  APPETIZERS: 'appetizers', // Starters
  HOTPOT: 'hotpot',        // Hotpot
  SEAFOOD: 'seafood',      // Seafood
  VEGETARIAN: 'vegetarian', // Vegetarian
};

// Allergen information
export const ALLERGEN_TYPES = {
  PEANUTS: 'peanuts',      // Peanuts
  SHELLFISH: 'shellfish',  // Shellfish
  FISH: 'fish',            // Fish
  EGGS: 'eggs',            // Eggs
  SOY: 'soy',              // Soy
  GLUTEN: 'gluten',        // Gluten
  DAIRY: 'dairy',          // Dairy
  SESAME: 'sesame',        // Sesame
  MSG: 'msg',              // MSG
};

// Spice levels
export const SPICE_LEVELS = {
  NONE: 0,        // Not spicy
  MILD: 1,        // Mild
  MEDIUM: 2,      // Medium
  HOT: 3,         // Hot
  EXTRA_HOT: 4,   // Extra hot
};

const initialState = {
  categories: [],
  items: [],
  currentItem: null,
  
  // 필터링 및 검색 (Local 특화)
  filters: {
    category: 'all',
    availability: 'all',
    searchTerm: '',
    priceRange: null,
    spiceLevel: null,
    allergens: [],
    dietary: 'all', // vegetarian, vegan, halal, all
    rating: null,
    district: 'all', // 지역별 인기 메뉴
  },
  
  // 정렬 옵션
  sortBy: 'popularity', // name, price, rating, popularity, newest
  displayOrder: 'desc',

  // Region-specific data
  vietnamData: {
    popularByDistrict: {},     // Popular items by district
    seasonalItems: [],         // Seasonal items
    festivalSpecials: [],      // Festival specials
    dietaryPreferences: {},    // Dietary preference statistics
    allergenStats: {},         // Allergen statistics
    spiceLevelPrefs: {},      // Spice level preferences
  },
  
  // 재고 및 가용성
  inventory: {
    lowStockItems: [],
    outOfStockItems: [],
    expiringSoonItems: [],
    autoReorderEnabled: true,
    reorderThreshold: 10,
  },
  
  // 추천 시스템
  recommendations: {
    trending: [],              // 트렌딩 메뉴
    customerFavorites: [],     // 고객 즐겨찾기
    pairingSuggestions: {},    // 조합 추천
    similarItems: {},          // 유사 메뉴
  },
  
  // 가격 및 프로모션
  pricing: {
    discountedItems: [],
    comboDeals: [],
    happyHourItems: [],
    bulkDiscounts: {},
  },
  
  // 통계 및 분석
  analytics: {
    topSellingItems: [],
    revenueByItem: {},
    orderFrequency: {},
    customerRatings: {},
    reviewCount: {},
    lastUpdated: null,
  },
  
  // 상태 관리
  isLoading: false,
  isLoadingDetails: false,
  error: null,
  syncStatus: 'idle',
  lastUpdated: null,
};

// VND 화폐 포맷 함수
const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// 메뉴 아이템 가격 포맷팅 헬퍼 함수
const formatMenuItemPrices = (item) => {
  return {
    ...item,
    formattedPrice: formatVND(item.price || 0),
    formattedDiscountPrice: item.discountPrice ? formatVND(item.discountPrice) : null,
    formattedOriginalPrice: item.originalPrice ? formatVND(item.originalPrice) : null,
    updatedAt: new Date().toISOString(),
  };
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    // 기본 카테고리 관리
    setCategories: (state, action) => {
      state.categories = action.payload.map(category => ({
        ...category,
        lastUpdated: new Date().toISOString(),
      }));
      state.lastUpdated = new Date().toISOString();
    },

    addCategory: (state, action) => {
      const newCategory = {
        ...action.payload,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };
      state.categories.push(newCategory);
      state.lastUpdated = new Date().toISOString();
    },

    updateCategory: (state, action) => {
      const index = state.categories.findIndex(
        (cat) => cat.id === action.payload.id
      );
      if (index !== -1) {
        state.categories[index] = {
          ...action.payload,
          lastUpdated: new Date().toISOString(),
        };
        state.lastUpdated = new Date().toISOString();
      }
    },

    removeCategory: (state, action) => {
      state.categories = state.categories.filter(
        (cat) => cat.id !== action.payload
      );
      state.lastUpdated = new Date().toISOString();
    },

    // 메뉴 아이템 관리 (Local 특화)
    setMenuItems: (state, action) => {
      state.items = action.payload.map(item => formatMenuItemPrices(item));
      state.lastUpdated = new Date().toISOString();
    },

    addMenuItem: (state, action) => {
      const newItem = formatMenuItemPrices({
        ...action.payload,
        createdAt: new Date().toISOString(),
      });
      state.items.push(newItem);
      state.lastUpdated = new Date().toISOString();
    },

    updateMenuItem: (state, action) => {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id
      );
      if (index !== -1) {
        state.items[index] = formatMenuItemPrices(action.payload);
        state.lastUpdated = new Date().toISOString();
      }
    },

    removeMenuItem: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      state.lastUpdated = new Date().toISOString();
    },

    setCurrentItem: (state, action) => {
      state.currentItem = action.payload ? formatMenuItemPrices(action.payload) : null;
    },

    toggleItemAvailability: (state, action) => {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) {
        item.isAvailable = !item.isAvailable;
        item.lastUpdated = new Date().toISOString();
        state.lastUpdated = new Date().toISOString();
      }
    },

    updateItemStock: (state, action) => {
      const { itemId, stock } = action.payload;
      const item = state.items.find((i) => i.id === itemId);
      if (item) {
        const oldStock = item.stock;
        item.stock = stock;
        item.lastUpdated = new Date().toISOString();
        
        // 재고 부족 알림 관리
        if (stock <= state.inventory.reorderThreshold && oldStock > state.inventory.reorderThreshold) {
          if (!state.inventory.lowStockItems.includes(itemId)) {
            state.inventory.lowStockItems.push(itemId);
          }
        } else if (stock > state.inventory.reorderThreshold) {
          state.inventory.lowStockItems = state.inventory.lowStockItems.filter(id => id !== itemId);
        }
        
        // 품절 관리
        if (stock === 0) {
          if (!state.inventory.outOfStockItems.includes(itemId)) {
            state.inventory.outOfStockItems.push(itemId);
          }
        } else if (stock > 0) {
          state.inventory.outOfStockItems = state.inventory.outOfStockItems.filter(id => id !== itemId);
        }
        
        state.lastUpdated = new Date().toISOString();
      }
    },

    // Local 특화 메뉴 기능
    updateVietnameseItemData: (state, action) => {
      const { itemId, vietnameseData } = action.payload;
      const item = state.items.find((i) => i.id === itemId);
      if (item) {
        item.vietnameseData = {
          ...item.vietnameseData,
          ...vietnameseData,
          lastUpdated: new Date().toISOString(),
        };
        state.lastUpdated = new Date().toISOString();
      }
    },

    updateSpiceLevel: (state, action) => {
      const { itemId, spiceLevel } = action.payload;
      const item = state.items.find((i) => i.id === itemId);
      if (item) {
        item.spiceLevel = spiceLevel;
        item.lastUpdated = new Date().toISOString();
        state.lastUpdated = new Date().toISOString();
      }
    },

    updateAllergenInfo: (state, action) => {
      const { itemId, allergens } = action.payload;
      const item = state.items.find((i) => i.id === itemId);
      if (item) {
        item.allergens = allergens;
        item.lastUpdated = new Date().toISOString();
        state.lastUpdated = new Date().toISOString();
      }
    },

    // 지역별 인기도 업데이트
    updateDistrictPopularity: (state, action) => {
      const { district, itemId, popularity } = action.payload;
      if (!state.vietnamData.popularByDistrict[district]) {
        state.vietnamData.popularByDistrict[district] = {};
      }
      state.vietnamData.popularByDistrict[district][itemId] = {
        popularity,
        lastUpdated: new Date().toISOString(),
      };
      state.lastUpdated = new Date().toISOString();
    },

    // 계절 메뉴 관리
    addSeasonalItem: (state, action) => {
      const seasonalItem = {
        ...action.payload,
        startDate: action.payload.startDate,
        endDate: action.payload.endDate,
        createdAt: new Date().toISOString(),
      };
      state.vietnamData.seasonalItems.push(seasonalItem);
      state.lastUpdated = new Date().toISOString();
    },

    removeSeasonalItem: (state, action) => {
      state.vietnamData.seasonalItems = state.vietnamData.seasonalItems.filter(
        item => item.id !== action.payload
      );
      state.lastUpdated = new Date().toISOString();
    },

    // 명절 특선 관리
    addFestivalSpecial: (state, action) => {
      state.vietnamData.festivalSpecials.push({
        ...action.payload,
        createdAt: new Date().toISOString(),
      });
      state.lastUpdated = new Date().toISOString();
    },

    clearExpiredFestivalSpecials: (state) => {
      const now = new Date();
      state.vietnamData.festivalSpecials = state.vietnamData.festivalSpecials.filter(
        special => new Date(special.endDate) > now
      );
      state.lastUpdated = new Date().toISOString();
    },

    // 필터링 및 정렬
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearFilters: (state) => {
      state.filters = initialState.filters;
    },

    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },

    setDisplayOrder: (state, action) => {
      state.displayOrder = action.payload;
    },

    // 추천 시스템
    updateRecommendations: (state, action) => {
      state.recommendations = {
        ...state.recommendations,
        ...action.payload,
        lastUpdated: new Date().toISOString(),
      };
    },

    updateTrendingItems: (state, action) => {
      state.recommendations.trending = action.payload;
      state.recommendations.lastUpdated = new Date().toISOString();
    },

    // 가격 및 프로모션
    applyDiscount: (state, action) => {
      const { itemId, discountPrice, discountPercentage } = action.payload;
      const item = state.items.find((i) => i.id === itemId);
      if (item) {
        item.originalPrice = item.originalPrice || item.price;
        item.discountPrice = discountPrice;
        item.discountPercentage = discountPercentage;
        item.formattedDiscountPrice = formatVND(discountPrice);
        item.lastUpdated = new Date().toISOString();
        
        if (!state.pricing.discountedItems.includes(itemId)) {
          state.pricing.discountedItems.push(itemId);
        }
        
        state.lastUpdated = new Date().toISOString();
      }
    },

    removeDiscount: (state, action) => {
      const itemId = action.payload;
      const item = state.items.find((i) => i.id === itemId);
      if (item) {
        delete item.discountPrice;
        delete item.discountPercentage;
        delete item.formattedDiscountPrice;
        item.lastUpdated = new Date().toISOString();
        
        state.pricing.discountedItems = state.pricing.discountedItems.filter(id => id !== itemId);
        state.lastUpdated = new Date().toISOString();
      }
    },

    // 통계 업데이트
    updateAnalytics: (state, action) => {
      state.analytics = {
        ...state.analytics,
        ...action.payload,
        lastUpdated: new Date().toISOString(),
      };
    },

    // 재고 관리
    updateInventorySettings: (state, action) => {
      state.inventory = {
        ...state.inventory,
        ...action.payload,
      };
      state.lastUpdated = new Date().toISOString();
    },

    markItemExpiringSoon: (state, action) => {
      const { itemId, expiryDate } = action.payload;
      if (!state.inventory.expiringSoonItems.find(item => item.itemId === itemId)) {
        state.inventory.expiringSoonItems.push({
          itemId,
          expiryDate,
          addedAt: new Date().toISOString(),
        });
        state.lastUpdated = new Date().toISOString();
      }
    },

    // 상태 관리
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    setLoadingDetails: (state, action) => {
      state.isLoadingDetails = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
      state.isLoadingDetails = false;
    },

    clearError: (state) => {
      state.error = null;
    },

    setSyncStatus: (state, action) => {
      state.syncStatus = action.payload;
    },
  },
});

// 액션 export
export const {
  // 기본 카테고리 및 메뉴 관리
  setCategories,
  addCategory,
  updateCategory,
  removeCategory,
  setMenuItems,
  addMenuItem,
  updateMenuItem,
  removeMenuItem,
  setCurrentItem,
  toggleItemAvailability,
  updateItemStock,
  
  // Local 특화 기능
  updateVietnameseItemData,
  updateSpiceLevel,
  updateAllergenInfo,
  updateDistrictPopularity,
  
  // 계절 및 명절 메뉴
  addSeasonalItem,
  removeSeasonalItem,
  addFestivalSpecial,
  clearExpiredFestivalSpecials,
  
  // 필터링 및 정렬
  setFilters,
  clearFilters,
  setSortBy,
  setDisplayOrder,
  
  // 추천 시스템
  updateRecommendations,
  updateTrendingItems,
  
  // 가격 및 프로모션
  applyDiscount,
  removeDiscount,
  
  // 통계 및 재고
  updateAnalytics,
  updateInventorySettings,
  markItemExpiringSoon,
  
  // 상태 관리
  setLoading,
  setLoadingDetails,
  setError,
  clearError,
  setSyncStatus,
} = menuSlice.actions;

// 셀렉터 함수들
export const selectMenuCategories = (state) => state.menu.categories;
export const selectMenuItems = (state) => state.menu.items;
export const selectCurrentMenuItem = (state) => state.menu.currentItem;
export const selectMenuFilters = (state) => state.menu.filters;
export const selectMenuSortBy = (state) => state.menu.sortBy;
export const selectMenuDisplayOrder = (state) => state.menu.displayOrder;
export const selectMenuLoading = (state) => state.menu.isLoading;
export const selectMenuError = (state) => state.menu.error;

// Local 특화 셀렉터
export const selectVietnameseMenuData = (state) => state.menu.vietnamData;
export const selectPopularItemsByDistrict = (district) => (state) => 
  state.menu.vietnamData.popularByDistrict[district] || {};
export const selectSeasonalItems = (state) => state.menu.vietnamData.seasonalItems;
export const selectFestivalSpecials = (state) => state.menu.vietnamData.festivalSpecials;

// 재고 관련 셀렉터
export const selectInventoryData = (state) => state.menu.inventory;
export const selectLowStockItems = (state) => state.menu.inventory.lowStockItems;
export const selectOutOfStockItems = (state) => state.menu.inventory.outOfStockItems;
export const selectExpiringSoonItems = (state) => state.menu.inventory.expiringSoonItems;

// 추천 및 인기 메뉴 셀렉터
export const selectRecommendations = (state) => state.menu.recommendations;
export const selectTrendingItems = (state) => state.menu.recommendations.trending;
export const selectCustomerFavorites = (state) => state.menu.recommendations.customerFavorites;

// 가격 및 프로모션 셀렉터
export const selectPricingData = (state) => state.menu.pricing;
export const selectDiscountedItems = (state) => state.menu.pricing.discountedItems;
export const selectComboDeals = (state) => state.menu.pricing.comboDeals;

// 통계 셀렉터
export const selectMenuAnalytics = (state) => state.menu.analytics;
export const selectTopSellingItems = (state) => state.menu.analytics.topSellingItems;
export const selectRevenueByItem = (state) => state.menu.analytics.revenueByItem;

// 복합 셀렉터
export const selectFilteredMenuItems = (state) => {
  const { items, filters } = state.menu;
  let filtered = items;

  // 카테고리 필터
  if (filters.category !== 'all') {
    filtered = filtered.filter(item => item.category === filters.category);
  }

  // 가용성 필터
  if (filters.availability !== 'all') {
    filtered = filtered.filter(item => 
      filters.availability === 'available' ? item.isAvailable : !item.isAvailable
    );
  }

  // 검색어 필터
  if (filters.searchTerm) {
    const searchTerm = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm) ||
      item.vietnameseData?.keywords?.some(keyword => 
        keyword.toLowerCase().includes(searchTerm)
      )
    );
  }

  // 가격 범위 필터
  if (filters.priceRange) {
    const [min, max] = filters.priceRange;
    filtered = filtered.filter(item => 
      item.price >= min && item.price <= max
    );
  }

  // 매운맛 단계 필터
  if (filters.spiceLevel !== null) {
    filtered = filtered.filter(item => item.spiceLevel === filters.spiceLevel);
  }

  // 알레르기 정보 필터
  if (filters.allergens.length > 0) {
    filtered = filtered.filter(item => 
      !filters.allergens.some(allergen => 
        item.allergens?.includes(allergen)
      )
    );
  }

  // 식단 유형 필터
  if (filters.dietary !== 'all') {
    filtered = filtered.filter(item => 
      item.dietaryInfo?.includes(filters.dietary)
    );
  }

  // 평점 필터
  if (filters.rating) {
    filtered = filtered.filter(item => 
      (item.rating || 0) >= filters.rating
    );
  }

  // 지역별 인기도 필터
  if (filters.district !== 'all') {
    const districtPopularity = state.menu.vietnamData.popularByDistrict[filters.district] || {};
    filtered = filtered.filter(item => districtPopularity[item.id]);
  }

  return filtered;
};

// 정렬된 메뉴 아이템 셀렉터
export const selectSortedMenuItems = (state) => {
  const filteredItems = selectFilteredMenuItems(state);
  const { sortBy, displayOrder } = state.menu;

  const sorted = [...filteredItems].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        return displayOrder === 'asc' ? 
          aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      
      case 'price':
        aValue = a.discountPrice || a.price || 0;
        bValue = b.discountPrice || b.price || 0;
        break;
        
      case 'rating':
        aValue = a.rating || 0;
        bValue = b.rating || 0;
        break;
        
      case 'popularity':
        aValue = a.orderCount || 0;
        bValue = b.orderCount || 0;
        break;
        
      case 'newest':
        aValue = new Date(a.createdAt || 0);
        bValue = new Date(b.createdAt || 0);
        break;
        
      default:
        return 0;
    }

    if (sortBy !== 'name') {
      return displayOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  return sorted;
};

// 카테고리별 메뉴 아이템 셀렉터
export const selectItemsByCategory = (categoryId) => (state) =>
  state.menu.items.filter(item => item.category === categoryId);

// Local 음식 카테고리별 셀렉터
export const selectVietnameseItemsByType = (foodType) => (state) =>
  state.menu.items.filter(item => 
    item.vietnameseData?.foodType === foodType
  );

// 매운맛 단계별 메뉴 셀렉터
export const selectItemsBySpiceLevel = (spiceLevel) => (state) =>
  state.menu.items.filter(item => item.spiceLevel === spiceLevel);

export default menuSlice.reducer;