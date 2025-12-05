'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '@/shared/i18n';
import FormField from '@/shared/components/ui/forms/FormField';
import SelectInput from '@/shared/components/ui/inputs/SelectInput';

/**
 * Conditional Option Builder Component
 *
 * 조건부 옵션 설정 UI
 * - 부모 옵션 선택 시에만 표시되도록 조건 설정
 * - JSON 형식: { showIf: { parentOptionId: ID, selectedValue: true } }
 *
 * @param {Object} props
 * @param {Array} props.optionGroups - 모든 옵션 그룹 목록
 * @param {Object} props.currentGroup - 현재 편집 중인 그룹
 * @param {Object} props.conditionalDisplay - 현재 조건 설정
 * @param {Function} props.onChange - 조건 변경 핸들러
 */
export default function ConditionalOptionBuilder({
  optionGroups = [],
  currentGroup,
  conditionalDisplay,
  onChange
}) {
  const { t, language } = useTranslation();

  // 현재 언어에 맞는 필드값 반환 함수
  const getLocalizedField = (obj, fieldBaseName) => {
    if (!obj) return '';

    if (language === 'ko') {
      return obj[`${fieldBaseName}Ko`] || obj[fieldBaseName] || obj[`${fieldBaseName}En`] || '';
    } else if (language === 'en') {
      return obj[`${fieldBaseName}En`] || obj[fieldBaseName] || obj[`${fieldBaseName}Ko`] || '';
    } else {
      return obj[fieldBaseName] || obj[`${fieldBaseName}Ko`] || obj[`${fieldBaseName}En`] || '';
    }
  };

  const [enabled, setEnabled] = useState(!!conditionalDisplay);
  const [parentOptionId, setParentOptionId] = useState(
    conditionalDisplay?.showIf?.parentOptionId || ''
  );

  // conditionalDisplay가 변경되면 state 동기화
  useEffect(() => {
    setEnabled(!!conditionalDisplay);
    setParentOptionId(conditionalDisplay?.showIf?.parentOptionId || '');
  }, [conditionalDisplay]);

  // 현재 그룹보다 앞에 있는 그룹들만 부모로 선택 가능
  const availableParentGroups = useMemo(() => {
    if (!currentGroup) return [];

    const currentIndex = optionGroups.findIndex(g => g.id === currentGroup.id);
    if (currentIndex === -1) return [];

    return optionGroups.slice(0, currentIndex);
  }, [optionGroups, currentGroup]);

  // 선택된 부모 그룹의 옵션들
  const parentOptions = useMemo(() => {
    if (!parentOptionId) return [];

    for (const group of availableParentGroups) {
      const option = (group.options || []).find(opt => String(opt.id) === String(parentOptionId));
      if (option) {
        return [{ group, option }];
      }
    }
    return [];
  }, [parentOptionId, availableParentGroups]);

  // SelectInput을 위한 옵션 배열 생성
  const selectOptions = useMemo(() => {
    const options = [];

    availableParentGroups.forEach(group => {
      (group.options || []).forEach(option => {
        if (option.id) {
          const groupName = getLocalizedField(group, 'name') || 'Unnamed Group';
          const optionName = getLocalizedField(option, 'name') || 'Unnamed Option';
          const optionItem = {
            value: option.id,
            label: `${groupName} > ${optionName}${option.additionalPrice > 0 ? ` (+₫${option.additionalPrice.toLocaleString('vi-VN')})` : ''}`,
            groupName: groupName
          };
          options.push(optionItem);
        }
      });
    });

    return options;
  }, [availableParentGroups, optionGroups, currentGroup, language]);

  // 조건 활성화/비활성화
  const handleToggle = (checked) => {
    setEnabled(checked);

    if (!checked) {
      onChange(null);
      setParentOptionId('');
    }
  };

  // 부모 옵션 선택
  const handleParentOptionChange = (e) => {
    const optionId = String(e.target.value);
    setParentOptionId(optionId);

    if (optionId) {
      onChange({
        showIf: {
          parentOptionId: optionId,
          selectedValue: true
        }
      });
    } else {
      onChange(null);
    }
  };

  // 이전 그룹이 없으면 조건부 표시를 설정할 수 없으므로 숨김
  if (availableParentGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 조건부 표시 활성화/비활성화 */}
      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex-1">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => handleToggle(e.target.checked)}
              className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {t('menu.conditional.enableConditional')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('menu.conditional.conditionalDescription')}
              </div>
            </div>
          </label>
        </div>

        {/* 인포 아이콘 */}
        <div className="ml-4">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* 조건 설정 */}
      {enabled && (
        <div
          className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-4"
        >
          {/* 부모 옵션 선택 - 커스텀 SelectInput 사용 */}
          <SelectInput
            label={t('menu.conditional.parentOption')}
            value={parentOptionId}
            onChange={handleParentOptionChange}
            options={selectOptions}
            placeholder={t('menu.conditional.selectParentOption')}
            error={enabled && !parentOptionId ? t('menu.conditional.parentOptionRequired') : ''}
            required
            searchable={selectOptions.length > 5}
            clearable={true}
            fullWidth
          />

          {/* 선택된 부모 옵션 정보 표시 */}
          {parentOptions.length > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-medium text-green-900 dark:text-green-100">
                    {t('menu.conditional.conditionalRule')}
                  </div>
                  <div className="mt-1 text-sm text-green-700 dark:text-green-300">
                    {t('menu.conditional.ruleDescription', {
                      groupName: getLocalizedField(currentGroup, 'name') || t('menu.conditional.thisGroup'),
                      parentGroup: getLocalizedField(parentOptions[0].group, 'name'),
                      parentOption: getLocalizedField(parentOptions[0].option, 'name')
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 예시 섹션 */}
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-indigo-800 dark:text-indigo-200">
                <div className="font-medium mb-1">{t('menu.conditional.exampleTitle')}</div>
                <ul className="space-y-0.5">
                  <li>• {t('menu.conditional.exampleGroupOrder')}</li>
                  <li>• {t('menu.conditional.exampleCurrentGroup')}</li>
                  <li>• {t('menu.conditional.exampleSelectable')}</li>
                  <li className="text-red-600 dark:text-red-400">• {t('menu.conditional.exampleNotSelectable')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 주의사항 */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-xs text-yellow-800 dark:text-yellow-200">
                <div className="font-medium mb-1">{t('menu.conditional.notice')}</div>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>{t('menu.conditional.noticeItem1')}</li>
                  <li>{t('menu.conditional.noticeItem2')}</li>
                  <li>{t('menu.conditional.noticeItem3')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 빈 상태 (부모 옵션이 없을 때) */}
          {availableParentGroups.length === 0 && (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm font-medium">{t('menu.conditional.noParentOptions')}</p>
              <p className="text-xs mt-1">{t('menu.conditional.createParentFirst')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
