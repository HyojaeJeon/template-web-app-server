/**
 * Location Services
 * 위치 관련 모든 서비스 통합 export
 */

// 개별 서비스들
import LocationService from '@services/location/locationService';
import GeocodingService from '@services/location/geocodingService';

// 싱글톤 인스턴스
const locationService = new LocationService();
const geocodingService = new GeocodingService();

// LocationService 메서드들
export const checkLocationPermission = locationService.checkLocationPermission.bind(locationService);
export const requestLocationPermission = locationService.requestLocationPermission.bind(locationService);
export const getCurrentLocation = locationService.getCurrentLocation.bind(locationService);
export const getLastKnownLocation = locationService.getLastKnownLocation.bind(locationService);
export const openLocationSettings = locationService.openLocationSettings.bind(locationService);
export const calculateDistance = locationService.calculateDistance.bind(locationService);
export const formatDistance = locationService.formatDistance.bind(locationService);

// GeocodingService 메서드들
export const searchAddress = geocodingService.searchAddress.bind(geocodingService);
export const searchWithMapbox = geocodingService.searchWithMapbox.bind(geocodingService);
export const searchWithGoogle = geocodingService.searchWithGoogle.bind(geocodingService);
export const reverseGeocode = geocodingService.reverseGeocode.bind(geocodingService);
export const formatAddressForDisplay = geocodingService.formatAddressForDisplay.bind(geocodingService);
export const parseVietnameseAddress = geocodingService.parseVietnameseAddress.bind(geocodingService);

// 기본 export
export default {
  // Location
  checkLocationPermission,
  requestLocationPermission,
  getCurrentLocation,
  getLastKnownLocation,
  openLocationSettings,
  calculateDistance,
  formatDistance,

  // Geocoding
  searchAddress,
  searchWithMapbox,
  searchWithGoogle,
  reverseGeocode,
  formatAddressForDisplay,
  parseVietnameseAddress
};