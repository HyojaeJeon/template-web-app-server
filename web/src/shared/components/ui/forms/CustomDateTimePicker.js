'use client';

import { useState, useEffect } from 'react';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';

/**
 * 날짜+시간 통합 선택 컴포넌트
 * DatePicker와 TimePicker를 조합하여 일관된 디자인 제공
 *
 * @param {Object} props
 * @param {string|Date} props.value - 날짜시간 값
 * @param {Function} props.onChange - 변경 핸들러 (ISO 문자열 전달)
 * @param {string} props.label - 레이블
 * @param {boolean} props.required - 필수 여부
 * @param {boolean} props.disabled - 비활성화 여부
 * @param {Date} props.minDate - 최소 날짜
 * @param {Date} props.maxDate - 최대 날짜
 * @param {boolean} props.showTime - 시간 선택기 표시 여부
 * @param {string} props.error - 에러 메시지
 * @param {string} props.size - 크기
 */
const CustomDateTimePicker = ({
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  showTime = true,
  error,
  size = 'md',
  className = '',
  ...props
}) => {
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');

  // 값 파싱 및 초기화
  useEffect(() => {
    if (!value) {
      setDateValue('');
      setTimeValue('');
      return;
    }

    const dateObj = value instanceof Date ? value : new Date(value);
    if (isNaN(dateObj.getTime())) {
      setDateValue('');
      setTimeValue('');
      return;
    }

    // 날짜 부분 (YYYY-MM-DD)
    const dateStr = dateObj.toISOString().split('T')[0];
    setDateValue(dateStr);

    // 시간 부분 (HH:mm)
    if (showTime) {
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      setTimeValue(`${hours}:${minutes}`);
    }
  }, [value, showTime]);

  // 날짜 또는 시간 변경 시 통합된 값 업데이트
  const updateDateTime = (newDateValue, newTimeValue) => {
    if (!newDateValue) {
      onChange?.(null);
      return;
    }

    let timeToUse = newTimeValue;
    if (!timeToUse && showTime) {
      timeToUse = '00:00';
    }

    const dateTimeString = showTime && timeToUse
      ? `${newDateValue}T${timeToUse}:00`
      : `${newDateValue}T00:00:00`;

    const newDateTime = new Date(dateTimeString);

    if (!isNaN(newDateTime.getTime())) {
      onChange?.(newDateTime.toISOString());
    }
  };

  // 날짜 변경 핸들러
  const handleDateChange = (newDate) => {
    setDateValue(newDate);
    updateDateTime(newDate, timeValue);
  };

  // 시간 변경 핸들러
  const handleTimeChange = (newTime) => {
    setTimeValue(newTime);
    updateDateTime(dateValue, newTime);
  };

  return (
    <div className={`${className}`}>
      {/* 레이블 */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && (
            <span className="text-red-500 dark:text-red-400 ml-1" aria-label="필수">*</span>
          )}
        </label>
      )}

      {/* 날짜 및 시간 입력 필드 */}
      <div className={`flex gap-2 ${showTime ? 'items-start' : ''}`}>
        {/* 날짜 선택기 */}
        <div className="flex-1">
          <DatePicker
            value={dateValue}
            onChange={handleDateChange}
            disabled={disabled}
            minDate={minDate}
            maxDate={maxDate}
            size={size}
            error={error}
            placeholder="날짜 선택"
            {...props}
          />
        </div>

        {/* 시간 선택기 */}
        {showTime && (
          <div className="flex-1">
            <TimePicker
              value={timeValue}
              onChange={handleTimeChange}
              disabled={disabled}
              size={size}
              placeholder="시간 선택"
              {...props}
            />
          </div>
        )}
      </div>

      {/* 에러 메시지 (DatePicker에서 표시되지만, 여기서도 표시 가능) */}
      {error && !showTime && (
        <div className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};

export default CustomDateTimePicker;
