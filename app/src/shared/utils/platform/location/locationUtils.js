import logger from '@shared/utils/system/logger';

// 지구 반지름 (km)
const EARTH_RADIUS = 6371;

/**
 * 두 지점 간의 거리를 계산 (Haversine 공식)
 */
export const calculateDistance = (point1, point2) => {
  if (!point1 || !point2 || !point1.latitude || !point1.longitude || !point2.latitude || !point2.longitude) {
    return 0;
  }

  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const deltaLatRad = toRadians(point2.latitude - point1.latitude);
  const deltaLonRad = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
};

/**
 * 각도를 라디안으로 변환
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * 라디안을 각도로 변환
 */
const toDegrees = (radians) => {
  return radians * (180 / Math.PI);
};

/**
 * Local 주소 형식 검증
 */
export const validateVietnameseAddress = (address) => {
  if (!address) {return false;}

  const requiredFields = ['street', 'ward', 'district', 'city'];
  return requiredFields.every(field => address[field] && address[field].trim().length > 0);
};

/**
 * Local 주소를 표준 형식으로 포맷팅
 */
export const formatVietnameseAddress = (address, language = 'vi') => {
  if (!validateVietnameseAddress(address)) {
    return '';
  }

  const { street, ward, district, city } = address;

  // Local어 형식: "Số nhà, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
  if (language === 'vi') {
    return `${street}, ${ward}, ${district}, ${city}`;
  }

  // 영어/한국어 형식: "Street, Ward, District, City"
  return `${street}, ${ward}, ${district}, ${city}`;
};

/**
 * 지점이 다각형 내부에 있는지 확인 (Ray Casting Algorithm)
 */
export const isPointInPolygon = (point, polygon) => {
  if (!point || !polygon || polygon.length < 3) {return false;}

  const { latitude: x, longitude: y } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude;
    const yi = polygon[i].longitude;
    const xj = polygon[j].latitude;
    const yj = polygon[j].longitude;

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
};

/**
 * 지점이 원형 반경 내부에 있는지 확인
 */
export const isPointInRadius = (center, point, radiusKm) => {
  if (!center || !point || !radiusKm) {return false;}

  const distance = calculateDistance(center, point);
  return distance <= radiusKm;
};

/**
 * 배달 가능 지역 확인
 */
export const isDeliveryAvailable = (storeLocation, deliveryAddress, deliveryAreas) => {
  if (!storeLocation || !deliveryAddress) {return false;}

  // 배달 지역이 설정되지 않은 경우 거리만으로 판단
  if (!deliveryAreas || deliveryAreas.length === 0) {
    return true; // 기본적으로 배달 가능
  }

  return deliveryAreas.some(area => {
    switch (area.type) {
      case 'CIRCLE':
        return isPointInRadius(
          { latitude: area.center.lat, longitude: area.center.lng },
          { latitude: deliveryAddress.lat, longitude: deliveryAddress.lng },
          area.radius
        );

      case 'POLYGON':
        return isPointInPolygon(
          { latitude: deliveryAddress.lat, longitude: deliveryAddress.lng },
          area.coordinates.map(coord => ({
            latitude: coord.lat,
            longitude: coord.lng}))
        );

      default:
        return false;
    }
  });
};

/**
 * 배달비 계산 (거리 기반)
 */
export const calculateDeliveryFee = (storeLocation, deliveryAddress, settings) => {
  if (!storeLocation || !deliveryAddress || !settings) {
    return { fee: 0, freeDelivery: false };
  }

  const distance = calculateDistance(
    { latitude: storeLocation.lat, longitude: storeLocation.lng },
    { latitude: deliveryAddress.lat, longitude: deliveryAddress.lng }
  );

  const { baseFee = 0, feePerKm = 0, freeDeliveryThreshold = null, maxDeliveryDistance = 10 } = settings;

  // 최대 배달 거리 초과
  if (distance > maxDeliveryDistance) {
    return { fee: null, freeDelivery: false, exceedsMaxDistance: true };
  }

  // 기본 배달비 + 거리별 추가 요금
  let totalFee = baseFee + (distance * feePerKm);

  // 무료 배달 임계값 확인
  const freeDelivery = freeDeliveryThreshold && totalFee >= freeDeliveryThreshold;

  return {
    fee: freeDelivery ? 0 : Math.round(totalFee),
    freeDelivery,
    distance: Math.round(distance * 10) / 10, // 소수점 1자리
  };
};

/**
 * 예상 배달 시간 계산
 */
