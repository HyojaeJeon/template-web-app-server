/**
 * usePermission.js - 권한 체크 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 세분화된 권한 관리 시스템
 * - 역할 기반 접근 제어 (RBAC)
 * - Local 특화 비즈니스 권한
 * - 조건부 권한 (시간/위치 기반)
 * - 권한 변경 실시간 감지
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './useAuth'
import { useAppTranslation } from '../i18n/I18nProvider'

// Local 점주 시스템 권한 정의
const PERMISSIONS = {
  // 매장 관리
  STORE_MANAGE: 'store:manage',
  STORE_VIEW: 'store:view',
  STORE_SETTINGS: 'store:settings',
  STORE_HOURS: 'store:hours',
  STORE_INFO: 'store:info',
  
  // 메뉴 관리
  MENU_CREATE: 'menu:create',
  MENU_UPDATE: 'menu:update',
  MENU_DELETE: 'menu:delete',
  MENU_VIEW: 'menu:view',
  MENU_PRICING: 'menu:pricing',
  
  // 주문 관리
  ORDER_VIEW_ALL: 'order:view_all',
  ORDER_VIEW_OWN: 'order:view_own',
  ORDER_UPDATE_STATUS: 'order:update_status',
  ORDER_CANCEL: 'order:cancel',
  ORDER_REFUND: 'order:refund',
  
  // 직원 관리
  STAFF_CREATE: 'staff:create',
  STAFF_UPDATE: 'staff:update',
  STAFF_DELETE: 'staff:delete',
  STAFF_VIEW: 'staff:view',
  STAFF_SCHEDULE: 'staff:schedule',
  
  // 재무/분석
  FINANCE_VIEW_REVENUE: 'finance:view_revenue',
  FINANCE_VIEW_EXPENSES: 'finance:view_expenses',
  FINANCE_EXPORT_DATA: 'finance:export_data',
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // POS 시스템
  POS_ACCESS: 'pos:access',
  POS_CONFIGURE: 'pos:configure',
  POS_REPORTS: 'pos:reports',
  
  // 프로모션/마케팅
  PROMOTION_CREATE: 'promotion:create',
  PROMOTION_UPDATE: 'promotion:update',
  PROMOTION_DELETE: 'promotion:delete',
  
  // 고객 관리
  CUSTOMER_VIEW: 'customer:view',
  CUSTOMER_CONTACT: 'customer:contact',
  
  // 배달 관리
  DELIVERY_MANAGE: 'delivery:manage',
  DELIVERY_TRACK: 'delivery:track',
  
  // 리뷰 관리
  REVIEW_RESPOND: 'review:respond',
  REVIEW_MODERATE: 'review:moderate',
  
  // 설정
  SETTINGS_GENERAL: 'settings:general',
  SETTINGS_PAYMENT: 'settings:payment',
  SETTINGS_NOTIFICATION: 'settings:notification'
}

// 역할별 기본 권한 매트릭스
const ROLE_PERMISSIONS = {
  store_owner: Object.values(PERMISSIONS), // 모든 권한
  
  manager: [
    PERMISSIONS.STORE_VIEW,
    PERMISSIONS.STORE_INFO,
    PERMISSIONS.STORE_HOURS,
    PERMISSIONS.MENU_CREATE,
    PERMISSIONS.MENU_UPDATE,
    PERMISSIONS.MENU_VIEW,
    PERMISSIONS.MENU_PRICING,
    PERMISSIONS.ORDER_VIEW_ALL,
    PERMISSIONS.ORDER_UPDATE_STATUS,
    PERMISSIONS.ORDER_CANCEL,
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.STAFF_SCHEDULE,
    PERMISSIONS.FINANCE_VIEW_REVENUE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_REPORTS,
    PERMISSIONS.PROMOTION_CREATE,
    PERMISSIONS.PROMOTION_UPDATE,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.DELIVERY_MANAGE,
    PERMISSIONS.REVIEW_RESPOND,
    PERMISSIONS.SETTINGS_GENERAL
  ],
  
  staff: [
    PERMISSIONS.STORE_VIEW,
    PERMISSIONS.MENU_VIEW,
    PERMISSIONS.ORDER_VIEW_ALL,
    PERMISSIONS.ORDER_UPDATE_STATUS,
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.DELIVERY_TRACK
  ],
  
  part_time: [
    PERMISSIONS.STORE_VIEW,
    PERMISSIONS.MENU_VIEW,
    PERMISSIONS.ORDER_VIEW_OWN,
    PERMISSIONS.ORDER_UPDATE_STATUS,
    PERMISSIONS.POS_ACCESS
  ]
}

/**
 * 권한 체크 훅
 * @param {Object} options 옵션
 */
