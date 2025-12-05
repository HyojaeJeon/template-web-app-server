/**
 * 환경별 설정 유틸리티
 * =====================
 *
 * __DEV__ (React Native) 또는 NODE_ENV에 따라 _DEV 또는 _PROD 접미사가 붙은 환경변수를 자동으로 선택
 */

// 현재 환경 확인
const isProduction = !__DEV__;
const getEnvSuffix = () => isProduction ? '_PROD' : '_DEV';

// 환경별 환경변수 값 가져오기
const getEnvVar = (baseName, defaultValue = '') => {
  const suffix = getEnvSuffix();
  const envValue = process.env[`${baseName}${suffix}`];
  return envValue !== undefined ? envValue : defaultValue;
};

const Config = {
  // API 엔드포인트 (환경변수 기반) - 환경별 URL 사용
  API_BASE_URL: getEnvVar('API_URL', __DEV__ ? 'http://10.0.2.2:6000/graphql' : 'https://api.delivery.vn/graphql'),
  GRAPHQL_ENDPOINT: getEnvVar('API_URL', __DEV__ ? 'http://10.0.2.2:6000/graphql' : 'https://api.delivery.vn/graphql'),
  WEBSOCKET_URL: getEnvVar('WS_URL', __DEV__ ? 'ws://10.0.2.2:6000' : 'wss://api.delivery.vn'),
  REACT_APP_SOCKET_URL: getEnvVar('WS_URL', __DEV__ ? 'http://10.0.2.2:6000' : 'https://api.delivery.vn').replace('ws://', 'http://').replace('wss://', 'https://'),

  // 지도 설정
  MAP: {
    DEFAULT_LATITUDE: 10.7769, // 호치민시 중심
    DEFAULT_LONGITUDE: 106.7009,
    DEFAULT_ZOOM: 13,
    DEFAULT_DELTA: {
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421}},

  // 결제 게이트웨이
  PAYMENT: {
    MOMO: {
      PARTNER_CODE: 'MOMOIQA420180417',
      ACCESS_KEY: 'your_access_key',
      SECRET_KEY: 'your_secret_key'},
    ZALOPAY: {
      APP_ID: 'your_app_id',
      KEY1: 'your_key1',
      KEY2: 'your_key2'},
    VNPAY: {
      TMN_CODE: 'your_tmn_code',
      HASH_SECRET: 'your_hash_secret'}},

  // 배달 설정
  DELIVERY: {
    MIN_ORDER_AMOUNT: 50000, // 최소 주문 금액 (VND)
    BASE_DELIVERY_FEE: 15000, // 기본 배달비 (VND)
    DELIVERY_FEE_PER_KM: 5000, // km당 배달비 (VND)
    MAX_DELIVERY_DISTANCE: 10, // 최대 배달 거리 (km)
  },

  // 앱 설정
  APP: {
    VERSION: '1.0.0',
    BUILD_NUMBER: 1,
    DEFAULT_LANGUAGE: 'vi', // 기본 언어
    SUPPORTED_LANGUAGES: ['vi', 'en', 'ko'],
    CACHE_EXPIRY: 3600000, // 1시간 (밀리초)
  },

  // 소셜 로그인
  SOCIAL: {
    FACEBOOK: {
      APP_ID: 'your_facebook_app_id'},
    GOOGLE: {
      WEB_CLIENT_ID: 'your_google_web_client_id',
      IOS_CLIENT_ID: 'your_google_ios_client_id'},
    ZALO: {
      APP_ID: 'your_zalo_app_id'}},

  // 푸시 알림
  PUSH_NOTIFICATION: {
    FCM_SERVER_KEY: 'your_fcm_server_key'},

  // 이미지 설정
  IMAGE: {
    CLOUDFLARE_URL: 'https://images.delivery.vn',
    DEFAULT_STORE_IMAGE: 'https://images.delivery.vn/default/store.jpg',
    DEFAULT_MENU_IMAGE: 'https://images.delivery.vn/default/menu.jpg',
    DEFAULT_AVATAR: 'https://images.delivery.vn/default/avatar.jpg'},

  // 환경 헬퍼
  ENV: {
    isDevelopment: __DEV__,
    isProduction: !__DEV__,
    suffix: getEnvSuffix(),
  },
};

export default Config;
