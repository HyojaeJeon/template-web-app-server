'use client';

import { useState, useEffect, useRef, useMemo, forwardRef } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * 날짜 선택 컴포넌트 (WCAG 2.1 준수)
 * TimePicker와 동일한 디자인 패턴 사용
 * Local 테마 컬러와 다크모드 지원
 *
 * @param {Object} props - 컴포넌트 props
 * @param {string|Date} props.value - 날짜 값 (YYYY-MM-DD 형식 또는 Date 객체)
 * @param {Function} props.onChange - 값 변경 핸들러 (YYYY-MM-DD 문자열 전달)
 * @param {boolean} props.disabled - 비활성화 여부
 * @param {Date} props.minDate - 최소 날짜
 * @param {Date} props.maxDate - 최대 날짜
 * @param {string} props.placeholder - 플레이스홀더
 * @param {string} props.size - 크기
 * @param {boolean} props.showDropdown - 드롭다운 표시 여부
 * @param {string} props.error - 에러 메시지
 */
const DatePicker = forwardRef(({
  value = '',
  onChange,
  disabled = false,
  minDate,
  maxDate,
  placeholder = '날짜를 선택하세요',
  size = 'md',
  showDropdown = true,
  error,
  className = '',
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const containerRef = useRef(null);
  const calendarRef = useRef(null);

  // 날짜 파싱
  const parseDate = (dateString) => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;
    return new Date(dateString);
  };

  // 날짜 포맷팅 (YYYY-MM-DD)
  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 날짜 표시 포맷팅 (YYYY년 MM월 DD일)
  const formatDisplayDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 선택된 날짜
  const selectedDate = useMemo(() => {
    return parseDate(value);
  }, [value]);

  // 값 초기화 (displayValue만 업데이트)
  useEffect(() => {
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      setDisplayValue(formatDisplayDate(selectedDate));
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  // 날짜 선택 핸들러
  const handleDateSelect = (date) => {
    const dateString = formatDate(date);
    if (onChange) {
      onChange(dateString);
    }
    setIsOpen(false);
  };

  // 드롭다운 열기/닫기
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  // 외부 클릭 처리
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
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

  // 월 변경
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // 달력 데이터 생성
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];

    // 이전 달 날짜들
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // 현재 달 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // 다음 달 날짜들 (6주 달력 완성)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  // 날짜 유효성 검증
  const isDateDisabled = (date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  // 날짜 비교 (같은 날인지)
  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return formatDate(date1) === formatDate(date2);
  };

  // 오늘 날짜인지
  const isToday = (date) => {
    return isSameDay(date, new Date());
  };

  const calendarDays = generateCalendarDays();

  // 크기별 스타일
  const sizeStyles = {
    sm: 'h-8 px-2 text-sm',
    md: 'h-10 px-3 text-base',
    lg: 'h-12 px-4 text-lg'
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
            w-full border-2 rounded-lg transition-all duration-200 cursor-pointer
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none focus:ring-2 focus:ring-mint-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${sizeStyles[size]}
            ${error ?
              'border-red-500 dark:border-red-400 focus:border-red-500' :
              'border-gray-300 dark:border-gray-600 focus:border-mint-500'
            }
          `}
          {...props}
        />

        {/* 캘린더 아이콘 */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <CalendarIcon
            className={`w-5 h-5 ${error ? 'text-red-500' : 'text-gray-400'}`}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* 드롭다운 캘린더 */}
      {isOpen && showDropdown && (
        <div className="absolute z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-mint-500/50"
              aria-label="이전 달"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            <div className="text-base font-semibold text-gray-900 dark:text-white">
              {currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-mint-500/50"
              aria-label="다음 달"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
              <div
                key={day}
                className={`text-center text-xs font-medium py-1 ${
                  idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div ref={calendarRef} className="grid grid-cols-7 gap-1">
            {calendarDays.map((dayInfo, idx) => {
              const isSelected = isSameDay(dayInfo.date, selectedDate);
              const isTodayDate = isToday(dayInfo.date);
              const isDisabled = isDateDisabled(dayInfo.date);
              const dayOfWeek = dayInfo.date.getDay();

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => !isDisabled && handleDateSelect(dayInfo.date)}
                  disabled={isDisabled}
                  className={`
                    w-8 h-8 text-sm rounded transition-colors focus:outline-none
                    ${!dayInfo.isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : ''}
                    ${dayOfWeek === 0 && dayInfo.isCurrentMonth ? 'text-red-500' : ''}
                    ${dayOfWeek === 6 && dayInfo.isCurrentMonth ? 'text-blue-500' : ''}
                    ${dayInfo.isCurrentMonth && dayOfWeek !== 0 && dayOfWeek !== 6 ? 'text-gray-900 dark:text-white' : ''}
                    ${isSelected ? 'bg-mint-500 text-white font-bold hover:bg-mint-600' :
                      isTodayDate ? 'bg-gray-200 dark:bg-gray-700 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600' :
                      'hover:bg-gray-100 dark:hover:bg-gray-700'}
                    ${isDisabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : ''}
                  `}
                >
                  {dayInfo.date.getDate()}
                </button>
              );
            })}
          </div>

          {/* 빠른 선택 버튼 */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  handleDateSelect(today);
                }}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-mint-500/50"
              >
                오늘
              </button>
              <button
                type="button"
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  handleDateSelect(tomorrow);
                }}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-mint-500/50"
              >
                내일
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  handleDateSelect(nextWeek);
                }}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-mint-500/50"
              >
                1주일 후
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
              확인
            </button>
          </div>
        </div>
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

DatePicker.displayName = 'DatePicker';

export default DatePicker;
