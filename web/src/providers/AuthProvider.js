/**
 * Store 인증 컨텍스트 프로바이더 (Redux 통합 버전)
 * Redux 중심의 단일 인증 시스템
 *
 * ✅ 단일 진실 공급원: Redux auth slice
 * ✅ 서버 스키마 기준: StoreAccount 모델 필드명 일치
 * ✅ UnifiedAuthInitializer와 완벽 동기화
 * ✅ 토큰명 고정: accessStoreToken, refreshStoreToken
 */

import React, { createContext, useContext, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import {
  selectIsAuthenticated,
  selectIsLoading,
  selectStoreAccount,
  logout
} from '../store/slices/authSlice'
import { tokenManager } from '../lib/apolloClient'

// 인증 컨텍스트 생성
const AuthContext = createContext(undefined)

// 컨텍스트 사용 훅
export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

// 보호된 라우트 목록
const PROTECTED_ROUTES = [
  '/dashboard',
  '/orders',
  '/menu',
  '/analytics',
  '/customers',
  '/settings',
  '/pos',
  '/finance',
  '/reports',
  '/chat',
  '/notifications',
  '/reviews',
  '/delivery',
  '/print',
  '/coupon',
]

// 인증이 필요하지 않은 라우트 (로그인한 사용자는 접근 불가)
const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // ✅ Redux에서 인증 상태 가져오기 (단일 진실 공급원)
  const user = useSelector(selectStoreAccount)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isLoading = useSelector(selectIsLoading)

  // 라우트 보호 로직
  useEffect(() => {
    // 로딩 중이거나 pathname이 없으면 리턴
    if (isLoading || !pathname) {
      return;
    }

    // 보호된 라우트에 비인증 사용자가 접근하는 경우
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      if (!isAuthenticated) {
        const returnUrl = encodeURIComponent(pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ''))
        router.replace(`/login?returnUrl=${returnUrl}`)
        return
      }

      // 권한 체크 (필요시 추가)
      if (user) {
        // 특정 역할만 접근 가능한 라우트 체크
        if (pathname.startsWith('/settings/users') && user.role !== 'STORE_OWNER') {
          router.replace('/dashboard')
          return
        }

        if (pathname.startsWith('/finance') && !['STORE_OWNER', 'STORE_MANAGER'].includes(user.role)) {
          router.replace('/dashboard')
          return
        }
      }
    }

    // 인증 라우트에 로그인한 사용자가 접근하는 경우
    if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
      if (isAuthenticated) {
        // returnUrl이 있으면 해당 페이지로, 없으면 대시보드로
        const returnUrl = searchParams?.get('returnUrl')
        if (returnUrl && returnUrl !== '/login') {
          router.replace(decodeURIComponent(returnUrl))
        } else {
          router.replace('/dashboard')
        }
        return
      }
    }
  }, [isAuthenticated, isLoading, pathname, searchParams, router, user])

  // 루트 경로 처리
  useEffect(() => {
    if (isLoading || !pathname) return

    if (pathname === '/') {
      if (isAuthenticated) {
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }
    }
  }, [isAuthenticated, isLoading, pathname, router])
// console.log("[AuthProvider] 인증된 사용자:", isAuthenticated, user?.id)
//    useEffect(()=>{
//     if(isAuthenticated){}
//    },[isAuthenticated])

  // 로딩 상태 컴포넌트
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 상태를 확인하고 있습니다...</p>
        </div>
      </div>
    )
  }

  // Redux 기반 인증 컨텍스트 값
  const contextValue = {
    user,
    isAuthenticated,
    isLoading,
    // 로그아웃 함수 제공
    logout: () => {
      // ✅ 1. Redux 상태 초기화 먼저 (Redux Persist가 자동으로 localStorage 정리)
      dispatch(logout())

      // ✅ 2. Apollo Client 캐시만 정리
      tokenManager.clearApolloCache()

      // ✅ 3. 로그인 페이지로 강제 이동 (페이지 새로고침)
      window.location.href = '/login'
    }
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// HOC: 인증이 필요한 페이지 래핑
export const withAuth = (
  WrappedComponent,
  options = {}
) => {
  const AuthenticatedComponent = (props) => {
    const { user, isAuthenticated, isLoading } = useAuthContext()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
      if (isLoading || !pathname) return

      if (!isAuthenticated) {
        const returnUrl = encodeURIComponent(pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ''))
        router.replace(`/login?returnUrl=${returnUrl}`)
        return
      }

      // 역할 체크
      if (options?.requiredRoles && user) {
        if (!options.requiredRoles.includes(user.role)) {
          router.replace(options.redirectTo || '/dashboard')
          return
        }
      }
    }, [isAuthenticated, isLoading, user, pathname, searchParams, router])

    if (isLoading || !isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">페이지를 로드하고 있습니다...</p>
          </div>
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }

  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`

  return AuthenticatedComponent
}

// HOC: 인증이 불필요한 페이지 래핑 (이미 로그인한 사용자는 리다이렉트)
export const withoutAuth = (
  WrappedComponent,
  redirectTo = '/dashboard'
) => {
  const UnauthenticatedComponent = (props) => {
    const { isAuthenticated, isLoading } = useAuthContext()
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
      if (isLoading) return

      if (isAuthenticated) {
        const returnUrl = searchParams?.get('returnUrl')
        if (returnUrl && returnUrl !== '/login') {
          router.replace(decodeURIComponent(returnUrl))
        } else {
          router.replace(redirectTo)
        }
      }
    }, [isAuthenticated, isLoading, searchParams, router])

    if (isLoading || isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">페이지를 로드하고 있습니다...</p>
          </div>
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }

  UnauthenticatedComponent.displayName = `withoutAuth(${WrappedComponent.displayName || WrappedComponent.name})`

  return UnauthenticatedComponent
}

export default AuthProvider
