/**
 * @fileoverview 날짜시간 선택기 컴포넌트 - WCAG 2.1 준수
 * 날짜와 시간을 통합하여 선택할 수 있는 컴포넌트
 * Local App 테마 색상 및 접근성 지원
 * 
 * @version 1.0.0
 * @author DeliveryVN Team
 */

'use client';

import React, { useState, useCallback, useRef, useId, useEffect } from 'react';

/**
 * 날짜시간 선택기 컴포넌트
 * @param {Object} props
 * @param {Date|string} [props.value] - 선택된 날짜시간 값
 * @param {Function} [props.onChange] - 날짜시간 변경 핸들러
 * @param {string} [props.name] - 입력 필드 이름
 * @param {string} [props.label] - 레이블
 * @param {boolean} [props.required=false] - 필수 입력 여부
 * @param {boolean} [props.disabled=false] - 비활성화 상태
 * @param {string} [props.placeholder] - 플레이스홀더
 * @param {string} [props.hint] - 도움말 텍스트
 * @param {string} [props.error] - 에러 메시지
 * @param {Date} [props.minDate] - 최소 날짜
 * @param {Date} [props.maxDate] - 최대 날짜
 * @param {boolean} [props.showTime=true] - 시간 선택 표시 여부
 * @param {boolean} [props.showSeconds=false] - 초 표시 여부
 * @param {boolean} [props.is24Hour=true] - 24시간 형식 사용 여부
 * @param {number} [props.timeStep=1] - 시간 간격 (분 단위)
 * @param {string} [props.dateFormat='YYYY-MM-DD'] - 날짜 형식
 * @param {string} [props.timeFormat='HH:mm'] - 시간 형식
 * @param {string} [props.size='md'] - 크기 (sm, md, lg)
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {string} [props.ariaLabel] - 접근성 레이블
 * @returns {JSX.Element}
 */
