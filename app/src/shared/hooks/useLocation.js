/**
 * Apollo 기반 위치 관리 Hook
 * locationSlice를 대체하여 위치 기능을 제공
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import Geolocation from 'react-native-geolocation-service';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { M_GET_SAVED_ADDRESSES, M_GET_DELIVERY_ZONES } from '@gql/queries/location';
import { M_CREATE_ADDRESS, M_UPDATE_ADDRESS, M_DELETE_ADDRESS } from '@gql/mutations/location';

/**
 * 위치 관리 Hook
 * @param {Object} options - Hook 옵션
 */
export const useLocation = (options = {}) => {
  const {
    watchLocation = false,
    highAccuracy = true,
    timeout = 15000,
    maximumAge = 60000,
    distanceFilter = 10
  } = options;

  // 로컬 상태 관리
  const [currentLocation, setCurrentLocation] = useState({
    coordinates: null,
    accuracy: null,
    timestamp: null,
    loading: false,
    error: null
  });

  const [permission, setPermission] = useState({
    status: 'not-determined', // 'granted', 'denied', 'not-determined'
    requestInProgress: false
  });

  const [map, setMap] = useState({
    region: {
      latitude: 10.8231, // Default to Ho Chi Minh City
      longitude: 106.6297,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05
    },
    mapType: 'standard',
    selectedLocation: null,
    markers: [],
    isLocationPickerMode: false
  });

  const [deliveryAvailability, setDeliveryAvailability] = useState({
    isAvailable: null,
    checking: false,
    distance: null,
    estimatedTime: null,
    fee: null,
    error: null
  });

  // Refs
  const watchIdRef = useRef(null);
  const isWatchingRef = useRef(false);

  // GraphQL 쿼리들
  const {
    data: addressesData,
    loading: addressesLoading,
    error: addressesError,
    refetch: refetchAddresses
  } = useQuery(M_GET_SAVED_ADDRESSES, {
    errorPolicy: 'partial',
    fetchPolicy: 'cache-first'
  });

  const {
    data: deliveryZonesData,
    loading: deliveryZonesLoading
  } = useQuery(M_GET_DELIVERY_ZONES, {
    errorPolicy: 'ignore',
    fetchPolicy: 'cache-first'
  });

  // GraphQL 뮤테이션들
  const [saveAddressMutation] = useMutation(M_CREATE_ADDRESS, {
    refetchQueries: [{ query: M_GET_SAVED_ADDRESSES }]
  });

  const [updateAddressMutation] = useMutation(M_UPDATE_ADDRESS, {
    refetchQueries: [{ query: M_GET_SAVED_ADDRESSES }]
  });

  const [deleteAddressMutation] = useMutation(M_DELETE_ADDRESS, {
    refetchQueries: [{ query: M_GET_SAVED_ADDRESSES }]
  });

  // 권한 요청
  const requestLocationPermission = useCallback(async () => {
    try {
      setPermission(prev => ({ ...prev, requestInProgress: true }));

      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await request(permission);

      let status;
      switch (result) {
        case RESULTS.GRANTED:
          status = 'granted';
          break;
        case RESULTS.DENIED:
        case RESULTS.BLOCKED:
          status = 'denied';
          break;
        default:
          status = 'not-determined';
      }

      setPermission({ status, requestInProgress: false });
      return status === 'granted';
    } catch (error) {
      console.error('위치 권한 요청 오류:', error);
      setPermission({ status: 'denied', requestInProgress: false });
      return false;
    }
  }, []);

  // 현재 위치 가져오기
  const getCurrentLocation = useCallback(async () => {
    return new Promise((resolve, reject) => {
      setCurrentLocation(prev => ({ ...prev, loading: true, error: null }));

      Geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            },
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            loading: false,
            error: null
          };

          setCurrentLocation(locationData);

          // 지도 영역 업데이트
          setMap(prev => ({
            ...prev,
            region: {
              ...prev.region,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          }));

          resolve(locationData);
        },
        (error) => {
          const errorMessage = `위치 정보를 가져올 수 없습니다: ${error.message}`;
          setCurrentLocation(prev => ({
            ...prev,
            loading: false,
            error: errorMessage
          }));
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout,
          maximumAge
        }
      );
    });
  }, [highAccuracy, timeout, maximumAge]);

  // 위치 감시 시작
  const startWatchingLocation = useCallback(() => {
    if (isWatchingRef.current) return;

    const watchId = Geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          loading: false,
          error: null
        });
      },
      (error) => {
        setCurrentLocation(prev => ({
          ...prev,
          error: `위치 감시 오류: ${error.message}`
        }));
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout,
        maximumAge,
        distanceFilter
      }
    );

    watchIdRef.current = watchId;
    isWatchingRef.current = true;
  }, [highAccuracy, timeout, maximumAge, distanceFilter]);

  // 위치 감시 중지
  const stopWatchingLocation = useCallback(() => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      isWatchingRef.current = false;
    }
  }, []);

  // 배송 가능 여부 확인
  const checkDeliveryAvailability = useCallback(async (coordinates) => {
    if (!coordinates) return;

    setDeliveryAvailability(prev => ({ ...prev, checking: true, error: null }));

    try {
      // TODO: GraphQL 쿼리로 배송 가능 여부 확인
      // const result = await checkDeliveryZone(coordinates);

      // 임시 구현
      const mockResult = {
        isAvailable: true,
        distance: 2.5,
        estimatedTime: 25,
        fee: 15000
      };

      setDeliveryAvailability({
        ...mockResult,
        checking: false,
        error: null
      });
    } catch (error) {
      setDeliveryAvailability(prev => ({
        ...prev,
        checking: false,
        error: error.message
      }));
    }
  }, []);

  // 주소 관리
  const saveAddress = useCallback(async (addressData) => {
    try {
      const result = await saveAddressMutation({
        variables: { input: addressData }
      });
      return result.data.mSaveAddress;
    } catch (error) {
      console.error('주소 저장 오류:', error);
      throw error;
    }
  }, [saveAddressMutation]);

  const updateAddress = useCallback(async (addressId, addressData) => {
    try {
      const result = await updateAddressMutation({
        variables: { id: addressId, input: addressData }
      });
      return result.data.mUpdateAddress;
    } catch (error) {
      console.error('주소 수정 오류:', error);
      throw error;
    }
  }, [updateAddressMutation]);

  const deleteAddress = useCallback(async (addressId) => {
    try {
      const result = await deleteAddressMutation({
        variables: { id: addressId }
      });
      return result.data.mDeleteAddress;
    } catch (error) {
      console.error('주소 삭제 오류:', error);
      throw error;
    }
  }, [deleteAddressMutation]);

  // 지도 관련 함수들
  const setMapRegion = useCallback((region) => {
    setMap(prev => ({ ...prev, region }));
  }, []);

  const setSelectedLocation = useCallback((location) => {
    setMap(prev => ({ ...prev, selectedLocation: location }));
  }, []);

  const setLocationPickerMode = useCallback((enabled) => {
    setMap(prev => ({ ...prev, isLocationPickerMode: enabled }));
  }, []);

  const addMapMarker = useCallback((marker) => {
    setMap(prev => ({
      ...prev,
      markers: [...prev.markers, marker]
    }));
  }, []);

  const clearMapMarkers = useCallback(() => {
    setMap(prev => ({ ...prev, markers: [] }));
  }, []);

  // 설정 앱 열기
  const openLocationSettings = useCallback(() => {
    Alert.alert(
      '위치 권한 필요',
      '설정에서 위치 권한을 허용해주세요.',
      [
        { text: '취소', style: 'cancel' },
        { text: '설정으로 이동', onPress: () => Linking.openSettings() }
      ]
    );
  }, []);

  // 자동 위치 감시 시작/중지
  useEffect(() => {
    if (watchLocation && permission.status === 'granted') {
      startWatchingLocation();
    }

    return () => {
      if (watchLocation) {
        stopWatchingLocation();
      }
    };
  }, [watchLocation, permission.status, startWatchingLocation, stopWatchingLocation]);

  // 현재 위치가 변경될 때 배송 가능 여부 확인
  useEffect(() => {
    if (currentLocation.coordinates) {
      checkDeliveryAvailability(currentLocation.coordinates);
    }
  }, [currentLocation.coordinates, checkDeliveryAvailability]);

  // 메모이제이션된 데이터
  const addresses = addressesData?.mGetUserAddresses || [];
  const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0] || null;
  const deliveryZones = deliveryZonesData?.mGetDeliveryZones || [];

  return {
    // 현재 위치
    currentLocation,
    hasLocation: !!currentLocation.coordinates,

    // 권한
    permission,

    // 주소 관리
    addresses,
    defaultAddress,
    addressesLoading,
    addressesError,

    // 배송 정보
    deliveryZones,
    deliveryAvailability,
    deliveryZonesLoading,

    // 지도
    map,
    isWatching: isWatchingRef.current,

    // 액션 함수들
    requestLocationPermission,
    getCurrentLocation,
    startWatchingLocation,
    stopWatchingLocation,
    checkDeliveryAvailability,
    openLocationSettings,

    // 주소 관리 함수들
    saveAddress,
    updateAddress,
    deleteAddress,
    refetchAddresses,

    // 지도 관련 함수들
    setMapRegion,
    setSelectedLocation,
    setLocationPickerMode,
    addMapMarker,
    clearMapMarkers,

    // 유틸리티
    hasPermission: permission.status === 'granted',
    isLocationLoading: currentLocation.loading || permission.requestInProgress
  };
};

export default useLocation;