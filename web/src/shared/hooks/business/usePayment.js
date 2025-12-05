/**
 * usePayment.js - 결제 처리 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - Local 결제 게이트웨이 통합 (MoMo, ZaloPay, VNPay)
 * - 동적 QR 코드 결제 (NAPAS 표준)
 * - 착불(COD) 결제 처리
 * - 결제 상태 실시간 추적
 * - 환불 및 부분 취소 처리
 * - POS 연동 결제 동기화
 */

'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAppTranslation } from '../i18n/I18nProvider'
import { formatVND } from '../utils/vietnam'
import { useUnifiedSocket } from '../../../providers/UnifiedSocketProvider'

// Local 결제 수단
const PAYMENT_METHODS = {
  COD: 'cod', // 착불
  MOMO: 'momo',
  ZALOPAY: 'zalopay',
  VNPAY: 'vnpay',
  BANK_TRANSFER: 'bank_transfer',
  CARD: 'card',
  QR_CODE: 'qr_code'
}

// 결제 상태
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded'
}

/**
 * 결제 처리 훅
 * @param {Object} options 옵션
 */
export const usePayment = (options = {}) => {
  const {
    apiBaseUrl = process.env.NEXT_PUBLIC_API_URL,
    webSocketUrl = process.env.NEXT_PUBLIC_WS_URL,
    enableRealTimeTracking = true,
    onPaymentStatusChange,
    onPaymentSuccess,
    onPaymentFailed,
    onRefundProcessed
  } = options

  const { t, errorT } = useAppTranslation()
  
  const [currentPayment, setCurrentPayment] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(PAYMENT_STATUS.PENDING)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [transactionHistory, setTransactionHistory] = useState([])
  
  const { subscribe, unsubscribe, emit, isConnected } = useUnifiedSocket()
  const subscriptionRef = useRef(null)
  const pollRef = useRef(null)

  // UnifiedSocketProvider를 통한 실시간 결제 상태 추적
  const initializePaymentTracking = useCallback((paymentId) => {
    if (!enableRealTimeTracking || !paymentId || !isConnected) return

    // 기존 구독 정리
    if (subscriptionRef.current) {
      unsubscribe(subscriptionRef.current)
    }

    // UnifiedSocketProvider를 통한 결제 상태 구독
    subscriptionRef.current = subscribe(`payment:${paymentId}`, (data) => {
      try {
        if (data.type === 'payment_status_update') {
          setPaymentStatus(data.status)
          setCurrentPayment(prev => ({ ...prev, ...data.payment }))
          onPaymentStatusChange?.(data.status, data.payment)
          
          if (data.status === PAYMENT_STATUS.SUCCESS) {
            onPaymentSuccess?.(data.payment)
          } else if (data.status === PAYMENT_STATUS.FAILED) {
            onPaymentFailed?.(data.payment, data.error)
          }
        }
      } catch (error) {
        console.error('Failed to parse payment update:', error)
      }
    })

    return subscriptionRef.current
  }, [subscribe, unsubscribe, enableRealTimeTracking, isConnected, onPaymentStatusChange, onPaymentSuccess, onPaymentFailed])

  // 사용 가능한 결제 수단 조회
  const fetchPaymentMethods = useCallback(async (orderInfo) => {
    try {
      const response = await fetch(`${apiBaseUrl}/payment/methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: orderInfo.amount,
          orderType: orderInfo.orderType,
          location: orderInfo.location
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods')
      }

      const methods = await response.json()
      setPaymentMethods(methods)
      return methods
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      setPaymentError(error.message)
      throw error
    }
  }, [apiBaseUrl])

  // MoMo 결제 처리
  const processMoMoPayment = useCallback(async (paymentData) => {
    try {
      const response = await fetch(`${apiBaseUrl}/payment/momo/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      })

      if (!response.ok) {
        throw new Error('MoMo payment creation failed')
      }

      const result = await response.json()
      
      // MoMo 앱으로 리다이렉트 또는 QR 코드 표시
      if (result.payUrl) {
        window.open(result.payUrl, '_blank')
      }

      return result
    } catch (error) {
      console.error('MoMo payment error:', error)
      throw error
    }
  }, [apiBaseUrl])

  // ZaloPay 결제 처리
  const processZaloPayment = useCallback(async (paymentData) => {
    try {
      const response = await fetch(`${apiBaseUrl}/payment/zalopay/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      })

      if (!response.ok) {
        throw new Error('ZaloPay payment creation failed')
      }

      const result = await response.json()
      
      if (result.order_url) {
        window.open(result.order_url, '_blank')
      }

      return result
    } catch (error) {
      console.error('ZaloPay payment error:', error)
      throw error
    }
  }, [apiBaseUrl])

  // VNPay 결제 처리
  const processVNPayPayment = useCallback(async (paymentData) => {
    try {
      const response = await fetch(`${apiBaseUrl}/payment/vnpay/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      })

      if (!response.ok) {
        throw new Error('VNPay payment creation failed')
      }

      const result = await response.json()
      
      if (result.vnp_Url) {
        window.location.href = result.vnp_Url
      }

      return result
    } catch (error) {
      console.error('VNPay payment error:', error)
      throw error
    }
  }, [apiBaseUrl])

  // QR 코드 결제 처리 (NAPAS 표준)
  const processQRCodePayment = useCallback(async (paymentData) => {
    try {
      const response = await fetch(`${apiBaseUrl}/payment/qr/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...paymentData,
          qrType: 'napas' // NAPAS 표준 QR
        })
      })

      if (!response.ok) {
        throw new Error('QR payment creation failed')
      }

      const result = await response.json()
      
      return {
        qrCode: result.qrData,
        qrImage: result.qrImageUrl,
        expiresAt: result.expiresAt,
        paymentId: result.paymentId
      }
    } catch (error) {
      console.error('QR payment error:', error)
      throw error
    }
  }, [apiBaseUrl])

  // 착불(COD) 결제 처리
  const processCODPayment = useCallback(async (paymentData) => {
    try {
      const response = await fetch(`${apiBaseUrl}/payment/cod/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...paymentData,
          collectionMethod: 'delivery' // 배달 시 수금
        })
      })

      if (!response.ok) {
        throw new Error('COD payment creation failed')
      }

      const result = await response.json()
      
      // COD는 즉시 성공 처리 (배달 시 실제 수금)
      setPaymentStatus(PAYMENT_STATUS.SUCCESS)
      
      return result
    } catch (error) {
      console.error('COD payment error:', error)
      throw error
    }
  }, [apiBaseUrl])

  // 통합 결제 처리
  const processPayment = useCallback(async (paymentData) => {
    const { method, orderId, amount, customerInfo, orderItems } = paymentData
    
    setIsProcessing(true)
    setPaymentError(null)

    try {
      let result

      const commonPaymentData = {
        orderId,
        amount,
        currency: 'VND',
        description: `Thanh toán đơn hàng #${orderId}`,
        customerInfo,
        orderItems,
        returnUrl: `${window.location.origin}/payment/return`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
        notifyUrl: `${apiBaseUrl}/payment/webhook`
      }

      switch (method) {
        case PAYMENT_METHODS.MOMO:
          result = await processMoMoPayment(commonPaymentData)
          break
        case PAYMENT_METHODS.ZALOPAY:
          result = await processZaloPayment(commonPaymentData)
          break
        case PAYMENT_METHODS.VNPAY:
          result = await processVNPayPayment(commonPaymentData)
          break
        case PAYMENT_METHODS.QR_CODE:
          result = await processQRCodePayment(commonPaymentData)
          break
        case PAYMENT_METHODS.COD:
          result = await processCODPayment(commonPaymentData)
          break
        default:
          throw new Error(`Unsupported payment method: ${method}`)
      }

      setCurrentPayment(result)
      
      // 실시간 추적 시작
      if (result.paymentId) {
        initializePaymentTracking(result.paymentId)
      }

      return result
    } catch (error) {
      setPaymentError(error.message)
      setPaymentStatus(PAYMENT_STATUS.FAILED)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [processMoMoPayment, processZaloPayment, processVNPayPayment, processQRCodePayment, processCODPayment, initializePaymentTracking])

  // 결제 상태 조회
  const checkPaymentStatus = useCallback(async (paymentId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/payment/${paymentId}/status`)
      
      if (!response.ok) {
        throw new Error('Failed to check payment status')
      }

      const result = await response.json()
      setPaymentStatus(result.status)
      
      return result
    } catch (error) {
      console.error('Error checking payment status:', error)
      throw error
    }
  }, [apiBaseUrl])

  // 결제 취소
  const cancelPayment = useCallback(async (paymentId, reason) => {
    try {
      setIsProcessing(true)

      const response = await fetch(`${apiBaseUrl}/payment/${paymentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })

      if (!response.ok) {
        throw new Error('Payment cancellation failed')
      }

      const result = await response.json()
      setPaymentStatus(PAYMENT_STATUS.CANCELLED)
      
      return result
    } catch (error) {
      console.error('Error cancelling payment:', error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [apiBaseUrl])

  // 환불 처리
  const processRefund = useCallback(async (paymentId, refundData) => {
    try {
      setIsProcessing(true)

      const response = await fetch(`${apiBaseUrl}/payment/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(refundData)
      })

      if (!response.ok) {
        throw new Error('Refund processing failed')
      }

      const result = await response.json()
      
      const newStatus = refundData.amount >= currentPayment?.amount 
        ? PAYMENT_STATUS.REFUNDED 
        : PAYMENT_STATUS.PARTIALLY_REFUNDED
      
      setPaymentStatus(newStatus)
      onRefundProcessed?.(result)
      
      return result
    } catch (error) {
      console.error('Error processing refund:', error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [apiBaseUrl, currentPayment, onRefundProcessed])

  // 거래 내역 조회
  const fetchTransactionHistory = useCallback(async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${apiBaseUrl}/payment/transactions?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch transaction history')
      }

      const result = await response.json()
      setTransactionHistory(result.transactions || [])
      
      return result
    } catch (error) {
      console.error('Error fetching transaction history:', error)
      throw error
    }
  }, [apiBaseUrl])

  // 결제 수단별 수수료 계산
  const calculateFees = useMemo(() => {
    return (method, amount) => {
      const fees = {
        [PAYMENT_METHODS.COD]: 0, // 착불은 수수료 없음
        [PAYMENT_METHODS.MOMO]: amount * 0.015, // 1.5%
        [PAYMENT_METHODS.ZALOPAY]: amount * 0.018, // 1.8%
        [PAYMENT_METHODS.VNPAY]: amount * 0.02, // 2.0%
        [PAYMENT_METHODS.QR_CODE]: amount * 0.01, // 1.0%
        [PAYMENT_METHODS.BANK_TRANSFER]: 5000 // 고정 5,000 VND
      }

      return fees[method] || 0
    }
  }, [])

  // Local 특화 결제 검증
  const validatePaymentAmount = useCallback((amount) => {
    const errors = []

    // 최소 결제 금액 (1,000 VND)
    if (amount < 1000) {
      errors.push(t?.('payment.minimumAmount') || 'Số tiền tối thiểu là 1,000₫')
    }

    // 최대 결제 금액 (50,000,000 VND - 규제 제한)
    if (amount > 50000000) {
      errors.push(t?.('payment.maximumAmount') || 'Số tiền tối đa là 50,000,000₫')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }, [t])

  // 컴포넌트 언마운트 시 구독 정리
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        unsubscribe(subscriptionRef.current)
      }
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [unsubscribe])

  return {
    // 상태
    currentPayment,
    paymentStatus,
    paymentMethods,
    isProcessing,
    paymentError,
    transactionHistory,
    
    // 액션
    processPayment,
    cancelPayment,
    processRefund,
    checkPaymentStatus,
    fetchPaymentMethods,
    fetchTransactionHistory,
    
    // 유틸리티
    calculateFees,
    validatePaymentAmount,
    
    // 상수
    PAYMENT_METHODS,
    PAYMENT_STATUS,
    
    // 상태 확인
    isPaymentSuccessful: paymentStatus === PAYMENT_STATUS.SUCCESS,
    isPaymentFailed: paymentStatus === PAYMENT_STATUS.FAILED,
    isPaymentPending: paymentStatus === PAYMENT_STATUS.PENDING,
    canRefund: [PAYMENT_STATUS.SUCCESS].includes(paymentStatus),
    canCancel: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING].includes(paymentStatus),
    
    // Local어 라벨
    labels: {
      cod: t?.('payments.cod') || 'Thanh toán khi nhận hàng',
      momo: t?.('payments.momo') || 'Ví MoMo',
      zalopay: t?.('payments.zalopay') || 'ZaloPay',
      vnpay: t?.('payments.vnpay') || 'VNPay',
      qrCode: t?.('payments.qrCode') || 'Quét mã QR',
      pending: t?.('payments.pending') || 'Đang chờ',
      processing: t?.('payments.processing') || 'Đang xử lý',
      success: t?.('payments.success') || 'Thành công',
      failed: t?.('payments.failed') || 'Thất bại',
      cancelled: t?.('payments.cancelled') || 'Đã hủy',
      refunded: t?.('payments.refunded') || 'Đã hoàn tiền'
    }
  }
}

/**
 * Local 점주용 결제 훅
 */
export const useStorePayment = () => {
  const payment = usePayment({
    enableRealTimeTracking: true
  })

  // 점주 전용 결제 분석
  const getPaymentAnalytics = useCallback(async (period = '7d') => {
    try {
      const response = await fetch(`${payment.apiBaseUrl}/payment/analytics?period=${period}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment analytics')
      }

      const analytics = await response.json()
      
      return {
        totalRevenue: analytics.totalRevenue,
        paymentMethodBreakdown: analytics.methodBreakdown,
        successRate: analytics.successRate,
        averageTransactionValue: analytics.averageValue,
        refundRate: analytics.refundRate
      }
    } catch (error) {
      console.error('Error fetching payment analytics:', error)
      throw error
    }
  }, [payment.apiBaseUrl])

  return {
    ...payment,
    getPaymentAnalytics
  }
}

export default usePayment