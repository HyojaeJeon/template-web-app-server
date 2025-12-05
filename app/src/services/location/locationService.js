import { Platform, Linking, PermissionsAndroid } from 'react-native';

class LocationService {
  constructor() {
    // Mock location service for development
  }

  // 강화된 위치 권한 확인
  async checkLocationPermission() {
    console.log('LocationService: 위치 권한 확인 시작');

    try {
      if (Platform.OS === 'android') {
        if (!PermissionsAndroid || !PermissionsAndroid.PERMISSIONS) {
          console.warn('LocationService: PermissionsAndroid를 사용할 수 없음');
          return false;
        }

        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        console.log('LocationService: Android 위치 권한 상태:', granted);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        console.log('LocationService: iOS - 기본 권한 허용');
        // iOS에서는 getCurrentPosition 시 자동 권한 처리
        return true;
      }
    } catch (error) {
      console.error('LocationService: 위치 권한 확인 실패:', error);
      return false;
    }
  }

  // 안전한 위치 권한 요청
  async requestLocationPermission() {
    console.log('LocationService: 위치 권한 요청 시작');

    try {
      if (Platform.OS === 'android') {
        console.log('LocationService: Android 위치 권한 요청');

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '위치 권한',
            message: '앱 서비스를 위해 위치 권한이 필요합니다.',
            buttonNeutral: '나중에 결정',
            buttonNegative: '거부',
            buttonPositive: '허용'},
        );

        console.log('LocationService: Android 권한 요청 결과:', granted);

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('LocationService: 위치 권한 허용됨');
          return true;
        } else {
          console.log('LocationService: 위치 권한 거부됨');
          // 권한 거부 시 안내 알림 (선택사항)
          // this.showPermissionAlert();
          return false;
        }
      } else {
        console.log('LocationService: iOS - 자동 권한 요청');
        // iOS는 getCurrentPosition 호출 시 자동으로 권한 요청
        return true;
      }
    } catch (error) {
      console.error('LocationService: 위치 권한 요청 실패:', error);
      return false;
    }
  }

  // 권한 거부 시 알림 (콜백 방식으로 변경)
  showPermissionAlert(onShowAlert) {
    const alertData = {
      title: '위치 권한이 필요합니다',
      message: '앱 서비스를 위해 위치 권한이 필요합니다.',
      action: {
        text: '설정으로 이동',
        onPress: () => Linking.openSettings()}};

    // UI 콜백이 제공된 경우 호출, 아니면 console.error로 대체
    if (onShowAlert && typeof onShowAlert === 'function') {
      onShowAlert(alertData);
    } else {
      console.error('LocationService: 위치 권한이 거부되었습니다. 설정에서 권한을 허용해주세요.');
    }
  }

  // 완전히 안전한 현재 위치 가져오기 (폴백 포함)
  async getCurrentPosition() {
    console.log('LocationService: getCurrentPosition 호출');

    try {
      // 단계 1: Geolocation API 기본 가용성 확인
      // if (!Geolocation) {
      //   console.error('LocationService: Geolocation API 없음 - 기본 위치 사용');
      //   return this.getDefaultLocation();
      // }
      console.warn('LocationService: Geolocation 서비스 비활성화됨 - 기본 위치 사용');
      return this.getDefaultLocation();

      // 단계 2: 타임아웃이 있는 위치 가져오기 시도
      // const locationPromise = new Promise((resolve, reject) => {
      //   console.log('LocationService: GPS 위치 요청 시작...');

      //   Geolocation.getCurrentPosition(
      //     (position) => {
      //       console.log('LocationService: GPS 성공:', position);

      //       // 위치 데이터 안전성 확인
      //       if (!position?.coords) {
      //         console.error('LocationService: 위치 데이터가 없음');
      //         reject(new Error('위치 데이터 없음'));
      //         return;
      //       }

      //       const { latitude, longitude, accuracy } = position.coords;

      //       // 좌표 유효성 검증
      //       if (!this.isValidCoordinate(latitude, longitude)) {
      //         console.error('LocationService: 잘못된 좌표:', latitude, longitude);
      //         reject(new Error('잘못된 좌표'));
      //         return;
      //       }

      //       const locationData = {
      //         latitude: Number(latitude),
      //         longitude: Number(longitude),
      //         accuracy: Number(accuracy) || 0,
      //         timestamp: position.timestamp || Date.now(),
      //         source: 'gps',
      //       };

      //       console.log('LocationService: 위치 검증 성공:', locationData);
      //       resolve(locationData);
      //     },
      //     (error) => {
      //       console.error('LocationService: GPS 오류:', error);
      //       reject(this.handleLocationError(error));
      //     },
      //     {
      //       enableHighAccuracy: true,
      //       timeout: 10000,  // 10초로 단축
      //       maximumAge: 60000,  // 1분 캐시
      //     }
      //   );
      // });

      // 단계 3: 10초 타임아웃으로 위치 가져오기 시도
      // const timeoutPromise = new Promise((_, reject) => {
      //   setTimeout(() => {
      //     console.warn('LocationService: GPS 타임아웃 - 기본 위치 사용');
      //     reject(new Error('위치 서비스 시간 초과'));
      //   }, 10000);
      // });

      // // GPS 시도, 실패 시 기본 위치 반환
      // try {
      //   const location = await Promise.race([locationPromise, timeoutPromise]);
      //   console.log('LocationService: GPS 위치 성공:', location);
      //   return location;
      // } catch (gpsError) {
      //   console.warn('LocationService: GPS 실패, 기본 위치 사용:', gpsError.message);
      //   return this.getDefaultLocation();
      // }

    } catch (error) {
      console.error('LocationService: 전체 실패, 기본 위치 사용:', error);
      return this.getDefaultLocation();
    }
  }

  // 좌표 유효성 검사
  isValidCoordinate(lat, lng) {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }

  // 기본 위치 반환 (호치민시)
  getDefaultLocation() {
    const defaultLocation = {
      latitude: 10.7759,  // 호치민시 중심부
      longitude: 106.7029,
      accuracy: 1000,
      timestamp: Date.now(),
      source: 'default'};

    console.log('LocationService: 기본 위치 반환:', defaultLocation);
    return defaultLocation;
  }

  // 오프라인 모드 감지 및 캐시된 위치 제공
  async getLastKnownLocation() {
    try {
      // AsyncStorage에서 마지막 알려진 위치 불러오기 시도
      // 현재는 기본 위치로 대체하지만, 향후 AsyncStorage 연동 가능
      console.log('LocationService: 마지막 알려진 위치 요청');

      const lastKnownLocation = {
        latitude: 10.7759,
        longitude: 106.7029,
        accuracy: 1000,
        timestamp: Date.now(),
        source: 'cached'};

      console.log('LocationService: 캐시된 위치 반환:', lastKnownLocation);
      return lastKnownLocation;
    } catch (error) {
      console.error('LocationService: 캐시된 위치 불러오기 실패:', error);
      return this.getDefaultLocation();
    }
  }

  // 위치 서비스 건강성 체크
  async isLocationServiceHealthy() {
    try {
      // 기본적인 Geolocation API 가용성 체크
      // if (!Geolocation) {
      //   return false;
      // }
      console.warn('LocationService: Geolocation 서비스 비활성화됨');
      return false;

      // 빠른 위치 확인 (낮은 정확도, 짧은 타임아웃)
      // return new Promise((resolve) => {
      //   const timeoutId = setTimeout(() => {
      //     console.log('LocationService: 건강성 체크 타임아웃');
      //     resolve(false);
      //   }, 3000);

      //   Geolocation.getCurrentPosition(
      //     (position) => {
      //       clearTimeout(timeoutId);
      //       const isHealthy = position?.coords?.latitude != null &&
      //                        position?.coords?.longitude != null;
      //       console.log('LocationService: 건강성 체크 결과:', isHealthy);
      //       resolve(isHealthy);
      //     },
      //     (error) => {
      //       clearTimeout(timeoutId);
      //       console.log('LocationService: 건강성 체크 실패:', error.code);
      //       resolve(false);
      //     },
      //     {
      //       enableHighAccuracy: false,
      //       timeout: 3000,
      //       maximumAge: 300000,
      //     }
      //   );
      // });
    } catch (error) {
      console.error('LocationService: 건강성 체크 오류:', error);
      return false;
    }
  }

  // 향상된 위치 오류 처리
  handleLocationError(error) {
    console.error('LocationService: 위치 오류 처리:', error);

    let errorMessage = '위치 서비스 오류가 발생했습니다';
    let errorCode = 'UNKNOWN_ERROR';

    if (error && typeof error.code === 'number') {
      switch (error.code) {
        case 1: // PERMISSION_DENIED
          errorMessage = '위치 권한이 거부되었습니다. 설정에서 위치 권한을 허용해주세요.';
          errorCode = 'PERMISSION_DENIED';
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMessage = '현재 위치를 확인할 수 없습니다. GPS가 켜져 있는지 확인해주세요.';
          errorCode = 'POSITION_UNAVAILABLE';
          break;
        case 3: // TIMEOUT
          errorMessage = '위치 확인 시간이 초과되었습니다. 다시 시도해주세요.';
          errorCode = 'TIMEOUT';
          break;
        default:
          errorMessage = `위치 오류 (코드: ${error.code}): ${error.message || '알 수 없는 오류'}`;
          errorCode = `ERROR_CODE_${error.code}`;
      }
    } else if (error && error.message) {
      errorMessage = error.message;
      errorCode = 'CUSTOM_ERROR';
    }

    const customError = new Error(errorMessage);
    customError.code = errorCode;
    customError.originalError = error;

    return customError;
  }

  // 위치 감시 (실시간 추적)
  watchPosition(callback, errorCallback) {
    // if (!Geolocation) {
    //   if (errorCallback) {
    //     errorCallback(new Error('Geolocation is not supported'));
    //   }
    //   return null;
    // }

    console.warn('LocationService: watchPosition 비활성화됨');
    if (errorCallback) {
      errorCallback(new Error('Geolocation service is disabled'));
    }
    return null;

    // const watchId = Geolocation.watchPosition(
    //   (position) => {
    //     const { latitude, longitude } = position.coords;
    //     callback({
    //       latitude,
    //       longitude,
    //       accuracy: position.coords.accuracy,
    //       timestamp: position.timestamp,
    //     });
    //   },
    //   (error) => {
    //     if (errorCallback) {
    //       errorCallback(this.handleLocationError(error));
    //     }
    //   },
    //   {
    //     enableHighAccuracy: true,
    //     timeout: 15000,
    //     maximumAge: 10000,
    //   }
    // );

    // return watchId;
  }

  // 위치 감시 중단
  clearWatch(watchId) {
    // if (Geolocation && watchId !== null) {
    //   Geolocation.clearWatch(watchId);
    // }
    console.warn('LocationService: clearWatch 비활성화됨');
  }

  // 두 좌표 간 거리 계산 (km)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 지구 반지름 (km)
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

}

const locationService = new LocationService();

// 편의 함수들
export const getCurrentPosition = () => locationService.getCurrentPosition();
export const checkLocationPermission = () => locationService.checkLocationPermission();
export const requestLocationPermission = () => locationService.requestLocationPermission();
export const calculateDistance = (lat1, lon1, lat2, lon2) =>
  locationService.calculateDistance(lat1, lon1, lat2, lon2);

export default locationService;
