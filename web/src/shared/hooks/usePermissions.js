/**
 * 권한 검사 훅 (usePermissions)
 * Local 배달 앱 MVP - 컴포넌트에서 사용하는 권한 검사 훅
 * Redux 상태와 연동된 실시간 권한 검사
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  selectPermissions, 
  selectUserRole, 
  selectIsAuthenticated,
  selectHasPermission as selectHasPermissionSelector,
  selectHasRole as selectHasRoleSelector,
  selectCanAccess as selectCanAccessSelector
} from '../../store/slices/authSlice';
import { 
  hasPermission, 
  hasAllPermissions, 
  hasAnyPermission,
  getDefaultPermissionsForRole,
  checkPermissionDependencies
} from '../constants/permissions';
import { 
  isHigherRole, 
  canInheritRole,
  isAdminRole,
  hasFinancialAccess,
  hasPosAccess
} from '../constants/userRoles';

/**
 * 권한 검사 훅
 * @returns {Object} 권한 검사 관련 함수와 상태
 */
export function usePermissions() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);
  const permissions = useSelector(selectPermissions);

  // 기본 권한 검사 함수들
  const permissionUtils = useMemo(() => ({
    /**
     * 단일 권한 확인
     * @param {string} permission - 확인할 권한
     * @returns {boolean} 권한 보유 여부
     */
    hasPermission: (permission) => {
      if (!isAuthenticated || !permissions) return false;
      return hasPermission(permissions, permission);
    },

    /**
     * 모든 권한 확인 (AND 조건)
     * @param {string[]} requiredPermissions - 필요한 권한 배열
     * @returns {boolean} 모든 권한 보유 여부
     */
    hasAllPermissions: (requiredPermissions) => {
      if (!isAuthenticated || !permissions) return false;
      return hasAllPermissions(permissions, requiredPermissions);
    },

    /**
     * 권한 중 하나라도 확인 (OR 조건)
     * @param {string[]} requiredPermissions - 필요한 권한 배열
     * @returns {boolean} 권한 보유 여부
     */
    hasAnyPermission: (requiredPermissions) => {
      if (!isAuthenticated || !permissions) return false;
      return hasAnyPermission(permissions, requiredPermissions);
    },

    /**
     * 역할 확인
     * @param {string} role - 확인할 역할
     * @returns {boolean} 역할 일치 여부
     */
    hasRole: (role) => {
      if (!isAuthenticated || !userRole) return false;
      return userRole === role;
    },

    /**
     * 여러 역할 중 하나 확인
     * @param {string[]} roles - 확인할 역할 배열
     * @returns {boolean} 역할 포함 여부
     */
    hasAnyRole: (roles) => {
      if (!isAuthenticated || !userRole) return false;
      return Array.isArray(roles) && roles.includes(userRole);
    },

    /**
     * 상위 역할 확인 (권한 상속)
     * @param {string} requiredRole - 필요한 역할
     * @returns {boolean} 상위 역할 여부
     */
    isHigherRole: (requiredRole) => {
      if (!isAuthenticated || !userRole) return false;
      return isHigherRole(userRole, requiredRole);
    },

    /**
     * 역할 상속 가능 여부 (동등 이상 역할)
     * @param {string} requiredRole - 필요한 역할
     * @returns {boolean} 상속 가능 여부
     */
    canInheritRole: (requiredRole) => {
      if (!isAuthenticated || !userRole) return false;
      return canInheritRole(userRole, requiredRole);
    },

    /**
     * 관리자 권한 확인
     * @returns {boolean} 관리자 권한 여부
     */
    isAdmin: () => {
      if (!isAuthenticated || !userRole) return false;
      return isAdminRole(userRole);
    },

    /**
     * 재무 정보 접근 권한 확인
     * @returns {boolean} 재무 접근 권한 여부
     */
    hasFinancialAccess: () => {
      if (!isAuthenticated || !userRole) return false;
      return hasFinancialAccess(userRole);
    },

    /**
     * POS 접근 권한 확인
     * @returns {boolean} POS 접근 권한 여부
     */
    hasPosAccess: () => {
      if (!isAuthenticated || !userRole) return false;
      return hasPosAccess(userRole);
    },

    /**
     * 권한 의존성 확인
     * @param {string} permission - 확인할 권한
     * @returns {boolean} 의존성 충족 여부
     */
    checkDependencies: (permission) => {
      if (!isAuthenticated || !permissions) return false;
      return checkPermissionDependencies(permission, permissions);
    },

    /**
     * 조건부 권한 확인 (복합 조건)
     * @param {Object} conditions - 조건 객체
     * @param {string[]} conditions.permissions - 필요한 권한들
     * @param {string[]} conditions.roles - 필요한 역할들
     * @param {boolean} conditions.requireAll - 모든 조건 필요 여부
     * @returns {boolean} 조건 충족 여부
     */
    checkConditions: ({ permissions: reqPermissions = [], roles = [], requireAll = false }) => {
      if (!isAuthenticated) return false;

      const permissionCheck = reqPermissions.length === 0 || 
        (requireAll ? 
          hasAllPermissions(permissions, reqPermissions) : 
          hasAnyPermission(permissions, reqPermissions)
        );

      const roleCheck = roles.length === 0 || 
        roles.some(role => canInheritRole(userRole, role));

      return permissionCheck && roleCheck;
    }

  }), [isAuthenticated, userRole, permissions]);

  // 현재 사용자 정보
  const currentUser = useMemo(() => ({
    isAuthenticated,
    role: userRole,
    permissions: permissions || [],
    isAdmin: permissionUtils.isAdmin(),
    hasFinancialAccess: permissionUtils.hasFinancialAccess(),
    hasPosAccess: permissionUtils.hasPosAccess()
  }), [isAuthenticated, userRole, permissions, permissionUtils]);

  // 권한별 접근 가능 기능 매핑
  const accessibleFeatures = useMemo(() => {
    if (!isAuthenticated || !permissions) {
      return {
        dashboard: false,
        orders: false,
        menu: false,
        pos: false,
        customers: false,
        analytics: false,
        settings: false,
        staff: false
      };
    }

    return {
      dashboard: permissionUtils.hasAnyPermission(['dashboard.view', 'dashboard.analytics']),
      orders: permissionUtils.hasAnyPermission(['orders.view', 'orders.create', 'orders.edit']),
      menu: permissionUtils.hasAnyPermission(['menu.view', 'menu.create', 'menu.edit']),
      pos: permissionUtils.hasAnyPermission(['pos.access', 'pos.process_order']),
      customers: permissionUtils.hasAnyPermission(['customers.view', 'customers.edit']),
      analytics: permissionUtils.hasAnyPermission(['analytics.view', 'analytics.sales']),
      settings: permissionUtils.hasAnyPermission(['settings.view', 'settings.general']),
      staff: permissionUtils.hasAnyPermission(['staff.view', 'staff.create']),
      inventory: permissionUtils.hasAnyPermission(['inventory.view', 'inventory.create']),
      promotions: permissionUtils.hasAnyPermission(['promotions.view', 'promotions.create']),
      delivery: permissionUtils.hasAnyPermission(['delivery.view', 'delivery.assign']),
      payments: permissionUtils.hasAnyPermission(['payments.view', 'payments.process'])
    };
  }, [isAuthenticated, permissions, permissionUtils]);

  // 디버깅용 정보
  const debugInfo = useMemo(() => ({
    isAuthenticated,
    userRole,
    permissions,
    permissionCount: permissions?.length || 0,
    accessibleFeaturesCount: Object.values(accessibleFeatures).filter(Boolean).length
  }), [isAuthenticated, userRole, permissions, accessibleFeatures]);

  return {
    // 기본 검사 함수들
    ...permissionUtils,
    
    // 사용자 정보
    currentUser,
    
    // 접근 가능 기능
    accessibleFeatures,
    
    // 편의성 함수들
    can: permissionUtils.hasPermission,
    canAll: permissionUtils.hasAllPermissions,
    canAny: permissionUtils.hasAnyPermission,
    is: permissionUtils.hasRole,
    isAnyOf: permissionUtils.hasAnyRole,
    canAccessFeature: (feature) => accessibleFeatures[feature] || false,
    
    // 디버깅
    debugInfo,
    
    // 원시 데이터 접근
    raw: {
      isAuthenticated,
      userRole,
      permissions
    }
  };
}

