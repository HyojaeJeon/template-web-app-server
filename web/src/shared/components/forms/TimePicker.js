/**
 * 시간 선택기 컴포넌트 (점주용)
 * WCAG 2.1 준수, 키보드 네비게이션, Local 테마 적용
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';

const TimePicker = ({
  id,
  name,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  success,
  label,
  helperText,
  format24Hour = true,
  minuteStep = 1,
  showSeconds = false,
  placeholder = '시간 선택',
  className = '',
  inputClassName = '',
  dropdownClassName = '',
  minTime,
  maxTime,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState(value || '');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const timeListRef = useRef(null);
  
  const timeId = id || `time-picker-${Math.random().toString(36).substr(2, 9)}`;
  const dropdownId = `${timeId}-dropdown`;

  // 시간 옵션 생성
  const generateTimeOptions = () => {
    const times = [];
    const totalMinutes = 24 * 60;
    
    for (let i = 0; i < totalMinutes; i += minuteStep) {
      const hours = Math.floor(i / 60);
      const minutes = i % 60;
      
      let timeString;
      if (format24Hour) {
        timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        if (showSeconds) {
          timeString += ':00';
        }
      } else {
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const ampm = hours < 12 ? 'AM' : 'PM';
        timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        if (showSeconds) {
          timeString = `${displayHours}:${minutes.toString().padStart(2, '0')}:00 ${ampm}`;
        }
      }
      
      // 최소/최대 시간 필터링
      if (minTime || maxTime) {
        const currentMinutes = hours * 60 + minutes;
        const minMinutes = minTime ? parseTimeToMinutes(minTime) : 0;
        const maxMinutes = maxTime ? parseTimeToMinutes(maxTime) : totalMinutes;
        
        if (currentMinutes < minMinutes || currentMinutes > maxMinutes) {
          continue;
        }
      }
      
      times.push({
        value: timeString,
        minutes: hours * 60 + minutes,
        hours,
        displayMinutes: minutes
      });
    }
    
    return times;
  };

  // 시간 문자열을 분으로 변환
  const parseTimeToMinutes = (timeString) => {
    if (!timeString) return 0;
    
    const parts = timeString.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10) || 0;
    
    if (!format24Hour && timeString.includes('PM') && hours !== 12) {
      hours += 12;
    } else if (!format24Hour && timeString.includes('AM') && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  };

  const timeOptions = generateTimeOptions();

  // 시간 선택 처리
  const handleTimeSelect = (time) => {
    setSelectedTime(time.value);
    setIsOpen(false);
    if (onChange) {
      onChange({
        target: {
          name,
          value: time.value
        }
      });
    }
  };

  // 입력 필드 직접 편집
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSelectedTime(newValue);
    if (onChange) {
      onChange(e);
    }
  };

  // 키보드 네비게이션
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < timeOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (timeOptions[focusedIndex]) {
          handleTimeSelect(timeOptions[focusedIndex]);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 선택된 항목으로 스크롤
  useEffect(() => {
    if (isOpen && timeListRef.current) {
      const selectedElement = timeListRef.current.children[focusedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);

  // 현재 선택된 시간의 인덱스 찾기
  useEffect(() => {
    if (selectedTime) {
      const index = timeOptions.findIndex(option => option.value === selectedTime);
      if (index !== -1) {
        setFocusedIndex(index);
      }
    }
  }, [selectedTime, timeOptions]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef} {...props}>
      {label && (
        <label
          htmlFor={timeId}
          className={`
            block text-sm font-medium mb-2
            ${disabled 
              ? 'text-gray-400 dark:text-gray-600' 
              : error 
                ? 'text-red-600 dark:text-red-400'
                : success
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-700 dark:text-gray-300'
            }
          `}
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="필수 항목">*</span>
          )}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id={timeId}
          name={name}
          type="text"
          value={selectedTime}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={dropdownId}
          aria-activedescendant={isOpen ? `${timeId}-option-${focusedIndex}` : undefined}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:border-vietnam-mint transition-colors
            ${error 
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
              : success
                ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                : 'border-gray-300 dark:border-gray-600'
            }
            ${disabled 
              ? 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
              : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
            }
            ${inputClassName}
          `}
        />

        {/* 드롭다운 아이콘 */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg 
            className={`w-5 h-5 ${disabled ? 'text-gray-400' : 'text-gray-500'} transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* 시간 아이콘 */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className={`w-5 h-5 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div
          id={dropdownId}
          className={`
            absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto
            ${dropdownClassName}
          `}
          role="listbox"
          aria-label="시간 옵션"
        >
          <div ref={timeListRef}>
            {timeOptions.map((time, index) => (
              <div
                key={time.value}
                id={`${timeId}-option-${index}`}
                role="option"
                aria-selected={index === focusedIndex}
                onClick={() => handleTimeSelect(time)}
                className={`
                  px-4 py-2 cursor-pointer transition-colors
                  ${index === focusedIndex 
                    ? 'bg-vietnam-mint text-white' 
                    : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                  ${time.value === selectedTime ? 'font-medium' : ''}
                `}
              >
                {time.value}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 도움말 텍스트 */}
      {helperText && (
        <p className={`
          mt-2 text-sm
          ${disabled 
            ? 'text-gray-400 dark:text-gray-600' 
            : success && !error
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-500 dark:text-gray-400'
          }
        `}>
          {helperText}
        </p>
      )}

      {/* 에러 메시지 */}
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center" role="alert">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default TimePicker;