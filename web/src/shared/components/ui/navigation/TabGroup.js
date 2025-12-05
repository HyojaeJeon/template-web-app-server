'use client'

import { useState, useRef, useEffect } from 'react'

const TabGroup = ({
  tabs = [],
  defaultTab = 0,
  activeTab: controlledActiveTab,
  onTabChange,
  variant = 'default', // 'default', 'pills', 'underline', 'vietnamese'
  size = 'medium',
  fullWidth = false,
  scrollable = false,
  className = '',
  tabClassName = '',
  panelClassName = '',
  showBadge = false,
  vertical = false,
  ariaLabel = '탭 탐색'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const tabListRef = useRef(null)
  const tabRefs = useRef([])

  const currentActiveTab = controlledActiveTab !== undefined ? controlledActiveTab : activeTab

  useEffect(() => {
    // Focus management for keyboard navigation
    if (tabRefs.current[currentActiveTab]) {
      tabRefs.current[currentActiveTab].focus()
    }
  }, [currentActiveTab])

  const handleTabClick = (index) => {
    if (tabs[index]?.disabled) return
    
    if (controlledActiveTab === undefined) {
      setActiveTab(index)
    }
    onTabChange?.(index)
  }

  const handleKeyDown = (event, index) => {
    let nextIndex = index

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        nextIndex = index > 0 ? index - 1 : tabs.length - 1
        while (tabs[nextIndex]?.disabled && nextIndex !== index) {
          nextIndex = nextIndex > 0 ? nextIndex - 1 : tabs.length - 1
        }
        break

      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        nextIndex = index < tabs.length - 1 ? index + 1 : 0
        while (tabs[nextIndex]?.disabled && nextIndex !== index) {
          nextIndex = nextIndex < tabs.length - 1 ? nextIndex + 1 : 0
        }
        break

      case 'Home':
        event.preventDefault()
        nextIndex = 0
        while (tabs[nextIndex]?.disabled && nextIndex < tabs.length - 1) {
          nextIndex++
        }
        break

      case 'End':
        event.preventDefault()
        nextIndex = tabs.length - 1
        while (tabs[nextIndex]?.disabled && nextIndex > 0) {
          nextIndex--
        }
        break

      case 'Enter':
      case ' ':
        event.preventDefault()
        handleTabClick(index)
        return

      default:
        return
    }

    if (nextIndex !== index && !tabs[nextIndex]?.disabled) {
      handleTabClick(nextIndex)
    }
  }

  if (tabs.length === 0) return null

  const orientation = vertical ? 'vertical' : 'horizontal'

  const getSizeClasses = () => {
    switch (size) {
      case 'small': return { text: 'text-sm', padding: 'px-3 py-1.5', height: 'h-8' }
      case 'large': return { text: 'text-lg', padding: 'px-6 py-3', height: 'h-12' }
      default: return { text: 'text-base', padding: 'px-4 py-2', height: 'h-10' }
    }
  }

  const getVariantClasses = (isActive, isDisabled) => {
    const baseClasses = `
      ${getSizeClasses().text} ${getSizeClasses().padding} ${getSizeClasses().height}
      flex items-center gap-2 font-medium transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `

    switch (variant) {
      case 'pills':
        return `${baseClasses} rounded-full ${
          isActive
            ? 'bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] text-white shadow-lg'
            : 'text-gray-600 hover:text-[#2AC1BC] hover:bg-gradient-to-r hover:from-[#F0FCFC] hover:to-white'
        }`

      case 'underline':
        return `${baseClasses} border-b-2 ${
          isActive
            ? 'border-[#2AC1BC] text-[#2AC1BC] bg-gradient-to-r from-[#F0FCFC] to-white'
            : 'border-transparent text-gray-600 hover:text-[#2AC1BC] hover:border-[#2AC1BC]/30'
        }`

      case 'vietnamese':
        return `${baseClasses} rounded-2xl border-2 ${
          isActive
            ? 'bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] text-white border-transparent shadow-lg'
            : 'border-gray-200 text-gray-600 hover:text-[#2AC1BC] hover:border-[#2AC1BC]/20 hover:bg-gradient-to-r hover:from-[#F0FCFC] hover:to-white'
        }`

      default:
        return `${baseClasses} rounded-xl ${
          isActive
            ? 'bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] text-white shadow-lg'
            : 'text-gray-600 hover:text-[#2AC1BC] hover:bg-gradient-to-r hover:from-[#F0FCFC] hover:to-white'
        }`
    }
  }

  return (
    <div className={`${vertical ? 'flex gap-6' : 'space-y-4'} ${className}`}>
      <div 
        ref={tabListRef}
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation={orientation}
        className={`
          ${vertical ? 'flex flex-col space-y-1 min-w-[200px]' : 'flex space-x-1'}
          ${fullWidth && !vertical ? 'grid' : ''}
          ${scrollable && !vertical ? 'overflow-x-auto scrollbar-hide' : ''}
          ${variant === 'underline' && !vertical ? 'border-b border-gray-200' : ''}
          ${variant === 'vietnamese' ? 'bg-gradient-to-r from-gray-50 to-white p-2 rounded-2xl border border-gray-100' : ''}
        `}
        style={fullWidth && !vertical ? { gridTemplateColumns: `repeat(${tabs.length}, 1fr)` } : {}}
      >
        {tabs.map((tab, index) => (
          <button
            key={index}
            ref={(el) => (tabRefs.current[index] = el)}
            role="tab"
            id={`tab-${index}`}
            aria-selected={currentActiveTab === index}
            aria-controls={`tabpanel-${index}`}
            aria-disabled={tab.disabled}
            tabIndex={currentActiveTab === index ? 0 : -1}
            onClick={() => handleTabClick(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            disabled={tab.disabled}
            className={`
              ${getVariantClasses(currentActiveTab === index, tab.disabled)}
              ${tabClassName}
            `}
            type="button"
          >
            {tab.icon && (
              <span className="flex-shrink-0" aria-hidden="true">
                {tab.icon}
              </span>
            )}
            
            <span className="whitespace-nowrap">
              {tab.label}
            </span>

            {showBadge && tab.badge !== undefined && (
              <span 
                className="ml-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm text-xs font-medium rounded-full min-w-[20px] text-center"
                aria-label={`${tab.badge}개 항목`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={`${vertical ? 'flex-1' : ''}`}>
        {tabs.map((tab, index) => (
          <div
            key={index}
            role="tabpanel"
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            hidden={currentActiveTab !== index}
            tabIndex={0}
            className={`
              ${currentActiveTab === index ? 'block' : 'hidden'}
              focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] focus:ring-offset-2 rounded-xl
              ${panelClassName}
            `}
          >
            {currentActiveTab === index && tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TabGroup