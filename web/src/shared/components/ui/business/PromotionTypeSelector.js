'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLazyQuery } from '@apollo/client';
import { useTranslation } from '@/shared/i18n';
import {
  ChevronDownIcon,
  TagIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { S_GET_PROMOTION_TYPES } from '@/gql/queries/promotionTypes';

/**
 * PromotionTypeSelector - V2 동적 프로모션 타입 선택기
 *
 * @param {string} value - 선택된 프로모션 타입 ID
 * @param {function} onChange - 타입 변경 핸들러
 * @param {string} placeholder - 플레이스홀더 텍스트
 * @param {boolean} required - 필수 여부
 * @param {string} className - 추가 CSS 클래스
 * @param {string} error - 에러 메시지
 * @param {array} types - 외부에서 전달받은 타입 목록 (옵셔널)
 * @param {boolean} loading - 외부 로딩 상태
 * @param {function} onOpen - 드롭다운 열릴 때 호출
 * @param {object} initialType - 초기 선택된 타입 (수정 모드용)
 */
export default function PromotionTypeSelector({
  value,
  onChange,
  placeholder,
  required = false,
  className = "",
  error = null,
  types: externalTypes = null,
  loading: externalLoading = false,
  onOpen = null,
  initialType = null
}) {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [types, setTypes] = useState(externalTypes || []);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // 프로모션 타입 데이터 lazy 로딩
  const [loadTypes, { loading }] = useLazyQuery(S_GET_PROMOTION_TYPES, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const newTypes = data?.sGetPromotionTypes?.types || [];
      setTypes(newTypes);
    },
    onError: (err) => {
      console.error('[PromotionTypeSelector] Error loading types:', err);
    }
  });

  // 선택된 타입 찾기
  const selectedType = useMemo(() => {
    if (!value) return null;

    // types에서 먼저 찾기
    if (Array.isArray(types) && types.length > 0) {
      const found = types.find(type => type.id === value);
      if (found) return found;
    }

    // externalTypes에서 찾기
    if (Array.isArray(externalTypes) && externalTypes.length > 0) {
      const found = externalTypes.find(type => type.id === value);
      if (found) return found;
    }

    // initialType 사용 (수정 모드)
    if (initialType && initialType.id === value) {
      return initialType;
    }

    return null;
  }, [value, types, externalTypes, initialType]);

  // externalTypes가 변경되면 types state 업데이트
  useEffect(() => {
    if (externalTypes && externalTypes.length > 0) {
      setTypes(externalTypes);
    }
  }, [externalTypes]);

  // 타입 로컬라이제이션
  const getLocalizedName = useCallback((type) => {
    if (!type) return '';
    if (language === 'vi') return type.name || '';
    if (language === 'ko') return type.nameKo || type.name || '';
    if (language === 'en') return type.nameEn || type.name || '';
    return type.name || '';
  }, [language]);

  // 검색 필터링된 타입 목록
  const filteredTypes = useMemo(() => {
    if (!searchQuery) return types;

    const query = searchQuery.toLowerCase();
    return types.filter(type => {
      const name = getLocalizedName(type).toLowerCase();
      const desc = (
        language === 'vi' ? type.description :
        language === 'ko' ? type.descriptionKo || type.description :
        type.descriptionEn || type.description || ''
      ).toLowerCase();

      return name.includes(query) || desc.includes(query);
    });
  }, [types, searchQuery, getLocalizedName, language]);

  // 시스템 타입과 커스텀 타입 분리
  const { systemTypes, customTypes } = useMemo(() => {
    const system = filteredTypes.filter(type => type.isSystem);
    const custom = filteredTypes.filter(type => !type.isSystem);
    return { systemTypes: system, customTypes: custom };
  }, [filteredTypes]);

  // 드롭다운 토글
  const toggleDropdown = useCallback(() => {
    if (!isOpen) {
      // 외부 콜백 호출 (외부에서 타입 로딩)
      if (onOpen) {
        onOpen();
      }

      // 내부 쿼리로 타입 로드 (externalTypes가 없을 때만)
      if (!externalTypes || externalTypes.length === 0) {
        loadTypes();
      }

      // 검색 입력 포커스
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }

    setIsOpen(!isOpen);
  }, [isOpen, onOpen, loadTypes, externalTypes]);

  // 타입 선택 핸들러
  const handleSelectType = useCallback((typeId) => {
    onChange(typeId);
    setIsOpen(false);
    setSearchQuery('');
  }, [onChange]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 로딩 상태
  const isLoading = loading || externalLoading;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 선택 버튼 */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={`
          w-full px-4 py-3 rounded-lg border transition-all duration-200
          flex items-center justify-between
          ${error
            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-gray-300 bg-white hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
          }
          ${isOpen ? 'ring-2 ring-primary/20 border-primary' : ''}
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedType ? (
            <>
              {/* 타입 아이콘 */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${selectedType.color}20` }}
              >
                <span style={{ color: selectedType.color }}>
                  {selectedType.icon || '🏷️'}
                </span>
              </div>

              {/* 타입 이름 */}
              <div className="flex flex-col items-start min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {getLocalizedName(selectedType)}
                </span>
                {selectedType.isSystem && (
                  <span className="text-xs text-gray-500">
                    {t('promotions.v2.systemType')}
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <TagIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-500">
                {placeholder || t('promotions.v2.selectType')}
              </span>
            </>
          )}
        </div>

        {/* 드롭다운 아이콘 */}
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-1 flex items-center gap-1 text-red-600 text-sm">
          <ExclamationCircleIcon className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-hidden">
          {/* 검색 입력 */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('promotions.v2.searchType')}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* 타입 목록 */}
          <div className="max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm">{t('common.loading')}</p>
              </div>
            ) : filteredTypes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <TagIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  {searchQuery ? t('promotions.v2.noTypesFound') : t('promotions.v2.noTypesAvailable')}
                </p>
              </div>
            ) : (
              <>
                {/* 시스템 기본 타입 */}
                {systemTypes.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('promotions.v2.systemTypes')}
                    </div>
                    {systemTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleSelectType(type.id)}
                        className={`
                          w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors
                          ${value === type.id ? 'bg-primary/5' : ''}
                        `}
                      >
                        {/* 타입 아이콘 */}
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${type.color}20` }}
                        >
                          <span style={{ color: type.color }}>
                            {type.icon || '🏷️'}
                          </span>
                        </div>

                        {/* 타입 정보 */}
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-gray-900">
                            {getLocalizedName(type)}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {type.discountType?.replace('_', ' ').toLowerCase()}
                          </div>
                        </div>

                        {/* 선택 체크 */}
                        {value === type.id && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* 매장 커스텀 타입 */}
                {customTypes.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('promotions.v2.customTypes')}
                    </div>
                    {customTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleSelectType(type.id)}
                        className={`
                          w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors
                          ${value === type.id ? 'bg-primary/5' : ''}
                        `}
                      >
                        {/* 타입 아이콘 */}
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${type.color}20` }}
                        >
                          <span style={{ color: type.color }}>
                            {type.icon || '🏷️'}
                          </span>
                        </div>

                        {/* 타입 정보 */}
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-gray-900">
                            {getLocalizedName(type)}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {type.discountType?.replace('_', ' ').toLowerCase()}
                          </div>
                        </div>

                        {/* 선택 체크 */}
                        {value === type.id && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
