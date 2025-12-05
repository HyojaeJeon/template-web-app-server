'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/shared/i18n';

/**
 * 실시간 시계 컴포넌트
 * - 선택된 언어에 맞는 날짜/시간 형식으로 표시
 * - 매초 업데이트
 * - 다국어 지원 (한국어, Local어, 영어)
 */
export default function RealtimeClock({ className = '' }) {
  const { language } = useTranslation();
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 언어별 날짜/시간 형식 설정
  const getFormattedDateTime = () => {
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };

    switch (language) {
      case 'vi':
        // Local어: dd/MM/yyyy HH:mm
        return currentTime.toLocaleDateString('vi-VN', {
          ...options,
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).replace(',', '');
      
      case 'en':
        // 영어: MM/dd/yyyy hh:mm AM/PM
        return currentTime.toLocaleDateString('en-US', {
          ...options,
          hour12: true
        }).replace(',', '');
      
      case 'ko':
      default:
        // 한국어: yyyy-MM-dd HH:mm
        return currentTime.toLocaleDateString('ko-KR', {
          ...options,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).replace(/\./g, '-').replace(/\s/g, '').replace(/-$/, '').replace('--', ' ');
    }
  };

  // 한국어 포맷을 직접 구성 (더 정확한 형식)
  const formatKoreanDateTime = () => {
    const year = currentTime.getFullYear();
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const day = String(currentTime.getDate()).padStart(2, '0');
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // Local어 포맷
  const formatVietnameseDateTime = () => {
    const year = currentTime.getFullYear();
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const day = String(currentTime.getDate()).padStart(2, '0');
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // 영어 포맷 (AM/PM 포함)
  const formatEnglishDateTime = () => {
    const year = currentTime.getFullYear();
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const day = String(currentTime.getDate()).padStart(2, '0');
    let hours = currentTime.getHours();
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // 0시는 12시로 표시
    const displayHours = String(hours).padStart(2, '0');
    
    return `${month}/${day}/${year} ${displayHours}:${minutes} ${ampm}`;
  };

  const getDisplayTime = () => {
    switch (language) {
      case 'vi':
        return formatVietnameseDateTime();
      case 'en':
        return formatEnglishDateTime();
      case 'ko':
      default:
        return formatKoreanDateTime();
    }
  };

  return (
    <div className={`flex items-center text-sm text-gray-600 dark:text-gray-300 font-mono ${className}`}>
      <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md border">
        {getDisplayTime()}
      </span>
    </div>
  );
}