export const calculateEstimatedDeliveryTime = (
  storeLocation,
  deliveryAddress,
  basePrepTime = 20,
  averageSpeed = 25 // km/h
) => {
  if (!storeLocation || !deliveryAddress) {
    return basePrepTime;
  }

  const distance = calculateDistance(
    { latitude: storeLocation.lat, longitude: storeLocation.lng },
    { latitude: deliveryAddress.lat, longitude: deliveryAddress.lng }
  );

  // 배달 시간 = 조리 시간 + 이동 시간 (분 단위)
  const deliveryTime = Math.round((distance / averageSpeed) * 60);
  const totalTime = basePrepTime + deliveryTime;

  return Math.max(totalTime, basePrepTime); // 최소 조리 시간은 보장
};

/**
 * 지도 중심점과 줌 레벨 계산
 */
export const calculateMapRegion = (locations, padding = 0.01) => {
  if (!locations || locations.length === 0) {
    return {
      latitude: 10.762622, // 호치민시 중심
      longitude: 106.660172,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05};
  }

  if (locations.length === 1) {
    return {
      latitude: locations[0].latitude,
      longitude: locations[0].longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01};
  }

  const lats = locations.map(loc => loc.latitude);
  const lngs = locations.map(loc => loc.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const latDelta = (maxLat - minLat) + padding;
  const lngDelta = (maxLng - minLng) + padding;

  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: Math.max(latDelta, 0.01),
    longitudeDelta: Math.max(lngDelta, 0.01)};
};

/**
 * Local 시간대로 시간 변환
 */
export const toVietnameseTime = (date = new Date()) => {
  return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
};

/**
 * 영업 시간 내인지 확인
 */
export const isStoreOpen = (openingHours, currentTime = new Date()) => {
  if (!openingHours) {return false;}

  const vietnameseTime = toVietnameseTime(currentTime);
  const currentDay = vietnameseTime.getDay(); // 0 = Sunday, 1 = Monday, ...
  const currentTimeStr = vietnameseTime.toTimeString().slice(0, 5); // HH:MM

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayNames[currentDay];

  const todayHours = openingHours[today];
  if (!todayHours || !todayHours.isOpen) {return false;}

  const { openTime, closeTime } = todayHours;
  if (!openTime || !closeTime) {return false;}

  // 24시간 영업인 경우
  if (openTime === '00:00' && closeTime === '23:59') {return true;}

  return currentTimeStr >= openTime && currentTimeStr <= closeTime;
};

/**
 * GPS 좌표를 주소로 변환 (Reverse Geocoding)
 * Mapbox Geocoding API 사용
 */
export const reverseGeocode = async (latitude, longitude, accessToken) => {
  if (!latitude || !longitude || !accessToken) {
    throw new Error('위도, 경도, 액세스 토큰이 필요합니다');
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${accessToken}&language=vi&country=VN`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error('주소를 찾을 수 없습니다');
    }

    const feature = data.features[0];
    const context = feature.context || [];

    // Local 주소 구조에 맞게 파싱
    const address = {
      formattedAddress: feature.place_name,
      street: feature.text || '',
      ward: context.find(c => c.id.includes('locality'))?.text || '',
      district: context.find(c => c.id.includes('place'))?.text || '',
      city: context.find(c => c.id.includes('region'))?.text || '',
      country: context.find(c => c.id.includes('country'))?.text || 'Vietnam',
      coordinates: {
        latitude,
        longitude}};

    return address;
  } catch (error) {
    logger.error('역지오코딩 실패:', error);
    throw error;
  }
};

/**
 * 주소를 GPS 좌표로 변환 (Forward Geocoding)
 */
export const geocodeAddress = async (address, accessToken) => {
  if (!address || !accessToken) {
    throw new Error('주소와 액세스 토큰이 필요합니다');
  }

  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${accessToken}&country=VN&limit=5`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error('주소를 찾을 수 없습니다');
    }

    return data.features.map(feature => ({
      formattedAddress: feature.place_name,
      coordinates: {
        latitude: feature.center[1],
        longitude: feature.center[0]},
      relevance: feature.relevance || 0}));
  } catch (error) {
    logger.error('지오코딩 실패:', error);
    throw error;
  }
};

export default {
  calculateDistance,
  validateVietnameseAddress,
  formatVietnameseAddress,
  isPointInPolygon,
  isPointInRadius,
  isDeliveryAvailable,
  calculateDeliveryFee,
  calculateEstimatedDeliveryTime,
  calculateMapRegion,
  toVietnameseTime,
  isStoreOpen,
  reverseGeocode,
  geocodeAddress};
