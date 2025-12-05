/**
 * RoleGate 컴포넌트
 * Local 배달 앱 MVP - 역할 기반 컴포넌트 렌더링 제어
 * Local 음식점 운영 구조에 특화된 역할 관리
 */

import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { USER_ROLES, getRoleDisplayName } from '../constants/userRoles';

/**
 * 역할 게이트 컴포넌트
 * 사용자 역할에 따라 자식 컴포넌트의 렌더링을 제어
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {React.ReactNode} props.children - 보호할 자식 컴포넌트
 * @param {string|string[]} props.roles - 필요한 역할(들)
 * @param {boolean} props.allowInheritance - 역할 상속 허용 여부 (기본값: true)
 * @param {boolean} props.requireAll - 모든 역할 필요 여부 (기본값: false)
 * @param {React.ReactNode} props.fallback - 권한이 없을 때 표시할 컴포넌트
 * @param {Function} props.onAccessDenied - 접근 거부 시 콜백
 * @param {boolean} props.showFallback - 권한 없을 때 fallback 표시 여부
 * @param {string} props.language - 표시 언어 (vi, ko, en)
 * @returns {React.ReactNode} 조건부 렌더링된 컴포넌트
 */
export function RoleGate({
  children,
  roles,
  allowInheritance = true,
  requireAll = false,
  fallback = null,
  onAccessDenied,
  showFallback = false,
  language = 'vi'
}) {
  const permissionUtils = usePermissions();

  // 역할 확인 로직
  const hasAccess = React.useMemo(() => {
    // 인증되지 않은 경우
    if (!permissionUtils.currentUser.isAuthenticated) {
      return false;
    }

    // 역할이 지정되지 않은 경우 인증된 사용자는 모두 접근 허용
    if (!roles) {
      return true;
    }

    // 역할 배열로 변환
    const roleArray = Array.isArray(roles) ? roles : [roles];

    if (requireAll) {
      // 모든 역할 필요
      return roleArray.every(role => 
        allowInheritance ? 
          permissionUtils.canInheritRole(role) : 
          permissionUtils.hasRole(role)
      );
    } else {
      // 하나의 역할만 필요 (기본값)
      return roleArray.some(role => 
        allowInheritance ? 
          permissionUtils.canInheritRole(role) : 
          permissionUtils.hasRole(role)
      );
    }
  }, [roles, allowInheritance, requireAll, permissionUtils]);

  // 접근 거부 시 콜백 실행
  React.useEffect(() => {
    if (!hasAccess && onAccessDenied) {
      onAccessDenied({
        requiredRoles: roles,
        userRole: permissionUtils.currentUser.role,
        allowInheritance,
        requireAll
      });
    }
  }, [hasAccess, onAccessDenied, roles, permissionUtils.currentUser.role, allowInheritance, requireAll]);

  // 접근 권한이 있는 경우 자식 컴포넌트 렌더링
  if (hasAccess) {
    return children;
  }

  // 접근 권한이 없고 fallback을 표시하는 경우
  if (showFallback && fallback) {
    return fallback;
  }

  // 접근 권한이 없는 경우 null 반환
  return null;
}

/**
 * 관리층 전용 컴포넌트
 * (사장, 매장관리자, 시스템관리자)
 */
export function ManagementOnly({ children, fallback = null }) {
  return (
    <RoleGate 
      roles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.STORE_OWNER, USER_ROLES.STORE_MANAGER]}
      allowInheritance={true}
      showFallback={!!fallback}
      fallback={fallback}
    >
      {children}
    </RoleGate>
  );
}

/**
 * 매장 소유자 전용 컴포넌트
 */
export function OwnerOnly({ children, fallback = null }) {
  return (
    <RoleGate 
      roles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.STORE_OWNER]}
      allowInheritance={true}
      showFallback={!!fallback}
      fallback={fallback}
    >
      {children}
    </RoleGate>
  );
}

/**
 * 주방 관련 직원 전용 컴포넌트
 */
export function KitchenStaffOnly({ children, fallback = null }) {
  return (
    <RoleGate 
      roles={[
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.STORE_OWNER, 
        USER_ROLES.STORE_MANAGER,
        USER_ROLES.KITCHEN_MANAGER, 
        USER_ROLES.CHEF
      ]}
      allowInheritance={true}
      showFallback={!!fallback}
      fallback={fallback}
    >
      {children}
    </RoleGate>
  );
}

/**
 * POS 접근 권한이 있는 직원 전용
 */
export function PosAccessOnly({ children, fallback = null }) {
  const { hasPosAccess } = usePermissions();
  
  if (hasPosAccess()) {
    return children;
  }
  
  return fallback;
}

