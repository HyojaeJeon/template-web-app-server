'use client'

import { Fragment } from 'react'
import Link from 'next/link'

const Breadcrumb = ({
  items = [],
  separator = '/',
  className = '',
  homeLabel = '홈',
  showHome = true,
  maxItems = 0,
  collapsed = false,
  ariaLabel = '경로 탐색'
}) => {
  // Process items with max items logic
  const processedItems = (() => {
    if (maxItems > 0 && items.length > maxItems) {
      const firstItem = items[0]
      const lastItems = items.slice(-(maxItems - 2))
      return [
        firstItem,
        { label: '...', isEllipsis: true },
        ...lastItems
      ]
    }
    return items
  })()

  // Prepare final items list
  const finalItems = showHome 
    ? [{ label: homeLabel, href: '/', icon: '🏠' }, ...processedItems]
    : processedItems

  if (finalItems.length === 0) return null

  return (
    <nav 
      aria-label={ariaLabel}
      className={`flex items-center py-2 ${className}`}
    >
      <ol className="flex items-center space-x-2">
        {finalItems.map((item, index) => {
          const isLast = index === finalItems.length - 1
          const isEllipsis = item.isEllipsis
          const isHome = index === 0 && showHome

          return (
            <Fragment key={index}>
              <li className="flex items-center">
                {isEllipsis ? (
                  <span 
                    className="px-2 py-1 text-gray-500 text-sm font-medium"
                    aria-label="더 많은 페이지"
                  >
                    •••
                  </span>
                ) : isLast ? (
                  <span 
                    className="px-3 py-1.5 bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] text-white text-sm font-medium rounded-xl"
                    aria-current="page"
                  >
                    {item.icon && (
                      <span className="mr-2" aria-hidden="true">
                        {item.icon}
                      </span>
                    )}
                    {collapsed && !isHome ? (
                      <span className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-lg text-xs font-bold">
                        {item.label.substring(0, 1).toUpperCase()}
                      </span>
                    ) : (
                      item.label
                    )}
                  </span>
                ) : item.href ? (
                  <Link 
                    href={item.href}
                    className="px-3 py-1.5 text-gray-600 hover:text-[#2AC1BC] hover:bg-gradient-to-r hover:from-[#F0FCFC] hover:to-white border border-gray-200 hover:border-[#2AC1BC]/20 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] focus:ring-offset-2"
                  >
                    {item.icon && (
                      <span className="mr-2" aria-hidden="true">
                        {item.icon}
                      </span>
                    )}
                    {collapsed && !isHome ? (
                      <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-xs font-bold">
                        {item.label.substring(0, 1).toUpperCase()}
                      </span>
                    ) : (
                      item.label
                    )}
                  </Link>
                ) : (
                  <span className="px-3 py-1.5 text-gray-500 text-sm font-medium">
                    {item.icon && (
                      <span className="mr-2" aria-hidden="true">
                        {item.icon}
                      </span>
                    )}
                    {collapsed && !isHome ? (
                      <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-xs font-bold">
                        {item.label.substring(0, 1).toUpperCase()}
                      </span>
                    ) : (
                      item.label
                    )}
                  </span>
                )}
              </li>
              {!isLast && (
                <li 
                  className="flex items-center text-gray-400 px-1" 
                  aria-hidden="true"
                  role="presentation"
                >
                  {separator === '/' || separator === '>' ? (
                    <svg 
                      className="w-4 h-4" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{separator}</span>
                  )}
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb