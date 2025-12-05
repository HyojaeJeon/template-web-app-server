/**
 * 자동 브레드크럼 네비게이션 컴포넌트
 * 경로 기반 자동 생성, 커스텀 브레드크럼 지원, WCAG 2.1 준수
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * 경로-라벨 매핑 테이블 (다국어 지원)
 */
const PATH_LABELS = {
  ko: {
    dashboard: '대시보드',
    orders: '주문 관리',
    'orders/new': '신규 주문',
    'orders/active': '진행중 주문', 
    'orders/completed': '완료된 주문',
    'orders/cancelled': '취소된 주문',
    'orders/live': '실시간 주문',
    menu: '메뉴 관리',
    'menu/list': '메뉴 목록',
    'menu/categories': '카테고리 관리',
    'menu/add': '메뉴 추가',
    'menu/ingredients': '재료 관리',
    analytics: '분석',
    'analytics/sales': '매출 분석',
    'analytics/menu': '메뉴 분석',
    'analytics/customers': '고객 분석',
    'analytics/revenue': '수익 분석',
    'analytics/orders': '주문 분석',
    'analytics/reports': '리포트',
    pos: 'POS 연동',
    'pos/setup': 'POS 설정',
    settings: '설정',
    'settings/profile': '프로필',
    'settings/store': '매장 설정',
    'settings/notifications': '알림 설정',
    'settings/integrations': '연동 설정',
    customers: '고객 관리',
    promotions: '프로모션',
    inventory: '재고 관리',
    reviews: '리뷰 관리',
    delivery: '배달 관리',
    payments: '결제 관리',
    staff: '직원 관리',
    reports: '보고서'
  },
  vi: {
    dashboard: 'Bảng điều khiển',
    orders: 'Quản lý đơn hàng',
    'orders/new': 'Đơn hàng mới',
    'orders/active': 'Đang xử lý', 
    'orders/completed': 'Hoàn thành',
    'orders/cancelled': 'Đã hủy',
    'orders/live': 'Đơn hàng trực tiếp',
    menu: 'Quản lý thực đơn',
    'menu/list': 'Danh sách món',
    'menu/categories': 'Quản lý danh mục',
    'menu/add': 'Thêm món mới',
    'menu/ingredients': 'Quản lý nguyên liệu',
    analytics: 'Phân tích',
    'analytics/sales': 'Phân tích bán hàng',
    'analytics/menu': 'Phân tích thực đơn',
    'analytics/customers': 'Phân tích khách hàng',
    'analytics/revenue': 'Phân tích doanh thu',
    'analytics/orders': 'Phân tích đơn hàng',
    'analytics/reports': 'Báo cáo',
    pos: 'Tích hợp POS',
    'pos/setup': 'Cài đặt POS',
    settings: 'Cài đặt',
    'settings/profile': 'Hồ sơ',
    'settings/store': 'Cửa hàng',
    'settings/notifications': 'Thông báo',
    'settings/integrations': 'Tích hợp',
    customers: 'Quản lý khách hàng',
    promotions: 'Khuyến mãi',
    inventory: 'Quản lý kho',
    reviews: 'Quản lý đánh giá',
    delivery: 'Quản lý giao hàng',
    payments: 'Quản lý thanh toán',
    staff: 'Quản lý nhân viên',
    reports: 'Báo cáo'
  },
  en: {
    dashboard: 'Dashboard',
    orders: 'Order Management',
    'orders/new': 'New Orders',
    'orders/active': 'Active Orders', 
    'orders/completed': 'Completed',
    'orders/cancelled': 'Cancelled',
    'orders/live': 'Live Orders',
    menu: 'Menu Management',
    'menu/list': 'Menu List',
    'menu/categories': 'Categories',
    'menu/add': 'Add Menu',
    'menu/ingredients': 'Ingredients',
    analytics: 'Analytics',
    'analytics/sales': 'Sales Analytics',
    'analytics/menu': 'Menu Analytics',
    'analytics/customers': 'Customer Analytics',
    'analytics/revenue': 'Revenue Analytics',
    'analytics/orders': 'Order Analytics',
    'analytics/reports': 'Reports',
    pos: 'POS Integration',
    'pos/setup': 'POS Setup',
    settings: 'Settings',
    'settings/profile': 'Profile',
    'settings/store': 'Store Settings',
    'settings/notifications': 'Notifications',
    'settings/integrations': 'Integrations',
    customers: 'Customer Management',
    promotions: 'Promotions',
    inventory: 'Inventory',
    reviews: 'Reviews',
    delivery: 'Delivery',
    payments: 'Payments',
    staff: 'Staff Management',
    reports: 'Reports'
  }
};

/**
 * 브레드크럼 아이템 컴포넌트
 */
