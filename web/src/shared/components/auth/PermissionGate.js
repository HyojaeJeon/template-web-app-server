/**
 * PermissionGate 컴포넌트
 * Local 배달 앱 MVP - 권한 기반 컴포넌트 렌더링 제어
 * WCAG 2.1 준수 접근성 고려
 */

import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

/**
 * 권한 게이트 컴포넌트
 * 사용자 권한에 따라 자식 컴포넌트의 렌더링을 제어
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {React.ReactNode} props.children - 보호할 자식 컴포넌트
 * @param {string|string[]} props.permissions - 필요한 권한(들)
 * @param {string|string[]} props.roles - 필요한 역할(들)
 * @param {boolean} props.requireAll - 모든 권한/역할 필요 여부 (기본값: false)
 * @param {boolean} props.allowInheritance - 역할 상속 허용 여부 (기본값: true)
 * @param {React.ReactNode} props.fallback - 권한이 없을 때 표시할 컴포넌트
 * @param {Function} props.onAccessDenied - 접근 거부 시 콜백
 * @param {boolean} props.showFallback - 권한 없을 때 fallback 표시 여부 (기본값: false)
 * @returns {React.ReactNode} 조건부 렌더링된 컴포넌트
 */
export function PermissionGate({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  allowInheritance = true,
  fallback = null,
  onAccessDenied,
  showFallback = false
}) {
  const permissionUtils = usePermissions();

  // 권한 및 역할 확인
  const hasAccess = React.useMemo(() => {
    // 인증되지 않은 경우
    if (!permissionUtils.currentUser.isAuthenticated) {
      return false;
    }

    // 권한 배열이 아닌 경우 배열로 변환
    const permArray = Array.isArray(permissions) ? permissions : 
      (permissions ? [permissions] : []);
    const roleArray = Array.isArray(roles) ? roles : 
      (roles ? [roles] : []);

    // 권한 확인
    let permissionCheck = true;
    if (permArray.length > 0) {
      permissionCheck = requireAll ?
        permissionUtils.hasAllPermissions(permArray) :
        permissionUtils.hasAnyPermission(permArray);
    }

    // 역할 확인
    let roleCheck = true;
    if (roleArray.length > 0) {
      if (allowInheritance) {
        roleCheck = roleArray.some(role => permissionUtils.canInheritRole(role));
      } else {
        roleCheck = permissionUtils.hasAnyRole(roleArray);
      }
    }

    return permissionCheck && roleCheck;
  }, [
    permissions, 
    roles, 
    requireAll, 
    allowInheritance, 
    permissionUtils
  ]);

  // 접근 거부 시 콜백 실행
  React.useEffect(() => {
    if (!hasAccess && onAccessDenied) {
      onAccessDenied({
        permissions,
        roles,
        userRole: permissionUtils.currentUser.role,
        userPermissions: permissionUtils.currentUser.permissions
      });
    }
  }, [hasAccess, onAccessDenied, permissions, roles, permissionUtils.currentUser]);

  // 접근 권한이 있는 경우 자식 컴포넌트 렌더링
  if (hasAccess) {
    return children;
  }

  // 접근 권한이 없고 fallback을 표시하는 경우
  if (showFallback && fallback) {
    return fallback;
  }

  // 접근 권한이 없는 경우 기본 메시지 표시
  if (!hasAccess && !showFallback) {
    return (
      <div role="alert" className="text-red-500 text-sm">
        권한이 없습니다.
      </div>
    );
  }

  // 접근 권한이 없는 경우 null 반환 (아무것도 렌더링하지 않음)
  return null;
}

/**
 * 인라인 권한 확인 컴포넌트
 * 간단한 권한 확인을 위한 경량 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.permission - 확인할 권한
 * @param {React.ReactNode} props.children - 자식 컴포넌트
 * @returns {React.ReactNode} 조건부 렌더링된 컴포넌트
 */
export function Can({ permission, children }) {
  const { can } = usePermissions();
  return can(permission) ? children : null;
}

/**
 * 여러 권한 중 하나라도 있으면 표시하는 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {string[]} props.permissions - 확인할 권한들
 * @param {React.ReactNode} props.children - 자식 컴포넌트
 * @returns {React.ReactNode} 조건부 렌더링된 컴포넌트
 */
export function CanAny({ permissions, children }) {
  const { canAny } = usePermissions();
  return canAny(permissions) ? children : null;
}

/**
 * 모든 권한이 있어야 표시하는 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {string[]} props.permissions - 확인할 권한들
 * @param {React.ReactNode} props.children - 자식 컴포넌트
 * @returns {React.ReactNode} 조건부 렌더링된 컴포넌트
 */
