import { Platform } from 'react-native';

// react-native-device-info는 선택적으로 사용
let DeviceInfo;
try {
  DeviceInfo = require('react-native-device-info');
} catch (e) {
  console.warn('react-native-device-info not installed, using fallback');
  DeviceInfo = null;
}

/**
 * 디바이스 정보 수집 유틸리티
 * FCM 토큰 등록 시 서버에 전송할 디바이스 정보를 수집합니다.
 */

/**
 * 디바이스 정보 수집
 * @returns {Promise<Object>} 디바이스 정보 객체
 */
export const getDeviceInfo = async () => {
  // DeviceInfo가 없으면 기본 정보만 반환
  if (!DeviceInfo) {
    return {
      brand: 'Unknown',
      model: 'Unknown',
      osVersion: `${Platform.OS} ${Platform.Version || 'Unknown'}`,
      appVersion: '1.0.0',
      platform: Platform.OS,
      deviceId: 'dev-' + Date.now(),
      systemName: Platform.OS === 'ios' ? 'iOS' : 'Android',
    };
  }

  try {
    const [
      brand,
      model,
      systemVersion,
      appVersion,
      buildNumber,
      deviceId,
      systemName,
    ] = await Promise.all([
      DeviceInfo.getBrand(),
      DeviceInfo.getModel(),
      DeviceInfo.getSystemVersion(),
      DeviceInfo.getVersion(),
      DeviceInfo.getBuildNumber(),
      DeviceInfo.getUniqueId(),
      DeviceInfo.getSystemName(),
    ]);

    return {
      brand,                          // 제조사 (Samsung, Apple 등)
      model,                          // 모델명 (Galaxy S21, iPhone 14 Pro 등)
      osVersion: `${systemName} ${systemVersion}`,  // OS 버전 (iOS 17.0, Android 14)
      appVersion: `${appVersion} (${buildNumber})`, // 앱 버전 (1.0.0 (100))
      platform: Platform.OS,          // ios, android
      deviceId,                       // 고유 디바이스 ID
      systemName,                     // iOS, Android
    };
  } catch (error) {
    console.error('디바이스 정보 수집 실패:', error);

    // 기본 정보라도 반환
    return {
      brand: 'Unknown',
      model: 'Unknown',
      osVersion: `${Platform.OS} ${Platform.Version || 'Unknown'}`,
      appVersion: '1.0.0',
      platform: Platform.OS,
      deviceId: 'dev-' + Date.now(),
      systemName: Platform.OS === 'ios' ? 'iOS' : 'Android',
    };
  }
};

/**
 * 플랫폼 타입 가져오기
 * GraphQL Enum 값과 일치하도록 대문자로 반환
 * @returns {string} IOS 또는 ANDROID
 */
export const getPlatformType = () => {
  return Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
};

/**
 * 디바이스 언어 설정 가져오기
 * @returns {string} 언어 코드 (vi, en, ko)
 */
export const getDeviceLanguage = () => {
  if (!DeviceInfo || !DeviceInfo.getDeviceLocale) {
    return 'vi'; // 기본값
  }

  try {
    // React Native에서 기본 언어 가져오기
    const locale = Platform.select({
      ios: DeviceInfo.getDeviceLocale?.() || 'vi',
      android: DeviceInfo.getDeviceLocale?.() || 'vi',
    });

    // 언어 코드만 추출 (예: en-US -> en)
    const languageCode = locale?.split('-')[0] || 'vi';

    // 지원하는 언어만 반환 (vi, en, ko)
    const supportedLanguages = ['vi', 'en', 'ko'];
    return supportedLanguages.includes(languageCode) ? languageCode : 'vi';
  } catch (error) {
    console.error('언어 가져오기 실패:', error);
    return 'vi';
  }
};

/**
 * 디바이스 타임존 가져오기
 * @returns {string} 타임존 (예: Asia/Ho_Chi_Minh)
 */
export const getDeviceTimezone = () => {
  if (!DeviceInfo || !DeviceInfo.getTimezone) {
    return 'Asia/Ho_Chi_Minh'; // 기본값
  }

  try {
    const timezone = DeviceInfo.getTimezone?.() || 'Asia/Ho_Chi_Minh';
    return timezone;
  } catch (error) {
    console.error('타임존 가져오기 실패:', error);
    return 'Asia/Ho_Chi_Minh';
  }
};
