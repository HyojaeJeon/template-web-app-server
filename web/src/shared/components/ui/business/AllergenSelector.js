'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from '@/shared/i18n';
import {
  ShieldExclamationIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { S_GET_ALLERGENS } from '@/gql/queries/menu';

/**
 * AllergenSelector - 알레르겐 선택 컴포넌트
 *
 * @param {string[]} value - 선택된 알레르겐 ID 배열
 * @param {function} onChange - 알레르겐 선택 변경 핸들러
 * @param {boolean} disabled - 비활성화 여부
 * @param {string} className - 추가 CSS 클래스
 */
export default function AllergenSelector({
  value = [],
  onChange,
  disabled = false,
  className = ""
}) {
  const { t } = useTranslation();
  const [selectedAllergens, setSelectedAllergens] = useState(value);

  // 알레르겐 목록 조회
  const {
    data: allergensData,
    loading: allergensLoading,
    error: allergensError
  } = useQuery(S_GET_ALLERGENS, {
    variables: { isActive: true },
    fetchPolicy: 'cache-first'
  });

  // value prop이 변경되면 내부 상태 동기화
  useEffect(() => {
    setSelectedAllergens(value);
  }, [value]);

  // 알레르겐 선택/해제 핸들러
  const handleToggleAllergen = (allergenId) => {
    if (disabled) return;

    const newSelected = selectedAllergens.includes(allergenId)
      ? selectedAllergens.filter(id => id !== allergenId)
      : [...selectedAllergens, allergenId];

    setSelectedAllergens(newSelected);
    onChange?.(newSelected);
  };

  // 심각도에 따른 스타일 반환
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'HIGH':
        return {
          borderColor: 'border-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          textColor: 'text-red-700 dark:text-red-300',
          icon: <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
        };
      case 'MEDIUM':
        return {
          borderColor: 'border-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          textColor: 'text-yellow-700 dark:text-yellow-300',
          icon: <ShieldExclamationIcon className="w-4 h-4 text-yellow-500" />
        };
      case 'LOW':
      default:
        return {
          borderColor: 'border-gray-300',
          bgColor: 'bg-gray-50 dark:bg-gray-700',
          textColor: 'text-gray-700 dark:text-gray-300',
          icon: <ShieldExclamationIcon className="w-4 h-4 text-gray-400" />
        };
    }
  };

  // 로딩 상태
  if (allergensLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-vietnam-mint rounded-full animate-spin"></div>
          <p className="ml-3 text-sm text-gray-500 dark:text-gray-400">
            {t('menu.allergen.loading')}
          </p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (allergensError) {
    return (
      <div className={`${className}`}>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">
            {t('menu.allergen.loadError')}: {allergensError.message}
          </p>
        </div>
      </div>
    );
  }

  const allergens = allergensData?.sGetAllergens?.allergens || [];

  // 알레르겐 없음 상태
  if (allergens.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="p-6 text-center border border-gray-200 dark:border-gray-700 rounded-lg">
          <ShieldExclamationIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('menu.allergen.noAllergens')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* 선택 카운트 */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('menu.allergen.selectAllergens')}
        </p>
        {selectedAllergens.length > 0 && (
          <span className="px-2 py-1 bg-vietnam-mint/10 text-vietnam-mint text-xs font-medium rounded-full">
            {t('menu.allergen.selected', { count: selectedAllergens.length })}
          </span>
        )}
      </div>

      {/* 알레르겐 그리드 (3열) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {allergens.map((allergen) => {
          const isSelected = selectedAllergens.includes(allergen.id);
          const severityStyle = getSeverityStyle(allergen.severity);

          return (
            <button
              key={allergen.id}
              type="button"
              onClick={() => handleToggleAllergen(allergen.id)}
              disabled={disabled}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200
                ${isSelected
                  ? `${severityStyle.borderColor} ${severityStyle.bgColor}`
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                flex items-start gap-3
              `}
            >
              {/* 체크박스 아이콘 */}
              <div className="flex-shrink-0 mt-0.5">
                {isSelected ? (
                  <CheckCircleIcon className={`w-5 h-5 ${severityStyle.textColor}`} />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                )}
              </div>

              {/* 알레르겐 정보 */}
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {severityStyle.icon}
                  <span className={`text-sm font-medium ${
                    isSelected
                      ? severityStyle.textColor
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {allergen.name}
                  </span>
                </div>

                {/* 다국어 이름 표시 */}
                {allergen.nameKo && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {allergen.nameKo}
                  </p>
                )}

                {/* 설명 (선택 시에만 표시) */}
                {isSelected && allergen.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {allergen.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 심각도 범례 */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('menu.allergen.severityLegend')}
        </p>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
            <span className="text-gray-600 dark:text-gray-400">
              {t('menu.allergen.severity.high')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldExclamationIcon className="w-4 h-4 text-yellow-500" />
            <span className="text-gray-600 dark:text-gray-400">
              {t('menu.allergen.severity.medium')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldExclamationIcon className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              {t('menu.allergen.severity.low')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
