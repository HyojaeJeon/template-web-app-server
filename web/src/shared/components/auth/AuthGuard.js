/**
 * AuthGuard 컴포넌트
 * Local 배달 앱 MVP - 라우팅 레벨 인증 및 권한 보호
 * Next.js 13+ App Router와 완전 호환
 */

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { 
  selectIsAuthenticated, 
  selectIsLoading, 
  selectUser, 
  selectAuthError,
  setUser
} from '@store/slices/authSlice';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';
import { USER_ROLES } from '../constants/userRoles';

// 로딩 스피너 컴포넌트
const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div 
    className="flex items-center justify-center min-h-screen bg-gradient-to-br from-vietnam-mint-pale to-vietnam-green-pale"
    role="status"
    aria-label={message}
  >
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vietnam-mint mx-auto mb-4"></div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  </div>
);

// 접근 거부 페이지 컴포넌트
const AccessDeniedPage = ({ 
  reason = 'permission_denied',
  requiredPermissions = [],
  requiredRoles = [],
  onRetry,
  onContactAdmin,
  language = 'vi'
}) => {
  const messages = {
    unauthorized: {
      vi: {
        title: 'Yêu cầu đăng nhập',
        message: 'Vui lòng đăng nhập để truy cập trang này.',
        action: 'Đăng nhập'
      },
      ko: {
        title: '로그인 필요',
        message: '이 페이지에 접근하려면 로그인이 필요합니다.',
        action: '로그인'
      },
      en: {
        title: 'Login Required',
        message: 'Please log in to access this page.',
        action: 'Log In'
      }
    },
    permission_denied: {
      vi: {
        title: 'Truy cập bị từ chối',
        message: 'Bạn không có quyền truy cập trang này.',
        action: 'Liên hệ quản trị viên'
      },
      ko: {
        title: '접근 거부',
        message: '이 페이지에 접근할 권한이 없습니다.',
        action: '관리자에게 문의'
      },
      en: {
        title: 'Access Denied',
        message: 'You do not have permission to access this page.',
        action: 'Contact Administrator'
      }
    }
  };

  const content = messages[reason]?.[language] || messages.permission_denied.vi;

  return (
    <div className="min-h-screen bg-gradient-to-br from-vietnam-mint-pale to-vietnam-green-pale flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-vietnam-error-light rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 mb-4">{content.title}</h1>
        <p className="text-gray-600 mb-6">{content.message}</p>
        
        {requiredPermissions.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">Required Permissions:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              {requiredPermissions.map(permission => (
                <li key={permission} className="font-mono">{permission}</li>
              ))}
            </ul>
          </div>
        )}

        {requiredRoles.length > 0 && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">Required Roles:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              {requiredRoles.map(role => (
                <li key={role} className="font-mono">{role}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="space-y-3">
          {reason === 'unauthorized' ? (
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-vietnam-mint text-white py-2 px-4 rounded-lg hover:bg-vietnam-mint-dark transition-colors focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-2"
            >
              {content.action}
            </button>
          ) : (
            <>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="w-full bg-vietnam-mint text-white py-2 px-4 rounded-lg hover:bg-vietnam-mint-dark transition-colors focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-2"
                >
                  다시 시도
                </button>
              )}
              {onContactAdmin && (
                <button
                  onClick={onContactAdmin}
                  className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  {content.action}
                </button>
              )}
            </>
          )}
          
          <button
            onClick={() => window.history.back()}
            className="w-full text-gray-500 hover:text-gray-700 py-2 focus:outline-none"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 라우트별 권한 설정
 */
