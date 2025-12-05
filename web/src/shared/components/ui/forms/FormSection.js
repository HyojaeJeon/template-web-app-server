/**
 * @fileoverview 폼 섹션 컴포넌트 - WCAG 2.1 준수
 * 폼을 논리적 섹션으로 구분하는 컴포넌트
 * Local App 테마 색상 및 접근성 지원
 * 
 * @version 1.0.0
 * @author DeliveryVN Team
 */

'use client';

import React, { useId } from 'react';

/**
 * 폼 섹션 컴포넌트
 * @param {Object} props
 * @param {React.ReactNode} props.children - 자식 컴포넌트들
 * @param {string} [props.title] - 섹션 제목
 * @param {string} [props.description] - 섹션 설명
 * @param {string} [props.level='2'] - 제목 레벨 (1-6)
 * @param {boolean} [props.required=false] - 필수 섹션 여부
 * @param {boolean} [props.collapsible=false] - 접을 수 있는 섹션 여부
 * @param {boolean} [props.defaultExpanded=true] - 기본 펼침 상태
 * @param {Function} [props.onToggle] - 펼침/접힘 토글 핸들러
 * @param {string} [props.variant='default'] - 스타일 변형 (default, bordered, card, minimal)
 * @param {string} [props.spacing='normal'] - 내부 간격 (tight, normal, loose)
 * @param {boolean} [props.showDivider=false] - 구분선 표시 여부
 * @param {string} [props.icon] - 섹션 아이콘 (SVG path 또는 컴포넌트)
 * @param {string} [props.badge] - 섹션 배지 텍스트
 * @param {string} [props.badgeColor='blue'] - 배지 색상
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {string} [props.ariaLabel] - 접근성 레이블
 * @returns {JSX.Element}
 */
const FormSection = ({
  children,
  title,
  description,
  level = '2',
  required = false,
  collapsible = false,
  defaultExpanded = true,
  onToggle,
  variant = 'default',
  spacing = 'normal',
  showDivider = false,
  icon,
  badge,
  badgeColor = 'blue',
  className = '',
  ariaLabel,
  ...props
}) => {
  const sectionId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  // 펼침/접힘 토글 핸들러
  const handleToggle = React.useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  }, [isExpanded, onToggle]);

  // 키보드 이벤트 핸들러
  const handleKeyDown = React.useCallback((e) => {
    if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleToggle();
    }
  }, [collapsible, handleToggle]);

  // 제목 태그 동적 생성
  const HeadingTag = `h${Math.max(1, Math.min(6, parseInt(level)))}`;

  // 스타일 변형별 클래스
  const variantClasses = {
    default: 'bg-transparent',
    bordered: 'border border-gray-200 dark:border-gray-700 rounded-lg p-6',
    card: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm',
    minimal: 'bg-transparent'
  };

  // 간격별 클래스
  const spacingClasses = {
    tight: 'space-y-3',
    normal: 'space-y-4',
    loose: 'space-y-6'
  };

  // 배지 색상별 클래스
  const badgeColorClasses = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    mint: 'bg-mint-100 text-mint-800 dark:bg-mint-900 dark:text-mint-200'
  };

  return (
    <section
      id={sectionId}
      className={`w-full ${variantClasses[variant]} ${className}`}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      aria-label={!title ? ariaLabel : undefined}
      {...props}
    >
      {/* 헤더 */}
      {(title || description) && (
        <div className={`${showDivider ? 'pb-4 border-b border-gray-200 dark:border-gray-700 mb-6' : 'mb-4'}`}>
          {/* 제목 */}
          {title && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* 접을 수 있는 섹션인 경우 버튼으로 렌더링 */}
                {collapsible ? (
                  <button
                    type="button"
                    onClick={handleToggle}
                    onKeyDown={handleKeyDown}
                    className="flex items-center space-x-3 text-left focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-opacity-50 rounded p-1 -m-1"
                    aria-expanded={isExpanded}
                    aria-controls={`${sectionId}-content`}
                  >
                    {/* 아이콘 */}
                    {icon && (
                      <div className="flex-shrink-0 w-5 h-5 text-gray-500 dark:text-gray-400">
                        {typeof icon === 'string' ? (
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path d={icon} />
                          </svg>
                        ) : (
                          icon
                        )}
                      </div>
                    )}

                    <HeadingTag
                      id={titleId}
                      className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2"
                    >
                      <span>{title}</span>
                      {required && (
                        <span className="text-red-500 dark:text-red-400" aria-label="필수">*</span>
                      )}
                      {badge && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeColorClasses[badgeColor] || badgeColorClasses.blue}`}>
                          {badge}
                        </span>
                      )}
                    </HeadingTag>

                    {/* 확장/축소 아이콘 */}
                    <svg
                      className={`w-5 h-5 text-gray-400 transform transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : (
                  <div className="flex items-center space-x-3">
                    {/* 아이콘 */}
                    {icon && (
                      <div className="flex-shrink-0 w-5 h-5 text-gray-500 dark:text-gray-400">
                        {typeof icon === 'string' ? (
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path d={icon} />
                          </svg>
                        ) : (
                          icon
                        )}
                      </div>
                    )}

                    <HeadingTag
                      id={titleId}
                      className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2"
                    >
                      <span>{title}</span>
                      {required && (
                        <span className="text-red-500 dark:text-red-400" aria-label="필수">*</span>
                      )}
                      {badge && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeColorClasses[badgeColor] || badgeColorClasses.blue}`}>
                          {badge}
                        </span>
                      )}
                    </HeadingTag>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 설명 */}
          {description && (
            <p 
              id={descriptionId}
              className="mt-2 text-sm text-gray-600 dark:text-gray-400"
            >
              {description}
            </p>
          )}
        </div>
      )}

      {/* 콘텐츠 */}
      {(!collapsible || isExpanded) && (
        <div
          id={collapsible ? `${sectionId}-content` : undefined}
          className={spacingClasses[spacing]}
        >
          {children}
        </div>
      )}

      {/* 접힌 상태 표시 */}
      {collapsible && !isExpanded && (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          섹션이 접혀있습니다. 클릭하여 펼치세요.
        </div>
      )}
    </section>
  );
};

export default FormSection;