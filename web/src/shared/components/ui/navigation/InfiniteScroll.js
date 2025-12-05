'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const InfiniteScroll = ({
  children,
  loadMore,
  hasMore = true,
  loader = null,
  threshold = 200,
  useWindow = true,
  initialLoad = true,
  isReverse = false,
  className = '',
  onScroll,
  dataLength,
  endMessage = null,
  scrollableTarget,
  style,
  height,
  pullDownToRefresh = false,
  pullDownToRefreshThreshold = 60,
  pullDownToRefreshContent = null,
  releaseToRefreshContent = null,
  refreshFunction,
  onlyShowLoaderWhenLoading = true
}) => {
  const [loading, setLoading] = useState(false)
  const [pullDownDistance, setPullDownDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const scrollComponentRef = useRef(null)
  const sentinelRef = useRef(null)
  const startY = useRef(0)
  
  const loadMoreItems = useCallback(async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    try {
      await loadMore()
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, loadMore])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMoreItems()
        }
      },
      {
        rootMargin: `${threshold}px`,
        root: scrollableTarget ? document.querySelector(scrollableTarget) : null
      }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, threshold, scrollableTarget, loadMoreItems])

  // Initial load
  useEffect(() => {
    if (initialLoad && hasMore && dataLength === 0) {
      loadMoreItems()
    }
  }, [initialLoad, hasMore, dataLength, loadMoreItems])

  // Pull to refresh handlers
  const handleTouchStart = (e) => {
    if (!pullDownToRefresh) return
    startY.current = e.touches[0].clientY
    setIsPulling(true)
  }

  const handleTouchMove = (e) => {
    if (!pullDownToRefresh || !isPulling) return
    
    const currentY = e.touches[0].clientY
    const distance = currentY - startY.current
    
    if (distance > 0 && scrollComponentRef.current?.scrollTop <= 0) {
      setPullDownDistance(Math.min(distance, pullDownToRefreshThreshold * 2))
      if (distance > pullDownToRefreshThreshold) {
        e.preventDefault()
      }
    }
  }

  const handleTouchEnd = async () => {
    if (!pullDownToRefresh || !isPulling) return
    
    setIsPulling(false)
    
    if (pullDownDistance > pullDownToRefreshThreshold && refreshFunction) {
      setLoading(true)
      try {
        await refreshFunction()
      } finally {
        setLoading(false)
        setPullDownDistance(0)
      }
    } else {
      setPullDownDistance(0)
    }
  }

  const scrollProps = height ? {
    style: {
      height,
      overflow: 'auto',
      ...style
    },
    ref: scrollComponentRef
  } : {}

  const DefaultLoader = () => (
    <div className="flex items-center justify-center py-6">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#2AC1BC] animate-spin" />
        <div className="absolute inset-0 w-12 h-12 rounded-full bg-gradient-to-r from-[#2AC1BC]/20 to-[#00B14F]/20 animate-pulse" />
      </div>
      <span className="ml-3 text-gray-600 font-medium">불러오는 중...</span>
    </div>
  )

  const DefaultEndMessage = () => (
    <div className="flex items-center justify-center py-6 text-gray-500">
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      모든 항목을 불러왔습니다
    </div>
  )

  const PullToRefreshIndicator = () => {
    const isReadyToRefresh = pullDownDistance > pullDownToRefreshThreshold
    
    return (
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200"
        style={{ 
          height: `${pullDownDistance}px`,
          transform: `translateY(-100%)`
        }}
      >
        {isReadyToRefresh ? (
          releaseToRefreshContent || (
            <div className="flex items-center text-[#2AC1BC]">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              놓아서 새로고침
            </div>
          )
        ) : (
          pullDownToRefreshContent || (
            <div className="flex items-center text-gray-500">
              <svg className="w-5 h-5 mr-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              당겨서 새로고침
            </div>
          )
        )}
      </div>
    )
  }

  return (
    <div 
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onScroll={onScroll}
      {...scrollProps}
    >
      {pullDownToRefresh && isPulling && <PullToRefreshIndicator />}
      
      <div style={{ transform: `translateY(${pullDownDistance}px)` }}>
        {isReverse && hasMore && (
          <div ref={sentinelRef} aria-hidden="true" />
        )}
        
        {children}
        
        {!isReverse && hasMore && (
          <div ref={sentinelRef} aria-hidden="true" />
        )}
        
        {loading && (!onlyShowLoaderWhenLoading || hasMore) && (
          loader || <DefaultLoader />
        )}
        
        {!hasMore && endMessage !== null && (
          endMessage || <DefaultEndMessage />
        )}
      </div>
    </div>
  )
}

// Local App 전용 무한 스크롤
export const DeliveryInfiniteScrolls = {
  // 주문 목록 무한 스크롤
  OrderList: ({ orders, loadMore, hasMore }) => (
    <InfiniteScroll
      dataLength={orders.length}
      loadMore={loadMore}
      hasMore={hasMore}
      loader={
        <div className="flex items-center justify-center py-6">
          <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#2AC1BC] animate-spin" />
          <span className="ml-3 text-gray-600">주문 불러오는 중...</span>
        </div>
      }
      endMessage={
        <div className="text-center py-8 text-gray-500">
          <span className="text-3xl">🎉</span>
          <p className="mt-2">모든 주문을 확인했습니다</p>
        </div>
      }
      className="space-y-4"
    >
      {orders.map(order => (
        <div key={order.id} className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          {order.content}
        </div>
      ))}
    </InfiniteScroll>
  ),

  // 메뉴 아이템 무한 스크롤
  MenuItems: ({ items, loadMore, hasMore, height = 600 }) => (
    <InfiniteScroll
      dataLength={items.length}
      loadMore={loadMore}
      hasMore={hasMore}
      height={height}
      loader={
        <div className="flex items-center justify-center py-6">
          <span className="text-2xl animate-pulse">🍜</span>
          <span className="ml-3 text-gray-600">메뉴 불러오는 중...</span>
        </div>
      }
      endMessage={
        <div className="text-center py-8">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#2AC1BC]/10 to-[#00B14F]/10 rounded-full text-gray-600">
            <svg className="w-5 h-5 mr-2 text-[#00B14F]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            모든 메뉴를 불러왔습니다
          </div>
        </div>
      }
      className="grid grid-cols-2 gap-4 p-4"
    >
      {items.map(item => (
        <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
          {item.content}
        </div>
      ))}
    </InfiniteScroll>
  ),

  // 리뷰 목록 무한 스크롤 (Pull to Refresh 지원)
  ReviewList: ({ reviews, loadMore, hasMore, onRefresh }) => (
    <InfiniteScroll
      dataLength={reviews.length}
      loadMore={loadMore}
      hasMore={hasMore}
      pullDownToRefresh
      pullDownToRefreshThreshold={80}
      refreshFunction={onRefresh}
      pullDownToRefreshContent={
        <div className="flex items-center justify-center py-3 text-gray-500">
          <svg className="w-5 h-5 mr-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          당겨서 새로고침
        </div>
      }
      releaseToRefreshContent={
        <div className="flex items-center justify-center py-3 text-[#2AC1BC]">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          놓아서 새로고침
        </div>
      }
      loader={
        <div className="flex items-center justify-center py-6">
          <span className="text-2xl animate-pulse">⭐</span>
          <span className="ml-3 text-gray-600">리뷰 불러오는 중...</span>
        </div>
      }
      className="space-y-4"
    >
      {reviews.map(review => (
        <div key={review.id} className="p-4 bg-white rounded-xl shadow-sm">
          {review.content}
        </div>
      ))}
    </InfiniteScroll>
  )
}

export default InfiniteScroll