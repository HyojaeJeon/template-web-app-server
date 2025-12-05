/**
 * usePolling.js - 주기적 데이터 갱신 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 실시간이 아닌 주기적 데이터 업데이트
 * - 주문 상태, 매출 통계, 재고 현황 등 폴링
 * - 네트워크 상태 및 페이지 가시성 인식
 * - 에러 백오프 및 재시도 메커니즘
 * - Local 현지 시간대 고려
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppTranslation } from '../i18n/I18nProvider'

/**
 * 폴링 훅
 * @param {Function} pollingFunction 호출할 폴링 함수
 * @param {number} interval 폴링 간격 (밀리초, 기본: 5000)
 * @param {Object} options 설정 옵션
 * @param {boolean} options.immediate 즉시 실행 여부 (기본: true)
 * @param {boolean} options.runOnFocus 포커스 시 실행 여부 (기본: true)
 * @param {boolean} options.runOnReconnect 재연결 시 실행 여부 (기본: true)
 * @param {number} options.maxRetries 최대 재시도 횟수 (기본: 3)
 * @param {Function} options.onSuccess 성공 콜백
 * @param {Function} options.onError 에러 콜백
 * @param {Function} options.shouldPoll 폴링 조건 함수
 */
export const usePolling = (
  pollingFunction,
  interval = 5000,
  options = {}
) => {
  const {
    immediate = true,
    runOnFocus = true,
    runOnReconnect = true,
    maxRetries = 3,
    onSuccess,
    onError,
    shouldPoll = () => true
  } = options

  const { errorT } = useAppTranslation()
  
  const [data, setData] = useState(null)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(null)
  
  const intervalRef = useRef(null)
  const retryTimeoutRef = useRef(null)
  const isActiveRef = useRef(true)

  // 네트워크 상태 감지
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  // 페이지 가시성 감지
  const [isVisible, setIsVisible] = useState(
    typeof document !== 'undefined' ? !document.hidden : true
  )

  // 실제 폴링 함수 실행
  const executePoll = useCallback(async () => {
    if (!shouldPoll() || !isOnline || !isVisible || !isActiveRef.current) {
      return
    }

    try {
      setError(null)
      const result = await pollingFunction()
      setData(result)
      setLastUpdated(new Date())
      setRetryCount(0)
      onSuccess?.(result)
    } catch (err) {
      console.error('폴링 에러:', err)
      setError(err)
      onError?.(err)
      
      // 재시도 로직
      if (retryCount < maxRetries) {
        const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 10000)
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1)
          executePoll()
        }, backoffDelay)
      }
    }
  }, [pollingFunction, shouldPoll, isOnline, isVisible, retryCount, maxRetries, onSuccess, onError])

  // 폴링 시작
  const startPolling = useCallback(() => {
    if (intervalRef.current) return
    
    setIsPolling(true)
    
    // 즉시 실행
    if (immediate) {
      executePoll()
    }
    
    // 주기적 실행
    intervalRef.current = setInterval(executePoll, interval)
  }, [executePoll, interval, immediate])

  // 폴링 중지
  const stopPolling = useCallback(() => {
    setIsPolling(false)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
  }, [])

  // 수동 새로고침
  const refresh = useCallback(async () => {
    await executePoll()
  }, [executePoll])

  // 네트워크 상태 이벤트 리스너
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (runOnReconnect && isPolling) {
        executePoll()
      }
    }
    
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [executePoll, runOnReconnect, isPolling])

  // 페이지 가시성 이벤트 리스너
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden
      setIsVisible(visible)
      
      if (visible && runOnFocus && isPolling) {
        executePoll()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [executePoll, runOnFocus, isPolling])

  // 컴포넌트 마운트/언마운트 시 폴링 제어
  useEffect(() => {
    isActiveRef.current = true
    startPolling()

    return () => {
      isActiveRef.current = false
      stopPolling()
    }
  }, [startPolling, stopPolling])

  // 의존성 변경 시 폴링 재시작
  useEffect(() => {
    if (isPolling) {
      stopPolling()
      startPolling()
    }
  }, [pollingFunction, interval])

  return {
    data,
    error,
    isPolling,
    isOnline,
    isVisible,
    retryCount,
    lastUpdated,
    startPolling,
    stopPolling,
    refresh,
    errorMessage: error ? errorT('E5002') : null
  }
}

/**
 * 주문 상태 폴링 훅
 */
