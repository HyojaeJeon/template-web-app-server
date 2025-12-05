'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLazyQuery } from '@apollo/client';
import { useTranslation } from '@/shared/i18n';
import {
  ChevronDownIcon,
  UserGroupIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { S_GET_SEGMENTS_FOR_PROMOTION } from '@/gql/queries/promotionTypes';

/**
 * CustomerSegmentSelector - V2 고객 세그먼트 다중 선택기
 * 프로모션 타겟팅에 사용되는 고객 세그먼트 선택 컴포넌트
 *
 * @param {array} value - 선택된 세그먼트 ID 배열
 * @param {function} onChange - 세그먼트 변경 핸들러
 * @param {string} placeholder - 플레이스홀더 텍스트
 * @param {boolean} required - 필수 여부
 * @param {string} className - 추가 CSS 클래스
 * @param {string} error - 에러 메시지
 * @param {array} segments - 외부에서 전달받은 세그먼트 목록 (옵셔널)
 * @param {boolean} loading - 외부 로딩 상태
 * @param {function} onOpen - 드롭다운 열릴 때 호출
 * @param {boolean} multiSelect - 다중 선택 허용 (기본: true)
 */
export default function CustomerSegmentSelector({
  value = [],
  onChange,
  placeholder,
  required = false,
  className = "",
  error = null,
  segments: externalSegments = null,
  loading: externalLoading = false,
  onOpen = null,
  multiSelect = true
}) {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [segments, setSegments] = useState(externalSegments || []);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // 선택된 세그먼트 ID 배열 정규화
  const selectedIds = useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }, [value]);

  // 고객 세그먼트 데이터 lazy 로딩
  const [loadSegments, { loading }] = useLazyQuery(S_GET_SEGMENTS_FOR_PROMOTION, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const newSegments = data?.sGetSegmentsForPromotion?.segments || [];
      setSegments(newSegments);
    },
    onError: (err) => {
      console.error('[CustomerSegmentSelector] Error loading segments:', err);
    }
  });

  // 선택된 세그먼트 객체 배열
  const selectedSegments = useMemo(() => {
    if (selectedIds.length === 0) return [];
    return segments.filter(seg => selectedIds.includes(seg.id));
  }, [selectedIds, segments]);

  // externalSegments가 변경되면 segments state 업데이트
  useEffect(() => {
    if (externalSegments && externalSegments.length > 0) {
      setSegments(externalSegments);
    }
  }, [externalSegments]);

  // 세그먼트 로컬라이제이션
  const getLocalizedName = useCallback((segment) => {
    if (!segment) return '';
    if (language === 'vi') return segment.name || '';
    if (language === 'ko') return segment.nameKo || segment.name || '';
    if (language === 'en') return segment.nameEn || segment.name || '';
    return segment.name || '';
  }, [language]);

  // 검색 필터링된 세그먼트 목록
  const filteredSegments = useMemo(() => {
    if (!searchQuery) return segments;

    const query = searchQuery.toLowerCase();
    return segments.filter(segment => {
      const name = getLocalizedName(segment).toLowerCase();
      const desc = (
        language === 'vi' ? segment.description :
        language === 'ko' ? segment.descriptionKo || segment.description :
        segment.descriptionEn || segment.description || ''
      ).toLowerCase();
      const ruleType = (segment.ruleType || '').toLowerCase();

      return name.includes(query) || desc.includes(query) || ruleType.includes(query);
    });
  }, [segments, searchQuery, getLocalizedName, language]);

  // 드롭다운 토글
  const toggleDropdown = useCallback(() => {
    if (!isOpen) {
      // 외부 콜백 호출
      if (onOpen) {
        onOpen();
      }

      // 내부 쿼리로 세그먼트 로드
      if (!externalSegments || externalSegments.length === 0) {
        loadSegments();
      }

      // 검색 입력 포커스
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }

    setIsOpen(!isOpen);
  }, [isOpen, onOpen, loadSegments, externalSegments]);

  // 세그먼트 선택/해제 핸들러
  const handleToggleSegment = useCallback((segmentId) => {
    if (multiSelect) {
      // 다중 선택 모드
      const newSelected = selectedIds.includes(segmentId)
        ? selectedIds.filter(id => id !== segmentId)
        : [...selectedIds, segmentId];
      onChange(newSelected);
    } else {
      // 단일 선택 모드
      onChange(segmentId);
      setIsOpen(false);
      setSearchQuery('');
    }
  }, [multiSelect, selectedIds, onChange]);

  // 모두 선택
  const handleSelectAll = useCallback(() => {
    const allIds = filteredSegments.map(seg => seg.id);
    onChange(allIds);
  }, [filteredSegments, onChange]);

  // 모두 해제
  const handleDeselectAll = useCallback(() => {
    onChange([]);
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
          <UserGroupIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />

          {selectedSegments.length > 0 ? (
            <div className="flex flex-wrap gap-2 flex-1">
              {selectedSegments.slice(0, 2).map(segment => (
                <span
                  key={segment.id}
                  className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium"
                >
                  {getLocalizedName(segment)}
                </span>
              ))}
              {selectedSegments.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-sm font-medium">
                  +{selectedSegments.length - 2} {t('common.more')}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-500">
              {placeholder || t('promotions.v2.selectSegments')}
            </span>
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
          {/* 검색 및 액션 바 */}
          <div className="p-3 border-b border-gray-200 space-y-2">
            {/* 검색 입력 */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('promotions.v2.searchSegment')}
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

            {/* 다중 선택 액션 버튼 */}
            {multiSelect && !isLoading && filteredSegments.length > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 rounded-md transition-colors"
                >
                  {t('common.selectAll')}
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  disabled={selectedIds.length === 0}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.deselectAll')}
                </button>
              </div>
            )}
          </div>

          {/* 세그먼트 목록 */}
          <div className="max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm">{t('common.loading')}</p>
              </div>
            ) : filteredSegments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <UserGroupIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  {searchQuery ? t('promotions.v2.noSegmentsFound') : t('promotions.v2.noSegmentsAvailable')}
                </p>
              </div>
            ) : (
              filteredSegments.map((segment) => {
                const isSelected = selectedIds.includes(segment.id);
                return (
                  <button
                    key={segment.id}
                    onClick={() => handleToggleSegment(segment.id)}
                    className={`
                      w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors
                      ${isSelected ? 'bg-primary/5' : ''}
                    `}
                  >
                    {/* 체크박스 (다중 선택) 또는 라디오 (단일 선택) */}
                    <div className={`
                      mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors
                      ${isSelected
                        ? 'bg-primary border-primary'
                        : 'bg-white border-gray-300'
                      }
                      ${!multiSelect && 'rounded-full'}
                    `}>
                      {isSelected && (
                        <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />
                      )}
                    </div>

                    {/* 세그먼트 정보 */}
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {getLocalizedName(segment)}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 capitalize">
                        {segment.ruleType?.replace('_', ' ').toLowerCase()}
                      </div>
                      {(segment.description || segment.descriptionKo || segment.descriptionEn) && (
                        <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {language === 'vi' ? segment.description :
                           language === 'ko' ? segment.descriptionKo || segment.description :
                           segment.descriptionEn || segment.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* 선택 요약 (다중 선택 모드) */}
          {multiSelect && selectedIds.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                {t('promotions.v2.selectedSegments')}: <span className="font-medium text-gray-900">{selectedIds.length}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
