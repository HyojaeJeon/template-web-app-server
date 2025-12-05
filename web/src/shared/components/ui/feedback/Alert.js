'use client'

/**
 * 알림/경고 메시지 컴포넌트 (WCAG 2.1 준수)
 * Local App 디자인 가이드라인 적용
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {'success'|'error'|'warning'|'info'} props.variant - 알림 타입
 * @param {string} props.title - 제목
 * @param {string} [props.message] - 메시지 내용
 * @param {React.ReactNode} [props.children] - 자식 컴포넌트
 * @param {boolean} [props.dismissible=false] - 닫기 가능 여부
 * @param {Function} [props.onDismiss] - 닫기 콜백
 * @param {boolean} [props.showIcon=true] - 아이콘 표시 여부
 * @param {string} [props.className] - 추가 CSS 클래스
 */

import { useState } from 'react'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline'

const Alert = ({
  variant = 'info',
  title,
  message,
  children,
  dismissible = false,
  onDismiss,
  showIcon = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  // 변형별 스타일 설정
  const getVariantStyles = () => {
    const baseStyles = 'rounded-2xl border-2 px-4 py-3 transition-all duration-300 ease-out'

    switch (variant) {
      case 'success':
        return `${baseStyles} bg-gradient-to-r from-[#e8f8f0] to-white dark:from-green-950/50 dark:to-green-900/30 border-[#00B14F]/20 dark:border-green-700/50 text-[#008f3f] dark:text-green-300`
      case 'error':
        return `${baseStyles} bg-gradient-to-r from-red-50 to-white dark:from-red-950/50 dark:to-red-900/30 border-red-200 dark:border-red-700/50 text-red-800 dark:text-red-300`
      case 'warning':
        return `${baseStyles} bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-950/50 dark:to-yellow-900/30 border-yellow-200 dark:border-yellow-700/50 text-yellow-800 dark:text-yellow-300`
      case 'info':
      default:
        return `${baseStyles} bg-gradient-to-r from-[#F0FCFC] to-white dark:from-cyan-950/50 dark:to-cyan-900/30 border-[#2AC1BC]/20 dark:border-cyan-700/50 text-[#147A76] dark:text-cyan-300`
    }
  }

  // 아이콘 컴포넌트 - Heroicons 사용
  const getIcon = () => {
    if (!showIcon) return null

    const iconClass = 'w-6 h-6 flex-shrink-0'

    switch (variant) {
      case 'success':
        return <CheckCircleIcon className={`${iconClass} text-[#00B14F] dark:text-green-400`} />
      case 'error':
        return <XCircleIcon className={`${iconClass} text-red-600 dark:text-red-400`} />
      case 'warning':
        return <ExclamationTriangleIcon className={`${iconClass} text-yellow-600 dark:text-yellow-400`} />
      case 'info':
      default:
        return <InformationCircleIcon className={`${iconClass} text-[#2AC1BC] dark:text-cyan-400`} />
    }
  }

  // role 속성 결정
  const getRole = () => {
    return variant === 'error' ? 'alert' : 'status'
  }

  // aria-live 속성 결정
  const getAriaLive = () => {
    return variant === 'error' ? 'assertive' : 'polite'
  }

  return (
    <div
      className={`${getVariantStyles()} ${className}`}
      role={getRole()}
      aria-live={getAriaLive()}
      aria-atomic="true"
    >
      <div className="flex items-center gap-3">
        {getIcon()}

        <div className="flex-1 min-w-0 flex items-center">
          <div className="flex-1">
            {title && (
              <h3 className="font-semibold text-base leading-tight">
                {title}
              </h3>
            )}

            {message && (
              <p className="text-sm leading-snug opacity-90">
                {message}
              </p>
            )}

            {children}
          </div>
        </div>

        {dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] dark:focus:ring-cyan-400 focus:ring-offset-1"
            aria-label="알림 닫기"
            type="button"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>
    </div>
  )
}

// 미리 정의된 알림 변형들
export const AlertVariants = {
  // 성공 알림
  Success: ({ title, message, ...props }) => (
    <Alert variant="success" title={title} message={message} {...props} />
  ),
  
  // 에러 알림
  Error: ({ title, message, ...props }) => (
    <Alert variant="error" title={title} message={message} {...props} />
  ),
  
  // 경고 알림
  Warning: ({ title, message, ...props }) => (
    <Alert variant="warning" title={title} message={message} {...props} />
  ),
  
  // 정보 알림
  Info: ({ title, message, ...props }) => (
    <Alert variant="info" title={title} message={message} {...props} />
  )
}

// Local App 전용 알림 컴포넌트들
export const DeliveryAlerts = {
  // POS 연결 성공
  PosConnected: (props) => (
    <Alert 
      variant="success" 
      title="POS 시스템 연결됨" 
      message="POS 시스템이 성공적으로 연결되었습니다. 실시간 주문 처리가 가능합니다." 
      {...props} 
    />
  ),
  
  // POS 연결 실패
  PosDisconnected: (props) => (
    <Alert 
      variant="error" 
      title="POS 시스템 연결 해제" 
      message="POS 시스템과의 연결이 해제되었습니다. 네트워크 상태를 확인해주세요." 
      {...props} 
    />
  ),
  
  // 새 주문 알림
  NewOrder: ({ orderNumber, ...props }) => (
    <Alert 
      variant="info" 
      title="새 주문 접수" 
      message={`주문번호 #${orderNumber}이 접수되었습니다. 주문을 확인해주세요.`} 
      {...props} 
    />
  ),
  
  // 결제 완료 알림
  PaymentCompleted: ({ amount, ...props }) => (
    <Alert 
      variant="success" 
      title="결제 완료" 
      message={`${amount?.toLocaleString('vi-VN')} VND 결제가 완료되었습니다.`} 
      {...props} 
    />
  ),
  
  // 재고 부족 경고
  LowStock: ({ itemName, remainingCount, ...props }) => (
    <Alert 
      variant="warning" 
      title="재고 부족" 
      message={`${itemName}의 재고가 부족합니다. (남은 수량: ${remainingCount}개)`} 
      {...props} 
    />
  )
}

export { Alert };
export default Alert;