export const useOrderPolling = (fetchOrders, interval = 10000) => {
  const [orders, setOrders] = useState([])
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  
  const { data, ...pollingState } = usePolling(
    fetchOrders,
    interval,
    {
      onSuccess: (newOrders) => {
        if (orders.length > 0) {
          const newCount = newOrders.filter(order => 
            !orders.find(existing => existing.id === order.id)
          ).length
          setNewOrdersCount(prev => prev + newCount)
        }
        setOrders(newOrders)
      },
      shouldPoll: () => typeof window !== 'undefined' // 클라이언트에서만 실행
    }
  )

  const markOrdersAsRead = useCallback(() => {
    setNewOrdersCount(0)
  }, [])

  return {
    ...pollingState,
    orders,
    newOrdersCount,
    markOrdersAsRead
  }
}

/**
 * 실시간 통계 폴링 훅
 */
export const useStatsPolling = (fetchStats, interval = 30000) => {
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    activeOrders: 0,
    avgOrderValue: 0
  })
  
  return usePolling(
    async () => {
      const data = await fetchStats()
      setStats(data)
      return data
    },
    interval,
    {
      shouldPoll: () => {
        // 업무 시간에만 폴링 (Local 시간 기준 6시-22시)
        const now = new Date()
        const vietnamTime = new Intl.DateTimeFormat('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour12: false,
          hour: 'numeric'
        }).format(now)
        
        const hour = parseInt(vietnamTime)
        return hour >= 6 && hour <= 22
      }
    }
  )
}

/**
 * POS 상태 폴링 훅
 */
export const usePOSPolling = (fetchPOSStatus, interval = 15000) => {
  const [posDevices, setPosDevices] = useState([])
  const [connectionIssues, setConnectionIssues] = useState([])
  
  return usePolling(
    async () => {
      const data = await fetchPOSStatus()
      setPosDevices(data.devices || [])
      
      // 연결 문제가 있는 기기 찾기
      const issues = data.devices?.filter(device => 
        device.status === 'offline' || device.lastHeartbeat < Date.now() - 60000
      ) || []
      setConnectionIssues(issues)
      
      return data
    },
    interval,
    {
      maxRetries: 1, // POS는 빠른 실패
      onError: (error) => {
        // POS 연결 문제 시 알림
        console.error('POS 연결 확인 실패:', error)
      }
    }
  )
}

/**
 * 재고 상태 폴링 훅
 */
export const useInventoryPolling = (fetchInventory, interval = 60000) => {
  const [inventory, setInventory] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [outOfStockItems, setOutOfStockItems] = useState([])
  
  return usePolling(
    async () => {
      const data = await fetchInventory()
      setInventory(data)
      
      // 재고 부족 및 품절 상품 분류
      const lowStock = data.filter(item => 
        item.quantity > 0 && item.quantity <= item.minQuantity
      )
      const outOfStock = data.filter(item => item.quantity === 0)
      
      setLowStockItems(lowStock)
      setOutOfStockItems(outOfStock)
      
      return data
    },
    interval,
    {
      runOnFocus: false, // 재고는 포커스시 자동 갱신 안함
      shouldPoll: () => {
        // 영업시간에만 재고 체크
        const now = new Date()
        const vietnamHour = parseInt(new Intl.DateTimeFormat('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour12: false,
          hour: 'numeric'
        }).format(now))
        
        return vietnamHour >= 8 && vietnamHour <= 23
      }
    }
  )
}

/**
 * 배달 추적 폴링 훅
 */
export const useDeliveryPolling = (fetchActiveDeliveries, interval = 20000) => {
  const [deliveries, setDeliveries] = useState([])
  const [delayedDeliveries, setDelayedDeliveries] = useState([])
  
  return usePolling(
    async () => {
      const data = await fetchActiveDeliveries()
      setDeliveries(data)
      
      // 지연된 배달 찾기 (예상 시간 + 15분 초과)
      const now = new Date()
      const delayed = data.filter(delivery => {
        const estimatedTime = new Date(delivery.estimatedDeliveryTime)
        const delayThreshold = new Date(estimatedTime.getTime() + 15 * 60000)
        return now > delayThreshold && delivery.status !== 'delivered'
      })
      
      setDelayedDeliveries(delayed)
      
      return data
    },
    interval,
    {
      shouldPoll: () => deliveries.length > 0 // 활성 배달이 있을 때만
    }
  )
}

export default usePolling