/**
 * useInventory.js - 재고 관리 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 */

'use client'

import { useState, useCallback } from 'react'
import { useAppTranslation } from '../i18n/I18nProvider'

export const useInventory = (options = {}) => {
  const { apiBaseUrl = process.env.NEXT_PUBLIC_API_URL } = options
  const { t } = useAppTranslation()
  
  const [inventory, setInventory] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchInventory = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${apiBaseUrl}/inventory`)
      const data = await response.json()
      setInventory(data)
      return data
    } catch (error) {
      console.error('Error fetching inventory:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [apiBaseUrl])

  const updateStock = useCallback(async (itemId, quantity) => {
    try {
      const response = await fetch(`${apiBaseUrl}/inventory/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      })
      return response.json()
    } catch (error) {
      console.error('Error updating stock:', error)
      throw error
    }
  }, [apiBaseUrl])

  return {
    inventory,
    isLoading,
    fetchInventory,
    updateStock,
    labels: {
      stock: t?.('inventory.stock') || 'Tồn kho',
      lowStock: t?.('inventory.lowStock') || 'Sắp hết hàng',
      outOfStock: t?.('inventory.outOfStock') || 'Hết hàng'
    }
  }
}

export default useInventory