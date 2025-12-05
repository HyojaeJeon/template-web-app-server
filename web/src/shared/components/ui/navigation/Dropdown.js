'use client'

import { useState, useRef, useEffect, forwardRef, createContext, useContext } from 'react'
import { 
  ChevronDownIcon,
  UserIcon, 
  ClipboardDocumentListIcon,
  HeartIcon,
  MapPinIcon,
  CogIcon,
  ArrowLeftOnRectangleIcon,
  AdjustmentsHorizontalIcon,
  StarIcon,
  TruckIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  Bars3BottomLeftIcon,
  FireIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { colors, shadows, animation } from '../designTokens'

// Dropdown 컨텍스트
const DropdownContext = createContext()

/**
 * Dropdown - 드롭다운 메뉴 컴포넌트 (WCAG 2.1 준수)
 * 접근성과 키보드 네비게이션 지원
 * 다크 테마 지원
 */
const Dropdown = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const dropdownRef = useRef(null)

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleDropdown = () => setIsOpen(!isOpen)
  const closeDropdown = () => setIsOpen(false)

  return (
    <DropdownContext.Provider value={{ 
      isOpen, 
      setIsOpen, 
      toggleDropdown, 
      closeDropdown,
      activeIndex,
      setActiveIndex 
    }}>
      <div 
        ref={ref || dropdownRef}
        className={`relative inline-block ${className}`}
        {...props}
      >
        {children}
      </div>
    </DropdownContext.Provider>
  )
})

// 드롭다운 트리거 버튼 - 현대적이고 세련된 디자인
const DropdownTrigger = forwardRef(({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const { isOpen, toggleDropdown } = useContext(DropdownContext)

  const sizeClasses = {
    sm: 'gap-2 px-3 py-2 text-sm',
    md: 'gap-3 px-4 py-2.5 text-sm',
    lg: 'gap-3 px-5 py-3 text-base'
  }

  const variantClasses = {
    default: `
      bg-white/90 backdrop-blur border border-neutral-200/80
      text-neutral-700 
      hover:bg-white hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-200/30
      focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100
    `,
    primary: `
      bg-gradient-to-r from-primary-50 to-primary-100/50 border border-primary-200/80
      text-primary-700
      hover:from-primary-100 hover:to-primary-200/50 hover:border-primary-300 hover:shadow-lg hover:shadow-primary-200/30
      focus:from-primary-100 focus:to-primary-200/50 focus:border-primary-500 focus:ring-2 focus:ring-primary-200
    `,
    ghost: `
      bg-transparent border border-transparent
      text-neutral-600
      hover:bg-gradient-to-r hover:from-neutral-50 hover:to-neutral-100/50 hover:border-neutral-200 hover:shadow-md
      focus:bg-neutral-100 focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200
    `
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggleDropdown}
      aria-expanded={isOpen}
      aria-haspopup="true"
      className={`
        inline-flex items-center justify-between
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-xl font-semibold
        shadow-sm hover:shadow-lg
        focus:outline-none
        transition-all duration-300 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        active:translate-y-px active:shadow-sm
        ${className}
      `}
      {...props}
    >
      {children}
      <ChevronDownIcon 
        className={`w-4 h-4 transition-transform duration-200 ease-out ${
          isOpen ? 'rotate-180' : ''
        }`} 
      />
    </button>
  )
})

// 드롭다운 메뉴 - 현대적 애니메이션과 글래스 모피즘
const DropdownMenu = forwardRef(({
  children,
  align = 'left',
  width = 'w-56',
  className = '',
  ...props
}, ref) => {
  const { isOpen, activeIndex, setActiveIndex } = useContext(DropdownContext)
  const menuRef = useRef(null)

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return

      const items = menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])')
      if (!items) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prev) => (prev + 1) % items.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((prev) => (prev - 1 + items.length) % items.length)
          break
        case 'Home':
          e.preventDefault()
          setActiveIndex(0)
          break
        case 'End':
          e.preventDefault()
          setActiveIndex(items.length - 1)
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, setActiveIndex])

  // 활성 아이템 포커스
  useEffect(() => {
    if (activeIndex >= 0) {
      const items = menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])')
      items?.[activeIndex]?.focus()
    }
  }, [activeIndex])

  if (!isOpen) return null

  const alignClasses = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
    center: 'left-1/2 -translate-x-1/2 origin-top'
  }

  return (
    <div
      ref={ref || menuRef}
      role="menu"
      aria-orientation="vertical"
      className={`
        absolute z-[1000] mt-2 ${width} ${alignClasses[align]}
        bg-white/95 backdrop-blur-xl 
        border border-neutral-200/60 
        rounded-2xl shadow-2xl shadow-black/10
        py-2 overflow-hidden
        ring-1 ring-black/5
        ${className}
      `}
      style={{
        animation: isOpen 
          ? 'dropdownEnter 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          : 'dropdownExit 0.15s cubic-bezier(0.4, 0.0, 0.2, 1) forwards'
      }}
      {...props}
    >
      <style jsx>{`
        @keyframes dropdownEnter {
          from {
            opacity: 0;
            transform: translateY(-8px);
            filter: blur(4px);
          }
          60% {
            opacity: 0.8;
            transform: translateY(-2px);
            filter: blur(1px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        @keyframes dropdownExit {
          from {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
          to {
            opacity: 0;
            transform: translateY(-4px);
            filter: blur(2px);
          }
        }
      `}</style>
      {children}
    </div>
  )
})

