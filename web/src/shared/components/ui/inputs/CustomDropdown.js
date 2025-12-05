'use client';

/**
 * CustomDropdown 컴포넌트
 * CategorySelector 디자인 패턴을 따르는 범용 드롭다운
 *
 * 사용 예시:
 * <CustomDropdown
 *   value="GOLD"
 *   options={[
 *     { value: 'GOLD', label: 'Gold', icon: StarIcon },
 *     { value: 'SILVER', label: 'Silver', icon: SparklesIcon }
 *   ]}
 *   onChange={(value) => console.log(value)}
 *   placeholder="Select an option"
 * />
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function CustomDropdown({
  value,
  options = [],
  onChange,
  placeholder = 'Select...',
  icon: DefaultIcon = null,
  className = '',
  disabled = false,
  error = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 선택된 옵션 찾기
  const selectedOption = options.find(opt => opt.value === value);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 드롭다운 토글
  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // 옵션 선택
  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // 아이콘 렌더링
  const renderIcon = (option) => {
    const IconComponent = option?.icon || DefaultIcon;
    if (!IconComponent) return null;

    return (
      <IconComponent
        className={`w-5 h-5 flex-shrink-0 ${
          value === option?.value ? 'text-emerald-500' : 'text-gray-400'
        }`}
      />
    );
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 드롭다운 트리거 버튼 */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5 text-left
          bg-white dark:bg-gray-700
          border rounded-lg
          flex items-center justify-between
          transition-all duration-200
          ${disabled
            ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
            : error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
          }
          ${isOpen && !disabled ? 'ring-2 ring-emerald-500/20 border-emerald-500' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption ? (
            <>
              {renderIcon(selectedOption)}
              <span className="text-gray-900 dark:text-white truncate">
                {selectedOption.label}
              </span>
              {selectedOption.description && (
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  ({selectedOption.description})
                </span>
              )}
            </>
          ) : (
            <>
              {DefaultIcon && <DefaultIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />}
              <span className="text-gray-500 dark:text-gray-400">
                {placeholder}
              </span>
            </>
          )}
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 에러 메시지 */}
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}

      {/* 드롭다운 메뉴 */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* 옵션 목록 */}
          <div className="max-h-60 overflow-y-auto">
            {options.length > 0 ? (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full px-4 py-3 text-left
                    flex items-center gap-3
                    transition-colors duration-150
                    hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                    ${value === option.value
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : 'text-gray-900 dark:text-white'
                    }
                  `}
                >
                  {renderIcon(option)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {option.description}
                      </div>
                    )}
                  </div>
                  {value === option.value && (
                    <CheckIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No options available
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
