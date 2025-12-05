/**
 * withPermission.js - 권한 체크 HOC
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 세분화된 권한 체크
 * - 조건부 컴포넌트 렌더링
 * - 권한 부족 시 대체 UI
 * - Local어 권한 메시지
 */

'use client'

import { useMemo } from 'react'
import { usePermission } from '../hooks/business/usePermission'
import { useAppTranslation } from '../i18n/I18nProvider'

/**
 * 권한 체크 HOC
 * @param {React.Component} WrappedComponent 래핑할 컴포넌트
 * @param {Object} options 옵션
 */
export const withPermission = (WrappedComponent, options = {}) => {
  const {
    requiredPermissions = [],
    requireAll = false,
    fallbackComponent: FallbackComponent = null,
    showFallback = true,
    onPermissionDenied,
    additionalChecks = []
  } = options

  const PermissionCheckedComponent = (props) => {
    const { t } = useAppTranslation()
    const { 
      hasPermission, 
      hasAnyPermission, 
      hasAllPermissions,
      userPermissions
    } = usePermission()

    // 권한 검사
    const permissionStatus = useMemo(() => {
      let hasRequiredPermission = true
      let deniedPermissions = []

      // 기본 권한 체크
      if (requiredPermissions.length > 0) {
        if (requireAll) {
          hasRequiredPermission = hasAllPermissions(requiredPermissions)
          deniedPermissions = requiredPermissions.filter(permission => 
            !hasPermission(permission)
          )
        } else {
          hasRequiredPermission = hasAnyPermission(requiredPermissions)
          if (!hasRequiredPermission) {
            deniedPermissions = requiredPermissions
          }
        }
      }

      // 추가 조건 체크
      if (hasRequiredPermission && additionalChecks.length > 0) {
        for (const check of additionalChecks) {
          if (typeof check === 'function') {
            const checkResult = check(userPermissions, props)
            if (!checkResult) {
              hasRequiredPermission = false
              deniedPermissions.push('additional_check')
              break
            }
          }
        }
      }

      return {
        allowed: hasRequiredPermission,
        deniedPermissions
      }
    }, [
      hasPermission, 
      hasAnyPermission, 
      hasAllPermissions, 
      userPermissions, 
      props
    ])

    // 권한 부족 콜백 실행
    if (!permissionStatus.allowed && onPermissionDenied) {
      onPermissionDenied(permissionStatus.deniedPermissions, props)
    }

    // 권한이 있는 경우 - 원본 컴포넌트 렌더링
    if (permissionStatus.allowed) {
      return <WrappedComponent {...props} userPermissions={userPermissions} />
    }

    // 권한이 없는 경우 - 대체 컴포넌트 또는 기본 UI
    if (FallbackComponent) {
      return (
        <FallbackComponent 
          {...props}
          deniedPermissions={permissionStatus.deniedPermissions}
          requiredPermissions={requiredPermissions}
        />
      )
    }

    if (showFallback) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t?.('permission.accessRestricted') || 'Quyền truy cập bị hạn chế'}
          </h3>
          <p className="text-gray-600 mb-4">
            {t?.('permission.insufficientPermissions') || 'Bạn không có đủ quyền để truy cập tính năng này'}
          </p>
          <div className="text-sm text-gray-500">
            <p className="mb-2">
              {t?.('permission.requiredPermissions') || 'Quyền cần thiết'}:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {requiredPermissions.map(permission => (
                <li key={permission} className="text-xs">
                  {permission}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    }

    // 아무것도 렌더링하지 않음
    return null
  }

  PermissionCheckedComponent.displayName = `withPermission(${WrappedComponent.displayName || WrappedComponent.name})`

  return PermissionCheckedComponent
}

/**
 * 매장 관리 권한 HOC
 */
export const withStoreManagement = (WrappedComponent, options = {}) => {
  return withPermission(WrappedComponent, {
    ...options,
    requiredPermissions: ['store:manage'],
    requireAll: true
  })
}

/**
 * 메뉴 관리 권한 HOC
 */
export const withMenuManagement = (WrappedComponent, options = {}) => {
  return withPermission(WrappedComponent, {
    ...options,
    requiredPermissions: ['menu:create', 'menu:update', 'menu:delete'],
    requireAll: false // 하나라도 있으면 됨
  })
}

/**
 * 주문 관리 권한 HOC
 */
export const withOrderManagement = (WrappedComponent, options = {}) => {
  return withPermission(WrappedComponent, {
    ...options,
    requiredPermissions: ['order:view_all', 'order:update_status'],
    requireAll: false
  })
}

/**
 * POS 접근 권한 HOC
 */
export const withPOSAccess = (WrappedComponent, options = {}) => {
  return withPermission(WrappedComponent, {
    ...options,
    requiredPermissions: ['pos:access'],
    requireAll: true
  })
}

/**
 * 재무 데이터 접근 권한 HOC
 */
export const withFinanceAccess = (WrappedComponent, options = {}) => {
  return withPermission(WrappedComponent, {
    ...options,
    requiredPermissions: ['finance:view_revenue', 'analytics:view'],
    requireAll: false
  })
}

/**
 * 조건부 권한 HOC (시간/위치 기반)
 */
export const withConditionalPermission = (basePermissions, conditions) => (WrappedComponent, options = {}) => {
  return withPermission(WrappedComponent, {
    ...options,
    requiredPermissions: basePermissions,
    additionalChecks: [
      (userPermissions, props) => {
        // 시간 기반 체크
        if (conditions.businessHoursOnly) {
          const now = new Date()
          const currentHour = now.getHours()
          
          // Local 일반적인 영업시간 (9시-22시)
          if (currentHour < 9 || currentHour > 22) {
            return false
          }
        }

        // 위치 기반 체크 (가상 구현)
        if (conditions.storeLocationOnly) {
          // TODO: 실제 위치 기반 체크 구현
          return true
        }

        // 커스텀 조건
        if (conditions.customCheck) {
          return conditions.customCheck(userPermissions, props)
        }

        return true
      }
    ]
  })
}

export default withPermission