/**
 * 재무 정보 접근 권한이 있는 직원 전용
 */
export function FinancialAccessOnly({ children, fallback = null }) {
  const { hasFinancialAccess } = usePermissions();
  
  if (hasFinancialAccess()) {
    return children;
  }
  
  return fallback;
}

/**
 * 특정 역할 제외 컴포넌트
 * 지정된 역할을 제외한 모든 사용자에게 표시
 */
export function ExceptRole({ excludeRoles, children, fallback = null }) {
  const { currentUser } = usePermissions();
  
  const excludeArray = Array.isArray(excludeRoles) ? excludeRoles : [excludeRoles];
  const shouldShow = !excludeArray.includes(currentUser.role);
  
  return shouldShow ? children : fallback;
}

/**
 * 최소 역할 레벨 컴포넌트
 * 지정된 역할보다 같거나 높은 레벨의 사용자에게만 표시
 */
export function MinimumRole({ minimumRole, children, fallback = null }) {
  const { canInheritRole } = usePermissions();
  
  if (canInheritRole(minimumRole)) {
    return children;
  }
  
  return fallback;
}

/**
 * 역할 표시 컴포넌트
 * 현재 사용자의 역할을 표시
 */
export function RoleDisplay({ 
  language = 'vi', 
  showBadge = false, 
  className = '',
  onRoleClick
}) {
  const { currentUser } = usePermissions();
  
  if (!currentUser.isAuthenticated || !currentUser.role) {
    return null;
  }

  const displayName = getRoleDisplayName(currentUser.role, language);
  
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case USER_ROLES.SUPER_ADMIN:
        return 'bg-purple-100 text-purple-800';
      case USER_ROLES.STORE_OWNER:
        return 'bg-gold-100 text-gold-800';
      case USER_ROLES.STORE_MANAGER:
        return 'bg-blue-100 text-blue-800';
      case USER_ROLES.KITCHEN_MANAGER:
        return 'bg-orange-100 text-orange-800';
      case USER_ROLES.CHEF:
        return 'bg-red-100 text-red-800';
      case USER_ROLES.CASHIER:
        return 'bg-green-100 text-green-800';
      case USER_ROLES.SERVER:
        return 'bg-indigo-100 text-indigo-800';
      case USER_ROLES.DELIVERY_MANAGER:
        return 'bg-yellow-100 text-yellow-800';
      case USER_ROLES.INVENTORY_MANAGER:
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (showBadge) {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(currentUser.role)} ${className}`}
        onClick={onRoleClick}
        role={onRoleClick ? 'button' : undefined}
        tabIndex={onRoleClick ? 0 : undefined}
        onKeyDown={onRoleClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onRoleClick();
          }
        } : undefined}
      >
        {displayName}
      </span>
    );
  }

  return (
    <span 
      className={className}
      onClick={onRoleClick}
      role={onRoleClick ? 'button' : undefined}
      tabIndex={onRoleClick ? 0 : undefined}
      onKeyDown={onRoleClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onRoleClick();
        }
      } : undefined}
    >
      {displayName}
    </span>
  );
}

/**
 * 역할 기반 메뉴 항목 컴포넌트
 * 사용자 역할에 따라 메뉴 항목을 조건부로 표시
 */
export function RoleBasedMenuItem({ 
  roles, 
  allowInheritance = true,
  children,
  icon,
  label,
  href,
  onClick,
  className = '',
  language = 'vi'
}) {
  return (
    <RoleGate roles={roles} allowInheritance={allowInheritance}>
      {href ? (
        <a 
          href={href}
          className={`flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
          onClick={onClick}
        >
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {label && <span>{label}</span>}
          {children}
        </a>
      ) : (
        <button
          className={`flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors w-full text-left ${className}`}
          onClick={onClick}
        >
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {label && <span>{label}</span>}
          {children}
        </button>
      )}
    </RoleGate>
  );
}

/**
 * 조건부 역할 컴포넌트
 * 복잡한 역할 조건을 처리
 */
export function ConditionalRole({
  condition,
  children,
  fallback = null
}) {
  const permissionUtils = usePermissions();
  
  const shouldShow = React.useMemo(() => {
    if (typeof condition === 'function') {
      return condition(permissionUtils);
    }
    return condition;
  }, [condition, permissionUtils]);
  
  return shouldShow ? children : fallback;
}

/**
 * Higher-Order Component로 역할 검사 적용
 */
export function withRoles(Component, roleConfig) {
  return function RoleWrappedComponent(props) {
    return (
      <RoleGate {...roleConfig}>
        <Component {...props} />
      </RoleGate>
    );
  };
}

// 기본 내보내기
export default RoleGate;