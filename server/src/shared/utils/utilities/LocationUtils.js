/**
 * Location, coordinate, and distance calculation utility
 *
 * @description  GPS coordinates, address processing, distance calculation
 * @coordinates  Latitude/Longitude (WGS84)
 * @includes     Distance calculation, address validation, service area checking
 */

// ================================
// Geographic constants
// ================================

// Major city coordinates
const VIETNAM_CITIES = {
  HANOI: { lat: 21.0285, lng: 105.8542, name: 'Hanoi' },
  HCMC: { lat: 10.8231, lng: 106.6297, name: 'Ho Chi Minh City' },
  DANANG: { lat: 16.0544, lng: 108.2022, name: 'Da Nang' },
  HAIPHONG: { lat: 20.8449, lng: 106.6881, name: 'Hai Phong' },
  CANTHO: { lat: 10.0452, lng: 105.7469, name: 'Can Tho' },
};

// VN territory bounds (approximate)
const VIETNAM_BOUNDS = {
  north: 23.3926,
  south: 8.5597,
  east: 109.4646,
  west: 102.1445,
};

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

// ================================
// Coordinate validation
// ================================

/**
 * Validate GPS coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} Validation result
 */
export const validateCoordinates = (lat, lng) => {
  const errors = [];

  // Check number type
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    errors.push('INVALID_TYPE');
  }

  // Check NaN, Infinity
  if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
    errors.push('INVALID_NUMBER');
  }

  // Check latitude range (-90 to 90)
  if (lat < -90 || lat > 90) {
    errors.push('INVALID_LATITUDE');
  }

  // Check longitude range (-180 to 180)
  if (lng < -180 || lng > 180) {
    errors.push('INVALID_LONGITUDE');
  }

  return {
    isValid: errors.length === 0,
    errors,
    coordinates: { lat, lng }
  };
};

/**
 * Check if coordinates are within VN territory
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} Whether within VN territory
 */
export const isWithinVietnam = (lat, lng) => {
  const validation = validateCoordinates(lat, lng);
  if (!validation.isValid) return false;
  
  return (
    lat >= VIETNAM_BOUNDS.south &&
    lat <= VIETNAM_BOUNDS.north &&
    lng >= VIETNAM_BOUNDS.west &&
    lng <= VIETNAM_BOUNDS.east
  );
};

// ================================
// Distance calculation functions
// ================================

/**
 * Calculate straight-line distance between two GPS coordinates (Haversine formula)
 * @param {number} lat1 - First point latitude
 * @param {number} lng1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lng2 - Second point longitude
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  // Validate coordinates
  const validation1 = validateCoordinates(lat1, lng1);
  const validation2 = validateCoordinates(lat2, lng2);

  if (!validation1.isValid || !validation2.isValid) {
    return 0;
  }

  // Same coordinates
  if (lat1 === lat2 && lng1 === lng2) {
    return 0;
  }

  // Convert to radians
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Radian value
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate distance matrix between multiple points
 * @param {Array} points - Coordinate array [{lat, lng}, ...]
 * @returns {Array} Distance matrix (2D array)
 */
export const calculateDistanceMatrix = (points) => {
  if (!Array.isArray(points) || points.length < 2) {
    return [];
  }
  
  const matrix = [];
  
  for (let i = 0; i < points.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < points.length; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        matrix[i][j] = calculateDistance(
          points[i].lat, points[i].lng,
          points[j].lat, points[j].lng
        );
      }
    }
  }
  
  return matrix;
};

// ================================
// Service area management
// ================================

/**
 * Check if location is within circular service area
 * @param {Object} storeLocation - Store location {lat, lng}
 * @param {Object} customerLocation - Customer location {lat, lng}
 * @param {number} radiusKm - Service radius (km)
 * @returns {Object} Service area information
 */
export const isWithinDeliveryRadius = (storeLocation, customerLocation, radiusKm) => {
  const distance = calculateDistance(
    storeLocation.lat, storeLocation.lng,
    customerLocation.lat, customerLocation.lng
  );

  const isWithinRadius = distance <= radiusKm;

  return {
    isWithinRadius,
    distance,
    radius: radiusKm,
    marginKm: radiusKm - distance,
  };
};

/**
 * Check if point is inside polygon service area (Ray Casting algorithm)
 * @param {Object} point - Point to check {lat, lng}
 * @param {Array} polygon - Polygon coordinate array
 * @returns {boolean} Whether point is inside polygon
 */
