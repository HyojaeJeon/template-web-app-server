// API 설정
export const API_CONFIG = {
  mapbox: {
    // .env 파일의 MAPBOX_ACCESS_TOKEN 사용
    // 현재는 Secret Token (sk.)이 설정되어 있어서 목업 데이터를 사용합니다
    // Public Token (pk.)으로 변경하면 실제 API 호출이 가능합니다
    accessToken:
      'pk.eyJ1IjoiaHlvamFlamVvbiIsImEiOiJjbDNqeDU0Z3kwMTFlM2RsbmZxemo4cDB3In0.vm8Zh9rvgPN6bKs3xr89UQ',
    baseUrl: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
    searchParams: {
      country: 'VN',
      language: 'vi',
      limit: 5,
      types: 'address,poi,place,locality,neighborhood'}},
  google: {
    apiKey: process.env.GOOGLE_PLACES_API_KEY || 'YOUR_GOOGLE_PLACES_API_KEY',
    baseUrl:
      process.env.GOOGLE_PLACES_URL ||
      'https://maps.googleapis.com/maps/api/place'},
  features: {
    useMapboxPrimary: process.env.USE_MAPBOX_PRIMARY !== 'false',
    enableGoogleFallback: process.env.ENABLE_FALLBACK_GOOGLE !== 'false',
    enableLogging: process.env.ENABLE_API_LOGGING === 'true'}};

// Local 주요 도시 좌표
export const VIETNAM_CITIES = {
  'Hồ Chí Minh': [106.6297, 10.8231],
  'Hà Nội': [105.8342, 21.0278],
  'Đà Nẵng': [108.2022, 16.0471],
  'Cần Thơ': [105.7851, 10.0452],
  'Hải Phòng': [106.6881, 20.8648],
  'Nha Trang': [109.1967, 12.2585]};
