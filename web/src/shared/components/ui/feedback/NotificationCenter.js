'use client'

/**
 * 알림 센터 컴포넌트 (WCAG 2.1 준수)
 * 스택형 토스트 관리 시스템 + 필터링 및 검색 기능
 * Local App 디자인 가이드라인 적용
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Array} props.notifications - 알림 목록
 * @param {Function} props.onRemove - 알림 제거 콜백
 * @param {number} [props.maxNotifications=5] - 최대 알림 개수
 * @param {'top-right'|'top-left'|'bottom-right'|'bottom-left'} [props.position='top-right'] - 알림 위치
 * @param {boolean} [props.enableFiltering=false] - 필터링 기능 활성화
 * @param {boolean} [props.enableSearch=false] - 검색 기능 활성화
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from '@/shared/i18n'
import { 
  Search, 
  Filter, 
  X, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Bell,
  Eye,
  EyeOff,
  Calendar,
  User,
  Settings,
  Trash2
} from 'lucide-react'
import { Button, IconButton } from '../buttons'
import { TextInput } from '../inputs'
import { EnhancedModal } from '../modals'
import { Badge } from '../display'
import { Dropdown } from '../navigation/Dropdown'

const NotificationCenter = ({
  notifications = [],
  onRemove,
  maxNotifications = 5,
  position = 'top-right',
  enableFiltering = false,
  enableSearch = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  showNotificationHistory = false
}) => {
  const { t, i18n } = useTranslation()
  const isVietnamese = i18n.language === 'vi'
  
  // 상태 관리
  const [visibleNotifications, setVisibleNotifications] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    type: 'all', // 'all', 'success', 'error', 'warning', 'info'
    status: 'all', // 'all', 'read', 'unread'
    priority: 'all', // 'all', 'high', 'medium', 'low'
    dateRange: 'all', // 'all', 'today', 'week', 'month'
    source: 'all' // 'all', 'orders', 'payments', 'system', 'customers'
  })
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // 알림 통계
  const notificationStats = useMemo(() => {
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {
        success: notifications.filter(n => n.type === 'success').length,
        error: notifications.filter(n => n.type === 'error').length,
        warning: notifications.filter(n => n.type === 'warning').length,
        info: notifications.filter(n => n.type === 'info').length
      },
      bySource: {
        orders: notifications.filter(n => n.source === 'orders').length,
        payments: notifications.filter(n => n.source === 'payments').length,
        system: notifications.filter(n => n.source === 'system').length,
        customers: notifications.filter(n => n.source === 'customers').length
      }
    }
    return stats
  }, [notifications])

  // 필터링된 알림
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications]

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(notification =>
        notification.message?.toLowerCase().includes(query) ||
        notification.title?.toLowerCase().includes(query) ||
        notification.source?.toLowerCase().includes(query)
      )
    }

    // 타입 필터
    if (selectedFilters.type !== 'all') {
      filtered = filtered.filter(n => n.type === selectedFilters.type)
    }

    // 상태 필터 (읽음/안읽음)
    if (selectedFilters.status !== 'all') {
      filtered = filtered.filter(n => 
        selectedFilters.status === 'read' ? n.read : !n.read
      )
    }

    // 우선순위 필터
    if (selectedFilters.priority !== 'all') {
      filtered = filtered.filter(n => n.priority === selectedFilters.priority)
    }

    // 날짜 범위 필터
    if (selectedFilters.dateRange !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (selectedFilters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
      }
      
      filtered = filtered.filter(n => 
        new Date(n.timestamp) >= filterDate
      )
    }

    // 소스 필터
    if (selectedFilters.source !== 'all') {
      filtered = filtered.filter(n => n.source === selectedFilters.source)
    }

    return filtered
  }, [notifications, searchQuery, selectedFilters])

  useEffect(() => {
    // 최대 알림 개수 제한 (필터링 적용)
    const limited = filteredNotifications.slice(0, maxNotifications)
    setVisibleNotifications(limited)
  }, [filteredNotifications, maxNotifications])

  // 알림 제거 핸들러
  const handleRemove = useCallback((notificationId) => {
    onRemove?.(notificationId)
  }, [onRemove])

  // 읽음 처리
  const handleMarkAsRead = useCallback((notificationId) => {
    onMarkAsRead?.(notificationId)
  }, [onMarkAsRead])

  // 모두 읽음 처리
  const handleMarkAllAsRead = useCallback(() => {
    onMarkAllAsRead?.()
  }, [onMarkAllAsRead])

  // 모두 삭제
  const handleClearAll = useCallback(() => {
    onClearAll?.()
  }, [onClearAll])

  // 필터 초기화
  const resetFilters = useCallback(() => {
    setSelectedFilters({
      type: 'all',
      status: 'all', 
      priority: 'all',
      dateRange: 'all',
      source: 'all'
    })
    setSearchQuery('')
  }, [])

  // 필터 적용
  const applyFilter = useCallback((filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }, [])

  // 위치별 컨테이너 스타일
  const getContainerStyles = () => {
    const baseStyles = 'fixed z-50 flex flex-col gap-2 pointer-events-none'
    
    switch (position) {
      case 'top-left':
        return `${baseStyles} top-4 left-4`
      case 'top-right':
      default:
        return `${baseStyles} top-4 right-4`
      case 'bottom-left':
        return `${baseStyles} bottom-4 left-4 flex-col-reverse`
      case 'bottom-right':
        return `${baseStyles} bottom-4 right-4 flex-col-reverse`
    }
  }

  // 확장된 알림 센터 모드
  if (enableFiltering || enableSearch || showNotificationHistory) {
    return (
      <>
        {/* 기본 토스트 알림들 */}
        {visibleNotifications.length > 0 && (
          <div 
            className={getContainerStyles()}
            role="region"
            aria-label="알림 센터"
            aria-live="polite"
          >
            {visibleNotifications.map((notification, index) => (
              <div
                key={notification.id}
                className="pointer-events-auto transform transition-all duration-300 ease-out"
                style={{
                  animationDelay: `${index * 100}ms`,
                  zIndex: 50 - index
                }}
              >
                <NotificationCard
                  notification={notification}
                  onClose={() => handleRemove(notification.id)}
                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* 알림 센터 헤더 (상단 고정) */}
        <div className="fixed top-0 right-0 p-4 z-50 pointer-events-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[300px]">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {isVietnamese ? 'Trung tâm thông báo' : '알림 센터'}
                </h3>
                {notificationStats.unread > 0 && (
                  <Badge variant="error" size="small">
                    {notificationStats.unread}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {enableSearch && (
                  <IconButton
                    icon={<Search className="w-4 h-4" />}
                    variant="ghost"
                    size="small"
                    onClick={() => setShowHistoryModal(true)}
                    aria-label={isVietnamese ? 'Tìm kiếm' : '검색'}
                  />
                )}
                
                {enableFiltering && (
                  <IconButton
                    icon={<Filter className="w-4 h-4" />}
                    variant="ghost"
                    size="small"
                    onClick={() => setShowFilterModal(true)}
                    aria-label={isVietnamese ? 'Bộ lọc' : '필터'}
                  />
                )}
                
                <IconButton
                  icon={<Eye className="w-4 h-4" />}
                  variant="ghost"
                  size="small"
                  onClick={handleMarkAllAsRead}
                  aria-label={isVietnamese ? 'Đánh dấu tất cả đã đọc' : '모두 읽음'}
                />
                
                <IconButton
                  icon={<Trash2 className="w-4 h-4" />}
                  variant="ghost"
                  size="small"
                  onClick={handleClearAll}
                  aria-label={isVietnamese ? 'Xóa tất cả' : '모두 삭제'}
                  className="text-red-600 hover:text-red-700"
                />
              </div>
            </div>

            {/* 통계 요약 */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <div className="text-lg font-bold text-blue-600">{notificationStats.total}</div>
                <div className="text-xs text-blue-700 dark:text-blue-400">
                  {isVietnamese ? 'Tổng' : '전체'}
                </div>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                <div className="text-lg font-bold text-red-600">{notificationStats.unread}</div>
                <div className="text-xs text-red-700 dark:text-red-400">
                  {isVietnamese ? 'Chưa đọc' : '안읽음'}
                </div>
              </div>
              <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <div className="text-lg font-bold text-yellow-600">{notificationStats.byType.warning}</div>
                <div className="text-xs text-yellow-700 dark:text-yellow-400">
                  {isVietnamese ? 'Cảnh báo' : '경고'}
                </div>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                <div className="text-lg font-bold text-red-600">{notificationStats.byType.error}</div>
                <div className="text-xs text-red-700 dark:text-red-400">
                  {isVietnamese ? 'Lỗi' : '오류'}
                </div>
              </div>
            </div>

            {/* 빠른 필터 버튼들 */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                size="small"
                variant={selectedFilters.status === 'unread' ? 'primary' : 'ghost'}
                onClick={() => applyFilter('status', selectedFilters.status === 'unread' ? 'all' : 'unread')}
              >
                {isVietnamese ? 'Chưa đọc' : '안읽음'} ({notificationStats.unread})
              </Button>
              <Button
                size="small"
                variant={selectedFilters.type === 'error' ? 'primary' : 'ghost'}
                onClick={() => applyFilter('type', selectedFilters.type === 'error' ? 'all' : 'error')}
              >
                {isVietnamese ? 'Lỗi' : '오류'} ({notificationStats.byType.error})
              </Button>
              <Button
                size="small"
                variant={selectedFilters.dateRange === 'today' ? 'primary' : 'ghost'}
                onClick={() => applyFilter('dateRange', selectedFilters.dateRange === 'today' ? 'all' : 'today')}
              >
                {isVietnamese ? 'Hôm nay' : '오늘'}
              </Button>
            </div>
            
            {/* 최근 알림 미리보기 */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {visibleNotifications.slice(0, 3).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    notification.read 
                      ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  } hover:bg-gray-100 dark:hover:bg-gray-700`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {notification.title || notification.message}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(notification.timestamp).toLocaleString(isVietnamese ? 'vi-VN' : 'ko-KR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                      <IconButton
                        icon={<X className="w-3 h-3" />}
                        variant="ghost"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemove(notification.id)
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredNotifications.length > 3 && (
              <div className="mt-3 text-center">
                <Button
                  size="small"
                  variant="ghost"
                  onClick={() => setShowHistoryModal(true)}
                >
                  {isVietnamese ? `Xem tất cả ${filteredNotifications.length} thông báo` : `${filteredNotifications.length}개 알림 모두 보기`}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 필터 모달 */}
        <EnhancedModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          title={isVietnamese ? 'Bộ lọc thông báo' : '알림 필터'}
          size="medium"
        >
          <div className="space-y-6">
            {/* 알림 타입 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isVietnamese ? 'Loại thông báo' : '알림 타입'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'all', label: isVietnamese ? 'Tất cả' : '전체' },
                  { value: 'success', label: isVietnamese ? 'Thành công' : '성공' },
                  { value: 'error', label: isVietnamese ? 'Lỗi' : '오류' },
                  { value: 'warning', label: isVietnamese ? 'Cảnh báo' : '경고' },
                  { value: 'info', label: isVietnamese ? 'Thông tin' : '정보' }
                ].map(({ value, label }) => (
                  <Button
                    key={value}
                    size="small"
                    variant={selectedFilters.type === value ? 'primary' : 'ghost'}
                    onClick={() => applyFilter('type', value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 읽음 상태 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isVietnamese ? 'Trạng thái' : '읽음 상태'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'all', label: isVietnamese ? 'Tất cả' : '전체' },
                  { value: 'unread', label: isVietnamese ? 'Chưa đọc' : '안읽음' },
                  { value: 'read', label: isVietnamese ? 'Đã đọc' : '읽음' }
                ].map(({ value, label }) => (
                  <Button
                    key={value}
                    size="small"
                    variant={selectedFilters.status === value ? 'primary' : 'ghost'}
                    onClick={() => applyFilter('status', value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 날짜 범위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isVietnamese ? 'Thời gian' : '날짜 범위'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'all', label: isVietnamese ? 'Tất cả' : '전체' },
                  { value: 'today', label: isVietnamese ? 'Hôm nay' : '오늘' },
                  { value: 'week', label: isVietnamese ? '7 ngày qua' : '최근 7일' },
                  { value: 'month', label: isVietnamese ? '30 ngày qua' : '최근 30일' }
                ].map(({ value, label }) => (
                  <Button
                    key={value}
                    size="small"
                    variant={selectedFilters.dateRange === value ? 'primary' : 'ghost'}
                    onClick={() => applyFilter('dateRange', value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 소스 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isVietnamese ? 'Nguồn' : '소스'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'all', label: isVietnamese ? 'Tất cả' : '전체' },
                  { value: 'orders', label: isVietnamese ? 'Đơn hàng' : '주문' },
                  { value: 'payments', label: isVietnamese ? 'Thanh toán' : '결제' },
                  { value: 'system', label: isVietnamese ? 'Hệ thống' : '시스템' },
                  { value: 'customers', label: isVietnamese ? 'Khách hàng' : '고객' }
                ].map(({ value, label }) => (
                  <Button
                    key={value}
                    size="small"
                    variant={selectedFilters.source === value ? 'primary' : 'ghost'}
                    onClick={() => applyFilter('source', value)}
                  >
                    {label} ({notificationStats.bySource[value] || 0})
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="ghost" onClick={resetFilters}>
                {isVietnamese ? 'Đặt lại' : '초기화'}
              </Button>
              <Button onClick={() => setShowFilterModal(false)}>
                {isVietnamese ? 'Áp dụng' : '적용'}
              </Button>
            </div>
          </div>
        </EnhancedModal>

        {/* 전체 알림 히스토리 모달 */}
        <EnhancedModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title={isVietnamese ? 'Lịch sử thông báo' : '알림 히스토리'}
          size="large"
        >
          <div className="space-y-4">
            {/* 검색 */}
            {enableSearch && (
              <TextInput
                placeholder={isVietnamese ? 'Tìm kiếm thông báo...' : '알림 검색...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
                className="w-full"
              />
            )}

            {/* 필터링된 알림 목록 */}
            <div className="max-h-96 overflow-y-auto space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${
                    notification.read 
                      ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeIcon(notification.type)}
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {notification.title || '알림'}
                        </h4>
                        {notification.priority && (
                          <Badge variant={notification.priority === 'high' ? 'error' : 'default'} size="small">
                            {notification.priority}
                          </Badge>
                        )}
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{new Date(notification.timestamp).toLocaleString(isVietnamese ? 'vi-VN' : 'ko-KR')}</span>
                        {notification.source && (
                          <Badge variant="default" size="small">
                            {notification.source}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-4">
                      {!notification.read && (
                        <IconButton
                          icon={<Eye className="w-4 h-4" />}
                          variant="ghost"
                          size="small"
                          onClick={() => handleMarkAsRead(notification.id)}
                          aria-label={isVietnamese ? 'Đánh dấu đã đọc' : '읽음 처리'}
                        />
                      )}
                      <IconButton
                        icon={<X className="w-4 h-4" />}
                        variant="ghost"
                        size="small"
                        onClick={() => handleRemove(notification.id)}
                        aria-label={isVietnamese ? 'Xóa' : '삭제'}
                        className="text-red-600 hover:text-red-700"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredNotifications.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{isVietnamese ? 'Không có thông báo nào' : '알림이 없습니다'}</p>
                </div>
              )}
            </div>
          </div>
        </EnhancedModal>

        {/* 스크린 리더용 알림 요약 */}
        <div className="sr-only" aria-live="assertive">
          {visibleNotifications.length > 0 && 
            `${visibleNotifications.length}개의 알림이 있습니다.`
          }
        </div>
      </>
    )
  }

  // 기본 모드 (기존 동작)
  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div 
      className={getContainerStyles()}
      role="region"
      aria-label="알림 센터"
      aria-live="polite"
    >
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto transform transition-all duration-300 ease-out"
          style={{
            animationDelay: `${index * 100}ms`,
            zIndex: 50 - index
          }}
        >
          <NotificationCard
            notification={notification}
            onClose={() => handleRemove(notification.id)}
          />
        </div>
      ))}
      
      {/* 스크린 리더용 알림 요약 */}
      <div className="sr-only" aria-live="assertive">
        {visibleNotifications.length > 0 && 
          `${visibleNotifications.length}개의 알림이 있습니다.`
        }
      </div>
    </div>
  )
}

// 알림 타입별 아이콘 가져오기
const getTypeIcon = (type) => {
  const icons = {
    success: <CheckCircle className="w-4 h-4 text-green-600" />,
    error: <AlertTriangle className="w-4 h-4 text-red-600" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
    info: <Info className="w-4 h-4 text-blue-600" />
  }
  return icons[type] || icons.info
}

// 알림 생성 헬퍼 함수
export const createNotification = (type, message, options = {}) => {
  return {
    id: Date.now() + Math.random(),
    type,
    message,
    duration: options.duration || 4000,
    closable: options.closable !== false,
    timestamp: new Date().toISOString(),
    ...options
  }
}

// 알림 타입별 생성 헬퍼 함수들
export const notificationHelpers = {
  success: (message, options) => createNotification('success', message, options),
  error: (message, options) => createNotification('error', message, options),
  warning: (message, options) => createNotification('warning', message, options),
  info: (message, options) => createNotification('info', message, options),
  
  // Local App 전용 알림 타입들
  orderReceived: (orderNumber) => createNotification('info', `새 주문이 접수되었습니다. (#${orderNumber})`, {
    duration: 0, // 수동 닫기
    type: 'info'
  }),
  
  orderConfirmed: (orderNumber) => createNotification('success', `주문이 확인되었습니다. (#${orderNumber})`, {
    duration: 5000,
    type: 'success'
  }),
  
  paymentCompleted: (amount) => createNotification('success', `결제가 완료되었습니다. (${amount}VND)`, {
    duration: 4000,
    type: 'success'
  }),
  
  posConnected: () => createNotification('success', 'POS 시스템이 연결되었습니다.', {
    duration: 3000,
    type: 'success'
  }),
  
  posDisconnected: () => createNotification('error', 'POS 시스템 연결이 해제되었습니다.', {
    duration: 0, // 수동 닫기
    type: 'error'
  }),
  
  deliveryStarted: (orderNumber) => createNotification('info', `배달이 시작되었습니다. (#${orderNumber})`, {
    duration: 5000,
    type: 'info'
  })
}

// 간단한 알림 카드 컴포넌트
const NotificationCard = ({ notification, onClose, onMarkAsRead }) => {
  const getTypeStyles = () => {
    const baseStyles = 'flex items-center p-4 rounded-xl shadow-lg backdrop-blur-lg border mb-2 min-w-[340px] max-w-[420px]';

    switch (notification.type) {
      case 'success':
        return `${baseStyles} bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-400/60 dark:border-emerald-600/60 text-emerald-800 dark:text-emerald-200`;
      case 'error':
        return `${baseStyles} bg-rose-50/95 dark:bg-rose-950/90 border-rose-400/60 dark:border-rose-600/60 text-rose-800 dark:text-rose-200`;
      case 'warning':
        return `${baseStyles} bg-amber-50/95 dark:bg-amber-950/90 border-amber-400/60 dark:border-amber-600/60 text-amber-800 dark:text-amber-200`;
      case 'info':
      default:
        return `${baseStyles} bg-cyan-50/95 dark:bg-cyan-950/90 border-[#2AC1BC]/60 dark:border-[#2AC1BC]/80 text-cyan-800 dark:text-cyan-200`;
    }
  };

  const getIcon = () => {
    const iconClass = 'w-5 h-5 flex-shrink-0';

    switch (notification.type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-emerald-600 dark:text-emerald-400`} />;
      case 'error':
        return <AlertTriangle className={`${iconClass} text-rose-600 dark:text-rose-400`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-amber-600 dark:text-amber-400`} />;
      case 'info':
      default:
        return <Info className={`${iconClass} text-[#2AC1BC] dark:text-cyan-400`} />;
    }
  };

  return (
    <div className={getTypeStyles()} role="alert" aria-live="assertive">
      {getIcon()}

      <div className="flex-1 min-w-0 ml-3">
        <p className="font-medium leading-relaxed text-current">
          {notification.message}
        </p>
      </div>

      {(notification.closable !== false || onClose) && (
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 p-2 rounded-lg bg-white/20 hover:bg-white/30 border border-white/20 hover:border-white/40 transition-all duration-200"
          aria-label="알림 닫기"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default NotificationCenter