/**
 * 디스플레이 컴포넌트 모듈 내보내기
 * Local App MVP - 점주용 관리자 시스템
 */

// 기본 디스플레이 컴포넌트들
export { default as Accordion } from './Accordion';
export { default as Avatar } from './Avatar';
export { default as AvatarGroup } from './AvatarGroup';
export { default as Badge } from './Badge';
export { default as Calendar } from './Calendar';
export { default as Card } from './Card';
export { default as Carousel } from './Carousel';
export { default as Chip } from './Chip';
export { default as Collapsible } from './Collapsible';
export { default as CountdownTimer } from './CountdownTimer';
export { default as DashboardCard } from './DashboardCard';
export { default as DataTable } from './DataTable';
export { default as Gallery } from './Gallery';
export { default as Grid } from './Grid';
export { default as Label } from './Label';
export { default as List } from './List';
export { default as Popover } from './Popover';
export { default as Progress } from './Progress';
export { default as QRCode } from './QRCode';
export { default as StatCard } from './StatCard';
export { default as Status } from './Status';
export { default as Table } from './Table';
export { default as Tag } from './Tag';
export { default as Timeline } from './Timeline';
export { default as Tooltip } from './Tooltip';

// 이미지 및 아이콘 컴포넌트들
export { OptimizedImage, FoodImage, CardImage } from './OptimizedImage';
export { default as Icon } from './Icon';
export { default as RealtimeClock } from './RealtimeClock';

// Local App 전용 디스플레이 컴포넌트들
export const DeliveryDisplay = {
  // 주문 상태 배지
  OrderStatusBadge: ({ status, count, showAnimation = true }) => (
    <Badge
      variant={getOrderStatusVariant(status)}
      size="md"
      gradient={true}
      shadow={true}
      className={`${showAnimation && status === 'pending' ? 'animate-pulse' : ''}`}
    >
      {getOrderStatusLabel(status)} {count && `(${count})`}
    </Badge>
  ),

  // 매장 상태 카드
  StoreStatusCard: ({ storeInfo, isOnline, orderCount, revenue }) => (
    <Card
      variant={isOnline ? 'success' : 'error'}
      gradient={true}
      shadow={true}
      className="bg-white border-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
            🏪
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">{storeInfo?.name}</h3>
            <Status 
              status={isOnline ? 'online' : 'offline'} 
              label={isOnline ? '영업중' : '영업종료'}
              variant="badge"
              gradient={true}
            />
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">오늘 주문</div>
          <div className="font-bold text-xl text-[#2AC1BC]">{orderCount}건</div>
          <div className="text-sm text-gray-500">{revenue?.toLocaleString()}đ</div>
        </div>
      </div>
    </Card>
  ),

  // 메뉴 카테고리 칩
  MenuCategoryChips: ({ categories, activeCategory, onCategorySelect }) => (
    <div className="flex flex-wrap gap-2">
      {categories?.map(category => (
        <Chip
          key={category.id}
          label={category.name}
          icon={category.icon}
          selected={activeCategory === category.id}
          onClick={() => onCategorySelect(category.id)}
          color="primary"
          gradient={true}
          className="cursor-pointer"
        />
      ))}
    </div>
  ),

  // 주문 우선순위 태그
  OrderPriorityTag: ({ priority, dueTime }) => (
    <Tag
      variant={getPriorityVariant(priority)}
      gradient={true}
      shadow={true}
      icon={getPriorityIcon(priority)}
    >
      {getPriorityLabel(priority)} {dueTime && `(${dueTime})`}
    </Tag>
  ),

  // 결제 상태 라벨
  PaymentStatusLabel: ({ paymentStatus, paymentMethod, amount }) => (
    <div className="flex flex-col gap-1">
      <Label
        className="text-sm font-medium"
        icon={getPaymentMethodIcon(paymentMethod)}
      >
        {paymentMethod}
      </Label>
      <Status
        status={getPaymentStatusType(paymentStatus)}
        label={getPaymentStatusLabel(paymentStatus)}
        variant="badge"
        gradient={true}
      />
      <span className="text-lg font-bold text-[#00B14F]">
        {amount?.toLocaleString()}đ
      </span>
    </div>
  ),

  // 배달 거리 정보 카드
  DeliveryDistanceCard: ({ distance, estimatedTime, deliveryFee }) => (
    <Card
      variant="primary" 
      size="sm"
      gradient={true}
      className="text-center"
    >
      <div className="flex items-center justify-center gap-4">
        <div>
          <div className="text-sm text-gray-600">거리</div>
          <div className="font-bold text-[#2AC1BC]">{distance}km</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">예상시간</div>
          <div className="font-bold text-[#00B14F]">{estimatedTime}분</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">배달료</div>
          <div className="font-bold text-[#FFDD00]">{deliveryFee?.toLocaleString()}đ</div>
        </div>
      </div>
    </Card>
  ),

  // POS 연동 상태 표시
  PosConnectionStatus: ({ isConnected, lastSync, errorCount }) => (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
      <Status
        status={isConnected ? 'online' : 'error'}
        showPulse={isConnected}
        variant="dot"
        size="lg"
      />
      <div className="flex-1">
        <div className="font-medium text-gray-900">
          POS 연동 {isConnected ? '정상' : '오류'}
        </div>
        <div className="text-sm text-gray-600">
          마지막 동기화: {lastSync}
          {errorCount > 0 && (
            <Badge variant="error" size="xs" className="ml-2">
              오류 {errorCount}건
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

// 헬퍼 함수들
const getOrderStatusVariant = (status) => {
  const statusMap = {
    pending: 'warning',
    confirmed: 'primary',
    cooking: 'info',
    ready: 'success',
    delivering: 'primary',
    completed: 'success',
    cancelled: 'error'
  }
  return statusMap[status] || 'default'
}

const getOrderStatusLabel = (status) => {
  const labelMap = {
    pending: '대기중',
    confirmed: 'POS전송완료',
    cooking: '조리중',
    ready: '준비완료',
    delivering: '배달중',
    completed: '완료',
    cancelled: '취소됨'
  }
  return labelMap[status] || status
}

const getPriorityVariant = (priority) => {
  const variantMap = {
    urgent: 'error',
    high: 'warning', 
    normal: 'primary',
    low: 'default'
  }
  return variantMap[priority] || 'default'
}

const getPriorityIcon = (priority) => {
  const iconMap = {
    urgent: '🚨',
    high: '⚡',
    normal: '📋',
    low: '📝'
  }
  return iconMap[priority] || '📋'
}

const getPriorityLabel = (priority) => {
  const labelMap = {
    urgent: '긴급',
    high: '높음',
    normal: '보통',
    low: '낮음'
  }
  return labelMap[priority] || priority
}

const getPaymentMethodIcon = (method) => {
  const iconMap = {
    'MoMo': '💰',
    'ZaloPay': '💳',
    'VNPay': '🏦',
    'COD': '💵',
    'QR': '📱'
  }
  return iconMap[method] || '💳'
}

const getPaymentStatusType = (status) => {
  const typeMap = {
    pending: 'pending',
    processing: 'processing',
    completed: 'success',
    failed: 'error',
    cancelled: 'error'
  }
  return typeMap[status] || 'idle'
}

const getPaymentStatusLabel = (status) => {
  const labelMap = {
    pending: '결제대기',
    processing: '결제처리중',
    completed: '결제완료',
    failed: '결제실패',
    cancelled: '결제취소'
  }
  return labelMap[status] || status
}