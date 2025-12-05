/**
 * withAuth.js - 인증 보호 HOC
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 컴포넌트 인증 상태 검사
 * - 미인증 사용자 리다이렉트
 * - 로딩 상태 처리
 * - Local어 에러 메시지
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/business/useAuth'
import { useAppTranslation } from '../i18n/I18nProvider'

/**
 * 인증 보호 HOC
 * @param {React.Component} WrappedComponent 래핑할 컴포넌트
 * @param {Object} options 옵션
 */
export const withAuth = (WrappedComponent, options = {}) => {
  const {
    redirectTo = '/login',
    requiredRoles = [],
    requiredPermissions = [],
    fallbackComponent: FallbackComponent = null,
    showLoader = true,
    checkInterval = 60000 // 1분마다 인증 상태 체크
  } = options

  const AuthenticatedComponent = (props) => {
    const router = useRouter()
    const { t } = useAppTranslation()
    const { 
      isAuthenticated, 
      isLoading, 
      user, 
      hasRole, 
      hasPermission,
      getAccessToken
    } = useAuth()
    
    const [authError, setAuthError] = useState(null)
    const [isValidating, setIsValidating] = useState(true)

    // 인증 상태 검증
    const validateAuth = async () => {
      try {
        setAuthError(null)
        
        // 기본 인증 상태 체크
        if (!isAuthenticated) {
          throw new Error(t?.('auth.notAuthenticated') || 'Chưa đăng nhập')
        }

        // 토큰 유효성 체크
        const token = await getAccessToken()
        if (!token) {
          throw new Error(t?.('auth.invalidToken') || 'Token không hợp lệ')
        }

        // 역할 권한 체크
        if (requiredRoles.length > 0) {
          const hasRequiredRole = requiredRoles.some(role => hasRole(role))
          if (!hasRequiredRole) {
            throw new Error(t?.('auth.insufficientRole') || 'Không đủ quyền hạn')
          }
        }

        // 권한 체크
        if (requiredPermissions.length > 0) {
          const hasRequiredPermission = requiredPermissions.every(permission => 
            hasPermission(permission)
          )
          if (!hasRequiredPermission) {
            throw new Error(t?.('auth.insufficientPermissions') || 'Không có quyền truy cập')
          }
        }

        setIsValidating(false)
      } catch (error) {
        setAuthError(error.message)
        
        // 인증 실패 시 리다이렉트
        if (redirectTo) {
          const currentPath = window.location.pathname
          const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
          router.push(redirectUrl)
        }
      }
    }

    // 초기 검증
    useEffect(() => {
      if (!isLoading) {
        validateAuth()
      }
    }, [isLoading, isAuthenticated])

    // 주기적 인증 상태 체크
    useEffect(() => {
      if (!checkInterval || checkInterval <= 0) return

      const interval = setInterval(() => {
        if (isAuthenticated) {
          validateAuth()
        }
      }, checkInterval)

      return () => clearInterval(interval)
    }, [checkInterval, isAuthenticated])

    // 로딩 중
    if (isLoading || isValidating) {
      if (showLoader) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-mint mx-auto mb-4"></div>
              <p className="text-gray-600">
                {t?.('auth.checking') || 'Đang kiểm tra quyền truy cập...'}
              </p>
            </div>
          </div>
        )
      }
      return null
    }

    // 인증 에러
    if (authError) {
      if (FallbackComponent) {
        return <FallbackComponent error={authError} user={user} />
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t?.('auth.accessDenied') || 'Truy cập bị từ chối'}
            </h3>
            <p className="text-gray-600 mb-4">{authError}</p>
            <button
              onClick={() => router.push(redirectTo)}
              className="w-full bg-primary-mint text-white py-2 px-4 rounded-lg hover:bg-primary-mint/90 transition-colors"
            >
              {t?.('auth.goToLogin') || 'Đi tới đăng nhập'}
            </button>
          </div>
        </div>
      )
    }

    // 인증 성공 - 원본 컴포넌트 렌더링
    return <WrappedComponent {...props} user={user} />
  }

  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`

  return AuthenticatedComponent
}

/**
 * 점주 전용 인증 HOC
 */
export const withStoreOwnerAuth = (WrappedComponent, options = {}) => {
  return withAuth(WrappedComponent, {
    ...options,
    requiredRoles: ['store_owner'],
    redirectTo: '/auth/owner-login'
  })
}

/**
 * 관리자 권한 HOC
 */
export const withManagerAuth = (WrappedComponent, options = {}) => {
  return withAuth(WrappedComponent, {
    ...options,
    requiredRoles: ['store_owner', 'manager'],
    redirectTo: '/login'
  })
}

/**
 * 권한 기반 인증 HOC
 */
export const withPermissionAuth = (permissions) => (WrappedComponent, options = {}) => {
  return withAuth(WrappedComponent, {
    ...options,
    requiredPermissions: Array.isArray(permissions) ? permissions : [permissions]
  })
}

export default withAuth