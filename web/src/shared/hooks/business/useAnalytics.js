/**
 * useAnalytics.js - 분석 데이터 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 매출 및 주문 분석 데이터
 * - Local 특화 KPI 및 지표
 * - 실시간 대시보드 데이터
 * - 차트용 데이터 변환
 * - 비교 분석 (전일/전주/전월)
 * - 예측 분석 및 트렌드
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAppTranslation } from '../i18n/I18nProvider'
import { formatVND } from '../utils/vietnam'

/**
 * 분석 데이터 훅
 * @param {Object} options 옵션
 */
export const useAnalytics = (options = {}) => {
  const {
    apiBaseUrl = process.env.NEXT_PUBLIC_API_URL,
    defaultPeriod = '7d',
    enableRealTime = true,
    refreshInterval = 300000, // 5분마다 갱신
    onDataUpdate
  } = options

  const { t } = useAppTranslation()
  
  const [analyticsData, setAnalyticsData] = useState({})
  const [revenueData, setRevenueData] = useState([])
  const [orderData, setOrderData] = useState([])
  const [customerData, setCustomerData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod)

  // 기본 분석 데이터 조회
  const fetchAnalytics = useCallback(async (period = selectedPeriod, filters = {}) => {
    try {
      setIsLoading(true)
      setAnalyticsError(null)

      const params = new URLSearchParams({ period, ...filters })
      const response = await fetch(`${apiBaseUrl}/analytics/overview?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const data = await response.json()
      setAnalyticsData(data)
      onDataUpdate?.(data)

      return data
    } catch (error) {
      setAnalyticsError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [apiBaseUrl, selectedPeriod, onDataUpdate])

  // 매출 데이터 조회
  const fetchRevenueData = useCallback(async (period = selectedPeriod) => {
    try {
      const response = await fetch(`${apiBaseUrl}/analytics/revenue?period=${period}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch revenue data')
      }

      const data = await response.json()
      setRevenueData(data.dailyRevenue || [])
      
      return data
    } catch (error) {
      console.error('Error fetching revenue data:', error)
      throw error
    }
  }, [apiBaseUrl, selectedPeriod])

  // 주문 데이터 조회
  const fetchOrderData = useCallback(async (period = selectedPeriod) => {
    try {
      const response = await fetch(`${apiBaseUrl}/analytics/orders?period=${period}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch order data')
      }

      const data = await response.json()
      setOrderData(data.dailyOrders || [])
      
      return data
    } catch (error) {
      console.error('Error fetching order data:', error)
      throw error
    }
  }, [apiBaseUrl, selectedPeriod])

  // 고객 데이터 조회
  const fetchCustomerData = useCallback(async (period = selectedPeriod) => {
    try {
      const response = await fetch(`${apiBaseUrl}/analytics/customers?period=${period}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch customer data')
      }

      const data = await response.json()
      setCustomerData(data.customerInsights || [])
      
      return data
    } catch (error) {
      console.error('Error fetching customer data:', error)
      throw error
    }
  }, [apiBaseUrl, selectedPeriod])

  // Local 특화 KPI 계산
  const vietnameseKPIs = useMemo(() => {
    if (!analyticsData || !analyticsData.summary) return {}

    const summary = analyticsData.summary
    
    return {
      // 일일 평균 매출 (VND)
      avgDailyRevenue: summary.totalRevenue / (summary.periodDays || 1),
      
      // 주문당 평균 금액 (VND)
      avgOrderValue: summary.totalRevenue / (summary.totalOrders || 1),
      
      // 고객당 평균 주문 수
      avgOrdersPerCustomer: summary.totalOrders / (summary.uniqueCustomers || 1),
      
      // 시간당 주문 수 (영업시간 기준)
      ordersPerHour: summary.totalOrders / ((summary.periodDays || 1) * 12), // 12시간 영업 기준
      
      // 배달 성공률
      deliverySuccessRate: (summary.deliveredOrders / (summary.totalOrders || 1)) * 100,
      
      // 고객 재방문율
      customerReturnRate: (summary.returningCustomers / (summary.uniqueCustomers || 1)) * 100,
      
      // Local 세금 총액 (10% VAT)
      totalTaxCollected: summary.totalRevenue * 0.1,
      
      // 평균 준비 시간 (분)
      avgPreparationTime: summary.avgPreparationTime || 0,
      
      // 피크 시간 매출 비율
      peakHourRevenueRatio: (summary.peakHourRevenue / (summary.totalRevenue || 1)) * 100
    }
  }, [analyticsData])

  // 차트용 데이터 변환
  const chartData = useMemo(() => {
    return {
      // 매출 차트 데이터
      revenueChart: {
        labels: revenueData.map(item => 
          new Date(item.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
        ),
        datasets: [{
          label: t?.('analytics.revenue') || 'Doanh thu',
          data: revenueData.map(item => item.revenue),
          borderColor: '#2AC1BC',
          backgroundColor: 'rgba(42, 193, 188, 0.1)',
          tension: 0.4
        }]
      },
      
      // 주문 수 차트 데이터
      orderChart: {
        labels: orderData.map(item => 
          new Date(item.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
        ),
        datasets: [{
          label: t?.('analytics.orders') || 'Đơn hàng',
          data: orderData.map(item => item.count),
          borderColor: '#00B14F',
          backgroundColor: 'rgba(0, 177, 79, 0.1)',
          tension: 0.4
        }]
      },
      
      // 고객 분포 파이 차트
      customerPieChart: {
        labels: [
          t?.('analytics.newCustomers') || 'Khách hàng mới',
          t?.('analytics.returningCustomers') || 'Khách hàng cũ'
        ],
        datasets: [{
          data: [
            analyticsData.summary?.newCustomers || 0,
            analyticsData.summary?.returningCustomers || 0
          ],
          backgroundColor: ['#2AC1BC', '#00B14F']
        }]
      }
    }
  }, [revenueData, orderData, analyticsData, t])

  // 비교 분석 데이터
  const comparisonData = useMemo(() => {
    if (!analyticsData.comparison) return {}

    const current = analyticsData.summary
    const previous = analyticsData.comparison
    
    const calculateChange = (current, previous) => {
      if (!previous || previous === 0) return 0
      return ((current - previous) / previous) * 100
    }

    return {
      revenueChange: calculateChange(current?.totalRevenue, previous?.totalRevenue),
      orderChange: calculateChange(current?.totalOrders, previous?.totalOrders),
      customerChange: calculateChange(current?.uniqueCustomers, previous?.uniqueCustomers),
      avgOrderValueChange: calculateChange(
        current?.totalRevenue / current?.totalOrders,
        previous?.totalRevenue / previous?.totalOrders
      )
    }
  }, [analyticsData])

  // 인기 메뉴 분석
  const topMenuItems = useMemo(() => {
    return analyticsData.topMenuItems?.map((item, index) => ({
      rank: index + 1,
      ...item,
      revenuePercentage: (item.revenue / (analyticsData.summary?.totalRevenue || 1)) * 100,
      formattedRevenue: formatVND(item.revenue)
    })) || []
  }, [analyticsData])

  // 시간대별 분석
  const hourlyAnalysis = useMemo(() => {
    if (!analyticsData.hourlyData) return []

    return analyticsData.hourlyData.map(hour => ({
      ...hour,
      label: `${hour.hour}:00`,
      revenuePercentage: (hour.revenue / (analyticsData.summary?.totalRevenue || 1)) * 100,
      orderPercentage: (hour.orders / (analyticsData.summary?.totalOrders || 1)) * 100
    }))
  }, [analyticsData])

  // Local 특화 인사이트 생성
  const generateInsights = useCallback(() => {
    const insights = []
    const kpi = vietnameseKPIs
    const comparison = comparisonData

    // 매출 트렌드 인사이트
    if (comparison.revenueChange > 10) {
      insights.push({
        type: 'positive',
        message: `Doanh thu tăng ${comparison.revenueChange.toFixed(1)}% so với kỳ trước!`,
        action: 'Tiếp tục duy trì chất lượng dịch vụ'
      })
    } else if (comparison.revenueChange < -10) {
      insights.push({
        type: 'negative',
        message: `Doanh thu giảm ${Math.abs(comparison.revenueChange).toFixed(1)}% so với kỳ trước`,
        action: 'Xem xét chạy chương trình khuyến mãi'
      })
    }

    // 주문 평균 금액 인사이트
    if (kpi.avgOrderValue < 100000) {
      insights.push({
        type: 'warning',
        message: 'Giá trị đơn hàng trung bình thấp',
        action: 'Khuyến khích khách đặt combo hoặc món phụ'
      })
    }

    // 배달 성공률 인사이트
    if (kpi.deliverySuccessRate < 95) {
      insights.push({
        type: 'warning',
        message: `Tỷ lệ giao hàng thành công: ${kpi.deliverySuccessRate.toFixed(1)}%`,
        action: 'Cải thiện quy trình giao hàng và đào tạo shipper'
      })
    }

    // 고객 재방문율 인사이트
    if (kpi.customerReturnRate > 60) {
      insights.push({
        type: 'positive',
        message: `Tỷ lệ khách hàng quay lại cao: ${kpi.customerReturnRate.toFixed(1)}%`,
        action: 'Tập trung vào chương trình loyalty'
      })
    }

    return insights
  }, [vietnameseKPIs, comparisonData])

  // 예측 데이터 조회
  const fetchForecastData = useCallback(async (type = 'revenue', days = 7) => {
    try {
      const response = await fetch(`${apiBaseUrl}/analytics/forecast?type=${type}&days=${days}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch forecast data')
      }

      const data = await response.json()
      return data.forecast || []
    } catch (error) {
      console.error('Error fetching forecast data:', error)
      throw error
    }
  }, [apiBaseUrl])

  // 맞춤형 리포트 생성
  const generateCustomReport = useCallback(async (reportConfig) => {
    try {
      const response = await fetch(`${apiBaseUrl}/analytics/custom-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportConfig)
      })

      if (!response.ok) {
        throw new Error('Failed to generate custom report')
      }

      const report = await response.json()
      return report
    } catch (error) {
      console.error('Error generating custom report:', error)
      throw error
    }
  }, [apiBaseUrl])

  // 전체 데이터 새로고침
  const refreshAllData = useCallback(async (period = selectedPeriod) => {
    try {
      await Promise.all([
        fetchAnalytics(period),
        fetchRevenueData(period),
        fetchOrderData(period),
        fetchCustomerData(period)
      ])
    } catch (error) {
      console.error('Error refreshing analytics data:', error)
    }
  }, [selectedPeriod, fetchAnalytics, fetchRevenueData, fetchOrderData, fetchCustomerData])

  // 실시간 갱신 설정
  useEffect(() => {
    let intervalId

    if (enableRealTime && refreshInterval > 0) {
      intervalId = setInterval(() => {
        refreshAllData()
      }, refreshInterval)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [enableRealTime, refreshInterval, refreshAllData])

  // 초기 데이터 로드
  useEffect(() => {
    refreshAllData()
  }, [selectedPeriod])

  return {
    // 상태
    analyticsData,
    revenueData,
    orderData,
    customerData,
    isLoading,
    analyticsError,
    selectedPeriod,
    
    // KPI 및 계산된 데이터
    vietnameseKPIs,
    chartData,
    comparisonData,
    topMenuItems,
    hourlyAnalysis,
    
    // 액션
    fetchAnalytics,
    fetchRevenueData,
    fetchOrderData,
    fetchCustomerData,
    fetchForecastData,
    generateCustomReport,
    refreshAllData,
    setSelectedPeriod,
    
    // 인사이트 및 예측
    insights: generateInsights(),
    
    // Local어 라벨
    labels: {
      revenue: t?.('analytics.revenue') || 'Doanh thu',
      orders: t?.('analytics.orders') || 'Đơn hàng',
      customers: t?.('analytics.customers') || 'Khách hàng',
      avgOrderValue: t?.('analytics.avgOrderValue') || 'Giá trị TB/đơn',
      deliveryRate: t?.('analytics.deliveryRate') || 'Tỷ lệ giao hàng',
      returnRate: t?.('analytics.returnRate') || 'Tỷ lệ quay lại',
      topItems: t?.('analytics.topItems') || 'Món bán chạy',
      insights: t?.('analytics.insights') || 'Thông tin chi tiết',
      forecast: t?.('analytics.forecast') || 'Dự báo',
      today: t?.('analytics.today') || 'Hôm nay',
      yesterday: t?.('analytics.yesterday') || 'Hôm qua',
      thisWeek: t?.('analytics.thisWeek') || 'Tuần này',
      thisMonth: t?.('analytics.thisMonth') || 'Tháng này'
    }
  }
}

export default useAnalytics