export const isPointInPolygon = (point, polygon) => {
  if (!polygon || polygon.length < 3) return false;

  const { lat, lng } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;

    if (((yi > lng) !== (yj > lng)) &&
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
};

/**
 * Check combined service areas (circular + polygon)
 * @param {Object} storeLocation - Store location
 * @param {Object} customerLocation - Customer location
 * @param {Object} deliveryZones - Service area settings
 * @returns {Object} Service area information
 */
export const checkDeliveryZones = (storeLocation, customerLocation, deliveryZones) => {
  const results = {
    canDeliver: false,
    matchedZones: [],
    distance: 0,
    reasons: []
  };

  results.distance = calculateDistance(
    storeLocation.lat, storeLocation.lng,
    customerLocation.lat, customerLocation.lng
  );

  // Check circular zone
  if (deliveryZones.circular) {
    const circularCheck = isWithinDeliveryRadius(
      storeLocation,
      customerLocation,
      deliveryZones.circular.radius
    );

    if (circularCheck.isWithinRadius) {
      results.canDeliver = true;
      results.matchedZones.push({
        type: 'circular',
        radius: deliveryZones.circular.radius,
        fee: deliveryZones.circular.fee || 0
      });
    }
  }

  // Check polygon zones
  if (deliveryZones.polygons && Array.isArray(deliveryZones.polygons)) {
    for (const polygon of deliveryZones.polygons) {
      if (isPointInPolygon(customerLocation, polygon.coordinates)) {
        results.canDeliver = true;
        results.matchedZones.push({
          type: 'polygon',
          name: polygon.name,
          fee: polygon.fee || 0
        });
      }
    }
  }

  if (!results.canDeliver) {
    results.reasons.push('OUTSIDE_SERVICE_ZONE');
  }

  return results;
};

// ================================
// 주소 유틸리티
// ================================

/**
 * Local 주소 구성 요소 파싱
 * @param {string} address                            - 전체 주소
 * @returns {Object}                                  파싱된 주소 구성요소
 */
export const parseVietnameseAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return {
      street: '',
      ward: '',
      district: '',
      city: '',
      parsed: false
    };
  }
  
  // Local 주소 구조: [상세주소], [Ward], [District], [City]
  const parts = address.split(',').map(part => part.trim());
  
  if (parts.length >= 4) {
    return {
      street: parts[0],                               // 상세 주소
      ward: parts[1],                                 // Phường/Xã
      district: parts[2],                             // Quận/Huyện
      city: parts[3],                                 // Thành phố/Tỉnh
      parsed: true,
      fullAddress: address
    };
  }
  
  return {
    street: address,
    ward: '',
    district: '',
    city: '',
    parsed: false,
    fullAddress: address
  };
};

/**
 * 주소 정규화 (Local 형식)
 * @param {Object} addressComponents                  - 주소 구성요소
 * @returns {string}                                  정규화된 주소
 */
export const normalizeVietnameseAddress = (addressComponents) => {
  const { street, ward, district, city } = addressComponents;
  
  const parts = [street, ward, district, city]
    .filter(part => part && part.trim())
    .map(part => part.trim());
    
  return parts.join(', ');
};

// ================================
// 근처 장소 검색
// ================================

/**
 * 반경 내 지점 검색
 * @param {Object} centerPoint                        - 중심 좌표 {lat, lng}
 * @param {Array} locations                           - 검색할 장소 배열
 * @param {number} radiusKm                           - 검색 반경 (km)
 * @returns {Array}                                   반경 내 장소 배열 (거리순 정렬)
 */
export const findNearbyLocations = (centerPoint, locations, radiusKm) => {
  if (!locations || !Array.isArray(locations)) {
    return [];
  }
  
  const nearbyLocations = locations
    .map(location => {
      const distance = calculateDistance(
        centerPoint.lat, centerPoint.lng,
        location.lat, location.lng
      );
      
      return {
        ...location,
        distance,
        isNearby: distance <= radiusKm
      };
    })
    .filter(location => location.isNearby)
    .sort((a, b) => a.distance - b.distance);      // 거리순 정렬
    
  return nearbyLocations;
};

/**
 * 가장 가까운 지점 찾기
 * @param {Object} centerPoint                        - 중심 좌표
 * @param {Array} locations                           - 검색할 장소 배열
 * @returns {Object|null}                             가장 가까운 지점
 */
export const findNearestLocation = (centerPoint, locations) => {
  const nearby = findNearbyLocations(centerPoint, locations, Infinity);
  return nearby.length > 0 ? nearby[0] : null;
};

// ================================
// 좌표 변환 유틸리티
// ================================

/**
 * 도분초(DMS)를 십진도(DD)로 변환
 * @param {number} degrees                            - 도
 * @param {number} minutes                            - 분
 * @param {number} seconds                            - 초
 * @param {string} direction                          - 방향 (N, S, E, W)
 * @returns {number}                                  십진도 좌표
 */
export const dmsToDecimal = (degrees, minutes, seconds, direction) => {
  let decimal = degrees + (minutes / 60) + (seconds / 3600);
  
  if (direction === 'S' || direction === 'W') {
    decimal = decimal * -1;
  }
  
  return decimal;
};

/**
 * 십진도(DD)를 도분초(DMS)로 변환
 * @param {number} decimal                            - 십진도 좌표
 * @param {boolean} isLongitude                       - 경도 여부
 * @returns {Object}                                  DMS 형식 좌표
 */
export const decimalToDms = (decimal, isLongitude = false) => {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutes = Math.floor((absolute - degrees) * 60);
  const seconds = Math.round(((absolute - degrees) * 60 - minutes) * 60 * 1000) / 1000;
  
  let direction;
  if (isLongitude) {
    direction = decimal >= 0 ? 'E' : 'W';
  } else {
    direction = decimal >= 0 ? 'N' : 'S';
  }
  
  return { degrees, minutes, seconds, direction };
};

// ================================
// 기본 export
// ================================
export default {
  // 좌표 검증
  validateCoordinates,
  isWithinVietnam,
  
  // 거리 계산
  calculateDistance,
  calculateDistanceMatrix,
  
  // 배달권역
  isWithinDeliveryRadius,
  isPointInPolygon,
  checkDeliveryZones,
  
  // 주소 처리
  parseVietnameseAddress,
  normalizeVietnameseAddress,
  
  // 근처 검색
  findNearbyLocations,
  findNearestLocation,
  
  // 좌표 변환
  dmsToDecimal,
  decimalToDms,
  
  // 상수
  VIETNAM_CITIES,
  VIETNAM_BOUNDS,
  EARTH_RADIUS_KM,
};