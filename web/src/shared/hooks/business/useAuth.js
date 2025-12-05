/**
 * useAuth - StoreAccount 기반 인증 훅
 * Web 전용 - StoreAccount 모델 기준
 *
 * @model StoreAccount { id, phone, email, fullName, role, storeId, permissions }
 * @returns { storeAccount, storeId, isAuthenticated, hasRole, hasPermission, logout }
 */

'use client'

import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import {
  selectIsAuthenticated,
  selectIsLoading,
  selectStoreAccount,
  selectStoreId,
  selectRole,
  selectPermissions,
  selectError,
  logout as logoutAction
} from '../../../store/slices/authSlice'
import { tokenManager } from '../../../lib/apolloClient'

/**
 * Web 인증 훅 (StoreAccount 기반)
 */
export const useAuth = (options = {}) => {
  const {
    redirectOnLogout = '/login',
  } = options

  const router = useRouter()
  const dispatch = useDispatch()

  // Redux 상태
  const storeAccount = useSelector(selectStoreAccount)
  const storeId = useSelector(selectStoreId)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isLoading = useSelector(selectIsLoading)
  const error = useSelector(selectError)
  const role = useSelector(selectRole)
  const permissions = useSelector(selectPermissions)

  // 로그아웃
  const logout = useCallback(async (redirect = true) => {
    dispatch(logoutAction())
    tokenManager.clearApolloCache()

    if (redirect && redirectOnLogout) {
      router.push(redirectOnLogout)
    }
  }, [dispatch, redirectOnLogout, router])

  // 토큰 가져오기
  const getAccessToken = useCallback(async () => {
    const token = tokenManager.getAccessToken()
    if (!token || tokenManager.isTokenExpired(token)) {
      return null
    }
    return token
  }, [])

  // 권한 체크
  const hasPermission = useCallback((permission) => {
    if (!storeAccount || !permissions) return false
    return Array.isArray(permissions) && permissions.includes(permission)
  }, [storeAccount, permissions])

  const hasRole = useCallback((checkRole) => {
    if (!storeAccount) return false
    return role === checkRole
  }, [storeAccount, role])

  // Web 특화 권한
  const canManageStore = useMemo(() => {
    return hasRole('STORE_OWNER') || hasRole('STORE_MANAGER')
  }, [hasRole])

  const canManageOrders = useMemo(() => {
    return hasRole('STORE_OWNER') || hasRole('STORE_MANAGER') || hasRole('CASHIER')
  }, [hasRole])

  const canAccessPOS = useMemo(() => {
    return hasRole('STORE_OWNER') || hasRole('STORE_MANAGER')
  }, [hasRole])

  const canViewAnalytics = useMemo(() => {
    return hasRole('STORE_OWNER') || hasRole('STORE_MANAGER')
  }, [hasRole])

  return {
    // StoreAccount 정보
    storeAccount,
    user: storeAccount, // Alias for compatibility
    currentStore: storeAccount ? { id: storeId, name: storeAccount.storeName } : null,
    storeId,
    role,
    permissions,

    // 인증 상태
    isAuthenticated,
    isInitialized: true, // Redux is always initialized
    isLoading,
    error,

    // 액션
    logout,
    getAccessToken,

    // 권한 체크
    hasPermission,
    hasRole,
    canManageStore,
    canManageOrders,
    canAccessPOS,
    canViewAnalytics,
  }
}

export default useAuth
