/**
 * 앱 환경 설정
 * .env 파일의 환경변수를 읽어옵니다
 */

// React Native는 REACT_APP_ 프리픽스가 없어도 process.env로 접근 가능
export const CUSTOMER_CENTER = {
  phone: process.env.CUSTOMER_CENTER_PHONE || '1588-0000',
  email: process.env.CUSTOMER_CENTER_EMAIL || 'support@deliveryvn.com',
  zalo: process.env.CUSTOMER_CENTER_ZALO || 'https://zalo.me/deliveryvn'
};

export const API_CONFIG = {
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://10.0.2.2:4000',
  graphqlEndpoint: process.env.REACT_APP_GRAPHQL_ENDPOINT || 'http://10.0.2.2:4000/graphql',
  socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://10.0.2.2:4000'
};

export const APP_CONFIG = {
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
};
