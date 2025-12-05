'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';

export default function Calendar({
  value, // 선택된 날짜 (Date 객체 또는 배열)
  onChange, // 날짜 변경 핸들러
  events = [], // Array of {id, date, title, time, location, type, color}
  mode = 'month', // month, week, day, year
  allowMultiple = false, // 다중 선택 허용
  minDate, // 최소 날짜
  maxDate, // 최대 날짜
  disabledDates = [], // 비활성화 날짜 배열
  holidays = [], // 공휴일 배열 {date, name}
  locale = 'vi-VN', // 로케일
  firstDayOfWeek = 1, // 0: 일요일, 1: 월요일
  showWeekNumbers = false, // 주차 표시
  showTimeSlots = false, // 시간 슬롯 표시 (day/week 모드)
  onEventClick, // 이벤트 클릭 핸들러
  className = '',
  headerContent, // 헤더 커스텀 콘텐츠
  footerContent // 푸터 커스텀 콘텐츠
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState(mode);
  const [selectedDates, setSelectedDates] = useState(
    Array.isArray(value) ? value : value ? [value] : []
  );
  const [hoveredDate, setHoveredDate] = useState(null);

  // 로케일별 설정
  const weekDays = getWeekDayNames(locale, firstDayOfWeek);
  const monthNames = getMonthNames(locale);

  // 날짜 선택 핸들러
  const handleDateSelect = useCallback((date) => {
    if (isDateDisabled(date)) return;

    let newDates;
    if (allowMultiple) {
      const dateStr = date.toISOString().split('T')[0];
      const existingIndex = selectedDates.findIndex(
        d => d.toISOString().split('T')[0] === dateStr
      );
      
      if (existingIndex >= 0) {
        newDates = selectedDates.filter((_, i) => i !== existingIndex);
      } else {
        newDates = [...selectedDates, date];
      }
    } else {
      newDates = [date];
    }

    setSelectedDates(newDates);
    if (onChange) {
      onChange(allowMultiple ? newDates : newDates[0]);
    }
  }, [selectedDates, allowMultiple, onChange]);

  // 날짜 비활성화 체크
  const isDateDisabled = (date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    
    const dateStr = date.toISOString().split('T')[0];
    return disabledDates.some(d => {
      const disabledStr = typeof d === 'string' ? d : d.toISOString().split('T')[0];
      return disabledStr === dateStr;
    });
  };

  // 날짜 선택 여부 체크
  const isDateSelected = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return selectedDates.some(
      d => d.toISOString().split('T')[0] === dateStr
    );
  };

  // 공휴일 체크
  const isHoliday = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.find(h => {
      const holidayStr = typeof h.date === 'string' ? h.date : h.date.toISOString().split('T')[0];
      return holidayStr === dateStr;
    });
  };

  // 이벤트 가져오기
  const getDateEvents = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toISOString().split('T')[0] === dateStr;
    });
  };

  // 네비게이션
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // 월 뷰 렌더링
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const startOffset = (startDate.getDay() - firstDayOfWeek + 7) % 7;
    startDate.setDate(startDate.getDate() - startOffset);

    const weeks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let week = 0; week < 6; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(startDate);
        const isCurrentMonth = date.getMonth() === month;
        const isToday = date.getTime() === today.getTime();
        const holiday = isHoliday(date);
        const dateEvents = getDateEvents(date);
        
        days.push(
          <td key={day} className="relative p-0 h-24 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleDateSelect(date)}
              disabled={isDateDisabled(date)}
              className={`
                w-full h-full p-2 text-left transition-all
                ${isCurrentMonth ? '' : 'bg-gray-50 dark:bg-gray-800/50'}
                ${isDateSelected(date) ? 'bg-emerald-100 dark:bg-emerald-900/30' : ''}
                ${isToday ? 'ring-2 ring-emerald-500 ring-inset' : ''}
                ${isDateDisabled(date) ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                ${holiday ? 'text-red-600 dark:text-red-400' : ''}
              `}
              aria-label={`${date.getDate()}일 ${monthNames[date.getMonth()]}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`
                  text-sm font-medium
                  ${isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'}
                  ${holiday ? 'text-red-600 dark:text-red-400' : ''}
                `}>
                  {date.getDate()}
                </span>
                {holiday && (
                  <span className="text-xs text-red-600 dark:text-red-400">
                    {holiday.name}
                  </span>
                )}
              </div>

              {/* 이벤트 표시 */}
              {dateEvents.length > 0 && (
                <div className="space-y-1">
                  {dateEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick && onEventClick(event);
                      }}
                      className={`
                        text-xs p-1 rounded truncate cursor-pointer
                        hover:opacity-80 transition-opacity
                        ${event.color || 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'}
                      `}
                      title={event.title}
                    >
                      {event.time && (
                        <span className="font-medium">{event.time} </span>
                      )}
                      {event.title}
                    </div>
                  ))}
                  {dateEvents.length > 2 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{dateEvents.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </button>
          </td>
        );
        
        startDate.setDate(startDate.getDate() + 1);
      }
      
      weeks.push(<tr key={week}>{days}</tr>);
    }

    return (
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {showWeekNumbers && (
              <th className="p-2 text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                주
              </th>
            )}
            {weekDays.map((day, index) => (
              <th
                key={index}
                className="p-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{weeks}</tbody>
      </table>
    );
  };

  // 주 뷰 렌더링
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = (day - firstDayOfWeek + 7) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - diff);

    const days = [];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr>
              <th className="w-16 p-2 text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                시간
              </th>
              {days.map((date, index) => {
                const isToday = isToday(date);
                const holiday = isHoliday(date);
                
                return (
                  <th
                    key={index}
                    className={`
                      p-2 text-sm font-medium border border-gray-200 dark:border-gray-700
                      ${isToday ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}
                      ${holiday ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
                    `}
                  >
                    <div>{weekDays[index]}</div>
                    <div className="text-lg font-semibold">{date.getDate()}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {hours.map((hour) => (
              <tr key={hour}>
                <td className="p-2 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                  {hour.toString().padStart(2, '0')}:00
                </td>
                {days.map((date, dayIndex) => {
                  const hourEvents = getDateEvents(date).filter(event => {
                    if (!event.time) return false;
                    const eventHour = parseInt(event.time.split(':')[0]);
                    return eventHour === hour;
                  });

                  return (
                    <td
                      key={dayIndex}
                      className="relative p-1 h-16 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      {hourEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => onEventClick && onEventClick(event)}
                          className={`
                            absolute inset-x-1 p-1 text-xs rounded cursor-pointer
                            hover:opacity-80 transition-opacity
                            ${event.color || 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'}
                          `}
                          title={event.title}
                        >
                          <div className="font-medium">{event.time}</div>
                          <div className="truncate">{event.title}</div>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // 일 뷰 렌더링
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = getDateEvents(currentDate);
    const holiday = isHoliday(currentDate);

    return (
      <div>
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className={`text-xl font-semibold ${holiday ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
            {currentDate.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h3>
          {holiday && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{holiday.name}</p>
          )}
        </div>

        <div className="space-y-2">
          {hours.map((hour) => {
            const hourEvents = dayEvents.filter(event => {
              if (!event.time) return false;
              const eventHour = parseInt(event.time.split(':')[0]);
              return eventHour === hour;
            });

            return (
              <div key={hour} className="flex gap-4">
                <div className="w-16 text-sm text-gray-500 dark:text-gray-400 pt-2">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 min-h-[60px] p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick && onEventClick(event)}
                      className={`
                        p-2 mb-2 rounded cursor-pointer hover:opacity-80 transition-opacity
                        ${event.color || 'bg-blue-100 dark:bg-blue-900/30'}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        {event.time && (
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <ClockIcon className="w-4 h-4" />
                            {event.time}
                          </div>
                        )}
                        <div className="font-medium">{event.title}</div>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <MapPinIcon className="w-4 h-4" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-md ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigatePrevious()}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="이전"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={navigateToday}
            className="px-3 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
          >
            오늘
          </button>
          
          <button
            onClick={() => navigateNext()}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="다음"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {viewMode === 'month' && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          {viewMode === 'week' && `${currentDate.getFullYear()}년 ${getWeekNumber(currentDate)}주차`}
          {viewMode === 'day' && currentDate.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
          {viewMode === 'year' && currentDate.getFullYear()}
        </h2>

        <div className="flex gap-1">
          {['month', 'week', 'day'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`
                px-3 py-1 text-sm font-medium rounded-lg transition-colors
                ${viewMode === mode
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                }
              `}
            >
              {mode === 'month' && '월'}
              {mode === 'week' && '주'}
              {mode === 'day' && '일'}
            </button>
          ))}
        </div>
      </div>

      {/* 본문 */}
      <div className="p-4">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </div>

      {/* 푸터 */}
      {footerContent && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {footerContent}
        </div>
      )}
    </div>
  );
}

// 유틸리티 함수들
function getWeekDayNames(locale, firstDayOfWeek) {
  const baseDate = new Date(2024, 0, 1); // 월요일
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + ((i + firstDayOfWeek) % 7));
    days.push(date.toLocaleDateString(locale, { weekday: 'short' }));
  }
  
  return days;
}

function getMonthNames(locale) {
  const names = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(2024, i, 1);
    names.push(date.toLocaleDateString(locale, { month: 'long' }));
  }
  return names;
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}