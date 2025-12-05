/**
 * usePromotion.js - 프로모션 관리 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 */

'use client'

import { useState, useCallback } from 'react'
import { useAppTranslation } from '../i18n/I18nProvider'

export const usePromotion = (options = {}) => {
  const { apiBaseUrl = process.env.NEXT_PUBLIC_API_URL } = options
  const { t } = useAppTranslation()
  
  const [promotions, setPromotions] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchPromotions = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${apiBaseUrl}/promotions`)
      const data = await response.json()
      setPromotions(data)
      return data
    } catch (error) {
      console.error('Error fetching promotions:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [apiBaseUrl])

  const createPromotion = useCallback(async (promotionData) => {
    try {
      const response = await fetch(`${apiBaseUrl}/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promotionData)
      })
      return response.json()
    } catch (error) {
      console.error('Error creating promotion:', error)
      throw error
    }
  }, [apiBaseUrl])

  const validatePromoCode = useCallback(async (code, orderTotal) => {
    try {
      const response = await fetch(`${apiBaseUrl}/promotions/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderTotal })
      })
      return response.json()
    } catch (error) {
      console.error('Error validating promo code:', error)
      throw error
    }
  }, [apiBaseUrl])

  return {
    promotions,
    isLoading,
    fetchPromotions,
    createPromotion,
    validatePromoCode,
    labels: {
      promotion: t?.('promotion.promotion') || 'Khuyến mãi',
      discount: t?.('promotion.discount') || 'Giảm giá',
      validUntil: t?.('promotion.validUntil') || 'Có hiệu lực đến'
    }
  }
}

export default usePromotion