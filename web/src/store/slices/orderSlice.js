/**
 * Order Management Redux Slice
 * Order state management for the application
 *
 * Features:
 * - Real-time order status tracking
 * - POS system synchronization
 * - Payment system support (MoMo, ZaloPay, VNPay)
 * - Currency formatting
 * - Delivery tracking and ETA calculation
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Order status definitions
export const ORDER_STATUS = {
  PENDING: 'pending',           // Pending
  CONFIRMED: 'confirmed',       // Confirmed
  PREPARING: 'preparing',       // Preparing
  READY: 'ready',              // Ready
  PICKED_UP: 'picked_up',      // Picked up
  DELIVERING: 'delivering',     // Delivering
  DELIVERED: 'delivered',       // Delivered
  CANCELLED: 'cancelled',       // Cancelled
  REFUNDED: 'refunded',        // Refunded
};

// Payment methods
export const PAYMENT_METHODS = {
  COD: 'cod',                  // Cash on delivery
  MOMO: 'momo',               // MoMo
  ZALOPAY: 'zalopay',         // ZaloPay
  VNPAY: 'vnpay',             // VNPay
  BANK_TRANSFER: 'bank_transfer', // Bank transfer
};

const initialState = {
  orders: [],
  currentOrder: null,
  
  // 상태별 주문 그룹
  pendingOrders: [],
  confirmedOrders: [],
  preparingOrders: [],
  readyOrders: [],
  deliveringOrders: [],
  completedOrders: [],
  cancelledOrders: [],
  
  // 필터링 및 검색
  filters: {
    status: 'all',
    dateRange: null,
    searchTerm: '',
    paymentMethod: 'all',
    district: 'all',
    priceRange: null,
  },
  
  // 통계 정보
  statistics: {
    todayTotal: 0,
    todayCount: 0,
    avgOrderValue: 0,
    pendingCount: 0,
    preparingCount: 0,
    deliveringCount: 0,
    completionRate: 0,
    avgDeliveryTime: 0,
    revenueByHour: {},
    popularItems: [],
    customerRetention: 0,
  },
  
  // 실시간 데이터
  realtimeStats: {
    activeOrders: 0,
    estimatedRevenue: 0,
    busyHours: [],
    deliveryHeatmap: {},
  },

  // Region-specific data
  vietnamData: {
    districts: {},              // Order statistics by district
    popularPaymentMethods: {},   // Payment method preferences
    peakDeliveryTimes: [],      // Peak delivery times
    weatherImpact: null,        // Weather impact
    festivalOrders: [],         // Festival/special event orders
  },
  
  // 상태 관리
  isLoading: false,
  isLoadingDetails: false,
  error: null,
  syncStatus: 'idle',          // idle, syncing, success, error
  lastUpdated: null,
  posConnectionStatus: 'disconnected',
};

// VND currency formatting function
const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// 주문 상태별 그룹 업데이트 헬퍼 함수
const updateOrderGroups = (state) => {
  state.pendingOrders = state.orders.filter(o => o.status === ORDER_STATUS.PENDING);
  state.confirmedOrders = state.orders.filter(o => o.status === ORDER_STATUS.CONFIRMED);
  state.preparingOrders = state.orders.filter(o => o.status === ORDER_STATUS.PREPARING);
  state.readyOrders = state.orders.filter(o => o.status === ORDER_STATUS.READY);
  state.deliveringOrders = state.orders.filter(o => o.status === ORDER_STATUS.DELIVERING);
  state.completedOrders = state.orders.filter(o => 
    [ORDER_STATUS.DELIVERED, ORDER_STATUS.PICKED_UP].includes(o.status)
  );
  state.cancelledOrders = state.orders.filter(o => 
    [ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED].includes(o.status)
  );
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    // 기본 주문 관리
    setOrders: (state, action) => {
      state.orders = action.payload.map(order => ({
        ...order,
        formattedTotal: formatVND(order.total || 0),
        estimatedDeliveryTime: order.estimatedDeliveryTime || null,
      }));
      updateOrderGroups(state);
      state.lastUpdated = new Date().toISOString();
      state.syncStatus = 'success';
    },

    addOrder: (state, action) => {
      const newOrder = {
        ...action.payload,
        formattedTotal: formatVND(action.payload.total || 0),
        createdAt: new Date().toISOString(),
        status: ORDER_STATUS.PENDING,
      };
      state.orders.unshift(newOrder);
      state.pendingOrders.unshift(newOrder);
      
      // 실시간 통계 업데이트
      state.realtimeStats.activeOrders += 1;
      state.realtimeStats.estimatedRevenue += newOrder.total || 0;
    },

    updateOrder: (state, action) => {
      const index = state.orders.findIndex(order => order.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = {
          ...action.payload,
          formattedTotal: formatVND(action.payload.total || 0),
          updatedAt: new Date().toISOString(),
        };
        updateOrderGroups(state);
      }
      if (state.currentOrder?.id === action.payload.id) {
        state.currentOrder = state.orders[index];
      }
    },

    updateOrderStatus: (state, action) => {
      const { orderId, status, metadata = {} } = action.payload;
      const order = state.orders.find(o => o.id === orderId);
      
      if (order) {
        const previousStatus = order.status;
        order.status = status;
        order.updatedAt = new Date().toISOString();
        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({
          from: previousStatus,
          to: status,
          timestamp: new Date().toISOString(),
          metadata,
        });

        // POS 시스템 동기화
        if (metadata.fromPOS) {
          order.posSync = true;
          order.posSyncTime = new Date().toISOString();
        }

        // 배달 추적 정보 업데이트
        if (status === ORDER_STATUS.DELIVERING && metadata.driverInfo) {
          order.deliveryTracking = {
            driverId: metadata.driverInfo.id,
            driverName: metadata.driverInfo.name,
            driverPhone: metadata.driverInfo.phone,
            estimatedArrival: metadata.estimatedArrival,
            currentLocation: metadata.currentLocation,
          };
        }

        updateOrderGroups(state);
      }
    },

    // Local 특화 기능
    updateDeliveryTracking: (state, action) => {
      const { orderId, trackingData } = action.payload;
      const order = state.orders.find(o => o.id === orderId);
      
      if (order) {
        order.deliveryTracking = {
          ...order.deliveryTracking,
          ...trackingData,
          lastUpdated: new Date().toISOString(),
        };
      }
    },

    updateDistrictStats: (state, action) => {
      const { district, stats } = action.payload;
      state.vietnamData.districts[district] = {
        ...state.vietnamData.districts[district],
        ...stats,
        lastUpdated: new Date().toISOString(),
      };
    },

    updatePaymentMethodStats: (state, action) => {
      state.vietnamData.popularPaymentMethods = {
        ...state.vietnamData.popularPaymentMethods,
        ...action.payload,
      };
    },

    setPeakDeliveryTimes: (state, action) => {
      state.vietnamData.peakDeliveryTimes = action.payload;
    },

    updateWeatherImpact: (state, action) => {
      state.vietnamData.weatherImpact = {
        ...action.payload,
        updatedAt: new Date().toISOString(),
      };
    },

    // 실시간 데이터 관리
    updateRealtimeStats: (state, action) => {
      state.realtimeStats = {
        ...state.realtimeStats,
        ...action.payload,
        lastUpdated: new Date().toISOString(),
      };
    },

    updateDeliveryHeatmap: (state, action) => {
      state.realtimeStats.deliveryHeatmap = {
        ...state.realtimeStats.deliveryHeatmap,
        ...action.payload,
      };
    },

    // POS 시스템 연동
    syncWithPOS: (state, action) => {
      state.syncStatus = 'syncing';
      state.posConnectionStatus = 'connected';
    },

    posConnected: (state) => {
      state.posConnectionStatus = 'connected';
    },

    posDisconnected: (state) => {
      state.posConnectionStatus = 'disconnected';
    },

    posOrderReceived: (state, action) => {
      const posOrder = {
        ...action.payload,
        fromPOS: true,
        posTimestamp: new Date().toISOString(),
        status: ORDER_STATUS.CONFIRMED,
      };
      state.orders.unshift(posOrder);
      state.confirmedOrders.unshift(posOrder);
    },

    // 필터링 및 검색
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearFilters: (state) => {
      state.filters = initialState.filters;
    },

    // 통계 관리
    updateStatistics: (state, action) => {
      state.statistics = { 
        ...state.statistics, 
        ...action.payload,
        lastCalculated: new Date().toISOString(),
      };
    },

    calculateDailyStats: (state) => {
      const today = new Date().toDateString();
      const todayOrders = state.orders.filter(
        order => new Date(order.createdAt).toDateString() === today
      );
      
      state.statistics.todayCount = todayOrders.length;
      state.statistics.todayTotal = todayOrders.reduce(
        (sum, order) => sum + (order.total || 0), 0
      );
      state.statistics.avgOrderValue = state.statistics.todayCount > 0 
        ? state.statistics.todayTotal / state.statistics.todayCount 
        : 0;

      // 상태별 카운트 업데이트
      state.statistics.pendingCount = state.pendingOrders.length;
      state.statistics.preparingCount = state.preparingOrders.length;
      state.statistics.deliveringCount = state.deliveringOrders.length;
      
      // 완료율 계산
      const completedToday = todayOrders.filter(
        order => order.status === ORDER_STATUS.DELIVERED
      ).length;
      state.statistics.completionRate = state.statistics.todayCount > 0 
        ? (completedToday / state.statistics.todayCount) * 100 
        : 0;
    },

    // 상태 관리
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    setLoadingDetails: (state, action) => {
      state.isLoadingDetails = action.payload;
    },

    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },

    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },

    setSyncStatus: (state, action) => {
      state.syncStatus = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
      state.isLoadingDetails = false;
      state.syncStatus = 'error';
    },

    clearError: (state) => {
      state.error = null;
      state.syncStatus = 'idle';
    },

    // 명절/특수 이벤트 주문 관리
    addFestivalOrder: (state, action) => {
      state.vietnamData.festivalOrders.push({
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
    },

    clearFestivalOrders: (state) => {
      state.vietnamData.festivalOrders = [];
    },
  },
});

// 액션 export
export const {
  // 기본 주문 관리
  setOrders,
  addOrder,
  updateOrder,
  updateOrderStatus,
  
  // Local 특화 기능
  updateDeliveryTracking,
  updateDistrictStats,
  updatePaymentMethodStats,
  setPeakDeliveryTimes,
  updateWeatherImpact,
  
  // 실시간 데이터 관리
  updateRealtimeStats,
  updateDeliveryHeatmap,
  
  // POS 시스템 연동
  syncWithPOS,
  posConnected,
  posDisconnected,
  posOrderReceived,
  
  // 필터링 및 검색
  setFilters,
  clearFilters,
  
  // 통계 관리
  updateStatistics,
  calculateDailyStats,
  
  // 상태 관리
  setLoading,
  setLoadingDetails,
  setCurrentOrder,
  clearCurrentOrder,
  setSyncStatus,
  setError,
  clearError,
  
  // 명절/특수 이벤트
  addFestivalOrder,
  clearFestivalOrders,
} = orderSlice.actions;

// 셀렉터 함수들
export const selectOrders = (state) => state.orders.orders;
export const selectCurrentOrder = (state) => state.orders.currentOrder;
export const selectOrdersByStatus = (status) => (state) => 
  state.orders.orders.filter(order => order.status === status);
export const selectPendingOrders = (state) => state.orders.pendingOrders;
export const selectPreparingOrders = (state) => state.orders.preparingOrders;
export const selectDeliveringOrders = (state) => state.orders.deliveringOrders;
export const selectCompletedOrders = (state) => state.orders.completedOrders;
export const selectOrderStatistics = (state) => state.orders.statistics;
export const selectRealtimeStats = (state) => state.orders.realtimeStats;
export const selectVietnameseData = (state) => state.orders.vietnamData;
export const selectPOSConnectionStatus = (state) => state.orders.posConnectionStatus;
export const selectOrdersLoading = (state) => state.orders.isLoading;
export const selectOrdersError = (state) => state.orders.error;

// 복합 셀렉터
export const selectFilteredOrders = (state) => {
  const { orders, filters } = state.orders;
  let filtered = orders;

  if (filters.status !== 'all') {
    filtered = filtered.filter(order => order.status === filters.status);
  }

  if (filters.paymentMethod !== 'all') {
    filtered = filtered.filter(order => order.paymentMethod === filters.paymentMethod);
  }

  if (filters.district !== 'all') {
    filtered = filtered.filter(order => order.deliveryAddress?.district === filters.district);
  }

  if (filters.searchTerm) {
    const searchTerm = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(order => 
      order.id.toLowerCase().includes(searchTerm) ||
      order.customerName?.toLowerCase().includes(searchTerm) ||
      order.customerPhone?.includes(searchTerm)
    );
  }

  if (filters.priceRange) {
    const [min, max] = filters.priceRange;
    filtered = filtered.filter(order => 
      order.total >= min && order.total <= max
    );
  }

  if (filters.dateRange) {
    const [startDate, endDate] = filters.dateRange;
    filtered = filtered.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }

  return filtered;
};

// Local 특화 셀렉터
export const selectOrdersByDistrict = (district) => (state) =>
  state.orders.orders.filter(order => order.deliveryAddress?.district === district);

export const selectOrdersByPaymentMethod = (method) => (state) =>
  state.orders.orders.filter(order => order.paymentMethod === method);

export const selectTodaysRevenue = (state) => {
  const today = new Date().toDateString();
  return state.orders.orders
    .filter(order => 
      new Date(order.createdAt).toDateString() === today &&
      order.status === ORDER_STATUS.DELIVERED
    )
    .reduce((sum, order) => sum + order.total, 0);
};

export const selectPopularDistricts = (state) => {
  const districts = state.orders.vietnamData.districts;
  return Object.entries(districts)
    .sort((a, b) => b[1].orderCount - a[1].orderCount)
    .slice(0, 5)
    .map(([district, data]) => ({ district, ...data }));
};

export default orderSlice.reducer;