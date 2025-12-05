'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from '@/shared/i18n';
import {
  ShoppingCart,
  Menu,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  User,
  Bell,
  MessageSquare,
  FileText,
  CreditCard,
  Truck,
  UserCheck,
  Gift,
  Printer,
  PlusSquare,
  Edit3,
  Package,
  TrendingUp,
  Clock,
  Star,
  MapPin,
  Smartphone,
  Monitor,
  Wifi,
  DollarSign,
  Calculator,
  UserPlus,
  Shield,
  Store,
  Activity,
  Home,
  Coffee,
  Target,
  Palette
} from 'lucide-react';

// 메뉴 아이템 정의
export const menuItems = [
  {
    icon: Home,
    label: 'common.navigation.home',
    href: '/dashboard',
    color: 'vietnam-mint'
  },
  {
    icon: ShoppingCart,
    label: 'common.navigation.orders',
    href: '/dashboard/orders',
    color: 'vietnam-green',
    submenu: [
      { 
        icon: Activity, 
        label: 'orders.navigation.all', 
        href: '/dashboard/orders' 
      },
      {
        icon: FileText,
        label: 'orders.navigation.history',
        href: '/dashboard/orders/history'
      },
      { 
        icon: Clock, 
        label: 'orders.navigation.live', 
        href: '/dashboard/orders/live' 
      }
    ]
  },
  {
    icon: Coffee,
    label: 'common.navigation.menu',
    href: '/dashboard/menu/items',
    color: 'vietnam-mint',
    submenu: [
      {
        icon: Menu,
        label: 'menu.navigation.items',
        href: '/dashboard/menu/items'
      },
      {
        icon: Package,
        label: 'menu.navigation.categories',
        href: '/dashboard/menu/categories'
      },
      {
        icon: Edit3,
        label: 'menu.navigation.availability',
        href: '/dashboard/menu/availability'
      },
      {
        icon: Gift,
        label: 'menu.navigation.bundles',
        href: '/dashboard/menu/bundles'
      }
      // ⚠️ 템플릿 관리 메뉴 숨김 처리 (서버/DB는 유지)
      // {
      //   icon: FileText,
      //   label: 'menu.navigation.templates',
      //   href: '/dashboard/menu/templates'
      // }
    ]
  },
  {
    icon: Monitor,
    label: 'common.navigation.pos',
    href: '/dashboard/pos',
    color: 'vietnam-green',
    submenu: [
      { 
        icon: Wifi, 
        label: 'pos.navigation.status', 
        href: '/dashboard/pos' 
      },
      { 
        icon: Activity, 
        label: 'pos.navigation.sync', 
        href: '/dashboard/pos/sync' 
      },
      { 
        icon: Settings, 
        label: 'pos.navigation.settings', 
        href: '/dashboard/pos/settings' 
      }
    ]
  },
  {
    icon: BarChart3,
    label: 'common.navigation.analytics',
    href: '/dashboard/analytics',
    color: 'vietnam-mint',
    submenu: [
      { 
        icon: TrendingUp, 
        label: 'analytics.navigation.sales', 
        href: '/dashboard/analytics/revenue' 
      },
      { 
        icon: Users, 
        label: 'analytics.navigation.customers', 
        href: '/dashboard/analytics/customers' 
      },
      { 
        icon: FileText, 
        label: 'analytics.navigation.reports', 
        href: '/dashboard/analytics/reports' 
      },
      { 
        icon: BarChart3, 
        label: 'analytics.navigation.performance', 
        href: '/dashboard/analytics/performance' 
      },
      { 
        icon: Menu, 
        label: 'analytics.navigation.menu', 
        href: '/dashboard/analytics/menu' 
      }
    ]
  },
  {
    icon: Users,
    label: 'common.navigation.customers',
    href: '/dashboard/customers',
    color: 'vietnam-green',
    submenu: [
      {
        icon: Users,
        label: 'customers.navigation.list',
        href: '/dashboard/customers'
      },
      {
        icon: Target,
        label: 'customers.navigation.segments',
        href: '/dashboard/customers/segments'
      },
      {
        icon: Star,
        label: 'customers.navigation.reviews',
        href: '/dashboard/customers/reviews'
      }
    ]
  },
  {
    icon: Gift,
    label: 'common.navigation.promotions',
    href: '/dashboard/promotions',
    color: 'vietnam-mint',
    submenu: [
      {
        icon: Gift,
        label: 'promotions.navigation.list',
        href: '/dashboard/promotions'
      },
      {
        icon: PlusSquare,
        label: 'promotions.navigation.add',
        href: '/dashboard/promotions/add'
      },
      {
        icon: BarChart3,
        label: 'promotions.navigation.analytics',
        href: '/dashboard/promotions/analytics'
      }
    ]
  },
  {
    icon: Truck,
    label: 'common.navigation.delivery',
    href: '/dashboard/delivery',
    color: 'vietnam-green',
    submenu: [
      { 
        icon: MapPin, 
        label: 'delivery.navigation.zones', 
        href: '/dashboard/delivery/zones' 
      },
      { 
        icon: Truck, 
        label: 'delivery.navigation.tracking', 
        href: '/dashboard/delivery/tracking' 
      },
      { 
        icon: Settings, 
        label: 'delivery.navigation.settings', 
        href: '/dashboard/delivery/settings' 
      }
    ]
  },
  {
    icon: MessageSquare,
    label: 'common.navigation.chat',
    href: '/dashboard/chat',
    color: 'vietnam-mint'
  },
  {
    icon: CreditCard,
    label: 'common.navigation.payments',
    href: '/dashboard/payments',
    color: 'vietnam-mint',
    submenu: [
      {
        icon: DollarSign,
        label: 'payments.navigation.transactions',
        href: '/dashboard/payments/transactions'
      },
      {
        icon: Calculator,
        label: 'payments.navigation.settlement',
        href: '/dashboard/payments/settlement'
      }
      // ⚠️ 결제 수단 관리 메뉴 제거 (매장 설정에서 관리)
      // {
      //   icon: Settings,
      //   label: 'payments.navigation.methods',
      //   href: '/dashboard/payments/methods'
      // }
    ]
  },
  {
    icon: UserCheck,
    label: 'common.navigation.staff',
    href: '/dashboard/staff',
    color: 'vietnam-green',
    submenu: [
      { 
        icon: Users, 
        label: 'staff.navigation.list', 
        href: '/dashboard/staff' 
      },
      { 
        icon: UserPlus, 
        label: 'staff.navigation.add', 
        href: '/dashboard/staff/add' 
      },
      { 
        icon: Shield, 
        label: 'staff.navigation.roles', 
        href: '/dashboard/staff/roles' 
      }
    ]
  },
  {
    icon: FileText,
    label: 'common.navigation.reports',
    href: '/dashboard/reports',
    color: 'vietnam-mint',
    submenu: [
      { 
        icon: TrendingUp, 
        label: 'reports.navigation.sales', 
        href: '/dashboard/reports/sales' 
      },
      { 
        icon: Package, 
        label: 'reports.navigation.inventory', 
        href: '/dashboard/reports/inventory' 
      },
      { 
        icon: Printer, 
        label: 'reports.navigation.export', 
        href: '/dashboard/reports/export' 
      }
    ]
  },
  {
    icon: Bell,
    label: 'common.navigation.notifications',
    href: '/dashboard/notifications',
    color: 'vietnam-mint'
  },
  // ⚠️ 개발/테스트 전용 메뉴 (배포 전 제거)
  {
    icon: Smartphone,
    label: 'menu.devTools',
    href: '/dashboard/dev-tools',
    color: 'orange-500',
    badge: 'DEV',
    submenu: [
      {
        icon: CreditCard,
        label: 'menu.paymentGatewayTest',
        href: '/dashboard/dev-tools/payment-test'
      }
    ]
  },
  {
    icon: Settings,
    label: 'common.navigation.settings',
    href: '/dashboard/settings',
    color: 'vietnam-mint',
    submenu: [
      {
        icon: Store,
        label: 'settings.navigation.store',
        href: '/dashboard/settings/store'
      },
      {
        icon: Palette,
        label: 'settings.navigation.brand',
        href: '/dashboard/settings/brand'
      },
      {
        icon: MessageSquare,
        label: 'chat.navigation.settings',
        href: '/dashboard/settings/chat'
      },
      {
        icon: Bell,
        label: 'settings.navigation.notifications',
        href: '/dashboard/settings/notifications'
      },
      {
        icon: User,
        label: 'settings.navigation.profile',
        href: '/dashboard/settings/profile'
      }
    ]
  }
];

