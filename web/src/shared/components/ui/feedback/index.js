/**
 * 피드백 컴포넌트 모듈 내보내기
 * Local App MVP - 점주용 관리자 시스템
 */

// 컴포넌트들을 명시적으로 import
import NotificationCenter, { createNotification, notificationHelpers } from './NotificationCenter'
import Alert, { AlertVariants, DeliveryAlerts } from './Alert'
import ConfirmDialog, { ConfirmDialogVariants, DeliveryConfirmDialogs } from './ConfirmDialog'
import Loading, { LoadingVariants, DeliveryLoadings, SkeletonLoader } from './Loading'
import EmptyState from './EmptyState'
import SuccessMessage from './SuccessMessage'
import ValidationError from './ValidationError'
import InfoBanner from './InfoBanner'
import StatusIndicator from './StatusIndicator'
import ProgressBar, { SteppedProgressBar, CircularProgressBar, DeliveryProgressBar } from './ProgressBar'
import Toast, { ToastProvider, useToast } from './Toast'
import Tooltip, { FormFieldTooltip } from './Tooltip'

// 기본 피드백 컴포넌트들 re-export
export { default as NotificationCenter, createNotification, notificationHelpers } from './NotificationCenter'
export { default as Alert, AlertVariants, DeliveryAlerts } from './Alert'
export { default as ConfirmDialog, ConfirmDialogVariants, DeliveryConfirmDialogs } from './ConfirmDialog'
export { default as Loading, DeliveryLoadings, SkeletonLoader, SkeletonLoader as Skeleton, Loading as LoadingSpinner } from './Loading'
export { default as EmptyState } from './EmptyState'
export { default as SuccessMessage } from './SuccessMessage'
export { default as ValidationError } from './ValidationError'
export {
  ValidationErrorItem,
  ValidationErrorList,
  ValidationSummary,
  FieldValidationError,
  ValidatedFormField
} from './ValidationErrorDisplay'
export { default as InfoBanner } from './InfoBanner'
export { default as StatusIndicator, DeliveryStatusIndicator, getSimplifiedStatus, DELIVERY_STATUS_CONFIGS } from './StatusIndicator'
export { default as ProgressBar, SteppedProgressBar, CircularProgressBar, DeliveryProgressBar } from './ProgressBar'
export { default as Toast, ToastProvider, useToast } from './Toast'
export { default as Tooltip, FormFieldTooltip } from './Tooltip'

// 편의성을 위한 통합 객체 내보내기
export const FeedbackComponents = {
  NotificationCenter,
  Alert,
  ConfirmDialog,
  Loading,
  EmptyState,
  SuccessMessage,
  ValidationError,
  InfoBanner,
  StatusIndicator,
  ProgressBar,
  SteppedProgressBar,
  CircularProgressBar,
  DeliveryProgressBar,
  Skeleton: SkeletonLoader,
  Toast,
  Tooltip,
  FormFieldTooltip
}

// Local App 전용 컴포넌트들 통합
export const DeliveryFeedbackComponents = {
  Alerts: DeliveryAlerts,
  ConfirmDialogs: DeliveryConfirmDialogs,
  Loadings: DeliveryLoadings,
  NotificationHelpers: notificationHelpers
}