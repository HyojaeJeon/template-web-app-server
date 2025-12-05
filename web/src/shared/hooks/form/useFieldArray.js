/**
 * useFieldArray.js - 동적 필드 배열 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 동적으로 추가/제거되는 폼 필드 관리
 * - 메뉴 항목, 주문 아이템, 옵션 관리에 활용
 * - 드래그앤드롭 정렬 지원
 * - Local어 UX 메시지
 */

'use client'

import { useState, useCallback } from 'react'
import { useAppTranslation } from '../i18n/I18nProvider'

/**
 * 동적 필드 배열 훅
 * @param {Array} initialValues 초기 배열
 * @param {Object} options 옵션
 */
export const useFieldArray = (initialValues = [], options = {}) => {
  const {
    maxItems = 100,
    minItems = 0,
    defaultItem = {},
    onAdd,
    onRemove,
    onMove,
    allowDuplicates = true
  } = options

  const { t } = useAppTranslation()
  
  const [fields, setFields] = useState(initialValues.map((item, index) => ({
    id: `field_${Date.now()}_${index}`,
    value: item
  })))

  // 아이템 추가
  const append = useCallback((item = defaultItem) => {
    if (fields.length >= maxItems) {
      console.warn(`Maximum ${maxItems} items allowed`)
      return false
    }

    const newField = {
      id: `field_${Date.now()}_${Math.random()}`,
      value: { ...item }
    }

    setFields(prev => [...prev, newField])
    onAdd?.(item, fields.length)
    return true
  }, [fields.length, maxItems, defaultItem, onAdd])

  // 특정 위치에 아이템 삽입
  const insert = useCallback((index, item = defaultItem) => {
    if (fields.length >= maxItems) {
      console.warn(`Maximum ${maxItems} items allowed`)
      return false
    }

    const newField = {
      id: `field_${Date.now()}_${Math.random()}`,
      value: { ...item }
    }

    setFields(prev => {
      const newFields = [...prev]
      newFields.splice(index, 0, newField)
      return newFields
    })

    onAdd?.(item, index)
    return true
  }, [fields.length, maxItems, defaultItem, onAdd])

  // 아이템 제거
  const remove = useCallback((index) => {
    if (fields.length <= minItems) {
      console.warn(`Minimum ${minItems} items required`)
      return false
    }

    const removedField = fields[index]
    setFields(prev => prev.filter((_, i) => i !== index))
    onRemove?.(removedField?.value, index)
    return true
  }, [fields, minItems, onRemove])

  // 아이템 이동
  const move = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return

    setFields(prev => {
      const newFields = [...prev]
      const [movedItem] = newFields.splice(fromIndex, 1)
      newFields.splice(toIndex, 0, movedItem)
      return newFields
    })

    onMove?.(fromIndex, toIndex)
  }, [onMove])

  // 아이템 업데이트
  const update = useCallback((index, item) => {
    setFields(prev => prev.map((field, i) => 
      i === index ? { ...field, value: item } : field
    ))
  }, [])

  // 전체 리셋
  const reset = useCallback(() => {
    setFields(initialValues.map((item, index) => ({
      id: `field_${Date.now()}_${index}`,
      value: item
    })))
  }, [initialValues])

  // 모든 아이템 제거
  const clear = useCallback(() => {
    setFields([])
  }, [])

  // 값 배열 추출
  const values = fields.map(field => field.value)

  return {
    fields,
    values,
    append,
    insert,
    remove,
    move,
    update,
    reset,
    clear,
    
    // 상태
    length: fields.length,
    isEmpty: fields.length === 0,
    canAdd: fields.length < maxItems,
    canRemove: fields.length > minItems,
    
    // Local어 라벨
    labels: {
      add: t?.('common.add') || 'Thêm',
      remove: t?.('common.remove') || 'Xóa',
      moveUp: t?.('common.moveUp') || 'Di chuyển lên',
      moveDown: t?.('common.moveDown') || 'Di chuyển xuống',
      clear: t?.('common.clear') || 'Xóa tất cả'
    }
  }
}

/**
 * Local 메뉴 아이템용 필드 배열 훅
 */
export const useMenuFieldArray = (initialMenuItems = []) => {
  const defaultMenuItem = {
    name: '',
    name: '',
    price: 0,
    description: '',
    category: '',
    isAvailable: true,
    preparationTime: 15
  }

  const fieldArray = useFieldArray(initialMenuItems, {
    defaultItem: defaultMenuItem,
    maxItems: 200,
    minItems: 0
  })

  const addMenuItem = useCallback((menuItem) => {
    return fieldArray.append({
      ...defaultMenuItem,
      ...menuItem,
      id: `menu_${Date.now()}`
    })
  }, [fieldArray])

  return {
    ...fieldArray,
    addMenuItem,
    defaultMenuItem
  }
}

export default useFieldArray