// 드롭다운 아이템 - Scale 효과 제거, 현대적 디자인
const DropdownItem = forwardRef(({
  children,
  icon,
  disabled = false,
  danger = false,
  onClick,
  className = '',
  ...props
}, ref) => {
  const { closeDropdown } = useContext(DropdownContext)

  const handleClick = (e) => {
    if (!disabled) {
      onClick?.(e)
      closeDropdown()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick(e)
    }
  }

  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        w-full text-left flex items-center gap-3 
        px-4 py-3 mx-2 rounded-xl
        font-medium text-sm
        transition-all duration-200 ease-out
        ${disabled 
          ? 'opacity-50 cursor-not-allowed text-neutral-400' 
          : danger
            ? 'text-red-600 hover:bg-red-50/80 hover:text-red-700 hover:shadow-sm'
            : 'text-neutral-700 hover:bg-gradient-to-r hover:from-neutral-50 hover:to-neutral-100/50 hover:text-neutral-900 hover:shadow-sm'
        }
        focus:outline-none focus:bg-primary-50 focus:text-primary-700 focus:ring-2 focus:ring-primary-200
        active:bg-opacity-80 active:translate-y-px
        ${className}
      `}
      {...props}
    >
      {icon && (
        <span className={`flex-shrink-0 w-4 h-4 ${
          danger 
            ? 'text-red-500' 
            : disabled 
              ? 'text-neutral-400' 
              : 'text-neutral-500'
        }`}>
          {icon}
        </span>
      )}
      <span className="flex-1 truncate">
        {children}
      </span>
    </button>
  )
})

// 드롭다운 구분선 - 현대적 디자인
const DropdownDivider = () => (
  <div className="my-2 mx-3">
    <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
  </div>
)

// 드롭다운 헤더 - 현대적 타이포그래피
const DropdownHeader = ({ children, className = '' }) => (
  <div className={`px-4 py-3 text-xs font-bold text-neutral-600 uppercase tracking-widest bg-neutral-50/50 border-b border-neutral-100 ${className}`}>
    {children}
  </div>
)

// Local App 특화 드롭다운
export const DeliveryDropdown = ({ 
  type = 'user',
  className = '',
  ...props 
}) => {
  const configs = {
    user: {
      trigger: (
        <div className="flex items-center gap-2">
          <UserIcon className="w-4 h-4" />
          <span>내 계정</span>
        </div>
      ),
      items: [
        { icon: <UserIcon className="w-4 h-4" />, label: '프로필', action: 'profile' },
        { icon: <ClipboardDocumentListIcon className="w-4 h-4" />, label: '주문 내역', action: 'orders' },
        { icon: <HeartIcon className="w-4 h-4" />, label: '찜 목록', action: 'favorites' },
        { icon: <MapPinIcon className="w-4 h-4" />, label: '배송 주소', action: 'addresses' },
        { divider: true },
        { icon: <CogIcon className="w-4 h-4" />, label: '설정', action: 'settings' },
        { icon: <ArrowLeftOnRectangleIcon className="w-4 h-4" />, label: '로그아웃', action: 'logout', danger: true }
      ]
    },
    filter: {
      trigger: (
        <div className="flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="w-4 h-4" />
          <span>필터</span>
        </div>
      ),
      items: [
        { icon: <StarIcon className="w-4 h-4" />, label: '평점 높은순', action: 'rating' },
        { icon: <TruckIcon className="w-4 h-4" />, label: '배달 빠른순', action: 'delivery' },
        { icon: <CurrencyDollarIcon className="w-4 h-4" />, label: '가격 낮은순', action: 'price_low' },
        { icon: <CurrencyDollarIcon className="w-4 h-4" />, label: '가격 높은순', action: 'price_high' },
        { icon: <BuildingStorefrontIcon className="w-4 h-4" />, label: '신규 매장', action: 'new' }
      ]
    },
    sort: {
      trigger: (
        <div className="flex items-center gap-2">
          <Bars3BottomLeftIcon className="w-4 h-4" />
          <span>정렬</span>
        </div>
      ),
      items: [
        { icon: <Bars3BottomLeftIcon className="w-4 h-4" />, label: '기본순', action: 'default' },
        { icon: <FireIcon className="w-4 h-4" />, label: '인기순', action: 'popular' },
        { icon: <CalendarIcon className="w-4 h-4" />, label: '최신순', action: 'recent' },
        { icon: <MapPinIcon className="w-4 h-4" />, label: '거리순', action: 'distance' }
      ]
    }
  }

  const config = configs[type] || configs.user

  return (
    <Dropdown className={className} {...props}>
      <DropdownTrigger>
        {config.trigger}
      </DropdownTrigger>
      <DropdownMenu>
        {config.items.map((item, index) => {
          if (item.divider) {
            return <DropdownDivider key={index} />
          }
          return (
            <DropdownItem
              key={index}
              icon={item.icon}
              danger={item.danger}
              onClick={() => console.log(item.action)}
            >
              {item.label}
            </DropdownItem>
          )
        })}
      </DropdownMenu>
    </Dropdown>
  )
}

// 컴포넌트 내보내기
Dropdown.Trigger = DropdownTrigger
Dropdown.Menu = DropdownMenu
Dropdown.Item = DropdownItem
Dropdown.Divider = DropdownDivider
Dropdown.Header = DropdownHeader

Dropdown.displayName = 'Dropdown'

export default Dropdown