const ROUTE_PERMISSIONS = {
  // 대시보드
  '/dashboard': {
    permissions: [PERMISSIONS.DASHBOARD.VIEW],
    roles: [],
    requireAuth: true,
    exact: true
  },
  
  // 주문 관리
  '/orders': {
    permissions: [PERMISSIONS.ORDERS.VIEW],
    roles: [],
    requireAuth: true,
    exact: false
  },
  '/orders/create': {
    permissions: [PERMISSIONS.ORDERS.CREATE],
    roles: [],
    requireAuth: true,
    exact: true
  },
  
  // 메뉴 관리
  '/menu': {
    permissions: [PERMISSIONS.MENU.VIEW],
    roles: [],
    requireAuth: true,
    exact: false
  },
  '/menu/create': {
    permissions: [PERMISSIONS.MENU.CREATE],
    roles: [],
    requireAuth: true,
    exact: true
  },
  
  // POS 시스템
  '/pos': {
    permissions: [PERMISSIONS.POS.ACCESS],
    roles: [],
    requireAuth: true,
    exact: false
  },
  
  // 고객 관리
  '/customers': {
    permissions: [PERMISSIONS.CUSTOMERS.VIEW],
    roles: [],
    requireAuth: true,
    exact: false
  },
  
  // 분석 및 리포트
  '/analytics': {
    permissions: [PERMISSIONS.ANALYTICS.VIEW],
    roles: [],
    requireAuth: true,
    exact: false
  },
  '/analytics/financial': {
    permissions: [PERMISSIONS.ANALYTICS.FINANCIAL],
    roles: [USER_ROLES.STORE_OWNER, USER_ROLES.STORE_MANAGER],
    requireAuth: true,
    exact: true
  },
  
  // 직원 관리
  '/staff': {
    permissions: [PERMISSIONS.STAFF.VIEW],
    roles: [USER_ROLES.STORE_OWNER, USER_ROLES.STORE_MANAGER],
    requireAuth: true,
    exact: false
  },
  
  // 설정
  '/settings': {
    permissions: [PERMISSIONS.SETTINGS.VIEW],
    roles: [USER_ROLES.STORE_OWNER, USER_ROLES.STORE_MANAGER],
    requireAuth: true,
    exact: false
  },
  '/settings/security': {
    permissions: [PERMISSIONS.SETTINGS.SECURITY],
    roles: [USER_ROLES.STORE_OWNER],
    requireAuth: true,
    exact: true
  },
  
  // 공개 페이지 (인증 불필요)
  '/login': {
    permissions: [],
    roles: [],
    requireAuth: false,
    exact: true,
    redirectIfAuthenticated: '/dashboard'
  },
  '/': {
    permissions: [],
    roles: [],
    requireAuth: false,
    exact: true,
    redirectIfAuthenticated: '/dashboard'
  }
};

/**
 * AuthGuard 메인 컴포넌트
 */
