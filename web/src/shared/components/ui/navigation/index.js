/**
 * 네비게이션 컴포넌트 모듈 내보내기
 * Local App MVP - 점주용 관리자 시스템
 */

// 기본 네비게이션 컴포넌트들
export { default as BackToTop } from './BackToTop';
export { default as Breadcrumb } from './Breadcrumb';
export { default as Dropdown } from './Dropdown';
export { default as InfiniteScroll } from './InfiniteScroll';
export { default as LanguageSwitcher } from './LanguageSwitcher';
export { default as Pagination } from './Pagination';
export { default as Stepper } from './Stepper';
export { default as TabGroup } from './TabGroup';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';

// Local App 전용 네비게이션 컴포넌트들
export const DeliveryNavigation = {
  // 주문 상태 탭
  OrderStatusTabs: ({ activeStatus, onStatusChange, orderCounts }) => (
    <TabGroup
      variant="vietnamese"
      size="medium"
      fullWidth={false}
      showBadge={true}
      activeTab={activeStatus}
      onTabChange={onStatusChange}
      tabs={[
        {
          label: '전체',
          icon: '📋',
          badge: orderCounts?.total || 0,
          content: null
        },
        {
          label: '대기중',
          icon: '⏰',
          badge: orderCounts?.pending || 0,
          content: null
        },
        {
          label: '조리중',
          icon: '👨‍🍳',
          badge: orderCounts?.cooking || 0,
          content: null
        },
        {
          label: '준비완료',
          icon: '✅',
          badge: orderCounts?.ready || 0,
          content: null
        },
        {
          label: '배달중',
          icon: '🚴‍♂️',
          badge: orderCounts?.delivering || 0,
          content: null
        },
        {
          label: '완료',
          icon: '🎉',
          badge: orderCounts?.completed || 0,
          content: null
        }
      ]}
    />
  ),

  // 메뉴 카테고리 탭
  MenuCategoryTabs: ({ activeCategory, onCategoryChange, categories }) => (
    <TabGroup
      variant="pills"
      size="medium"
      scrollable={true}
      activeTab={activeCategory}
      onTabChange={onCategoryChange}
      tabs={categories?.map(category => ({
        label: category.name,
        icon: category.icon,
        badge: category.itemCount,
        content: null
      })) || []}
    />
  ),

  // 분석 기간 탭
  AnalyticsPeriodTabs: ({ activePeriod, onPeriodChange }) => (
    <TabGroup
      variant="underline"
      size="small"
      fullWidth={true}
      activeTab={activePeriod}
      onTabChange={onPeriodChange}
      tabs={[
        { label: '오늘', icon: '📅', content: null },
        { label: '이번 주', icon: '📊', content: null },
        { label: '이번 달', icon: '📈', content: null },
        { label: '지난 달', icon: '📉', content: null }
      ]}
    />
  ),

  // 매장 관리 브레드크럼
  StoreBreadcrumb: ({ currentPage, storeInfo }) => (
    <Breadcrumb
      showHome={true}
      homeLabel="매장 관리"
      maxItems={4}
      items={[
        { 
          label: storeInfo?.name || 'Local 쌀국수', 
          href: '/dashboard', 
          icon: '🏪' 
        },
        ...(currentPage ? [{ 
          label: currentPage, 
          icon: getPageIcon(currentPage) 
        }] : [])
      ]}
    />
  ),

  // 주문 목록 페이지네이션
  OrderPagination: ({ currentPage, totalPages, onPageChange }) => (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      showFirstLast={true}
      showPrevNext={true}
      size="medium"
      siblingCount={1}
      boundaryCount={1}
    />
  )
}

// 페이지 아이콘 헬퍼 함수
const getPageIcon = (pageName) => {
  const iconMap = {
    '주문관리': '📋',
    '메뉴관리': '🍜',
    '분석': '📊',
    '설정': '⚙️',
    '고객관리': '👥',
    'POS연동': '💳',
    '프로모션': '🎁',
    '리뷰관리': '⭐',
    '배달관리': '🚴‍♂️',
    '재고관리': '📦'
  }
  return iconMap[pageName] || '📄'
}