const DashboardSidebar = ({
  collapsed = false,
  onToggle,
  mobileMenuOpen = false,
  setMobileMenuOpen,
  className = ''
}) => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [expandedMenus, setExpandedMenus] = useState({});

  const isActivePath = (href) => {
    if (href === '/dashboard') {
      return pathname === href;
    }

    // 정확한 경로 일치 확인
    if (pathname === href) {
      return true;
    }

    // 하위 경로 확인 (다음 문자가 '/'인 경우만 true)
    // 예: /dashboard/customers는 /dashboard/customers/reviews의 부모지만
    //     /dashboard/customers와 /dashboard/customers/reviews를 구분
    return pathname.startsWith(href + '/');
  };

  // ✅ 서브메뉴 활성화 체크 (정확한 경로만 active) - useCallback으로 최적화
  const isSubmenuActive = useCallback((href) => {
    // 정확한 경로 일치만 active로 표시
    // 예: /dashboard/orders/history는 active이지만 /dashboard/orders는 active 아님
    return pathname === href;
  }, [pathname]);

  // ✅ 서브메뉴 중 하나라도 active인지 확인 (부모 메뉴 펼치기용)
  const hasActiveChild = useCallback((href) => {
    // 현재 경로가 href로 시작하면 하위 경로임
    return pathname === href || pathname.startsWith(href + '/');
  }, [pathname]);

  const toggleSubmenu = (itemHref) => {
    setExpandedMenus(prev => ({
      ...prev,
      [itemHref]: !prev[itemHref]
    }));
  };

  // ✅ 현재 경로에 맞는 서브메뉴 자동 펼침 (페이지 로드 및 경로 변경 시)
  // 🎯 모든 페이지에서 새로고침 시 해당 메뉴 펼침 (부모는 펼치기만, active 아님)
  useEffect(() => {
    const newExpandedMenus = {};

    // 모든 메뉴 항목을 순회하며 현재 경로의 부모 메뉴를 찾아 펼침
    menuItems.forEach((item) => {
      if (item.submenu && item.submenu.length > 0) {
        // 서브메뉴 중 하나라도 현재 경로 또는 하위 경로와 일치하면 부모 메뉴 펼침
        const shouldExpand = item.submenu.some((subItem) =>
          hasActiveChild(subItem.href)
        );

        if (shouldExpand) {
          newExpandedMenus[item.href] = true;
        }
      }
    });

    setExpandedMenus(newExpandedMenus);
  }, [pathname, hasActiveChild]); // pathname 또는 hasActiveChild 변경 시 실행

  const getMenuColors = (colorClass, isActive) => {
    const colors = {
      'vietnam-mint': {
        active: 'bg-gradient-to-r from-vietnam-mint to-vietnam-mint-dark text-white shadow-vietnam-mint',
        inactive: 'text-gray-700 dark:text-gray-300 hover:bg-vietnam-mint/10 dark:hover:bg-vietnam-mint/20 hover:text-vietnam-mint',
        icon: isActive ? 'bg-white/20 text-white' : 'bg-vietnam-mint/10 dark:bg-vietnam-mint/20 text-vietnam-mint group-hover:bg-vietnam-mint/20 dark:group-hover:bg-vietnam-mint/30',
        submenuActive: 'bg-vietnam-mint/20 dark:bg-vietnam-mint/30 text-vietnam-mint font-medium',
        submenuInactive: 'text-gray-600 dark:text-gray-400 hover:bg-vietnam-mint/5 dark:hover:bg-vietnam-mint/15 hover:text-vietnam-mint-dark',
        submenuIcon: 'bg-vietnam-mint text-white',
        submenuIconInactive: 'text-gray-400 dark:text-gray-500 group-hover:text-vietnam-mint',
        overlay: 'bg-gradient-to-r from-vietnam-mint/5 to-vietnam-mint/10 dark:from-vietnam-mint/10 dark:to-vietnam-mint/15'
      },
      'vietnam-green': {
        active: 'bg-gradient-to-r from-vietnam-green to-vietnam-green-dark text-white shadow-vietnam-green',
        inactive: 'text-gray-700 dark:text-gray-300 hover:bg-vietnam-green/10 dark:hover:bg-vietnam-green/20 hover:text-vietnam-green',
        icon: isActive ? 'bg-white/20 text-white' : 'bg-vietnam-green/10 dark:bg-vietnam-green/20 text-vietnam-green group-hover:bg-vietnam-green/20 dark:group-hover:bg-vietnam-green/30',
        submenuActive: 'bg-vietnam-green/20 dark:bg-vietnam-green/30 text-vietnam-green font-medium',
        submenuInactive: 'text-gray-600 dark:text-gray-400 hover:bg-vietnam-green/5 dark:hover:bg-vietnam-green/15 hover:text-vietnam-green-dark',
        submenuIcon: 'bg-vietnam-green text-white',
        submenuIconInactive: 'text-gray-400 dark:text-gray-500 group-hover:text-vietnam-green',
        overlay: 'bg-gradient-to-r from-vietnam-green/5 to-vietnam-green/10 dark:from-vietnam-green/10 dark:to-vietnam-green/15'
      }
    };
    
    return colors[colorClass] || colors['vietnam-mint'];
  };

  const MenuLink = ({ item, level = 0 }) => {
    const Icon = item.icon;
    const isActive = isActivePath(item.href);
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus[item.href];
    const colorClass = item.color || 'vietnam-mint';
    const colors = getMenuColors(colorClass, isActive);

    const handleClick = () => {
      // 서브메뉴가 있으면 펼치기/접기만 수행 (페이지 이동 안 함)
      if (hasSubmenu && !collapsed) {
        toggleSubmenu(item.href);
        return; // 페이지 이동 막기
      }

      // 서브메뉴가 없으면 페이지 이동
      router.push(item.href);

      // 모바일 메뉴 닫기
      setMobileMenuOpen && setMobileMenuOpen(false);
    };

    return (
      <div key={item.href} className={`mb-1 ${level > 0 ? 'ml-4' : ''}`}>
        <div
          className={`
            group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 cursor-pointer relative overflow-hidden
            ${isActive ? colors.active : colors.inactive}
            ${!collapsed ? 'mx-2' : 'mx-1'}
          `}
          onClick={handleClick}
        >
          {/* Gradient overlay on hover */}
          <div className={`absolute inset-0 ${colors.overlay} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

          <div className="flex items-center relative z-10">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 ${colors.icon}`}>
              <Icon size={18} className="flex-shrink-0" />
            </div>

            {!collapsed && (
              <>
                <div className="flex-1 ml-3">
                  <span className="block font-semibold truncate">
                    {t(item.label)}
                  </span>
                </div>

                {hasSubmenu && (
                  <div className="ml-2">
                    {isExpanded ? (
                      <ChevronUp size={16} className="transform transition-transform duration-200" />
                    ) : (
                      <ChevronDown size={16} className="transform transition-transform duration-200" />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Submenu */}
        {hasSubmenu && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1 animate-fadeIn">
            {item.submenu.map((subItem) => {
              const SubIcon = subItem.icon;
              // ✅ 정확한 경로만 active (예: /dashboard/orders/history만 active)
              const isSubActive = isSubmenuActive(subItem.href);
              const subColors = getMenuColors(colorClass, isSubActive);

              return (
                <Link
                  key={subItem.href}
                  href={subItem.href}
                  className={`
                    group flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200 ml-4
                    ${isSubActive ? subColors.submenuActive : subColors.submenuInactive}
                  `}
                  onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-all duration-200 ${isSubActive ? subColors.submenuIcon : subColors.submenuIconInactive}`}>
                    <SubIcon size={16} />
                  </div>
                  <span className="font-medium">{t(subItem.label)}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
          transition-all duration-300 ease-in-out
          flex flex-col
          ${collapsed ? 'w-20' : 'w-72'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:inset-0
          ${className}
        `}
      >
        {/* Header - 고정 */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-vietnam-mint to-vietnam-green rounded-lg mr-3 flex items-center justify-center">
                <Store size={20} className="text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-vietnam-mint to-vietnam-green bg-clip-text text-transparent">
                Vietnam Delivery
              </span>
            </Link>
          )}
          
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => onToggle && onToggle()}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {collapsed ? (
              <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Menu Items - 스크롤 가능 영역 */}
        <nav className="flex-1 overflow-y-auto py-4 min-h-0">
          {menuItems.map((item) => (
            <MenuLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Footer - 고정 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={18} className="mr-2" />
            {!collapsed && t('common.actions.logout')}
          </button>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;