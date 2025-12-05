/**
 * useCopyToClipboard.js - 클립보드 복사 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - Clipboard API를 활용한 텍스트 복사
 * - 폴백 메커니즘 지원
 * - 복사 상태 피드백
 * - Local어 알림 메시지
 */

'use client'

import { useState, useCallback } from 'react'
import { useAppTranslation } from '../i18n/I18nProvider'

/**
 * 클립보드 복사 훅
 * @param {Object} options 옵션
 */
export const useCopyToClipboard = (options = {}) => {
  const {
    successDuration = 2000,
    onSuccess,
    onError
  } = options

  const { t } = useAppTranslation()
  
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState(null)

  const copyToClipboard = useCallback(async (text) => {
    try {
      setError(null)

      // 현대적인 Clipboard API 시도
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        // 폴백: 구식 방법
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        if (!document.execCommand('copy')) {
          throw new Error('복사에 실패했습니다')
        }
        
        document.body.removeChild(textArea)
      }

      setIsCopied(true)
      onSuccess?.(text)

      // 성공 상태 자동 리셋
      setTimeout(() => {
        setIsCopied(false)
      }, successDuration)

      return true
    } catch (err) {
      setError(err.message)
      onError?.(err)
      return false
    }
  }, [successDuration, onSuccess, onError])

  const reset = useCallback(() => {
    setIsCopied(false)
    setError(null)
  }, [])

  return {
    copyToClipboard,
    isCopied,
    error,
    reset,
    // Local어 메시지
    successMessage: t ? t('common.copySuccess') : 'Đã sao chép vào clipboard!',
    errorMessage: error ? (t ? t('common.copyError') : 'Không thể sao chép') : null
  }
}

/**
 * Local 특화 클립보드 복사 훅
 */
export const useVietnameseCopyToClipboard = (options = {}) => {
  const clipboard = useCopyToClipboard(options)

  // Local에서 자주 복사하는 정보들을 위한 편의 메서드들
  const copyOrderInfo = useCallback((order) => {
    const orderText = `
Đơn hàng: ${order.id}
Khách hàng: ${order.customerName}
Địa chỉ: ${order.address}
Số điện thoại: ${order.phone}
Tổng tiền: ${order.total.toLocaleString('vi-VN')}₫
    `.trim()
    
    return clipboard.copyToClipboard(orderText)
  }, [clipboard])

  const copyStoreInfo = useCallback((store) => {
    const storeText = `
Cửa hàng: ${store.name}
Địa chỉ: ${store.address}
Số điện thoại: ${store.phone}
Giờ mở cửa: ${store.hours}
    `.trim()
    
    return clipboard.copyToClipboard(storeText)
  }, [clipboard])

  const copyPaymentInfo = useCallback((payment) => {
    const paymentText = `
Mã thanh toán: ${payment.id}
Phương thức: ${payment.method}
Số tiền: ${payment.amount.toLocaleString('vi-VN')}₫
Thời gian: ${payment.createdAt}
    `.trim()
    
    return clipboard.copyToClipboard(paymentText)
  }, [clipboard])

  return {
    ...clipboard,
    copyOrderInfo,
    copyStoreInfo,
    copyPaymentInfo,
    // Local어 라벨들
    labels: {
      copy: 'Sao chép',
      copied: 'Đã sao chép!',
      copyError: 'Lỗi sao chép',
      copyOrderInfo: 'Sao chép thông tin đơn hàng',
      copyStoreInfo: 'Sao chép thông tin cửa hàng',
      copyPaymentInfo: 'Sao chép thông tin thanh toán'
    }
  }
}

export default useCopyToClipboard