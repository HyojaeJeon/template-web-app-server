'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check, Building } from 'lucide-react';
import { cn } from '@/shared/utils';
import { VIETNAM_BANKS, searchBanks, getBankByName } from '@/shared/constants/vietnamBanks';

/**
 * BankSelectDropdown - Local 은행 선택 커스텀 드롭다운
 *
 * @param {Object} props
 * @param {string} props.value - 선택된 은행명
 * @param {function} props.onChange - 선택 변경 핸들러
 * @param {string} props.placeholder - 플레이스홀더 텍스트
 * @param {string} props.searchPlaceholder - 검색 입력 플레이스홀더
 * @param {string} props.noResultsText - 검색 결과 없을 때 텍스트
 * @param {boolean} props.error - 에러 상태
 * @param {boolean} props.disabled - 비활성화 상태
 * @param {string} props.className - 추가 스타일
 */
export default function BankSelectDropdown({
  value = '',
  onChange,
  placeholder = 'Select a bank',
  searchPlaceholder = 'Search bank name...',
  noResultsText = 'No results found',
  error = false,
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // 선택된 은행 정보
  const selectedBank = useMemo(() => getBankByName(value), [value]);

  // 필터링된 은행 목록
  const filteredBanks = useMemo(() => {
    return searchBanks(searchQuery);
  }, [searchQuery]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 드롭다운 열릴 때 검색 입력에 포커스
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // 은행 선택 핸들러
  const handleSelectBank = (bank) => {
    onChange?.(bank.name);
    setIsOpen(false);
    setSearchQuery('');
  };

  // 선택 초기화
  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.('');
    setSearchQuery('');
  };

  // 키보드 네비게이션
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* 트리거 (div로 변경 - button 중첩 방지) */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 border rounded-lg',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-vietnam-mint',
          'dark:bg-gray-700 dark:text-white',
          error
            ? 'border-red-500 dark:border-red-400'
            : 'border-gray-300 dark:border-gray-600',
          disabled
            ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60'
            : 'bg-white dark:bg-gray-700 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500'
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedBank ? (
            <>
              <Building className="w-4 h-4 flex-shrink-0 text-vietnam-mint" />
              <span className="truncate font-medium">{selectedBank.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                ({selectedBank.fullName})
              </span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform duration-200',
              isOpen && 'transform rotate-180'
            )}
          />
        </div>
      </div>

      {/* 드롭다운 패널 - 플로팅 모달 (위쪽 표시) */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 w-full bottom-full mb-2',
            'bg-white dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700',
            'rounded-xl shadow-2xl overflow-hidden',
            'max-h-[360px] flex flex-col',
            'animate-in fade-in-0 slide-in-from-bottom-2 duration-200'
          )}
          onKeyDown={handleKeyDown}
        >
          {/* 검색 입력 */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className={cn(
                  'w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg',
                  'text-sm focus:outline-none focus:ring-2 focus:ring-vietnam-mint',
                  'dark:bg-gray-700 dark:text-white'
                )}
              />
            </div>
          </div>

          {/* 은행 목록 */}
          <div className="overflow-y-auto flex-1">
            {filteredBanks.length > 0 ? (
              filteredBanks.map((bank) => (
                <button
                  key={bank.code}
                  type="button"
                  onClick={() => handleSelectBank(bank)}
                  className={cn(
                    'w-full px-3 py-2.5 flex items-center gap-3 text-left',
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                    'transition-colors duration-150',
                    value === bank.name && 'bg-vietnam-mint/10 dark:bg-vietnam-mint/20'
                  )}
                >
                  <Building className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {bank.name}
                      </span>
                      {bank.swift && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-gray-500 dark:text-gray-400">
                          {bank.swift}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {bank.fullName}
                    </p>
                  </div>
                  {value === bank.name && (
                    <Check className="w-4 h-4 flex-shrink-0 text-vietnam-mint" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{noResultsText}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
