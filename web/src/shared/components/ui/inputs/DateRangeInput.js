'use client';

import React, { useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import DatePickerDropdown from './DatePickerDropdown';
import { useTranslation } from '@/shared/i18n';

/**
 * DateRangeInput - 기간 선택 컴포넌트 (커스텀 DatePickerDropdown 사용)
 *
 * Local 테마 컬러와 다크모드 지원
 * WCAG 2.1 준수
 */
const DateRangeInput = ({
  value = { startDate: null, endDate: null },
  onChange,
  label = '기간 선택',
  startLabel = '시작일',
  endLabel = '종료일',
  minDate,
  maxDate,
  disabled = false,
  required = false,
  error = '',
  helperText = '',
  size = 'md',
  variant = 'default',
  className = '',
  ...rest
}) => {
  const { t } = useTranslation();

  // 날짜를 yyyy-MM-dd 형식으로 변환
  const formatDateForPicker = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  };

  // 변경 핸들러 - 시작일
  const handleStartDateChange = (dateString) => {
    if (!dateString) return;
    const startDate = new Date(dateString);
    onChange?.({
      startDate,
      endDate: value.endDate
    });
  };

  // 변경 핸들러 - 종료일
  const handleEndDateChange = (dateString) => {
    if (!dateString) return;
    const endDate = new Date(dateString);
    onChange?.({
      startDate: value.startDate,
      endDate
    });
  };

  // 종료일이 시작일보다 빠른지 검사
  const validateDateRange = () => {
    if (value.startDate && value.endDate) {
      return new Date(value.endDate) >= new Date(value.startDate);
    }
    return true;
  };

  const isValidRange = validateDateRange();

  // 사이즈별 DatePicker 사이즈 매핑
  const pickerSizeMap = {
    sm: 'sm',
    md: 'md',
    lg: 'lg'
  };

  // variant별 컨테이너 스타일
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    outlined: 'bg-transparent border-2 border-emerald-500 dark:border-emerald-400',
    filled: 'bg-gray-50 dark:bg-gray-900 border border-transparent'
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`
        ${variantClasses[variant]}
        rounded-xl overflow-hidden transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${error || !isValidRange ? 'border-red-500 dark:border-red-400' : ''}
      `}>
        <div className="flex items-center gap-2 p-2">
          {/* 시작일 DatePickerDropdown */}
          <div className="flex-1">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 px-2">
              {startLabel}
            </label>
            <DatePickerDropdown
              value={formatDateForPicker(value.startDate)}
              onChange={handleStartDateChange}
              placeholder={t('common.datePicker.selectDate', '날짜 선택')}
              minDate={minDate}
              maxDate={formatDateForPicker(value.endDate) || maxDate}
              disabled={disabled}
              size={pickerSizeMap[size]}
              className="border-0 bg-transparent"
              {...rest}
            />
          </div>

          {/* 구분 화살표 */}
          <div className="flex items-center justify-center px-2">
            <ArrowRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>

          {/* 종료일 DatePickerDropdown */}
          <div className="flex-1">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 px-2">
              {endLabel}
            </label>
            <DatePickerDropdown
              value={formatDateForPicker(value.endDate)}
              onChange={handleEndDateChange}
              placeholder={t('common.datePicker.selectDate', '날짜 선택')}
              minDate={formatDateForPicker(value.startDate) || minDate}
              maxDate={maxDate}
              disabled={disabled}
              size={pickerSizeMap[size]}
              className="border-0 bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {!isValidRange && (
        <p className="mt-1 text-sm text-red-500" role="alert">
          {t('common.datePicker.endDateAfterStart', '종료일은 시작일 이후여야 합니다')}
        </p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-500" role="alert">{error}</p>
      )}
      {!error && helperText && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default DateRangeInput;
