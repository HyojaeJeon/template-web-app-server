/**
 * 날짜 관련 유틸리티 함수들
 */

// 날짜 포맷팅 함수
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) {return '';}

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {return '';}

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'HH:mm':
      return `${hours}:${minutes}`;
    case 'YYYY-MM-DD HH:mm':
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    default:
      return dateObj.toISOString();
  }
};

// 상대 시간 계산 (예: "2시간 전")
export const getRelativeTime = (date) => {
  if (!date) {return '';}

  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now - targetDate) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}초 전`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}분 전`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  } else if (diffInSeconds < 604800) {
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
  } else {
    return formatDate(date, 'YYYY-MM-DD');
  }
};

// formatTimeAgo alias (채팅 UI용)
export const formatTimeAgo = getRelativeTime;

// 날짜 범위 체크
export const isDateInRange = (date, startDate, endDate) => {
  const targetDate = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);

  return targetDate >= start && targetDate <= end;
};

// 오늘 날짜 체크
export const isToday = (date) => {
  const today = new Date();
  const targetDate = new Date(date);

  return (
    today.getFullYear() === targetDate.getFullYear() &&
    today.getMonth() === targetDate.getMonth() &&
    today.getDate() === targetDate.getDate()
  );
};

// 내일 날짜 체크
export const isTomorrow = (date) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const targetDate = new Date(date);

  return (
    tomorrow.getFullYear() === targetDate.getFullYear() &&
    tomorrow.getMonth() === targetDate.getMonth() &&
    tomorrow.getDate() === targetDate.getDate()
  );
};

// 배달 예상 시간 계산
export const getEstimatedDeliveryTime = (orderTime, cookingMinutes = 30, deliveryMinutes = 20) => {
  const orderDate = new Date(orderTime);
  const estimatedTime = new Date(orderDate.getTime() + (cookingMinutes + deliveryMinutes) * 60000);

  return estimatedTime;
};

// 영업시간 체크
export const isWithinBusinessHours = (date, openTime = '09:00', closeTime = '22:00') => {
  const targetDate = new Date(date);
  const hours = targetDate.getHours();
  const minutes = targetDate.getMinutes();
  const currentTime = hours * 60 + minutes;

  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);

  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  return currentTime >= openMinutes && currentTime <= closeMinutes;
};
