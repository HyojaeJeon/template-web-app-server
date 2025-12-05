/**
 * withLoading.js - 로딩 상태 래핑 HOC
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 컴포넌트 로딩 상태 관리
 * - Local어 로딩 메시지
 * - 커스텀 로더 컴포넌트
 * - 로딩 타임아웃 처리
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAppTranslation } from '../i18n/I18nProvider'

/**
 * 로딩 상태 래핑 HOC
 * @param {React.Component} WrappedComponent 래핑할 컴포넌트
 * @param {Object} options 옵션
 */
export const withLoading = (WrappedComponent, options = {}) => {
  const {
    loadingProp = 'isLoading',
    loadingComponent: LoadingComponent = null,
    loadingText = null,
    minLoadingTime = 300, // 최소 로딩 시간 (깜빡임 방지)
    timeout = 30000, // 30초 타임아웃
    onTimeout,
    showProgress = false,
    progressProp = 'progress'
  } = options

  const LoadingWrapper = (props) => {
    const { t } = useAppTranslation()
    const [minTimeElapsed, setMinTimeElapsed] = useState(false)
    const [timedOut, setTimedOut] = useState(false)
    
    const isLoading = props[loadingProp]
    const progress = showProgress ? props[progressProp] : null

    // 최소 로딩 시간 관리
    useEffect(() => {
      if (isLoading && minLoadingTime > 0) {
        setMinTimeElapsed(false)
        const timer = setTimeout(() => {
          setMinTimeElapsed(true)
        }, minLoadingTime)

        return () => clearTimeout(timer)
      } else {
        setMinTimeElapsed(true)
      }
    }, [isLoading])

    // 타임아웃 관리
    useEffect(() => {
      if (isLoading && timeout > 0) {
        setTimedOut(false)
        const timer = setTimeout(() => {
          setTimedOut(true)
          onTimeout?.()
        }, timeout)

        return () => clearTimeout(timer)
      }
    }, [isLoading])

    // 로딩 상태 계산
    const shouldShowLoading = useMemo(() => {
      return isLoading && !minTimeElapsed
    }, [isLoading, minTimeElapsed])

    // 타임아웃 발생
    if (timedOut) {
      return (
        <div className="min-h-[200px] flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t?.('loading.timeout') || 'Hết thời gian chờ'}
            </h3>
            <p className="text-gray-600 mb-4">
              {t?.('loading.timeoutMessage') || 'Việc tải dữ liệu mất quá nhiều thời gian'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-mint text-white px-4 py-2 rounded-lg hover:bg-primary-mint/90 transition-colors"
            >
              {t?.('loading.retry') || 'Thử lại'}
            </button>
          </div>
        </div>
      )
    }

    // 로딩 중
    if (shouldShowLoading) {
      if (LoadingComponent) {
        return <LoadingComponent progress={progress} />
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            {/* 로딩 스피너 */}
            <div className="relative mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-mint border-t-transparent mx-auto"></div>
              {showProgress && progress !== null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary-mint">
                    {Math.round(progress)}%
                  </span>
                </div>
              )}
            </div>

            {/* 로딩 텍스트 */}
            <p className="text-gray-600 mb-2">
              {loadingText || t?.('loading.default') || 'Đang tải...'}
            </p>

            {/* 진행률 바 */}
            {showProgress && progress !== null && (
              <div className="w-48 bg-gray-200 rounded-full h-2 mx-auto">
                <div 
                  className="bg-primary-mint h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                ></div>
              </div>
            )}

            {/* 로딩 팁 */}
            <p className="text-xs text-gray-500 mt-4">
              {t?.('loading.tip') || 'Xin vui lòng đợi trong giây lát...'}
            </p>
          </div>
        </div>
      )
    }

    // 로딩 완료 - 원본 컴포넌트 렌더링
    return <WrappedComponent {...props} />
  }

  LoadingWrapper.displayName = `withLoading(${WrappedComponent.displayName || WrappedComponent.name})`

  return LoadingWrapper
}

/**
 * 데이터 로딩 HOC (API 호출용)
 */
export const withDataLoading = (WrappedComponent, options = {}) => {
  return withLoading(WrappedComponent, {
    ...options,
    loadingText: options.loadingText || 'Đang tải dữ liệu...',
    minLoadingTime: 500,
    timeout: 15000
  })
}

/**
 * 페이지 로딩 HOC (전체 페이지용)
 */
export const withPageLoading = (WrappedComponent, options = {}) => {
  return withLoading(WrappedComponent, {
    ...options,
    loadingComponent: options.loadingComponent || (() => (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-mint border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">
            {options.loadingText || 'Đang tải trang...'}
          </p>
        </div>
      </div>
    )),
    minLoadingTime: 300,
    timeout: 20000
  })
}

/**
 * 파일 업로드 로딩 HOC
 */
export const withUploadLoading = (WrappedComponent, options = {}) => {
  return withLoading(WrappedComponent, {
    ...options,
    loadingText: options.loadingText || 'Đang tải lên tệp...',
    showProgress: true,
    progressProp: 'uploadProgress',
    timeout: 60000 // 파일 업로드는 더 오래 기다림
  })
}

/**
 * Local 특화 로딩 메시지 HOC
 */
export const withVietnameseLoading = (WrappedComponent, loadingMessages = {}) => {
  const vietnameseMessages = {
    default: 'Đang xử lý...',
    order: 'Đang xử lý đơn hàng...',
    payment: 'Đang xử lý thanh toán...',
    menu: 'Đang tải menu...',
    analytics: 'Đang tải dữ liệu thống kê...',
    pos: 'Đang kết nối POS...',
    ...loadingMessages
  }

  return (props) => {
    const LoadingWrappedComponent = withLoading(WrappedComponent, {
      loadingText: vietnameseMessages[props.loadingType] || vietnameseMessages.default,
      minLoadingTime: 400
    })

    return <LoadingWrappedComponent {...props} />
  }
}

export default withLoading