/**
 * 특정 권한에 대한 간단한 확인 훅
 * @param {string|string[]} requiredPermissions - 필요한 권한(들)
 * @param {Object} options - 옵션
 * @param {boolean} options.requireAll - 모든 권한 필요 여부 (배열인 경우)
 * @returns {boolean} 권한 보유 여부
 */
export function useHasPermission(requiredPermissions, { requireAll = false } = {}) {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();

  return useMemo(() => {
    if (!requiredPermissions) return true;
    
    if (Array.isArray(requiredPermissions)) {
      return requireAll ? 
        hasAllPermissions(requiredPermissions) : 
        hasAnyPermission(requiredPermissions);
    }
    
    return hasPermission(requiredPermissions);
  }, [requiredPermissions, requireAll, hasPermission, hasAllPermissions, hasAnyPermission]);
}

/**
 * 특정 역할에 대한 간단한 확인 훅
 * @param {string|string[]} requiredRoles - 필요한 역할(들)
 * @param {Object} options - 옵션
 * @param {boolean} options.allowInheritance - 역할 상속 허용 여부
 * @returns {boolean} 역할 보유 여부
 */
export function useHasRole(requiredRoles, { allowInheritance = true } = {}) {
  const { hasRole, hasAnyRole, canInheritRole } = usePermissions();

  return useMemo(() => {
    if (!requiredRoles) return true;
    
    if (Array.isArray(requiredRoles)) {
      if (allowInheritance) {
        return requiredRoles.some(role => canInheritRole(role));
      }
      return hasAnyRole(requiredRoles);
    }
    
    if (allowInheritance) {
      return canInheritRole(requiredRoles);
    }
    
    return hasRole(requiredRoles);
  }, [requiredRoles, allowInheritance, hasRole, hasAnyRole, canInheritRole]);
}

/**
 * 기능별 접근 권한 확인 훅
 * @param {string} feature - 기능 이름
 * @returns {boolean} 기능 접근 권한 여부
 */
export function useCanAccessFeature(feature) {
  const { canAccessFeature } = usePermissions();
  return useMemo(() => canAccessFeature(feature), [feature, canAccessFeature]);
}

/**
 * 권한 기반 라우팅 훅
 * @param {string} route - 라우트 경로
 * @returns {Object} 라우팅 정보
 */
export function usePermissionRoute(route) {
  const permissions = usePermissions();

  // 라우트별 필요 권한 매핑
  const routePermissions = useMemo(() => ({
    '/dashboard': ['dashboard.view'],
    '/orders': ['orders.view'],
    '/menu': ['menu.view'],
    '/pos': ['pos.access'],
    '/customers': ['customers.view'],
    '/analytics': ['analytics.view'],
    '/settings': ['settings.view'],
    '/staff': ['staff.view'],
    // 추가 라우트...
  }), []);

  const requiredPermissions = routePermissions[route] || [];
  const canAccess = requiredPermissions.length === 0 || 
    permissions.hasAnyPermission(requiredPermissions);

  return {
    canAccess,
    requiredPermissions,
    redirectTo: canAccess ? null : '/unauthorized'
  };
}

export default usePermissions;