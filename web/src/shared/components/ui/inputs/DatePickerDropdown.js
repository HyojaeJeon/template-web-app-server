'use client';

import { useState, useEffect, useRef, useMemo, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { format, parse, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, isBefore, startOfDay } from 'date-fns';
import { ko, vi, enUS } from 'date-fns/locale';
import { useTranslation } from '@/shared/i18n';
import { useToast } from '@/shared/providers/ToastProvider';

/**
 * 날짜 선택 컴포넌트 (TimePicker와 동일한 드롭다운 스타일)
 * Local 테마 컬러와 다크모드 지원
 *
 * @param {Object} props - 컴포넌트 props
 * @param {Date|string} props.value - 날짜 값
 * @param {Function} props.onChange - 값 변경 핸들러
 * @param {boolean} props.disabled - 비활성화 여부
 * @param {Date|string} props.minDate - 최소 날짜
 * @param {Date|string} props.maxDate - 최대 날짜
 * @param {string} props.placeholder - 플레이스홀더
 * @param {string} props.size - 크기
 * @param {string} props.error - 에러 메시지
 */
const DatePickerDropdown = forwardRef(({
  value = null,
  onChange,
  disabled = false,
  minDate,
  maxDate,
  placeholder = '날짜를 선택하세요',
  size = 'md',
  error,
  className = '',
  ...props
}, ref) => {
  const { t, language } = useTranslation();
  const { showError } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  // 언어별 date-fns locale 매핑
  const localeMap = {
    ko: ko,
    vi: vi,
    en: enUS
  };
  const currentLocale = localeMap[language] || ko;

  // value를 Date로 변환
  const selectedDate = useMemo(() => {
    if (!value) return null;
    if (value instanceof Date) return value;
    try {
      return parse(value, 'yyyy-MM-dd', new Date());
    } catch {
      return null;
    }
  }, [value]);

  // 언어별 날짜 형식
  const dateFormatMap = {
    ko: 'yyyy년 MM월 dd일',
    vi: 'dd/MM/yyyy',
    en: 'MM/dd/yyyy'
  };
  const dateFormat = dateFormatMap[language] || dateFormatMap.ko;

  // displayValue 업데이트
  useEffect(() => {
    if (selectedDate) {
      setDisplayValue(format(selectedDate, dateFormat, { locale: currentLocale }));
      setCurrentMonth(selectedDate);
    } else {
      setDisplayValue('');
    }
  }, [selectedDate, dateFormat, currentLocale]);

  // 달력 날짜 생성
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // 일요일 시작
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // 날짜 선택 핸들러
  const handleDateSelect = (date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');

    if (onChange) {
      onChange(formattedDate);
    }
    closeDropdown();
  };

  // 빠른 선택 핸들러
  const handleQuickSelect = (days) => {
    const date = subDays(new Date(), days);

    // minDate 검증 (종료일이 시작일보다 이전인 경우)
    if (minDate && isBefore(startOfDay(date), startOfDay(new Date(minDate)))) {
      showError(t('common.datePicker.endDateBeforeStartDate'));
      return;
    }

    handleDateSelect(date);
  };

  // 이전/다음 월 이동
  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  // 드롭다운 위치 계산
  const updateDropdownPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4, // 4px gap
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // 드롭다운 열기/닫기
  const toggleDropdown = () => {
    if (!disabled) {
      if (!isOpen) {
        updateDropdownPosition();
      }
      setIsOpen(!isOpen);
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  // 외부 클릭 처리 (Portal 지원)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // containerRef와 dropdownRef 모두 체크 (Portal 때문에)
      const clickedInsideContainer = containerRef.current?.contains(event.target);
      const clickedInsideDropdown = dropdownRef.current?.contains(event.target);

      if (!clickedInsideContainer && !clickedInsideDropdown) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // 키보드 네비게이션
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeDropdown();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown();
    }
  };

  // 크기별 스타일 - SelectInput과 동일하게
  const sizeStyles = {
    sm: 'h-8 px-2 text-sm',
    md: 'h-[42px] px-4 py-2 text-sm',  // SelectInput과 동일
    lg: 'h-12 px-4 text-lg'
  };

  // 날짜 유효성 검증 - startOfDay를 사용하여 정확한 날짜 비교
  const isDateDisabled = (date) => {
    const normalizedDate = startOfDay(date);
    if (minDate && isBefore(normalizedDate, startOfDay(new Date(minDate)))) return true;
    if (maxDate && isBefore(startOfDay(new Date(maxDate)), normalizedDate)) return true;
    return false;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 입력 필드 */}
      <div className="relative">
        <input
          ref={ref}
          type="text"
          value={displayValue}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          onClick={toggleDropdown}
          onKeyDown={handleKeyDown}
          className={`
            w-full rounded-lg transition-colors duration-200 cursor-pointer
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-500 dark:placeholder:text-gray-400
            border
            ${sizeStyles[size]}
            ${error
              ? 'border-red-500'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${disabled
              ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
              : ''
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
          `}
          {...props}
        />

        {/* 달력 아이콘 */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <CalendarIcon
            className={`w-5 h-5 ${error ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* 드롭다운 - Portal로 렌더링 */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
        >
          <div className="p-4">
            {/* 월 네비게이션 */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {format(currentMonth, language === 'ko' ? 'yyyy년 MM월' : 'MMMM yyyy', { locale: currentLocale })}
              </div>

              <button
                type="button"
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {(() => {
                const weekDays = {
                  ko: ['일', '월', '화', '수', '목', '금', '토'],
                  vi: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
                  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                };
                const days = weekDays[language] || weekDays.ko;

                return days.map((day, index) => (
                  <div
                    key={day}
                    className={`text-center text-xs font-medium py-2 ${
                      index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {day}
                  </div>
                ));
              })()}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isTodayDate = isToday(day);
                const disabled = isDateDisabled(day);

                return (
                  <button
                    key={index}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && handleDateSelect(day)}
                    className={`
                      aspect-square p-2 text-sm rounded-lg transition-colors focus:outline-none
                      ${!isCurrentMonth && 'text-gray-400 dark:text-gray-600'}
                      ${isSelected && 'bg-mint-500 text-white font-bold'}
                      ${!isSelected && isTodayDate && 'bg-gray-100 dark:bg-gray-700 font-bold'}
                      ${!isSelected && !isTodayDate && isCurrentMonth && 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'}
                      ${disabled && 'opacity-30 cursor-not-allowed'}
                    `}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>

            {/* 빠른 선택 버튼 */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickSelect(0)}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-mint-500/50"
                >
                  {t('common.datePicker.today')}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(1)}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-mint-500/50"
                >
                  {t('common.datePicker.yesterday')}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(7)}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-mint-500/50"
                >
                  {t('common.datePicker.7daysAgo')}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(30)}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-mint-500/50"
                >
                  {t('common.datePicker.30daysAgo')}
                </button>
              </div>
            </div>

            {/* 확인 버튼 */}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeDropdown}
                className="px-4 py-2 text-sm font-medium text-white bg-mint-500 hover:bg-mint-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500/50 transition-colors duration-200"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
});

DatePickerDropdown.displayName = 'DatePickerDropdown';

export default DatePickerDropdown;