export function AuthGuard({ 
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireAuth = true,
  fallback = null,
  loadingComponent = null,
  onAccessDenied,
  language = 'vi'
}) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);
  const user = useSelector(selectUser);
  const authError = useSelector(selectAuthError);
  
  const permissions = usePermissions();
  const [isInitialized, setIsInitialized] = useState(false);
  const [accessDeniedReason, setAccessDeniedReason] = useState(null);

  // 초기 인증 상태 확인 - providers.js의 UnifiedAuthInitializer에서 통합 처리됨
  useEffect(() => {
    // 초기화 완료 표시만 함 (사용자 정보 로드는 UnifiedAuthInitializer에서 처리)
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // 라우트별 권한 확인
  const routeConfig = React.useMemo(() => {
    // 정확한 경로 매칭 우선
    const exactMatch = ROUTE_PERMISSIONS[pathname];
    if (exactMatch && exactMatch.exact) {
      return exactMatch;
    }

    // 부분 경로 매칭
    const partialMatch = Object.entries(ROUTE_PERMISSIONS)
      .find(([route, config]) => 
        !config.exact && pathname.startsWith(route) && route !== '/'
      );
    
    if (partialMatch) {
      return partialMatch[1];
    }

    // 기본 인증 필요 설정
    return {
      permissions: requiredPermissions,
      roles: requiredRoles,
      requireAuth,
      exact: false
    };
  }, [pathname, requiredPermissions, requiredRoles, requireAuth]);

  // 접근 권한 확인
  const hasAccess = React.useMemo(() => {
    if (!isInitialized) return false;

    // 인증이 필요하지 않은 페이지
    if (!routeConfig.requireAuth) {
      return true;
    }

    // 인증되지 않은 경우
    if (!isAuthenticated) {
      setAccessDeniedReason('unauthorized');
      return false;
    }

    // 권한 확인
    if (routeConfig.permissions?.length > 0) {
      const hasRequiredPermissions = permissions.hasAnyPermission(routeConfig.permissions);
      if (!hasRequiredPermissions) {
        setAccessDeniedReason('permission_denied');
        return false;
      }
    }

    // 역할 확인
    if (routeConfig.roles?.length > 0) {
      const hasRequiredRole = routeConfig.roles.some(role => 
        permissions.canInheritRole(role)
      );
      if (!hasRequiredRole) {
        setAccessDeniedReason('permission_denied');
        return false;
      }
    }

    setAccessDeniedReason(null);
    return true;
  }, [isInitialized, isAuthenticated, routeConfig, permissions]);

  // 로그인된 사용자를 위한 리다이렉션
  useEffect(() => {
    if (isInitialized && isAuthenticated && routeConfig.redirectIfAuthenticated) {
      router.replace(routeConfig.redirectIfAuthenticated);
    }
  }, [isInitialized, isAuthenticated, routeConfig.redirectIfAuthenticated, router]);

  // 접근 거부 콜백 실행
  useEffect(() => {
    if (accessDeniedReason && onAccessDenied) {
      onAccessDenied({
        reason: accessDeniedReason,
        pathname,
        requiredPermissions: routeConfig.permissions || [],
        requiredRoles: routeConfig.roles || [],
        user
      });
    }
  }, [accessDeniedReason, onAccessDenied, pathname, routeConfig, user]);

  // 로딩 상태 표시
  if (!isInitialized || isLoading) {
    if (loadingComponent) {
      return loadingComponent;
    }
    return <LoadingSpinner message={
      language === 'vi' ? 'Đang kiểm tra quyền truy cập...' :
      language === 'ko' ? '접근 권한을 확인하는 중...' :
      'Checking access permissions...'
    } />;
  }

  // 접근 권한이 있는 경우 자식 컴포넌트 렌더링
  if (hasAccess) {
    return children;
  }

  // 접근 권한이 없는 경우
  if (fallback) {
    return fallback;
  }

  // 기본 접근 거부 페이지 표시
  return (
    <AccessDeniedPage
      reason={accessDeniedReason}
      requiredPermissions={routeConfig.permissions || []}
      requiredRoles={routeConfig.roles || []}
      language={language}
      onRetry={() => {
        setIsInitialized(false);
      }}
      onContactAdmin={() => {
        // TODO: 관리자 연락 모달 또는 페이지로 이동
        console.log('Contact admin requested');
      }}
    />
  );
}

/**
 * Higher-Order Component로 AuthGuard 적용
 */
export function withAuthGuard(Component, guardConfig = {}) {
  return function AuthGuardedComponent(props) {
    return (
      <AuthGuard {...guardConfig}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

/**
 * 페이지 레벨 인증 보호를 위한 유틸리티
 */
export function protectPage(pageComponent, guardConfig = {}) {
  return withAuthGuard(pageComponent, {
    requireAuth: true,
    ...guardConfig
  });
}

/**
 * 라우트 권한 설정 업데이트 함수
 */
export function updateRoutePermissions(newRoutePermissions) {
  Object.assign(ROUTE_PERMISSIONS, newRoutePermissions);
}

/**
 * 현재 라우트의 권한 요구사항 조회
 */
export function getRouteRequirements(pathname) {
  return ROUTE_PERMISSIONS[pathname] || {
    permissions: [],
    roles: [],
    requireAuth: true,
    exact: false
  };
}

// 기본 내보내기
export default AuthGuard;