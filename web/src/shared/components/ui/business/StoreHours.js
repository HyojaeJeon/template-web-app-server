'use client';

import { useState, useEffect } from 'react';
import { format } from '@/shared/utils/format';
import { useTranslation } from '@/shared/i18n';

/**
 * StoreHours Component
 * 
 * Local 배달 앱 매장 운영시간 관리 컴포넌트
 * - 요일별 운영시간 설정
 * - 휴무일 관리
 * - 실시간 운영상태 표시
 * - Local 현지 시간 처리
 * 
 * WCAG 2.1 준수, 키보드 네비게이션, 스크린 리더 지원
 * 
 * @param {Object} props - StoreHours 컴포넌트 props
 * @param {Object} props.hours - 운영시간 데이터 (요일별)
 * @param {boolean} props.is24Hours - 24시간 운영 여부
 * @param {Array} props.closedDays - 휴무일 배열
 * @param {Function} props.onHoursChange - 시간 변경 콜백
 * @param {Function} props.onStatusChange - 상태 변경 콜백
 * @param {boolean} props.showStatus - 운영상태 표시 여부
 * @param {boolean} props.editable - 편집 가능 여부
 * @param {string} props.className - 추가 CSS 클래스
 */
const StoreHours = ({
  hours = {
    monday: { open: '09:00', close: '22:00', closed: false },
    tuesday: { open: '09:00', close: '22:00', closed: false },
    wednesday: { open: '09:00', close: '22:00', closed: false },
    thursday: { open: '09:00', close: '22:00', closed: false },
    friday: { open: '09:00', close: '23:00', closed: false },
    saturday: { open: '09:00', close: '23:00', closed: false },
    sunday: { open: '10:00', close: '22:00', closed: false }
  },
  is24Hours = false,
  closedDays = [],
  onHoursChange,
  onStatusChange,
  showStatus = true,
  editable = false,
  className = ''
}) => {
  const { language } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [timeToNext, setTimeToNext] = useState('');

  // Local 요일명
  const dayNames = {
    monday: 'Thứ Hai',
    tuesday: 'Thứ Ba',
    wednesday: 'Thứ Tư',
    thursday: 'Thứ Năm',
    friday: 'Thứ Sáu',
    saturday: 'Thứ Bảy',
    sunday: 'Chủ Nhật'
  };

  const dayKeys = Object.keys(dayNames);

  // 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(timer);
  }, []);

  // 운영 상태 계산
  useEffect(() => {
    const now = new Date();
    const currentDay = dayKeys[now.getDay() === 0 ? 6 : now.getDay() - 1]; // 일요일=0 -> 인덱스 조정
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMinute}`;

    const todayHours = hours[currentDay];

    if (is24Hours) {
      setIsOpen(true);
      setTimeToNext('24시간 운영');
      onStatusChange?.({ isOpen: true, nextChange: '24시간 운영' });
      return;
    }

    if (todayHours?.closed || closedDays.includes(currentDay)) {
      setIsOpen(false);
      // 다음 영업일 계산
      const nextOpenDay = getNextOpenDay(currentDay);
      setTimeToNext(`다음 영업: ${dayNames[nextOpenDay]}`);
      onStatusChange?.({ isOpen: false, nextChange: `다음 영업: ${dayNames[nextOpenDay]}` });
      return;
    }

    const isCurrentlyOpen = currentTimeStr >= todayHours.open && currentTimeStr < todayHours.close;
    setIsOpen(isCurrentlyOpen);

    if (isCurrentlyOpen) {
      setTimeToNext(`${todayHours.close}에 마감`);
      onStatusChange?.({ isOpen: true, nextChange: `${todayHours.close}에 마감` });
    } else {
      if (currentTimeStr < todayHours.open) {
        setTimeToNext(`${todayHours.open}에 오픈`);
        onStatusChange?.({ isOpen: false, nextChange: `${todayHours.open}에 오픈` });
      } else {
        const nextOpenDay = getNextOpenDay(currentDay);
        setTimeToNext(`다음 영업: ${dayNames[nextOpenDay]}`);
        onStatusChange?.({ isOpen: false, nextChange: `다음 영업: ${dayNames[nextOpenDay]}` });
      }
    }
  }, [currentTime, hours, is24Hours, closedDays, onStatusChange]);

  // 다음 영업일 찾기
  const getNextOpenDay = (currentDay) => {
    const currentIndex = dayKeys.indexOf(currentDay);
    
    for (let i = 1; i <= 7; i++) {
      const nextIndex = (currentIndex + i) % 7;
      const nextDay = dayKeys[nextIndex];
      
      if (!hours[nextDay]?.closed && !closedDays.includes(nextDay)) {
        return nextDay;
      }
    }
    
    return currentDay;
  };

  // 시간 변경 핸들러
  const handleTimeChange = (day, field, value) => {
    if (!editable || !onHoursChange) return;

    const newHours = {
      ...hours,
      [day]: {
        ...hours[day],
        [field]: value
      }
    };

    onHoursChange(newHours);
  };

  // 휴무 토글 핸들러
  const handleToggleClosed = (day) => {
    if (!editable || !onHoursChange) return;

    const newHours = {
      ...hours,
      [day]: {
        ...hours[day],
        closed: !hours[day].closed
      }
    };

    onHoursChange(newHours);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            운영시간
          </h3>
          
          {showStatus && (
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                isOpen 
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`} />
                {isOpen ? '영업중' : '영업종료'}
              </div>
              
              {timeToNext && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {timeToNext}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 운영시간 목록 */}
      <div className="p-6 space-y-4">
        {is24Hours ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              24시간 운영
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              언제든지 주문하실 수 있습니다
            </p>
          </div>
        ) : (
          dayKeys.map((day) => {
            const dayHours = hours[day];
            const isClosed = dayHours?.closed || closedDays.includes(day);
            
            return (
              <div key={day} className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white w-16">
                    {dayNames[day]}
                  </span>
                  
                  {editable && (
                    <button
                      onClick={() => handleToggleClosed(day)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                        isClosed
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200'
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                      aria-label={`${dayNames[day]} ${isClosed ? '휴무' : '영업일'} 토글`}
                    >
                      {isClosed ? '휴무' : '영업'}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isClosed ? (
                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                      휴무
                    </span>
                  ) : (
                    <>
                      {editable ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={dayHours?.open || '09:00'}
                            onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            aria-label={`${dayNames[day]} 오픈 시간`}
                          />
                          <span className="text-gray-500 dark:text-gray-400">-</span>
                          <input
                            type="time"
                            value={dayHours?.close || '22:00'}
                            onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            aria-label={`${dayNames[day]} 마감 시간`}
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                          {dayHours?.open || '09:00'} - {dayHours?.close || '22:00'}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 현재 시간 표시 */}
      {showStatus && (
        <div className="px-6 pb-6">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            현재 시간: {format.timeByLocale(currentTime, language)} (Local 시간)
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreHours;