/**
 * DatePicker 컴포넌트 - Local App 디자인 시스템
 * WCAG 2.1 준수 날짜 선택기 (키보드 네비게이션 지원)
 */

import React, { useState, useRef, useId, useEffect } from 'react';

const DatePicker = ({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'YYYY-MM-DD',
  error,
  helperText,
  required = false,
  disabled = false,
  readOnly = false,
  locale = 'vi-VN',
  dateFormat = 'YYYY-MM-DD',
  size = 'medium',
  fullWidth = false,
  name,
  id,
  className = '',
  onFocus,
  onBlur,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const [focusedDate, setFocusedDate] = useState(null);
  const calendarRef = useRef(null);
  const inputRef = useRef(null);
  const generatedId = useId();
  const pickerId = id || generatedId;

  // Vietnamese month names
  const monthNames = locale === 'vi-VN' 
    ? ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
       'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
    : ['January', 'February', 'March', 'April', 'May', 'June',
       'July', 'August', 'September', 'October', 'November', 'December'];

  const dayNames = locale === 'vi-VN'
    ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Format date based on locale and format
  const formatDate = (date) => {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    if (dateFormat === 'DD/MM/YYYY') {
      return `${day}/${month}/${year}`;
    } else if (dateFormat === 'MM/DD/YYYY') {
      return `${month}/${day}/${year}`;
    }
    return `${year}-${month}-${day}`;
  };

  // Parse date from string
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    
    let parts;
    if (dateFormat === 'DD/MM/YYYY') {
      parts = dateStr.split('/');
      return new Date(parts[2], parts[1] - 1, parts[0]);
    } else if (dateFormat === 'MM/DD/YYYY') {
      parts = dateStr.split('/');
      return new Date(parts[2], parts[0] - 1, parts[1]);
    }
    return new Date(dateStr);
  };

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // Check if date is valid
  const isDateValid = (date) => {
    if (!date) return true;
    
    if (minDate && date < new Date(minDate)) return false;
    if (maxDate && date > new Date(maxDate)) return false;
    
    return true;
  };

  // Check if dates are same day
  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  // Check if date is today
  const isToday = (date) => {
    return isSameDay(date, new Date());
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    if (!date || !isDateValid(date)) return;
    
    setSelectedDate(date);
    setIsOpen(false);
    
    if (onChange) {
      onChange({ target: { value: formatDate(date) } });
    }
  };

  // Handle month navigation
  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1));
  };

  // Handle year change
  const handleYearChange = (e) => {
    const year = parseInt(e.target.value);
    setViewDate(new Date(year, viewDate.getMonth()));
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    let newFocusedDate = focusedDate || selectedDate || new Date();
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newFocusedDate = new Date(newFocusedDate);
        newFocusedDate.setDate(newFocusedDate.getDate() - 1);
        break;
      
      case 'ArrowRight':
        e.preventDefault();
        newFocusedDate = new Date(newFocusedDate);
        newFocusedDate.setDate(newFocusedDate.getDate() + 1);
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        newFocusedDate = new Date(newFocusedDate);
        newFocusedDate.setDate(newFocusedDate.getDate() - 7);
        break;
      
      case 'ArrowDown':
        e.preventDefault();
        newFocusedDate = new Date(newFocusedDate);
        newFocusedDate.setDate(newFocusedDate.getDate() + 7);
        break;
      
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isDateValid(newFocusedDate)) {
          handleDateSelect(newFocusedDate);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.focus();
        break;
      
      case 'Home':
        e.preventDefault();
        newFocusedDate = new Date(newFocusedDate);
        newFocusedDate.setDate(1);
        break;
      
      case 'End':
        e.preventDefault();
        newFocusedDate = new Date(newFocusedDate.getFullYear(), newFocusedDate.getMonth() + 1, 0);
        break;
      
      default:
        return;
    }
    
    setFocusedDate(newFocusedDate);
    setViewDate(newFocusedDate);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const containerClasses = [
    'input-container',
    'datepicker-container',
    `input-${size}`,
    fullWidth && 'input-full-width',
    disabled && 'input-disabled',
    error && 'input-error',
    isOpen && 'datepicker-open',
    className
  ].filter(Boolean).join(' ');

  const days = getDaysInMonth(viewDate);
  const currentYear = viewDate.getFullYear();
  const yearOptions = [];
  for (let year = currentYear - 50; year <= currentYear + 50; year++) {
    yearOptions.push(year);
  }

  return (
    <div className={containerClasses} ref={calendarRef}>
      {label && (
        <label htmlFor={pickerId} className="input-label">
          {label}
          {required && <span className="input-required" aria-label="필수 항목">*</span>}
        </label>
      )}
      
      <div className="input-wrapper">
        <input
          ref={inputRef}
          id={pickerId}
          name={name}
          type="text"
          value={selectedDate ? formatDate(selectedDate) : ''}
          onChange={(e) => {
            const date = parseDate(e.target.value);
            if (date && isDateValid(date)) {
              setSelectedDate(date);
              if (onChange) {
                onChange({ target: { value: formatDate(date) } });
              }
            }
          }}
          onClick={() => !disabled && !readOnly && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          className="input-field datepicker-input"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${pickerId}-error` : helperText ? `${pickerId}-helper` : undefined
          }
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          {...props}
        />
        
        <button
          type="button"
          className="datepicker-trigger"
          onClick={() => !disabled && !readOnly && setIsOpen(!isOpen)}
          disabled={disabled || readOnly}
          tabIndex={-1}
          aria-label="Open calendar"
        >
          📅
        </button>
      </div>
      
      {isOpen && (
        <div className="datepicker-dropdown" role="dialog" aria-label="Date picker">
          <div className="datepicker-header">
            <button
              type="button"
              className="datepicker-nav-btn"
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              ‹
            </button>
            
            <div className="datepicker-month-year">
              <span className="datepicker-month">
                {monthNames[viewDate.getMonth()]}
              </span>
              <select
                className="datepicker-year-select"
                value={currentYear}
                onChange={handleYearChange}
                aria-label="Select year"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <button
              type="button"
              className="datepicker-nav-btn"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              ›
            </button>
          </div>
          
          <div className="datepicker-calendar">
            <div className="datepicker-weekdays">
              {dayNames.map(day => (
                <div key={day} className="datepicker-weekday">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="datepicker-days">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="datepicker-day-empty" />;
                }
                
                const isSelected = isSameDay(date, selectedDate);
                const isFocused = isSameDay(date, focusedDate);
                const isValid = isDateValid(date);
                const today = isToday(date);
                
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    className={[
                      'datepicker-day',
                      isSelected && 'datepicker-day-selected',
                      isFocused && 'datepicker-day-focused',
                      today && 'datepicker-day-today',
                      !isValid && 'datepicker-day-disabled'
                    ].filter(Boolean).join(' ')}
                    onClick={() => handleDateSelect(date)}
                    disabled={!isValid}
                    aria-label={formatDate(date)}
                    aria-selected={isSelected}
                    tabIndex={isFocused ? 0 : -1}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="datepicker-footer">
            <button
              type="button"
              className="datepicker-today-btn"
              onClick={() => handleDateSelect(new Date())}
            >
              Hôm nay
            </button>
            <button
              type="button"
              className="datepicker-clear-btn"
              onClick={() => {
                setSelectedDate(null);
                if (onChange) {
                  onChange({ target: { value: '' } });
                }
                setIsOpen(false);
              }}
            >
              Xóa
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <span id={`${pickerId}-error`} className="input-error-text" role="alert">
          {error}
        </span>
      )}
      
      {!error && helperText && (
        <span id={`${pickerId}-helper`} className="input-helper-text">
          {helperText}
        </span>
      )}
    </div>
  );
};

export default DatePicker;