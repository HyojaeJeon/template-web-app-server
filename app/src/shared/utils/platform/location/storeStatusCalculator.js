/**
 * Store Operating Status Calculator Utility
 * Calculate current operating status and delivery availability based on operating hours
 */

/**
 * Get current local time
 * @returns {Date} Current local time
 */
const getVietnamTime = () => {
  return new Date(new Date().toLocaleString('en-US', {timeZone: 'Asia/Ho_Chi_Minh'}));
};

/**
 * Convert time string to minutes
 * @param {string} timeString Time string in "HH:mm" format
 * @returns {number} Time in minutes (e.g., "14:30" -> 870)
 */
const timeStringToMinutes = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return null;

  const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
  if (isNaN(hours) || isNaN(minutes)) return null;

  return hours * 60 + minutes;
};

/**
 * Convert minutes to time string
 * @param {number} minutes Time in minutes
 * @returns {string} Time string in "HH:mm" format
 */
const minutesToTimeString = (minutes) => {
  if (typeof minutes !== 'number' || minutes < 0) return '';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Calculate store's current operating status
 * @param {object} store Store object
 * @returns {object} Operating status information
 */
export const calculateStoreStatus = (store) => {
  const now = getVietnamTime();
  const currentDay = now.getDay(); // 0: Sunday, 1: Monday, ..., 6: Saturday
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Default status
  const defaultStatus = {
    isOpen: false,
    status: 'CLOSED',
    statusText: 'Closed',
    statusTextVi: 'Đã đóng cửa',
    isDeliveryAvailable: false,
    nextOpenTime: null,
    nextCloseTime: null,
    specialMessage: null,
    remainingTime: null, // Remaining time until closing (minutes)
  };

  if (!store) return defaultStatus;

  // 매장이 강제로 비활성화된 경우
  if (store.status === 'INACTIVE' || store.isAvailable === false) {
    return {
      ...defaultStatus,
      status: 'UNAVAILABLE',
      statusText: '일시중단',
      statusTextVi: 'Tạm ngừng'};
  }

  // 운영시간 정보 가져오기
  let businessHours = null;
  
  if (store.vietnamBusinessHours) {
    businessHours = store.vietnamBusinessHours;
  } else if (store.businessHours) {
    businessHours = store.businessHours;
  } else if (store.openingHours) {
    // 간단한 형태의 운영시간 문자열 파싱 (예: "09:00-22:00")
    const openingHours = store.openingHours;
    if (typeof openingHours === 'string' && openingHours.includes('-')) {
      const [openTime, closeTime] = openingHours.split('-');
      businessHours = {
        regularHours: [{
          dayOfWeek: currentDay,
          isOpen: true,
          openTime: openTime.trim(),
          closeTime: closeTime.trim()}]
      };
    }
  }

  if (!businessHours || !businessHours.regularHours) {
    // 운영시간 정보가 없으면 기본적으로 영업중으로 가정
    return {
      isOpen: true,
      status: 'OPEN',
      statusText: '영업중',
      statusTextVi: 'Đang mở cửa',
      isDeliveryAvailable: true,
      nextOpenTime: null,
      nextCloseTime: null,
      specialMessage: null,
      remainingTime: null};
  }

  // 오늘의 운영시간 찾기
  const todayHours = businessHours.regularHours.find(h => h.dayOfWeek === currentDay);
  
  if (!todayHours || !todayHours.isOpen) {
    // 오늘 휴무
    const nextOpenDay = findNextOpenDay(businessHours.regularHours, currentDay);
    return {
      ...defaultStatus,
      nextOpenTime: nextOpenDay ? `${getNextDayName(nextOpenDay.dayOfWeek)} ${nextOpenDay.openTime}` : null};
  }

  const openMinutes = timeStringToMinutes(todayHours.openTime);
  const closeMinutes = timeStringToMinutes(todayHours.closeTime);

  if (openMinutes === null || closeMinutes === null) {
    // 시간 파싱 실패 시 영업중으로 가정
    return {
      isOpen: true,
      status: 'OPEN',
      statusText: '영업중',
      statusTextVi: 'Đang mở cửa',
      isDeliveryAvailable: true,
      nextOpenTime: null,
      nextCloseTime: null,
      specialMessage: null,
      remainingTime: null};
  }

  // 자정을 넘어가는 경우 처리 (예: 22:00-02:00)
  const isOvernight = closeMinutes < openMinutes;
  
  let isCurrentlyOpen = false;
  let remainingMinutes = null;

  if (isOvernight) {
    // 자정을 넘어가는 경우
    isCurrentlyOpen = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
    if (isCurrentlyOpen) {
      remainingMinutes = currentMinutes >= openMinutes 
        ? (24 * 60) - currentMinutes + closeMinutes  // 자정 지나서 닫힘
        : closeMinutes - currentMinutes;             // 오늘 닫힘
    }
  } else {
    // 일반적인 경우
    isCurrentlyOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    if (isCurrentlyOpen) {
      remainingMinutes = closeMinutes - currentMinutes;
    }
  }

  // 상태 결정
  if (isCurrentlyOpen) {
    const isClosingSoon = remainingMinutes && remainingMinutes <= 30; // 30분 이내 마감
    
    return {
      isOpen: true,
      status: isClosingSoon ? 'CLOSING_SOON' : 'OPEN',
      statusText: isClosingSoon ? '곧 마감' : '영업중',
      statusTextVi: isClosingSoon ? 'Sắp đóng cửa' : 'Đang mở cửa',
      isDeliveryAvailable: true,
      nextOpenTime: null,
      nextCloseTime: todayHours.closeTime,
      specialMessage: isClosingSoon ? `${Math.round(remainingMinutes)}분 후 마감` : null,
      remainingTime: remainingMinutes};
  } else {
    // 영업 종료
    const nextOpenTime = currentMinutes < openMinutes 
      ? todayHours.openTime // 오늘 아직 안 열림
      : null; // 오늘은 이미 마감, 내일 또는 다음 영업일 확인 필요

    return {
      ...defaultStatus,
      nextOpenTime: nextOpenTime || `내일 ${todayHours.openTime}`};
  }
};

/**
 * 다음 영업일 찾기
 * @param {Array} regularHours 정규 운영시간 배열
 * @param {number} currentDay 현재 요일
 * @returns {object|null} 다음 영업일 정보
 */
const findNextOpenDay = (regularHours, currentDay) => {
  if (!regularHours || !Array.isArray(regularHours)) return null;
  
  for (let i = 1; i <= 7; i++) {
    const nextDay = (currentDay + i) % 7;
    const dayHours = regularHours.find(h => h.dayOfWeek === nextDay && h.isOpen);
    if (dayHours) {
      return dayHours;
    }
  }
  return null;
};

/**
 * 요일 이름 가져오기
 * @param {number} dayOfWeek 요일 (0: 일요일)
 * @returns {string} 요일 이름
 */
const getNextDayName = (dayOfWeek) => {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return days[dayOfWeek] || '';
};

/**
 * 매장 상태에 따른 배지 스타일 가져오기
 * @param {object} statusInfo 상태 정보
 * @returns {object} 배지 스타일 정보
 */
export const getStatusBadgeStyle = (statusInfo) => {
  if (!statusInfo) return null;

  switch (statusInfo.status) {
    case 'OPEN':
      return {
        backgroundColor: '#10B981', // 초록색
        color: '#FFFFFF',
        text: statusInfo.statusText,
        icon: 'check-circle'};
    
    case 'CLOSING_SOON':
      return {
        backgroundColor: '#F59E0B', // 주황색
        color: '#FFFFFF', 
        text: statusInfo.statusText,
        icon: 'access-time'};
    
    case 'CLOSED':
      return {
        backgroundColor: '#6B7280', // 회색
        color: '#FFFFFF',
        text: statusInfo.statusText,
        icon: 'schedule'};
    
    case 'UNAVAILABLE':
      return {
        backgroundColor: '#EF4444', // 빨간색
        color: '#FFFFFF',
        text: statusInfo.statusText,
        icon: 'block'};
    
    default:
      return null;
  }
};

export default {
  calculateStoreStatus,
  getStatusBadgeStyle,
  getVietnamTime};