/**
 * 거리 계산 유틸리티
 * 호치민시 중심부 기준으로 매장까지의 거리 계산
 */

// 호치민시 중심부 좌표 (벤탄 시장 근처)
const HO_CHI_MINH_CENTER = {
  latitude: 10.7769,
  longitude: 106.7009};

/**
 * 두 좌표간 거리 계산 (Haversine 공식)
 * @param {number} lat1 위도1
 * @param {number} lon1 경도1
 * @param {number} lat2 위도2
 * @param {number} lon2 경도2
 * @returns {number} 거리 (km)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return null;
  }

  const R = 6371; // 지구 반지름 (km)
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // 소수점 1자리로 반올림
};

/**
 * 도를 라디안으로 변환
 * @param {number} degrees 도
 * @returns {number} 라디안
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * 매장까지의 거리 계산
 * @param {object} store 매장 객체
 * @param {object} userLocation 사용자 위치 {latitude, longitude} (선택사항)
 * @returns {number|null} 거리 (km) 또는 null
 */
export const calculateStoreDistance = (store, userLocation = null) => {
  if (!store) return null;

  // store 객체에서 좌표 추출
  let storeLat, storeLon;

  if (store.latitude && store.longitude) {
    storeLat = store.latitude;
    storeLon = store.longitude;
  } else if (store.location?.latitude && store.location?.longitude) {
    storeLat = store.location.latitude;
    storeLon = store.location.longitude;
  } else if (store.coordinates?.latitude && store.coordinates?.longitude) {
    storeLat = store.coordinates.latitude;
    storeLon = store.coordinates.longitude;
  } else {
    return null;
  }

  // 사용자 위치 결정: input으로 받은 위치 또는 호치민 중심부 기본값
  const fromLocation = userLocation && userLocation.latitude && userLocation.longitude 
    ? userLocation 
    : HO_CHI_MINH_CENTER;

  return calculateDistance(
    fromLocation.latitude,
    fromLocation.longitude,
    parseFloat(storeLat),
    parseFloat(storeLon)
  );
};

/**
 * 거리 표시 문자열 생성
 * @param {number} distance 거리 (km)
 * @returns {string} 표시용 문자열
 */
export const formatDistance = (distance) => {
  if (!distance || typeof distance !== 'number') {
    return null;
  }

  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  
  return `${distance.toFixed(1)}km`;
};

/**
 * 배달 소요시간 추정 (거리 기반)
 * @param {number} distance 거리 (km)
 * @returns {number} 예상 소요시간 (분)
 */
export const estimateDeliveryTime = (distance) => {
  if (!distance || typeof distance !== 'number') {
    return 30; // 기본값
  }

  // Local 교통 상황을 고려한 배달 시간 추정
  // 평균 속도: 15km/h (도심 교통체증 고려)
  const baseTime = Math.round((distance / 15) * 60); // 분 단위
  const minTime = Math.max(15, baseTime); // 최소 15분
  const maxTime = minTime + 10; // 범위 ±10분

  return { min: minTime, max: maxTime, average: Math.round((minTime + maxTime) / 2) };
};

/**
 * 배달 가능 여부 판단 (거리 기준)
 * @param {number} distance 거리 (km)
 * @param {number} maxDeliveryDistance 매장 최대 배달 거리 (km)
 * @returns {boolean} 배달 가능 여부
 */
export const isDeliveryAvailable = (distance, maxDeliveryDistance = 10) => {
  if (!distance || typeof distance !== 'number') {
    return true; // 거리 정보가 없으면 배달 가능으로 가정
  }

  return distance <= maxDeliveryDistance;
};

export default {
  calculateStoreDistance,
  formatDistance,
  estimateDeliveryTime,
  isDeliveryAvailable,
  HO_CHI_MINH_CENTER};