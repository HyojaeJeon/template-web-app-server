/**
 * Address Model 통일 유틸리티
 * Local 주소 체계에 맞는 일관된 주소 모델 제공
 */

/**
 * 주소 컴포넌트 타입 정의
 */
export const AddressComponents = {
  street: '',
  ward: '',
  district: '',
  city: '',
  province: '',
  building: '',
  apartment: '',
  landmark: ''
};

/**
 * 통일된 주소 모델 구조
 */
export const createAddressModel = (addressData) => ({
  formattedAddress: addressData?.formattedAddress ||
                   addressData?.display_name ||
                   addressData?.address || '',
  components: {
    street: addressData?.components?.street || addressData?.address?.road || '',
    ward: addressData?.components?.ward ||
          addressData?.address?.suburb ||
          addressData?.address?.quarter || '',
    district: addressData?.components?.district ||
              addressData?.address?.county ||
              addressData?.address?.district || '',
    city: addressData?.components?.city ||
          addressData?.address?.city ||
          addressData?.address?.town ||
          addressData?.address?.village || '',
    province: addressData?.components?.province ||
              addressData?.address?.state ||
              addressData?.address?.province || '',
    building: addressData?.components?.building || '',
    apartment: addressData?.components?.apartment || '',
    landmark: addressData?.components?.landmark || ''
  },
  coordinates: addressData?.coordinates || addressData?.location || null
});

/**
 * OSM Nominatim 응답을 통일된 주소 모델로 변환
 */
export const normalizeNominatimAddress = (data) => {
  if (!data) return null;

  return createAddressModel({
    formattedAddress: data.display_name || '',
    components: {
      street: data.address?.road,
      ward: data.address?.suburb || data.address?.quarter,
      district: data.address?.county || data.address?.district,
      city: data.address?.city || data.address?.town || data.address?.village,
      province: data.address?.state || data.address?.province
    },
    coordinates: data.lat && data.lon ? {
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon)
    } : null
  });
};

/**
 * 자동완성 결과를 통일된 형식으로 변환
 */
export const normalizeAutocompleteResult = (data) => {
  if (!data) return null;

  return {
    address: createAddressModel(data),
    location: data.location || data.coordinates || {
      lat: data.lat || data.latitude,
      lng: data.lng || data.longitude
    }
  };
};

/**
 * 선택된 주소를 일관된 형식으로 생성
 */
export const createSelectedAddress = (coordinate, addressData) => ({
  coordinates: {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude
  },
  address: createAddressModel(addressData),
  timestamp: Date.now()
});

/**
 * 주소 표시용 문자열 추출
 */
export const getDisplayAddress = (addressModel) => {
  if (!addressModel) return '';

  if (typeof addressModel === 'string') {
    return addressModel;
  }

  if (addressModel.formattedAddress) {
    return addressModel.formattedAddress;
  }

  // fallback: 컴포넌트로부터 주소 구성
  const components = addressModel.components || {};
  const parts = [
    components.building,
    components.street,
    components.ward,
    components.district,
    components.city,
    components.province
  ].filter(Boolean);

  return parts.join(', ') || 'Unknown Address';
};

/**
 * 좌표가 유효한지 검증
 */
export const isValidCoordinate = (coordinate) => {
  if (!coordinate) return false;

  const { latitude, longitude } = coordinate;
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Local 좌표 범위 내인지 검증
 */
export const isVietnamCoordinate = (coordinate) => {
  if (!isValidCoordinate(coordinate)) return false;

  const { latitude, longitude } = coordinate;
  // Local 대략적 경계
  return (
    latitude >= 8.0 &&
    latitude <= 24.0 &&
    longitude >= 102.0 &&
    longitude <= 110.0
  );
};

export default {
  createAddressModel,
  normalizeNominatimAddress,
  normalizeAutocompleteResult,
  createSelectedAddress,
  getDisplayAddress,
  isValidCoordinate,
  isVietnamCoordinate
};