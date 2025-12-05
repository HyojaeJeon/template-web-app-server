/**
 * MapView - 매장 위치 표시용 지도 컴포넌트
 * Google Maps SDK 기반으로 매장 마커와 현재 위치 표시
 * CLAUDE.md 가이드라인 준수 및 Local 현지화 적용
 */
import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  HapticFeedback} from 'react-native';
import { useTranslation } from 'react-i18next';
// react-native-maps는 Mock으로 대체됨 (TurboModule 오류 방지)
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Components
import { useToast } from '@providers/ToastProvider';
import { LoadingSpinner } from '@shared/components/ui/feedback/Loading';

// Utils
import { colors } from '@shared/design/tokens';
import { calculateDistance } from '@shared/utils/platform/location/locationUtils';

const StoreMapView = memo(({
  stores = [],
  selectedStore = null,
  onStorePress,
  onLocationChange,
  showUserLocation = true,
  showDeliveryRadius = true,
  style = {},
  className = 'flex-1'}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const mapRef = useRef(null);

  // 상태 관리
  const [userLocation, setUserLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: 10.762622, // 호치민시 중심
    longitude: 106.660172,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05});
  const [locationLoading, setLocationLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // 위치 권한 요청
  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === 'ios') {
      setPermissionGranted(true);
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: t('location.permission.title'),
          message: t('location.permission.message'),
          buttonNeutral: t('common.askMeLater'),
          buttonNegative: t('common.cancel'),
          buttonPositive: t('common.ok')}
      );

      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      setPermissionGranted(isGranted);
      return isGranted;
    } catch (error) {
      console.warn('위치 권한 요청 실패:', error);
      return false;
    }
  }, [t]);

  // 현재 위치 가져오기
  const getCurrentLocation = useCallback(async () => {
    if (!showUserLocation) {return;}

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      showToast('location:permissionDenied', { type: 'warning' });
      return;
    }

    setLocationLoading(true);

    console.warn('getCurrentLocation: Geolocation 서비스 비활성화됨 - 기본 위치 사용');
    
    // 기본 위치 (호치민시 중심) 설정
    const defaultLocation = {
      latitude: 10.762622,
      longitude: 106.660172};
    
    setUserLocation(defaultLocation);
    onLocationChange?.(defaultLocation);
    
    const newRegion = {
      ...defaultLocation,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01};
    
    setRegion(newRegion);
    setLocationLoading(false);
    
  }, [showUserLocation, requestLocationPermission, onLocationChange, showToast, t]);

  // 매장 마커 클릭 핸들러
  const handleStoreMarkerPress = useCallback((store) => {
    if (HapticFeedback) {
      HapticFeedback.selection();
    }
    onStorePress?.(store);
  }, [onStorePress]);

  // 지도 영역 변경 핸들러
  const handleRegionChangeComplete = useCallback((newRegion) => {
    setRegion(newRegion);
  }, []);

  // 현재 위치 버튼 클릭
  const handleMyLocationPress = useCallback(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // 선택된 매장으로 이동
  const focusOnStore = useCallback((store) => {
    if (!store?.address?.lat || !store?.address?.lng) {return;}

    const storeRegion = {
      latitude: store.address.lat,
      longitude: store.address.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01};

    mapRef.current?.animateToRegion(storeRegion, 1000);
  }, []);

  // 매장 마커 컴포넌트
  const StoreMarker = useCallback(({ store }) => {
    const isSelected = selectedStore?.id === store.id;
    const distance = userLocation ?
      calculateDistance(userLocation, {
        latitude: store.address.lat,
        longitude: store.address.lng}) : null;

    return (
      <Marker
        key={store.id}
        coordinate={{
          latitude: store.address.lat,
          longitude: store.address.lng}}
        onPress={() => handleStoreMarkerPress(store)}
        anchor={{ x: 0.5, y: 1 }}
        calloutAnchor={{ x: 0.5, y: 0 }}
      >
        <View
          className={`px-3 py-2 rounded-full items-center justify-center ${
            isSelected ? 'bg-primary-500' : 'bg-white'
          }`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5}}
        >
          <MaterialCommunityIcons
            name="store"
            size={16}
            color={isSelected ? '#FFFFFF' : colors.primary[500]}
          />
          {distance && (
            <Text className={`text-xs font-medium mt-1 ${
              isSelected ? 'text-white' : 'text-gray-700'
            }`}>
              {distance.toFixed(1)}km
            </Text>
          )}
        </View>
      </Marker>
    );
  }, [selectedStore, userLocation, handleStoreMarkerPress]);

  // 컴포넌트 마운트 시 현재 위치 조회
  useEffect(() => {
    if (showUserLocation) {
      getCurrentLocation();
    }
  }, [showUserLocation, getCurrentLocation]);

  // 선택된 매장 변경 시 포커스 이동
  useEffect(() => {
    if (selectedStore) {
      focusOnStore(selectedStore);
    }
  }, [selectedStore, focusOnStore]);

  return (
    <View className={className} style={style}>
      {/* MapView Mock - 실제 앱에서는 react-native-maps 사용 */}
      <View
        style={{
          flex: 1,
          backgroundColor: '#F0F8F5',
          position: 'relative'}}
      >
        {/* Mock 지도 배경 */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.3}}>
          {/* 격자 패턴 */}
          {[...Array(10)].map((_, i) => (
            <View
              key={`h-${i}`}
              style={{
                position: 'absolute',
                top: `${i * 10}%`,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: '#D1D5DB'}}
            />
          ))}
          {[...Array(10)].map((_, i) => (
            <View
              key={`v-${i}`}
              style={{
                position: 'absolute',
                left: `${i * 10}%`,
                top: 0,
                bottom: 0,
                width: 1,
                backgroundColor: '#D1D5DB'}}
            />
          ))}
        </View>

        {/* Mock 매장 마커들 */}
        <View style={{
          position: 'absolute',
          top: '30%',
          left: '20%',
          right: '20%',
          alignItems: 'center'}}>
          {stores.slice(0, 3).map((store, index) => (
            <TouchableOpacity
              key={store.id}
              onPress={() => handleStoreMarkerPress(store)}
              style={{
                position: 'absolute',
                top: index * 60,
                left: `${30 + index * 20}%`,
                backgroundColor: selectedStore?.id === store.id ? colors.primary[500] : '#FFFFFF',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5}}
            >
              <MaterialCommunityIcons
                name="store"
                size={16}
                color={selectedStore?.id === store.id ? '#FFFFFF' : colors.primary[500]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Mock 지도 안내 메시지 */}
        <View style={{
          position: 'absolute',
          top: '50%',
          left: '10%',
          right: '10%',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 16,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3}}>
          <Ionicons
            name="map-outline"
            size={48}
            color={colors.primary[500]}
            style={{ alignSelf: 'center', marginBottom: 12 }}
          />
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#111827',
            textAlign: 'center',
            marginBottom: 8}}>
            지도 Mock 모드
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#6B7280',
            textAlign: 'center',
            lineHeight: 20}}>
            개발 중 TurboModule 오류 방지를 위해{'\n'}
            임시로 Mock 지도를 표시합니다.{'\n'}
            {stores.length}개의 매장이 있습니다.
          </Text>
        </View>
      </View>

      {/* 현재 위치 버튼 */}
      {showUserLocation && (
        <TouchableOpacity
          onPress={handleMyLocationPress}
          disabled={locationLoading}
          className="absolute top-4 right-4 bg-white rounded-full p-3 shadow-lg"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5}}
          accessibilityRole="button"
          accessibilityLabel={t('location.myLocation')}
        >
          {locationLoading ? (
            <LoadingSpinner size="small" />
          ) : (
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={24}
              color={colors.primary[500]}
            />
          )}
        </TouchableOpacity>
      )}

      {/* 지도 범례 */}
      <View className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg">
        <View className="flex-row items-center mb-2">
          <MaterialCommunityIcons
            name="store"
            size={16}
            color={colors.primary[500]}
          />
          <Text className="text-sm text-gray-700 ml-2">
            {t('map.legend.store')}
          </Text>
        </View>

        {userLocation && (
          <View className="flex-row items-center">
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={16}
              color={colors.blue[500]}
            />
            <Text className="text-sm text-gray-700 ml-2">
              {t('map.legend.myLocation')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
});

export default StoreMapView;