const DateTimePicker = ({
  value,
  onChange,
  name,
  label,
  required = false,
  disabled = false,
  placeholder,
  hint,
  error,
  minDate,
  maxDate,
  showTime = true,
  showSeconds = false,
  is24Hour = true,
  timeStep = 1,
  dateFormat = 'YYYY-MM-DD',
  timeFormat = 'HH:mm',
  size = 'md',
  className = '',
  ariaLabel,
  ...props
}) => {
  const containerRef = useRef(null);
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);
  const labelId = useId();
  const hintId = useId();
  const errorId = useId();

  // 현재 값을 Date 객체로 변환
  const currentDate = value ? (value instanceof Date ? value : new Date(value)) : null;
  
  // 날짜와 시간을 분리하여 상태 관리
  const [dateValue, setDateValue] = useState(() => {
    if (!currentDate || isNaN(currentDate.getTime())) return '';
    return currentDate.toISOString().split('T')[0];
  });

  const [timeValue, setTimeValue] = useState(() => {
    if (!currentDate || isNaN(currentDate.getTime())) return '';
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const seconds = showSeconds ? currentDate.getSeconds().toString().padStart(2, '0') : '';
    return showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
  });

  // 값이 외부에서 변경될 때 내부 상태 업데이트
  useEffect(() => {
    const newDate = value ? (value instanceof Date ? value : new Date(value)) : null;
    
    if (newDate && !isNaN(newDate.getTime())) {
      setDateValue(newDate.toISOString().split('T')[0]);
      const hours = newDate.getHours().toString().padStart(2, '0');
      const minutes = newDate.getMinutes().toString().padStart(2, '0');
      const seconds = showSeconds ? newDate.getSeconds().toString().padStart(2, '0') : '';
      setTimeValue(showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`);
    } else {
      setDateValue('');
      setTimeValue('');
    }
  }, [value, showSeconds]);

  // 날짜시간 값 조합 및 변경 알림
  const updateDateTime = useCallback((newDateValue, newTimeValue) => {
    if (!newDateValue) {
      onChange?.(null);
      return;
    }

    let timeToUse = newTimeValue;
    if (!timeToUse && showTime) {
      timeToUse = '00:00';
    }

    const dateTimeString = showTime && timeToUse 
      ? `${newDateValue}T${timeToUse}${showSeconds ? '' : ':00'}`
      : `${newDateValue}T00:00:00`;

    const newDateTime = new Date(dateTimeString);
    
    if (!isNaN(newDateTime.getTime())) {
      onChange?.(newDateTime);
    }
  }, [onChange, showTime, showSeconds]);

  // 날짜 변경 핸들러
  const handleDateChange = useCallback((e) => {
    const newDateValue = e.target.value;
    setDateValue(newDateValue);
    updateDateTime(newDateValue, timeValue);
  }, [timeValue, updateDateTime]);

  // 시간 변경 핸들러
  const handleTimeChange = useCallback((e) => {
    const newTimeValue = e.target.value;
    setTimeValue(newTimeValue);
    updateDateTime(dateValue, newTimeValue);
  }, [dateValue, updateDateTime]);

  // 현재 날짜/시간으로 설정
  const handleSetNow = useCallback(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = showSeconds ? now.getSeconds().toString().padStart(2, '0') : '';
    const timeStr = showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
    
    setDateValue(dateStr);
    setTimeValue(timeStr);
    updateDateTime(dateStr, timeStr);
  }, [showSeconds, updateDateTime]);

  // 초기화 핸들러
  const handleClear = useCallback(() => {
    setDateValue('');
    setTimeValue('');
    onChange?.(null);
  }, [onChange]);

  // 키보드 네비게이션 핸들러
  const handleKeyDown = useCallback((e) => {
    // Tab 키로 날짜와 시간 필드 간 이동
    if (e.key === 'Tab' && showTime) {
      if (e.target === dateInputRef.current && !e.shiftKey) {
        e.preventDefault();
        timeInputRef.current?.focus();
      } else if (e.target === timeInputRef.current && e.shiftKey) {
        e.preventDefault();
        dateInputRef.current?.focus();
      }
    }
  }, [showTime]);

  // 날짜 범위 제한 계산
  const minDateString = minDate ? minDate.toISOString().split('T')[0] : undefined;
  const maxDateString = maxDate ? maxDate.toISOString().split('T')[0] : undefined;

  // 크기별 스타일 클래스
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg'
  };

  const inputBaseClasses = `
    border border-gray-300 dark:border-gray-600 rounded-md 
    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
    focus:ring-2 focus:ring-mint-500 focus:border-mint-500
    disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
    transition-colors duration-200
    ${sizeClasses[size]}
    ${error ? 'border-red-500 dark:border-red-500' : ''}
  `;

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {/* 레이블 */}
      {label && (
        <label 
          id={labelId}
          htmlFor={`${name || 'datetime'}-date`}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && (
            <span className="text-red-500 dark:text-red-400 ml-1" aria-label="필수">*</span>
          )}
        </label>
      )}

      {/* 입력 필드들 */}
      <div className="flex items-center space-x-2">
        {/* 날짜 입력 */}
        <div className="flex-1">
          <input
            ref={dateInputRef}
            type="date"
            id={`${name || 'datetime'}-date`}
            name={name ? `${name}-date` : 'date'}
            value={dateValue}
            onChange={handleDateChange}
            onKeyDown={handleKeyDown}
            min={minDateString}
            max={maxDateString}
            required={required}
            disabled={disabled}
            className={`w-full ${inputBaseClasses}`}
            aria-labelledby={label ? labelId : undefined}
            aria-label={!label ? (ariaLabel ? `${ariaLabel} 날짜` : '날짜 선택') : undefined}
            aria-describedby={`${hint ? hintId : ''} ${error ? errorId : ''}`.trim() || undefined}
            aria-invalid={error ? 'true' : 'false'}
            {...props}
          />
        </div>

        {/* 시간 입력 */}
        {showTime && (
          <div className="flex-1">
            <input
              ref={timeInputRef}
              type="time"
              id={`${name || 'datetime'}-time`}
              name={name ? `${name}-time` : 'time'}
              value={timeValue}
              onChange={handleTimeChange}
              onKeyDown={handleKeyDown}
              step={showSeconds ? 1 : timeStep * 60}
              required={required && showTime}
              disabled={disabled}
              className={`w-full ${inputBaseClasses}`}
              aria-label={ariaLabel ? `${ariaLabel} 시간` : '시간 선택'}
              aria-describedby={`${hint ? hintId : ''} ${error ? errorId : ''}`.trim() || undefined}
              aria-invalid={error ? 'true' : 'false'}
            />
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex items-center space-x-1">
          {/* 현재 시간 설정 버튼 */}
          <button
            type="button"
            onClick={handleSetNow}
            disabled={disabled}
            className="p-2 text-gray-400 hover:text-mint-600 dark:hover:text-mint-400 focus:ring-2 focus:ring-mint-500 focus:ring-opacity-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="현재 날짜시간으로 설정"
            title="현재 날짜시간으로 설정"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* 초기화 버튼 */}
          {(dateValue || timeValue) && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="선택 초기화"
              title="선택 초기화"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 현재 선택된 값 표시 */}
      {currentDate && !isNaN(currentDate.getTime()) && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">선택됨:</span>{' '}
          {currentDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short'
          })}
          {showTime && (
            <>
              {' '}
              {currentDate.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                second: showSeconds ? '2-digit' : undefined,
                hour12: !is24Hour
              })}
            </>
          )}
        </div>
      )}

      {/* 도움말 */}
      {hint && (
        <p id={hintId} className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}

      {/* 에러 메시지 */}
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* 날짜 범위 안내 */}
      {(minDate || maxDate) && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {minDate && maxDate ? (
            <>
              선택 가능한 기간: {minDate.toLocaleDateString('ko-KR')} ~ {maxDate.toLocaleDateString('ko-KR')}
            </>
          ) : minDate ? (
            <>
              최소 날짜: {minDate.toLocaleDateString('ko-KR')} 이후
            </>
          ) : (
            <>
              최대 날짜: {maxDate.toLocaleDateString('ko-KR')} 이전
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;