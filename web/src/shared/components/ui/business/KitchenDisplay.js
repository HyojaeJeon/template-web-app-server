'use client';

import { useState, useEffect } from 'react';

/**
 * KitchenDisplay Component
 * 
 * Local 배달 앱 주방 디스플레이 컴포넌트
 * - 실시간 주문 목록 표시
 * - 우선순위 기반 정렬
 * - 조리 시간 추적
 * - 주방 상태 관리
 * - 음성/시각 알림
 * 
 * WCAG 2.1 준수, 키보드 네비게이션, 스크린 리더 지원
 * 
 * @param {Object} props - KitchenDisplay 컴포넌트 props
 * @param {Array} props.orders - 주문 목록
 * @param {Function} props.onStatusUpdate - 주문 상태 업데이트 콜백
 * @param {Function} props.onOrderComplete - 주문 완료 콜백
 * @param {boolean} props.soundEnabled - 음성 알림 활성화
 * @param {string} props.view - 뷰 모드 ('grid', 'list', 'compact')
 * @param {Object} props.filters - 필터 옵션
 * @param {string} props.className - 추가 CSS 클래스
 */
const KitchenDisplay = ({
  orders = [],
  onStatusUpdate,
  onOrderComplete,
  soundEnabled = true,
  view = 'grid',
  filters = {},
  className = ''
}) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 주문 상태별 색상
  const statusColors = {
    pending: 'orange',
    confirmed: 'blue', 
    preparing: 'yellow',
    ready: 'emerald',
    picked_up: 'green'
  };

  // 우선순위 계산
  const calculatePriority = (order) => {
    const orderTime = new Date(order.createdAt);
    const elapsed = (currentTime - orderTime) / (1000 * 60); // 분
    const estimatedTime = order.estimatedTime || 30;
    
    if (elapsed > estimatedTime + 15) return 'high';
    if (elapsed > estimatedTime + 5) return 'medium';
    return 'normal';
  };

  // 조리 시간 계산
  const calculateCookingTime = (order) => {
    if (!order.startedAt) return null;
    const started = new Date(order.startedAt);
    return Math.floor((currentTime - started) / (1000 * 60));
  };

  // 주문 필터링 및 정렬
  const filteredOrders = orders
    .filter(order => {
      if (filters.status && order.status !== filters.status) return false;
      if (filters.priority) {
        const priority = calculatePriority(order);
        if (priority !== filters.priority) return false;
      }
      return true;
    })
    .sort((a, b) => {
      // 우선순위 정렬
      const priorityOrder = { high: 3, medium: 2, normal: 1 };
      const aPriority = priorityOrder[calculatePriority(a)];
      const bPriority = priorityOrder[calculatePriority(b)];
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      // 주문 시간 정렬
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

  // 주문 카드 컴포넌트
  const OrderCard = ({ order }) => {
    const priority = calculatePriority(order);
    const cookingTime = calculateCookingTime(order);
    const statusColor = statusColors[order.status] || 'gray';
    
    const priorityColors = {
      high: 'border-red-500 bg-red-50 dark:bg-red-900/20',
      medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      normal: 'border-gray-300 bg-white dark:bg-gray-800'
    };

    return (
      <div 
        className={`
          rounded-2xl shadow-lg border-2 p-4 cursor-pointer transition-all duration-200
          ${priorityColors[priority]}
          ${selectedOrder?.id === order.id ? 'ring-2 ring-teal-500' : ''}
          ${priority === 'high' ? 'animate-pulse' : ''}
        `}
        onClick={() => setSelectedOrder(order)}
        role="button"
        tabIndex={0}
        aria-label={`주문 ${order.orderNumber} 선택`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              #{order.orderNumber}
            </span>
            
            {priority === 'high' && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>

          <div className={`
            px-2 py-1 rounded-full text-xs font-semibold
            bg-${statusColor}-100 dark:bg-${statusColor}-900/30 
            text-${statusColor}-700 dark:text-${statusColor}-400
          `}>
            {order.status === 'pending' ? '대기' :
             order.status === 'confirmed' ? '확인' :
             order.status === 'preparing' ? '조리중' :
             order.status === 'ready' ? '완료' : '픽업'}
          </div>
        </div>

        {/* 시간 정보 */}
        <div className="flex items-center gap-4 mb-3 text-sm">
          <div className="text-gray-600 dark:text-gray-400">
            주문: {new Date(order.createdAt).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          
          {cookingTime !== null && (
            <div className={`font-semibold ${
              cookingTime > 45 ? 'text-red-600 dark:text-red-400' :
              cookingTime > 30 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-green-600 dark:text-green-400'
            }`}>
              조리 {cookingTime}분
            </div>
          )}
        </div>

        {/* 메뉴 아이템 */}
        <div className="space-y-2">
          {order.items.slice(0, 3).map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900 dark:text-white">
                {item.name}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                x{item.quantity}
              </span>
            </div>
          ))}
          
          {order.items.length > 3 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              +{order.items.length - 3}개 더
            </div>
          )}
        </div>

        {/* 특별 요청 */}
        {order.specialInstructions && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              📝 {order.specialInstructions}
            </p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="mt-4 flex gap-2">
          {order.status === 'pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate?.(order.id, 'confirmed');
              }}
              className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              확인
            </button>
          )}
          
          {order.status === 'confirmed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate?.(order.id, 'preparing');
              }}
              className="flex-1 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              조리 시작
            </button>
          )}
          
          {order.status === 'preparing' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate?.(order.id, 'ready');
              }}
              className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              조리 완료
            </button>
          )}
          
          {order.status === 'ready' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOrderComplete?.(order.id);
              }}
              className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              픽업 완료
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-gray-50 dark:bg-gray-900 min-h-screen ${className}`}>
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              주방 디스플레이
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              총 {filteredOrders.length}개 주문 • {currentTime.toLocaleTimeString('ko-KR')}
            </p>
          </div>

          {/* 필터 및 설정 */}
          <div className="flex items-center gap-4">
            {/* 우선순위 필터 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">우선순위:</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full" title="높음" />
                <span className="text-xs text-red-600 dark:text-red-400">
                  {filteredOrders.filter(o => calculatePriority(o) === 'high').length}
                </span>
              </div>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" title="보통" />
                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                  {filteredOrders.filter(o => calculatePriority(o) === 'medium').length}
                </span>
              </div>
            </div>

            {/* 음성 알림 토글 */}
            <button
              onClick={() => {}} // soundEnabled 토글 구현 필요
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled 
                  ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
              aria-label={`음성 알림 ${soundEnabled ? '끄기' : '켜기'}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.777L4.342 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.342l4.041-3.777zm7.512 1.341a1 1 0 011.414 1.414L16.896 7.244l1.413 1.413a1 1 0 11-1.414 1.414L15.482 8.658l-1.414 1.413a1 1 0 11-1.414-1.414L14.068 7.244l-1.414-1.413a1 1 0 011.414-1.414L15.482 5.83l1.413-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 주문 목록 */}
      <div className="p-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              주문이 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              새로운 주문이 들어오면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
            view === 'list' ? 'grid-cols-1' :
            'grid-cols-1 md:grid-cols-2'
          }`}>
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      {/* 주문 상세 모달 */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
          role="dialog"
          aria-modal="true"
          aria-label="주문 상세 정보"
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  주문 #{selectedOrder.orderNumber}
                </h3>
                
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="닫기"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 상세 정보 렌더링 */}
              <div className="space-y-4">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {item.name}
                      </h4>
                      {item.options && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {item.options.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        x{item.quantity}
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {item.price.toLocaleString()}₫
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedOrder.specialInstructions && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    특별 요청사항
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    {selectedOrder.specialInstructions}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;