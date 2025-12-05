/**
 * index.js - HOC 라이브러리 엔트리 포인트
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 모든 HOC 컴포넌트 통합 export
 * - Local 특화 HOC 조합
 * - 편의성 HOC 컴포저
 */

// 기본 HOC들
export { default as withAuth, withStoreOwnerAuth, withManagerAuth, withPermissionAuth } from './withAuth'
export { default as withPermission, withStoreManagement, withMenuManagement, withOrderManagement, withPOSAccess, withFinanceAccess, withConditionalPermission } from './withPermission'
export { default as withLoading, withDataLoading, withPageLoading, withUploadLoading, withVietnameseLoading } from './withLoading'
export { default as withError, withNetworkError, withDataError, withVietnameseError } from './withError'
export { default as withAnalytics } from './withAnalytics'
export { default as withI18n } from './withI18n'
export { default as withTheme } from './withTheme'
export { default as withCache } from './withCache'
export { default as withOptimization } from './withOptimization'
export { default as withAccessibility } from './withAccessibility'
export { default as withResponsive } from './withResponsive'
export { default as withSubscription } from './withSubscription'

/**
 * HOC 컴포저 - 여러 HOC를 조합하는 유틸리티
 */
export const compose = (...hocs) => (WrappedComponent) => {
  return hocs.reduceRight((acc, hoc) => hoc(acc), WrappedComponent)
}

/**
 * Local App 페이지용 기본 HOC 조합
 */
export const withPageDefaults = (WrappedComponent, options = {}) => {
  return compose(
    withError,
    withLoading,
    withI18n,
    withResponsive,
    withAccessibility
  )(WrappedComponent)
}

/**
 * 인증이 필요한 페이지용 HOC 조합
 */
export const withAuthPage = (WrappedComponent, options = {}) => {
  return compose(
    withAuth,
    withError,
    withLoading,
    withI18n,
    withResponsive,
    withAccessibility
  )(WrappedComponent)
}

/**
 * 점주 전용 페이지용 HOC 조합
 */
export const withOwnerPage = (WrappedComponent, options = {}) => {
  return compose(
    withStoreOwnerAuth,
    withStoreManagement,
    withVietnameseError,
    withDataLoading,
    withI18n,
    withResponsive,
    withAccessibility,
    withAnalytics
  )(WrappedComponent)
}

/**
 * 실시간 데이터가 필요한 페이지용 HOC 조합
 */
export const withRealtimePage = (WrappedComponent, options = {}) => {
  const { websocketUrl } = options
  
  return compose(
    withAuth,
    withSubscription(WrappedComponent, { url: websocketUrl }),
    withError,
    withLoading,
    withI18n,
    withResponsive
  )(WrappedComponent)
}

/**
 * 고성능이 필요한 컴포넌트용 HOC 조합
 */
export const withPerformance = (WrappedComponent, options = {}) => {
  return compose(
    withOptimization,
    withCache,
    withError
  )(WrappedComponent)
}

/**
 * Local어 전용 컴포넌트 HOC 조합
 */
export const withVietnamese = (WrappedComponent, options = {}) => {
  return compose(
    withI18n,
    withVietnameseError,
    withVietnameseLoading,
    withAccessibility
  )(WrappedComponent)
}

/**
 * 데이터 중심 컴포넌트용 HOC 조합
 */
export const withDataComponent = (WrappedComponent, options = {}) => {
  return compose(
    withCache,
    withDataError,
    withDataLoading,
    withOptimization
  )(WrappedComponent)
}