export const usePermission = (options = {}) => {
  const {
    enableTimeBasedCheck = true,
    enableLocationCheck = false,
    onPermissionDenied,
    onPermissionGranted
  } = options

  const { user, isAuthenticated } = useAuth()
  const { t } = useAppTranslation()
  
  const [timeBasedPermissions, setTimeBasedPermissions] = useState({})
  const [locationBasedPermissions, setLocationBasedPermissions] = useState({})

  // 사용자의 모든 권한 계산
  const userPermissions = useMemo(() => {
    if (!user || !isAuthenticated) return []

    const permissions = new Set()

    // 명시적 권한 추가
    if (user.permissions) {
      const explicitPermissions = Array.isArray(user.permissions) 
        ? user.permissions 
        : Object.keys(user.permissions).filter(key => user.permissions[key])
        
      explicitPermissions.forEach(permission => permissions.add(permission))
    }

    // 역할 기반 권한 추가
    const userRole = user.role || user.roles?.[0]
    if (userRole && ROLE_PERMISSIONS[userRole]) {
      ROLE_PERMISSIONS[userRole].forEach(permission => permissions.add(permission))
    }

    return Array.from(permissions)
  }, [user, isAuthenticated])

  // 기본 권한 체크
  const hasPermission = useCallback((permission, options = {}) => {
    if (!isAuthenticated || !user) {
      onPermissionDenied?.(permission, 'NOT_AUTHENTICATED')
      return false
    }

    // 기본 권한 체크
    const hasBasicPermission = userPermissions.includes(permission)
    
    if (!hasBasicPermission) {
      onPermissionDenied?.(permission, 'NO_PERMISSION')
      return false
    }

    // 시간 기반 체크
    if (enableTimeBasedCheck && options.requireActiveHours) {
      const isWithinBusinessHours = checkBusinessHours()
      if (!isWithinBusinessHours) {
        onPermissionDenied?.(permission, 'OUTSIDE_BUSINESS_HOURS')
        return false
      }
    }

    // 위치 기반 체크
    if (enableLocationCheck && options.requireStoreLocation) {
      const isAtStore = checkStoreLocation()
      if (!isAtStore) {
        onPermissionDenied?.(permission, 'NOT_AT_STORE')
        return false
      }
    }

    onPermissionGranted?.(permission)
    return true
  }, [isAuthenticated, user, userPermissions, enableTimeBasedCheck, enableLocationCheck, onPermissionDenied, onPermissionGranted])

  // 다중 권한 체크
  const hasAnyPermission = useCallback((permissions) => {
    return permissions.some(permission => hasPermission(permission))
  }, [hasPermission])

  const hasAllPermissions = useCallback((permissions) => {
    return permissions.every(permission => hasPermission(permission))
  }, [hasPermission])

  // 역할 체크
  const hasRole = useCallback((role) => {
    if (!user) return false
    
    if (user.role === role) return true
    if (Array.isArray(user.roles) && user.roles.includes(role)) return true
    
    return false
  }, [user])

  // 영업 시간 체크
  const checkBusinessHours = useCallback(() => {
    if (!user?.storeSettings?.businessHours) return true

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = currentHour * 60 + currentMinute // 분 단위 변환
    const dayOfWeek = now.getDay() // 0: 일요일, 1: 월요일, ...

    const businessHours = user.storeSettings.businessHours
    const todayHours = businessHours[dayOfWeek] || businessHours.default

    if (!todayHours || !todayHours.isOpen) return false

    const [openHour, openMinute] = todayHours.open.split(':').map(Number)
    const [closeHour, closeMinute] = todayHours.close.split(':').map(Number)
    
    const openTime = openHour * 60 + openMinute
    const closeTime = closeHour * 60 + closeMinute

    // 자정 넘어가는 경우 처리
    if (closeTime < openTime) {
      return currentTime >= openTime || currentTime <= closeTime
    }

    return currentTime >= openTime && currentTime <= closeTime
  }, [user])

  // 위치 기반 체크 (가상 구현 - 실제로는 GPS/IP 기반)
  const checkStoreLocation = useCallback(() => {
    // TODO: 실제 위치 기반 구현
    // - GPS 좌표 비교
    // - IP 주소 기반 위치 확인
    // - 매장 반경 내 위치 확인
    return true // 임시로 항상 true 반환
  }, [])

  // Local 특화 비즈니스 권한 체크
  const canManageStore = useMemo(() => 
    hasPermission(PERMISSIONS.STORE_MANAGE), 
    [hasPermission]
  )

  const canViewFinancials = useMemo(() => 
    hasPermission(PERMISSIONS.FINANCE_VIEW_REVENUE), 
    [hasPermission]
  )

  const canManageMenu = useMemo(() => 
    hasAnyPermission([
      PERMISSIONS.MENU_CREATE,
      PERMISSIONS.MENU_UPDATE,
      PERMISSIONS.MENU_DELETE
    ]), 
    [hasAnyPermission]
  )

  const canManageOrders = useMemo(() => 
    hasAnyPermission([
      PERMISSIONS.ORDER_VIEW_ALL,
      PERMISSIONS.ORDER_UPDATE_STATUS,
      PERMISSIONS.ORDER_CANCEL
    ]), 
    [hasAnyPermission]
  )

  const canAccessPOS = useMemo(() => 
    hasPermission(PERMISSIONS.POS_ACCESS), 
    [hasPermission]
  )

  const canManageStaff = useMemo(() => 
    hasAnyPermission([
      PERMISSIONS.STAFF_CREATE,
      PERMISSIONS.STAFF_UPDATE,
      PERMISSIONS.STAFF_DELETE
    ]), 
    [hasAnyPermission]
  )

  const canManagePromotions = useMemo(() => 
    hasAnyPermission([
      PERMISSIONS.PROMOTION_CREATE,
      PERMISSIONS.PROMOTION_UPDATE,
      PERMISSIONS.PROMOTION_DELETE
    ]), 
    [hasAnyPermission]
  )

  // 권한 설명 가져오기
  const getPermissionDescription = useCallback((permission) => {
    const descriptions = {
      [PERMISSIONS.STORE_MANAGE]: t?.('permission.storeManage') || 'Quản lý cửa hàng',
      [PERMISSIONS.MENU_CREATE]: t?.('permission.menuCreate') || 'Tạo menu mới',
      [PERMISSIONS.ORDER_VIEW_ALL]: t?.('permission.orderViewAll') || 'Xem tất cả đơn hàng',
      [PERMISSIONS.STAFF_CREATE]: t?.('permission.staffCreate') || 'Tạo nhân viên mới',
      [PERMISSIONS.FINANCE_VIEW_REVENUE]: t?.('permission.financeRevenue') || 'Xem doanh thu',
      [PERMISSIONS.POS_ACCESS]: t?.('permission.posAccess') || 'Truy cập POS',
      // 더 많은 권한 설명 추가 가능
    }

    return descriptions[permission] || permission
  }, [t])

  // 권한 요약 정보
  const permissionSummary = useMemo(() => ({
    total: userPermissions.length,
    byCategory: {
      store: userPermissions.filter(p => p.startsWith('store:')).length,
      menu: userPermissions.filter(p => p.startsWith('menu:')).length,
      order: userPermissions.filter(p => p.startsWith('order:')).length,
      staff: userPermissions.filter(p => p.startsWith('staff:')).length,
      finance: userPermissions.filter(p => p.startsWith('finance:')).length,
      pos: userPermissions.filter(p => p.startsWith('pos:')).length
    },
    businessHours: enableTimeBasedCheck ? checkBusinessHours() : null,
    atStoreLocation: enableLocationCheck ? checkStoreLocation() : null
  }), [userPermissions, enableTimeBasedCheck, enableLocationCheck, checkBusinessHours, checkStoreLocation])

  return {
    // 기본 권한 체크
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    
    // Local 비즈니스 권한
    canManageStore,
    canViewFinancials,
    canManageMenu,
    canManageOrders,
    canAccessPOS,
    canManageStaff,
    canManagePromotions,
    
    // 조건부 체크
    checkBusinessHours,
    checkStoreLocation,
    
    // 데이터
    userPermissions,
    permissionSummary,
    
    // 유틸리티
    getPermissionDescription,
    
    // 상수
    PERMISSIONS,
    ROLE_PERMISSIONS,
    
    // Local어 라벨
    labels: {
      permitted: t?.('permission.permitted') || 'Có quyền',
      denied: t?.('permission.denied') || 'Không có quyền',
      outsideHours: t?.('permission.outsideHours') || 'Ngoài giờ làm việc',
      notAtStore: t?.('permission.notAtStore') || 'Không ở cửa hàng',
      insufficientRole: t?.('permission.insufficientRole') || 'Vai trò không đủ quyền'
    }
  }
}

/**
 * 권한 가드 컴포넌트용 훅
 */
export const usePermissionGuard = (requiredPermissions = [], options = {}) => {
  const { requireAll = false, fallbackComponent = null } = options
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermission()

  const isAllowed = useMemo(() => {
    if (requireAll) {
      return hasAllPermissions(requiredPermissions)
    } else {
      return hasAnyPermission(requiredPermissions)
    }
  }, [requiredPermissions, requireAll, hasAllPermissions, hasAnyPermission])

  const checkPermission = useCallback((permission) => {
    return hasPermission(permission, options)
  }, [hasPermission, options])

  return {
    isAllowed,
    checkPermission,
    fallbackComponent
  }
}

export default usePermission