export function CanAll({ permissions, children }) {
  const { canAll } = usePermissions();
  return canAll(permissions) ? children : null;
}

/**
 * 특정 기능에 대한 접근 권한 확인 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.feature - 기능 이름
 * @param {React.ReactNode} props.children - 자식 컴포넌트
 * @param {React.ReactNode} props.fallback - 권한 없을 때 표시할 컴포넌트
 * @returns {React.ReactNode} 조건부 렌더링된 컴포넌트
 */
export function FeatureGate({ feature, children, fallback = null }) {
  const { canAccessFeature } = usePermissions();
  
  if (canAccessFeature(feature)) {
    return children;
  }
  
  return fallback;
}

/**
 * 관리자 전용 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {React.ReactNode} props.children - 자식 컴포넌트
 * @param {React.ReactNode} props.fallback - 권한 없을 때 표시할 컴포넌트
 * @returns {React.ReactNode} 조건부 렌더링된 컴포넌트
 */
export function AdminOnly({ children, fallback = null }) {
  const { isAdmin } = usePermissions();
  return isAdmin() ? children : fallback;
}

/**
 * 접근 거부 메시지 컴포넌트
 * WCAG 2.1 준수 접근성 고려
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.message - 표시할 메시지
 * @param {string} props.language - 언어 설정 (vi, ko, en)
 * @param {Function} props.onContactAdmin - 관리자 연락 콜백
 * @returns {React.ReactNode} 접근 거부 메시지 컴포넌트
 */
export function AccessDeniedMessage({ 
  message, 
  language = 'vi',
  onContactAdmin 
}) {
  const defaultMessages = {
    vi: 'Bạn không có quyền truy cập chức năng này.',
    ko: '이 기능에 접근할 권한이 없습니다.',
    en: 'You do not have permission to access this feature.'
  };

  const contactMessages = {
    vi: 'Liên hệ quản trị viên để được hỗ trợ',
    ko: '지원이 필요하시면 관리자에게 문의하세요',
    en: 'Contact administrator for assistance'
  };

  return (
    <div
      role="alert"
      className="bg-vietnam-error-pale border border-vietnam-error-light rounded-lg p-4"
      aria-live="polite"
    >
      <div className="flex items-center space-x-2 mb-2">
        <svg 
          className="w-5 h-5 text-vietnam-error" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path 
            fillRule="evenodd" 
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
            clipRule="evenodd" 
          />
        </svg>
        <h3 className="text-sm font-medium text-vietnam-error">
          {language === 'vi' ? 'Truy cập bị từ chối' : 
           language === 'ko' ? '접근 거부' : 
           'Access Denied'}
        </h3>
      </div>
      
      <p className="text-sm text-gray-700 mb-3">
        {message || defaultMessages[language]}
      </p>
      
      {onContactAdmin && (
        <button
          onClick={onContactAdmin}
          className="text-sm text-vietnam-mint hover:text-vietnam-mint-dark underline focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-2 rounded"
          aria-label={contactMessages[language]}
        >
          {contactMessages[language]}
        </button>
      )}
    </div>
  );
}

/**
 * 권한 디버깅 컴포넌트 (개발 환경에서만 사용)
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {boolean} props.show - 표시 여부
 * @returns {React.ReactNode} 디버깅 정보 컴포넌트
 */
export function PermissionDebugger({ show = false }) {
  const permissions = usePermissions();
  
  if (!show || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h4 className="font-medium text-sm mb-2">Permission Debug</h4>
      <div className="text-xs space-y-1">
        <p><strong>Role:</strong> {permissions.currentUser.role || 'None'}</p>
        <p><strong>Authenticated:</strong> {permissions.currentUser.isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>Permissions:</strong> {permissions.currentUser.permissions.length}</p>
        <details className="mt-2">
          <summary className="cursor-pointer text-vietnam-mint">View Details</summary>
          <pre className="mt-1 text-xs overflow-auto max-h-32">
            {JSON.stringify(permissions.debugInfo, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

/**
 * Higher-Order Component로 권한 검사 적용
 * 
 * @param {React.ComponentType} Component - 래핑할 컴포넌트
 * @param {Object} permissions - 권한 설정
 * @returns {React.ComponentType} 권한이 적용된 컴포넌트
 */
export function withPermissions(Component, permissionConfig) {
  return function PermissionWrappedComponent(props) {
    return (
      <PermissionGate {...permissionConfig}>
        <Component {...props} />
      </PermissionGate>
    );
  };
}

// 기본 내보내기
export default PermissionGate;