/**
 * useReview.js - 리뷰 관리 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useAppTranslation } from '../i18n/I18nProvider'

export const useReview = (options = {}) => {
  const { apiBaseUrl = process.env.NEXT_PUBLIC_API_URL } = options
  const { t } = useAppTranslation()
  
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchReviews = useCallback(async (filters = {}) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${apiBaseUrl}/reviews?${params}`)
      const data = await response.json()
      setReviews(data.reviews || [])
      return data
    } catch (error) {
      console.error('Error fetching reviews:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [apiBaseUrl])

  const replyToReview = useCallback(async (reviewId, reply) => {
    try {
      const response = await fetch(`${apiBaseUrl}/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply })
      })
      return response.json()
    } catch (error) {
      console.error('Error replying to review:', error)
      throw error
    }
  }, [apiBaseUrl])

  const reviewStats = useMemo(() => {
    if (!reviews.length) return { averageRating: 0, totalReviews: 0 }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = totalRating / reviews.length
    
    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      distribution: {
        1: reviews.filter(r => r.rating === 1).length,
        2: reviews.filter(r => r.rating === 2).length,
        3: reviews.filter(r => r.rating === 3).length,
        4: reviews.filter(r => r.rating === 4).length,
        5: reviews.filter(r => r.rating === 5).length
      }
    }
  }, [reviews])

  return {
    reviews,
    isLoading,
    reviewStats,
    fetchReviews,
    replyToReview,
    labels: {
      reviews: t?.('review.reviews') || 'Đánh giá',
      rating: t?.('review.rating') || 'Xếp hạng',
      reply: t?.('review.reply') || 'Trả lời',
      averageRating: t?.('review.averageRating') || 'Điểm TB'
    }
  }
}

export default useReview