const BreadcrumbItem = ({ href, children, isLast, icon }) => {
  if (isLast) {
    return (
      <li className="flex items-center">
        <span className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
          {icon && <span className="mr-1.5 text-xs">{icon}</span>}
          <span className="truncate max-w-[200px]" title={children}>
            {children}
          </span>
        </span>
      </li>
    );
  }

  return (
    <li className="flex items-center">
      <Link
        href={href}
        className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-vietnam-mint dark:hover:text-vietnam-mint hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-opacity-50 rounded-md px-2 py-1"
      >
        {icon && <span className="mr-1.5 text-xs">{icon}</span>}
        <span className="truncate max-w-[150px]" title={children}>
          {children}
        </span>
      </Link>
      <svg
        className="flex-shrink-0 mx-1.5 h-3 w-3 text-gray-400 dark:text-gray-500"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    </li>
  );
};

/**
 * 브레드크럼 컴포넌트
 */
const Breadcrumb = ({ 
  customItems = null,
  maxItems = 4,
  showHome = true,
  homeLabel = null, // null이면 언어에 따라 자동 설정
  homeHref = '/dashboard',
  homeIcon = '🏠',
  className = '',
  separator = null,
  locale = 'vi', // 기본값을 Local어로 설정
  showIcons = true,
  isCollapsible = true,
  ...props 
}) => {
  const pathname = usePathname();

  // 브레드크럼 아이템 생성
  const generateBreadcrumbs = () => {
    // 커스텀 아이템이 제공된 경우
    if (customItems) {
      return customItems;
    }

    const pathSegments = pathname.split('/').filter(segment => segment !== '');
    const breadcrumbs = [];
    const labels = PATH_LABELS[locale] || PATH_LABELS.vi;

    // 홈 링크 추가
    if (showHome) {
      const defaultHomeLabels = {
        vi: 'Trang chủ',
        ko: '홈',
        en: 'Home'
      };
      
      breadcrumbs.push({
        label: homeLabel || defaultHomeLabels[locale] || defaultHomeLabels.vi,
        href: homeHref,
        icon: showIcons ? homeIcon : null
      });
    }

    // 경로 세그먼트를 브레드크럼으로 변환
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // 마지막이 아닌 경우에만 href 설정
      const isLast = index === pathSegments.length - 1;
      const pathKey = pathSegments.slice(0, index + 1).join('/');
      
      // 아이콘 매핑
      const iconMap = {
        'dashboard': '📊',
        'orders': '🛒',
        'menu': '🍽️',
        'analytics': '📈',
        'pos': '💳',
        'settings': '⚙️',
        'customers': '👥',
        'promotions': '🎉',
        'inventory': '📦',
        'reviews': '⭐',
        'delivery': '🚚',
        'payments': '💰',
        'staff': '👨‍💼'
      };
      
      breadcrumbs.push({
        label: labels[pathKey] || 
               segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        href: isLast ? undefined : currentPath,
        icon: showIcons ? iconMap[segment] : null,
        isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // 최대 항목 수 제한 (축소 가능한 경우만)
  const displayBreadcrumbs = (isCollapsible && breadcrumbs.length > maxItems)
    ? [
        breadcrumbs[0], // 홈
        { 
          label: '...', 
          isEllipsis: true,
          title: `${breadcrumbs.length - 3} mục đã ẩn` // 툴팁
        },
        ...breadcrumbs.slice(-2) // 마지막 2개
      ]
    : breadcrumbs;

  if (displayBreadcrumbs.length <= 1) {
    return null; // 브레드크럼이 의미없는 경우 숨김
  }

  const ariaLabels = {
    vi: 'Điều hướng đường dẫn',
    ko: '브레드크럼 네비게이션',
    en: 'Breadcrumb navigation'
  };

  return (
    <nav 
      className={`flex ${className}`} 
      aria-label={ariaLabels[locale] || ariaLabels.vi}
      role="navigation"
      {...props}
    >
      <ol className="inline-flex items-center space-x-1 md:space-x-2 flex-wrap">
        {/* Skip to main content link for screen readers */}
        <li className="sr-only">
          <a 
            href="#main-content" 
            className="focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-vietnam-mint text-white px-4 py-2 rounded-lg z-50"
          >
            {locale === 'vi' ? 'Chuyển đến nội dung chính' : 
             locale === 'ko' ? '메인 콘텐츠로 이동' : 
             'Skip to main content'}
          </a>
        </li>
        {displayBreadcrumbs.map((item, index) => {
          const isLast = index === displayBreadcrumbs.length - 1;
          
          // 생략 표시 (ellipsis) - 개선된 버전
          if (item.isEllipsis) {
            return (
              <li key="ellipsis" className="flex items-center">
                <button
                  className="flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mx-2 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-opacity-50"
                  title={item.title}
                  aria-label={item.title}
                  onClick={() => {
                    // 클릭 시 모든 아이템 표시하는 기능 추가 가능
                    console.log('Show all breadcrumb items');
                  }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                <svg
                  className="flex-shrink-0 mx-1 h-4 w-4 text-gray-400 dark:text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
            );
          }

          return (
            <BreadcrumbItem
              key={item.href || item.label}
              href={item.href}
              isLast={isLast}
              icon={item.icon}
            >
              {item.label}
            </BreadcrumbItem>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * 구조화된 데이터용 브레드크럼 (SEO)
 */
export const BreadcrumbSchema = ({ breadcrumbs }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      ...(item.href && { "item": `${typeof window !== 'undefined' ? window.location.origin : ''}${item.href}` })
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default Breadcrumb;