/**
 * useCart.js - 장바구니 관리 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 장바구니 상태 관리 및 지속성
 * - 메뉴 옵션 및 가격 계산
 * - Local VND 화폐 처리
 * - 할인 및 프로모션 적용
 * - 배달비 및 세금 계산
 * - 재고 확인 및 제한
 */

'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAppTranslation } from '../i18n/I18nProvider'
import { formatVND, calculateVietnamTax } from '../utils/vietnam'

const CART_STORAGE_KEY = 'delivery_cart'
const CART_EXPIRY_TIME = 24 * 60 * 60 * 1000 // 24시간

/**
 * 장바구니 관리 훅
 * @param {Object} options 옵션
 */
export const useCart = (options = {}) => {
  const {
    persistCart = true,
    autoSave = true,
    maxItems = 50,
    onCartChange,
    onItemAdded,
    onItemRemoved,
    onCartCleared
  } = options

  const { t } = useAppTranslation()
  
  const [items, setItems] = useState([])
  const [appliedPromos, setAppliedPromos] = useState([])
  const [deliveryInfo, setDeliveryInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cartError, setCartError] = useState(null)
  
  const saveTimeoutRef = useRef(null)

  // 장바구니 데이터 로컬 저장
  const saveCartToStorage = useCallback((cartData) => {
    if (!persistCart || typeof window === 'undefined') return

    try {
      const dataToSave = {
        ...cartData,
        timestamp: Date.now(),
        expiresAt: Date.now() + CART_EXPIRY_TIME
      }
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(dataToSave))
    } catch (error) {
      console.error('Failed to save cart to storage:', error)
    }
  }, [persistCart])

  // 장바구니 데이터 로컬 복구
  const loadCartFromStorage = useCallback(() => {
    if (!persistCart || typeof window === 'undefined') return null

    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      if (!saved) return null

      const cartData = JSON.parse(saved)
      
      // 만료 시간 확인
      if (cartData.expiresAt && Date.now() > cartData.expiresAt) {
        localStorage.removeItem(CART_STORAGE_KEY)
        return null
      }

      return {
        items: cartData.items || [],
        appliedPromos: cartData.appliedPromos || [],
        deliveryInfo: cartData.deliveryInfo || null
      }
    } catch (error) {
      console.error('Failed to load cart from storage:', error)
      return null
    }
  }, [persistCart])

  // 디바운스된 저장
  const debouncedSave = useCallback((cartData) => {
    if (!autoSave) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveCartToStorage(cartData)
    }, 1000)
  }, [autoSave, saveCartToStorage])

  // 아이템 추가
  const addItem = useCallback((menuItem, options = {}) => {
    const {
      quantity = 1,
      selectedOptions = [],
      specialInstructions = '',
      checkStock = true
    } = options

    setIsLoading(true)
    setCartError(null)

    try {
      // 재고 확인
      if (checkStock && menuItem.stock !== undefined && menuItem.stock < quantity) {
        throw new Error(t?.('cart.insufficientStock') || 'Không đủ hàng trong kho')
      }

      // 최대 아이템 수 확인
      if (items.length >= maxItems) {
        throw new Error(t?.('cart.maxItemsReached') || `Không thể thêm quá ${maxItems} món`)
      }

      const cartItemId = `${menuItem.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // 옵션 가격 계산
      const optionsPrice = selectedOptions.reduce((total, option) => {
        return total + (option.price || 0)
      }, 0)

      const newItem = {
        id: cartItemId,
        menuItemId: menuItem.id,
        name: menuItem.name,
        name: menuItem.name,
        basePrice: menuItem.price,
        optionsPrice,
        totalPrice: (menuItem.price + optionsPrice) * quantity,
        quantity,
        selectedOptions,
        specialInstructions,
        addedAt: Date.now(),
        image: menuItem.image,
        category: menuItem.category,
        preparationTime: menuItem.preparationTime || 15
      }

      setItems(prevItems => {
        const updatedItems = [...prevItems, newItem]
        const cartData = { items: updatedItems, appliedPromos, deliveryInfo }
        debouncedSave(cartData)
        onCartChange?.(cartData)
        onItemAdded?.(newItem)
        return updatedItems
      })

    } catch (error) {
      setCartError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [items.length, maxItems, appliedPromos, deliveryInfo, debouncedSave, onCartChange, onItemAdded, t])

  // 아이템 제거
  const removeItem = useCallback((itemId) => {
    setItems(prevItems => {
      const itemToRemove = prevItems.find(item => item.id === itemId)
      const updatedItems = prevItems.filter(item => item.id !== itemId)
      
      const cartData = { items: updatedItems, appliedPromos, deliveryInfo }
      debouncedSave(cartData)
      onCartChange?.(cartData)
      onItemRemoved?.(itemToRemove)
      
      return updatedItems
    })
  }, [appliedPromos, deliveryInfo, debouncedSave, onCartChange, onItemRemoved])

  // 아이템 수량 업데이트
  const updateItemQuantity = useCallback((itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(itemId)
      return
    }

    setItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item.id === itemId) {
          const updatedItem = {
            ...item,
            quantity: newQuantity,
            totalPrice: (item.basePrice + item.optionsPrice) * newQuantity
          }
          return updatedItem
        }
        return item
      })
      
      const cartData = { items: updatedItems, appliedPromos, deliveryInfo }
      debouncedSave(cartData)
      onCartChange?.(cartData)
      
      return updatedItems
    })
  }, [removeItem, appliedPromos, deliveryInfo, debouncedSave, onCartChange])

  // 아이템 특별 요청 업데이트
  const updateItemInstructions = useCallback((itemId, instructions) => {
    setItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item.id === itemId) {
          return { ...item, specialInstructions: instructions }
        }
        return item
      })
      
      const cartData = { items: updatedItems, appliedPromos, deliveryInfo }
      debouncedSave(cartData)
      onCartChange?.(cartData)
      
      return updatedItems
    })
  }, [appliedPromos, deliveryInfo, debouncedSave, onCartChange])

  // 프로모션 적용
  const applyPromotion = useCallback((promo) => {
    setAppliedPromos(prevPromos => {
      // 중복 프로모션 확인
      const isAlreadyApplied = prevPromos.some(p => p.id === promo.id)
      if (isAlreadyApplied) return prevPromos

      const updatedPromos = [...prevPromos, promo]
      const cartData = { items, appliedPromos: updatedPromos, deliveryInfo }
      debouncedSave(cartData)
      onCartChange?.(cartData)
      
      return updatedPromos
    })
  }, [items, deliveryInfo, debouncedSave, onCartChange])

  // 프로모션 제거
  const removePromotion = useCallback((promoId) => {
    setAppliedPromos(prevPromos => {
      const updatedPromos = prevPromos.filter(promo => promo.id !== promoId)
      const cartData = { items, appliedPromos: updatedPromos, deliveryInfo }
      debouncedSave(cartData)
      onCartChange?.(cartData)
      
      return updatedPromos
    })
  }, [items, deliveryInfo, debouncedSave, onCartChange])

  // 배달 정보 설정
  const setDeliveryInformation = useCallback((info) => {
    setDeliveryInfo(info)
    const cartData = { items, appliedPromos, deliveryInfo: info }
    debouncedSave(cartData)
    onCartChange?.(cartData)
  }, [items, appliedPromos, debouncedSave, onCartChange])

  // 장바구니 전체 삭제
  const clearCart = useCallback(() => {
    setItems([])
    setAppliedPromos([])
    setDeliveryInfo(null)
    setCartError(null)
    
    if (persistCart && typeof window !== 'undefined') {
      localStorage.removeItem(CART_STORAGE_KEY)
    }
    
    onCartCleared?.()
  }, [persistCart, onCartCleared])

  // 가격 계산
  const calculations = useMemo(() => {
    const subtotal = items.reduce((total, item) => total + item.totalPrice, 0)
    
    // 프로모션 할인 계산
    let promoDiscount = 0
    appliedPromos.forEach(promo => {
      if (promo.type === 'percentage') {
        promoDiscount += subtotal * (promo.value / 100)
      } else if (promo.type === 'fixed') {
        promoDiscount += promo.value
      }
    })
    
    // 최대 할인 제한
    promoDiscount = Math.min(promoDiscount, subtotal * 0.8) // 최대 80% 할인
    
    const discountedSubtotal = subtotal - promoDiscount
    
    // 배달비 계산
    let deliveryFee = 0
    if (deliveryInfo?.deliveryMethod === 'delivery') {
      const distance = deliveryInfo.distance || 0
      const baseFee = 15000 // 기본 15,000 VND
      const extraFee = Math.max(0, distance - 3) * 3000 // 3km 초과 시 km당 3,000 VND
      deliveryFee = baseFee + extraFee
      
      // 무료 배달 조건
      if (discountedSubtotal >= 200000) { // 20만 VND 이상 시 무료
        deliveryFee = 0
      }
    }
    
    // Local VAT (10%)
    const tax = calculateVietnamTax(discountedSubtotal + deliveryFee)
    
    const total = discountedSubtotal + deliveryFee + tax
    
    return {
      subtotal,
      promoDiscount,
      discountedSubtotal,
      deliveryFee,
      tax,
      total,
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
      averagePreparationTime: items.length > 0 
        ? Math.ceil(items.reduce((total, item) => total + item.preparationTime, 0) / items.length)
        : 0
    }
  }, [items, appliedPromos, deliveryInfo])

  // 장바구니 검증
  const validateCart = useCallback(() => {
    const errors = []
    
    if (items.length === 0) {
      errors.push(t?.('cart.empty') || 'Giỏ hàng trống')
    }
    
    // 최소 주문 금액 확인 (5만 VND)
    if (calculations.subtotal < 50000) {
      errors.push(t?.('cart.minimumOrder') || 'Đơn hàng tối thiểu 50,000₫')
    }
    
    // 배달 정보 확인
    if (deliveryInfo?.deliveryMethod === 'delivery' && !deliveryInfo?.address) {
      errors.push(t?.('cart.deliveryAddressRequired') || 'Vui lòng nhập địa chỉ giao hàng')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }, [items.length, calculations.subtotal, deliveryInfo, t])

  // 초기화 시 저장된 장바구니 복구
  useEffect(() => {
    const savedCart = loadCartFromStorage()
    if (savedCart) {
      setItems(savedCart.items || [])
      setAppliedPromos(savedCart.appliedPromos || [])
      setDeliveryInfo(savedCart.deliveryInfo || null)
    }
  }, [loadCartFromStorage])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    // 상태
    items,
    appliedPromos,
    deliveryInfo,
    isLoading,
    cartError,
    calculations,
    
    // 액션
    addItem,
    removeItem,
    updateItemQuantity,
    updateItemInstructions,
    applyPromotion,
    removePromotion,
    setDeliveryInformation,
    clearCart,
    
    // 유틸리티
    validateCart,
    saveCartToStorage: () => saveCartToStorage({ items, appliedPromos, deliveryInfo }),
    
    // 상태 확인
    isEmpty: items.length === 0,
    hasDelivery: deliveryInfo?.deliveryMethod === 'delivery',
    isValidForCheckout: validateCart().isValid,
    
    // Local어 라벨
    labels: {
      add: t?.('cart.add') || 'Thêm vào giỏ',
      remove: t?.('cart.remove') || 'Xóa',
      clear: t?.('cart.clear') || 'Xóa tất cả',
      checkout: t?.('cart.checkout') || 'Thanh toán',
      subtotal: t?.('cart.subtotal') || 'Tạm tính',
      discount: t?.('cart.discount') || 'Giảm giá',
      delivery: t?.('cart.delivery') || 'Phí giao hàng',
      tax: t?.('cart.tax') || 'VAT (10%)',
      total: t?.('cart.total') || 'Tổng cộng',
      empty: t?.('cart.empty') || 'Giỏ hàng trống',
      itemCount: (count) => t?.('cart.itemCount', { count }) || `${count} món`
    }
  }
}

/**
 * Local 특화 장바구니 훅 (점주용)
 */
export const useStoreCart = () => {
  const cart = useCart({
    persistCart: true,
    maxItems: 100, // 점주는 더 많은 아이템 추가 가능
    autoSave: true
  })

  // 점주 전용 기능들
  const addBulkItems = useCallback(async (menuItems) => {
    const results = []
    
    for (const menuItem of menuItems) {
      try {
        await cart.addItem(menuItem)
        results.push({ success: true, item: menuItem })
      } catch (error) {
        results.push({ success: false, item: menuItem, error: error.message })
      }
    }
    
    return results
  }, [cart.addItem])

  const exportCart = useCallback(() => {
    return {
      items: cart.items,
      calculations: cart.calculations,
      appliedPromos: cart.appliedPromos,
      deliveryInfo: cart.deliveryInfo,
      exportedAt: new Date().toISOString()
    }
  }, [cart])

  return {
    ...cart,
    addBulkItems,
    exportCart
  }
}

export default useCart