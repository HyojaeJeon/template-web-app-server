/**
 * Server Configuration Manager
 * 개발 환경에서 서버 주소를 동적으로 변경할 수 있도록 지원
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { makeVar } from '@apollo/client';

// 서버 환경 타입
export const SERVER_ENV = {
  SIMULATOR: 'simulator',      // iOS 시뮬레이터 / Android 에뮬레이터
  REAL_DEVICE: 'real_device',  // 실제 기기 (로컬 IP 사용)
  PRODUCTION: 'production',    // 프로덕션 서버
  CUSTOM: 'custom',            // 사용자 정의 IP
};

// AsyncStorage 키
const STORAGE_KEY = '@dev_server_config';

// 기본 설정
const DEFAULT_CONFIG = {
  serverEnv: SERVER_ENV.SIMULATOR,
  customIp: '192.168.1.64',  // 기본 로컬 IP
  port: '4000',
};

// Reactive Variable로 현재 설정 관리
export const serverConfigVar = makeVar(DEFAULT_CONFIG);

// 서버 URL 캐시
let cachedServerUrl = null;

/**
 * 서버 URL 가져오기
 */
export const getServerUrl = (config = serverConfigVar()) => {
  const { serverEnv, customIp, port } = config;

  // 프로덕션 환경
  if (!__DEV__ || serverEnv === SERVER_ENV.PRODUCTION) {
    return 'https://api.deliveryvn.com/graphql';
  }

  // 개발 환경
  switch (serverEnv) {
    case SERVER_ENV.SIMULATOR:
      if (Platform.OS === 'ios') {
        return `http://localhost:${port}/graphql`;
      } else {
        return `http://10.0.2.2:${port}/graphql`;
      }

    case SERVER_ENV.REAL_DEVICE:
    case SERVER_ENV.CUSTOM:
      return `http://${customIp}:${port}/graphql`;

    default:
      return `http://localhost:${port}/graphql`;
  }
};

/**
 * WebSocket URL 가져오기 (Socket.IO용)
 */
export const getSocketUrl = (config = serverConfigVar()) => {
  const { serverEnv, customIp, port } = config;

  // 프로덕션 환경
  if (!__DEV__ || serverEnv === SERVER_ENV.PRODUCTION) {
    return 'https://api.deliveryvn.com';
  }

  // 개발 환경
  switch (serverEnv) {
    case SERVER_ENV.SIMULATOR:
      if (Platform.OS === 'ios') {
        return `http://localhost:${port}`;
      } else {
        return `http://10.0.2.2:${port}`;
      }

    case SERVER_ENV.REAL_DEVICE:
    case SERVER_ENV.CUSTOM:
      return `http://${customIp}:${port}`;

    default:
      return `http://localhost:${port}`;
  }
};

/**
 * 설정 저장
 */
export const saveServerConfig = async (config) => {
  try {
    const newConfig = { ...serverConfigVar(), ...config };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    serverConfigVar(newConfig);
    cachedServerUrl = null; // 캐시 무효화
    console.log('🔧 Server config saved:', newConfig);
    return true;
  } catch (error) {
    console.error('Failed to save server config:', error);
    return false;
  }
};

/**
 * 설정 로드 (앱 시작 시 호출)
 */
export const loadServerConfig = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const config = JSON.parse(stored);
      serverConfigVar({ ...DEFAULT_CONFIG, ...config });
      console.log('🔧 Server config loaded:', config);
      return config;
    }
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Failed to load server config:', error);
    return DEFAULT_CONFIG;
  }
};

/**
 * 설정 초기화
 */
export const resetServerConfig = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    serverConfigVar(DEFAULT_CONFIG);
    cachedServerUrl = null;
    console.log('🔧 Server config reset to default');
    return true;
  } catch (error) {
    console.error('Failed to reset server config:', error);
    return false;
  }
};

/**
 * 현재 설정 가져오기
 */
export const getCurrentConfig = () => serverConfigVar();

/**
 * 서버 환경 레이블 가져오기
 */
export const getServerEnvLabel = (env) => {
  switch (env) {
    case SERVER_ENV.SIMULATOR:
      return Platform.OS === 'ios' ? 'iOS Simulator' : 'Android Emulator';
    case SERVER_ENV.REAL_DEVICE:
      return 'Real Device (Local IP)';
    case SERVER_ENV.PRODUCTION:
      return 'Production';
    case SERVER_ENV.CUSTOM:
      return 'Custom IP';
    default:
      return 'Unknown';
  }
};

export default {
  SERVER_ENV,
  getServerUrl,
  getSocketUrl,
  saveServerConfig,
  loadServerConfig,
  resetServerConfig,
  getCurrentConfig,
  getServerEnvLabel,
  serverConfigVar,
};
