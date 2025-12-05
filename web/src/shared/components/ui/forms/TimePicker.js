'use client';

import { useState, useEffect, useRef, useMemo, forwardRef } from 'react';
import { ClockIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

/**
 * 시간 선택 컴포넌트 (WCAG 2.1 준수)
 * Local 테마 컬러와 다크모드 지원
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.value - 시간 값 (HH:mm 형식)
 * @param {Function} props.onChange - 값 변경 핸들러
 * @param {boolean} props.disabled - 비활성화 여부
 * @param {boolean} props.use24Hour - 24시간 형식 사용 여부
 * @param {number} props.minuteStep - 분 단위 간격
 * @param {string} props.minTime - 최소 시간
 * @param {string} props.maxTime - 최대 시간
 * @param {string} props.placeholder - 플레이스홀더
 * @param {string} props.size - 크기
 * @param {boolean} props.showDropdown - 드롭다운 표시 여부
 * @param {string} props.error - 에러 메시지
 */
const TimePicker = forwardRef(({
  value = '',
  onChange,
  disabled = false,
  use24Hour = true,
  minuteStep = 15,
  minTime,
  maxTime,
  placeholder = '시간을 선택하세요',
  size = 'md',
  showDropdown = true,
  error,
  className = '',
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  const containerRef = useRef(null);
  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);

  // 시간 파싱
  const parseTime = (timeString) => {
    if (!timeString) return null;
    
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    if (use24Hour) {
      return { hours, minutes, period: null };
    } else {
      return { hours, minutes, period: period || 'AM' };
    }
  };

  // 시간 포맷팅
  const formatTime = (hours, minutes, period = null) => {
    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    
    if (use24Hour) {
      return `${h}:${m}`;
    } else {
      return `${h}:${m} ${period}`;
    }
  };

  // 24시간을 12시간으로 변환
  const to12Hour = (hour24) => {
    if (hour24 === 0) return { hour: 12, period: 'AM' };
    if (hour24 < 12) return { hour: hour24, period: 'AM' };
    if (hour24 === 12) return { hour: 12, period: 'PM' };
    return { hour: hour24 - 12, period: 'PM' };
  };

  // 12시간을 24시간으로 변환
  const to24Hour = (hour12, period) => {
    if (period === 'AM') {
      return hour12 === 12 ? 0 : hour12;
    } else {
      return hour12 === 12 ? 12 : hour12 + 12;
    }
  };

  // value로부터 현재 선택된 시간/분/period 계산
  const { selectedHour, selectedMinute, selectedPeriod } = useMemo(() => {
    if (!value) {
      return { selectedHour: null, selectedMinute: null, selectedPeriod: 'AM' };
    }

    const parsed = parseTime(value);
    if (!parsed) {
      return { selectedHour: null, selectedMinute: null, selectedPeriod: 'AM' };
    }

    if (use24Hour) {
      return { selectedHour: parsed.hours, selectedMinute: parsed.minutes, selectedPeriod: null };
    } else {
      const { hour, period } = to12Hour(parsed.hours);
      return { selectedHour: hour, selectedMinute: parsed.minutes, selectedPeriod: period };
    }
  }, [value, use24Hour]);

  // 값 초기화 (displayValue만 업데이트)
  useEffect(() => {
    if (value) {
      const parsed = parseTime(value);
      if (parsed) {
        if (use24Hour) {
          setDisplayValue(formatTime(parsed.hours, parsed.minutes));
        } else {
          const { hour, period } = to12Hour(parsed.hours);
          setDisplayValue(formatTime(hour, parsed.minutes, period));
        }
      }
    } else {
      setDisplayValue('');
    }
  }, [value, use24Hour]);

  // 시간 범위 생성
  const getHourRange = () => {
    if (use24Hour) {
      return Array.from({ length: 24 }, (_, i) => i);
    } else {
      return Array.from({ length: 12 }, (_, i) => i + 1);
    }
  };

  const getMinuteRange = () => {
    const minutes = [];
    for (let i = 0; i < 60; i += minuteStep) {
      minutes.push(i);
    }
    return minutes;
  };

  // 시간 유효성 검증
  const isTimeValid = (hours, minutes, period) => {
    let hour24 = use24Hour ? hours : to24Hour(hours, period);
    const timeString = formatTime(hour24, minutes);
    
    if (minTime && timeString < minTime) return false;
    if (maxTime && timeString > maxTime) return false;
    
    return true;
  };

  // 시간 선택 핸들러
  const handleTimeSelect = (hours, minutes, period) => {
    if (!isTimeValid(hours, minutes, period)) return;

    let finalHours = use24Hour ? hours : to24Hour(hours, period);
    const timeValue = formatTime(finalHours, minutes);

    if (onChange) {
      onChange(timeValue);
    }
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

  // 선택된 항목으로 스크롤
  useEffect(() => {
    if (isOpen && selectedHour !== null) {
      setTimeout(() => {
        const hourElement = hourListRef.current?.querySelector(`button:nth-child(${selectedHour + 1})`);
        if (hourElement) {
          hourElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 50);
    }
  }, [isOpen, value]);

  useEffect(() => {
    if (isOpen && selectedMinute !== null) {
      setTimeout(() => {
        const minuteIndex = Math.floor(selectedMinute / minuteStep);
        const minuteElement = minuteListRef.current?.querySelector(`button:nth-child(${minuteIndex + 1})`);
        if (minuteElement) {
          minuteElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 50);
    }
  }, [isOpen, value]);

  // 키보드 네비게이션
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeDropdown();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown();
    }
  };

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
        
        {/* 시계 아이콘 */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ClockIcon 
            className={`w-5 h-5 ${error ? 'text-red-500' : 'text-gray-400'}`} 
            aria-hidden="true" 
          />
        </div>
      </div>

      {/* 드롭다운 */}
      {isOpen && showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="p-4">
            <div className="flex gap-2">
              {/* 시간 선택 */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  시간
                </label>
                <div
                  ref={hourListRef}
                  className="h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
                >
                  {getHourRange().map((hour) => {
                    const isSelected = selectedHour === hour;
                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => handleTimeSelect(hour, selectedMinute ?? 0, use24Hour ? null : selectedPeriod)}
                        className={`w-full px-3 py-2 text-sm text-left transition-colors focus:outline-none ${
                          isSelected
                            ? 'bg-mint-500 text-white'
                            : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {String(hour).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 분 선택 */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  분
                </label>
                <div
                  ref={minuteListRef}
                  className="h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
                >
                  {getMinuteRange().map((minute) => {
                    const isSelected = selectedMinute === minute;
                    return (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => handleTimeSelect(selectedHour ?? 0, minute, use24Hour ? null : selectedPeriod)}
                        className={`w-full px-3 py-2 text-sm text-left transition-colors focus:outline-none ${
                          isSelected
                            ? 'bg-mint-500 text-white'
                            : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {String(minute).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AM/PM 선택 (12시간 형식) */}
              {!use24Hour && (
                <div className="w-16">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    오전/오후
                  </label>
                  <div className="space-y-1">
                    {['AM', 'PM'].map((period) => {
                      const isSelected = selectedPeriod === period;
                      return (
                        <button
                          key={period}
                          type="button"
                          onClick={() => handleTimeSelect(selectedHour, selectedMinute, period)}
                          className={`w-full px-2 py-2 text-sm rounded transition-colors focus:outline-none ${
                            isSelected
                              ? 'bg-mint-500 text-white'
                              : 'text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {period}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 빠른 선택 버튼 */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {['09:00', '12:00', '15:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'].map((quickTime) => {
                  // 24:00은 23:59로 처리 (자정)
                  const displayTime = quickTime;
                  const actualTime = quickTime === '24:00' ? '23:59' : quickTime;

                  return (
                    <button
                      key={quickTime}
                      type="button"
                      onClick={() => {
                        const [hours24, minutes] = actualTime.split(':').map(Number);

                        if (use24Hour) {
                          // 24시간 형식: 그대로 전달
                          handleTimeSelect(hours24, minutes, null);
                        } else {
                          // 12시간 형식: 변환 필요
                          const period = hours24 < 12 ? 'AM' : 'PM';
                          const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
                          handleTimeSelect(hours12, minutes, period);
                        }
                        closeDropdown();
                      }}
                      className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-mint-500/50"
                    >
                      {displayTime}
                    </button>
                  );
                })}
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

TimePicker.displayName = 'TimePicker';

export default TimePicker;