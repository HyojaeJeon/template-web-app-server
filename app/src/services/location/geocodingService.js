import { API_CONFIG } from '@config/api';

class GeocodingService {
  constructor() {
    this.mapboxToken = API_CONFIG.mapbox.accessToken;
    this.googleApiKey = API_CONFIG.google.apiKey;
    this.requestCount = { mapbox: 0, google: 0 };
  }

  // Mapbox Geocoding 검색
  searchWithMapbox = async (query, options = {}) => {
    // API 토큰 검증
    if (!this.mapboxToken || this.mapboxToken === 'YOUR_MAPBOX_ACCESS_TOKEN' ||
        this.mapboxToken.includes('DEMO_TOKEN_PLEASE_REPLACE')) {
      console.warn('Mapbox API 토큰이 설정되지 않음');
      return [];
    }

    try {
      const params = new URLSearchParams({
        access_token: this.mapboxToken,
        country: options?.country || API_CONFIG?.mapbox?.searchParams?.country,
        language: options?.language || API_CONFIG?.mapbox?.searchParams?.language,
        limit: options?.limit || API_CONFIG?.mapbox?.searchParams?.limit,
        types: options?.types || API_CONFIG?.mapbox?.searchParams?.types,
        ...options?.proximity && { proximity: `${options.proximity.longitude},${options.proximity.latitude}` },
        ...options?.bbox && { bbox: options.bbox.join(',') }});

      // URL 인코딩 개선 - 숫자와 특수문자 처리
      const encodedQuery = encodeURIComponent(query).replace(/%20/g, '+');
      const url = `${API_CONFIG.mapbox.baseUrl}/${encodedQuery}.json?${params}`;

      if (API_CONFIG?.features?.enableLogging) {
        console.log('Mapbox 검색 요청:', url);
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'},
        timeout: 10000});

      if (!response.ok) {
        console.error(`Mapbox API 오류: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      this.requestCount.mapbox++;

      if (data?.features && data.features.length > 0) {
        return this.formatMapboxResults(data.features);
      }

      return [];

    } catch (error) {
      console.error('Mapbox 검색 실패:', error?.message || error);
      return [];
    }
  }

  // Google Places 검색 (Fallback)
  searchWithGoogle = async (query, options = {}) => {
    // Google API 키가 설정되지 않은 경우 빈 배열 반환
    if (!this.googleApiKey || this.googleApiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      if (API_CONFIG?.features?.enableLogging) {
        console.info('Google Places API 키가 설정되지 않음 - Mapbox만 사용');
      }
      return [];
    }

    try {
      const params = new URLSearchParams({
        key: this.googleApiKey,
        input: query,
        language: options?.language || 'vi',
        components: options?.country || 'country:vn',
        types: 'establishment|geocode',
        ...options?.location && { location: `${options.location.latitude},${options.location.longitude}` },
        ...options?.radius && { radius: options.radius }});

      const url = `${API_CONFIG.google.baseUrl}/autocomplete/json?${params}`;

      if (API_CONFIG?.features?.enableLogging) {
        console.log('Google Places 검색 요청:', url);
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'},
        timeout: 10000});

      if (!response.ok) {
        console.info(`Google Places API 사용 불가: ${response.status} - Mapbox 결과만 사용`);
        return [];
      }

      const data = await response.json();
      this.requestCount.google++;

      if (data?.status !== 'OK') {
        console.info(`Google Places API 상태 오류: ${data?.status} - Mapbox 결과만 사용`);
        return [];
      }

      return this.formatGoogleResults(data?.predictions);

    } catch (error) {
      console.info('Google Places 백업 검색 실패 - Mapbox 결과만 사용:', error?.message || error);
      return [];
    }
  }

  // 통합 검색 (Mapbox 우선, Google 폴백, 최후 목업)
  search = async (query, options = {}) => {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      // 1차: Mapbox 검색
      if (API_CONFIG?.features?.useMapboxPrimary) {
        const mapboxResults = await this.searchWithMapbox(query, options);
        if (mapboxResults && mapboxResults.length > 0) {
          // 거리 계산 및 정렬 적용
          return this.applyDistanceSorting(mapboxResults, options?.proximity);
        }
      }

      // 2차: Google 폴백 (Mapbox 실패 시)
      if (API_CONFIG?.features?.enableGoogleFallback) {
        const googleResults = await this.searchWithGoogle(query, options);
        if (googleResults && googleResults.length > 0) {
          return this.applyDistanceSorting(googleResults, options?.proximity);
        }
      }

      // 3차: 목업 데이터 (모든 API 실패 시)
      console.info('API 검색 실패 - 목업 데이터 사용');
      const mockResults = this.getMockSearchResults(query);
      return this.applyDistanceSorting(mockResults, options?.proximity);

    } catch (error) {
      console.error('통합 검색 실패:', error);

      // 최후 수단: 목업 데이터 사용
      console.info('모든 검색 실패 - 목업 데이터로 대체');
      const mockResults = this.getMockSearchResults(query);
      return this.applyDistanceSorting(mockResults, options?.proximity);
    }
  }

  // 거리 기반 정렬 적용
  applyDistanceSorting = (results, proximity = null) => {
    if (!proximity || !results?.length) {
      return results || [];
    }

    return results.map(result => {
      if (result?.coordinates && result.coordinates.length >= 2) {
        const distance = this.calculateDistance(
          proximity?.latitude,
          proximity?.longitude,
          result.coordinates[1], // lat
          result.coordinates[0]  // lon
        );

        return {
          ...result,
          distance: distance,
          distanceFormatted: distance < 1 ?
            `${Math.round(distance * 1000)}m` :
            `${distance.toFixed(1)}km`};
      }
      return result;
    }).sort((a, b) => {
      // 거리가 있는 경우 거리순 정렬, 없으면 관련도순
      if (a?.distance !== undefined && b?.distance !== undefined) {
        return a.distance - b.distance;
      }
      return (b?.accuracy || 0) - (a?.accuracy || 0);
    });
  }

  // 거리 계산 메서드 (Haversine 공식)
  calculateDistance = (lat1, lon1, lat2, lon2) => {
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

  deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  }

  // 역지오코딩 (좌표 → 주소)
  reverseGeocode = async (latitude, longitude) => {
    try {
      if (!latitude || !longitude) {
        console.warn('역지오코딩: 유효하지 않은 좌표');
        return null;
      }

      const url = `${API_CONFIG.mapbox.baseUrl}/${longitude},${latitude}.json?` +
        `access_token=${this.mapboxToken}&language=vi`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`역지오코딩 오류: ${response.status}`);
      }

      const data = await response.json();
      this.requestCount.mapbox++;

      if (data?.features && data.features.length > 0) {
        const feature = data.features[0];
        return {
          id: feature?.id || 'current',
          name: feature?.place_name || 'Unknown location',
          detail: feature?.place_name || '',
          coordinates: [longitude, latitude],
          type: 'current_location',
          icon: 'my-location'};
      }

      return null;
    } catch (error) {
      console.error('역지오코딩 실패:', error);
      return null;
    }
  }

  // Mapbox 결과 포맷팅
  formatMapboxResults = (features) => {
    if (!Array.isArray(features)) {return [];}

    return features.map((feature, index) => ({
      id: feature?.id || `mapbox_${index}`,
      name: this.extractPlaceName(feature),
      detail: feature?.place_name || '',
      coordinates: feature?.center || [0, 0],
      type: this.getLocationType(feature),
      icon: this.getLocationIcon(feature),
      source: 'mapbox',
      // 추가 메타데이터
      accuracy: feature?.relevance,
      bbox: feature?.bbox,
      properties: feature?.properties}));
  }

  // Google 결과 포맷팅
  formatGoogleResults = (predictions) => {
    if (!Array.isArray(predictions)) {return [];}

    return predictions.map((prediction, index) => ({
      id: prediction?.place_id || `google_${index}`,
      name: prediction?.structured_formatting?.main_text || prediction?.description || 'Unknown',
      detail: prediction?.description || '',
      coordinates: null, // 별도 API 호출 필요
      type: this.getGoogleLocationType(prediction),
      icon: this.getGoogleLocationIcon(prediction),
      source: 'google',
      // 추가 메타데이터
      placeId: prediction?.place_id,
      types: prediction?.types}));
  }

  // 장소명 추출
  extractPlaceName = (feature) => {
    const name = feature?.text || feature?.properties?.name;
    if (name) {return name;}

    // 주소에서 첫 번째 부분 추출
    const parts = feature?.place_name?.split(',') || [''];
    return parts[0]?.trim() || 'Unknown';
  }

  // 위치 타입 결정
  getLocationType = (feature) => {
    const types = feature?.place_type || [];
    if (types.includes('poi')) {return 'poi';}
    if (types.includes('address')) {return 'address';}
    if (types.includes('place')) {return 'place';}
    return 'location';
  }

  getGoogleLocationType = (prediction) => {
    const types = prediction?.types || [];
    if (types.includes('establishment')) {return 'poi';}
    if (types.includes('street_address')) {return 'address';}
    if (types.includes('locality')) {return 'place';}
    return 'location';
  }

  // 아이콘 결정
  getLocationIcon = (feature) => {
    const type = this.getLocationType(feature);
    const category = feature?.properties?.category;

    if (category?.includes('store')) {return 'store';}
    if (category?.includes('shop')) {return 'store';}
    if (type === 'poi') {return 'place';}
    if (type === 'address') {return 'location-on';}
    return 'place';
  }

  getGoogleLocationIcon = (prediction) => {
    const types = prediction?.types || [];
    if (types.includes('store') || types.includes('food')) {return 'store';}
    if (types.includes('store') || types.includes('shopping_mall')) {return 'store';}
    if (types.includes('establishment')) {return 'business';}
    return 'location-on';
  }

  // 향상된 목업 검색 결과 - Local 실제 주소 체계 반영
  getMockSearchResults = (query) => {
    const mockData = [
      // 호치민시 주요 구역
      {
        id: 'mock_1',
        name: 'Quận 1 (1구)',
        detail: 'Quận 1, Thành phố Hồ Chí Minh, Việt Nam',
        coordinates: [106.7008, 10.7718],
        type: 'district',
        icon: 'location-city',
        source: 'mock',
        accuracy: 0.95},
      {
        id: 'mock_1b',
        name: 'Quận 3 (3구)',
        detail: 'Quận 3, Thành phố Hồ Chí Minh, Việt Nam',
        coordinates: [106.6879, 10.7756],
        type: 'district',
        icon: 'location-city',
        source: 'mock',
        accuracy: 0.94},
      {
        id: 'mock_1c',
        name: 'Quận 7 (7구)',
        detail: 'Quận 7, Thành phố Hồ Chí Minh, Việt Nam',
        coordinates: [106.7206, 10.7378],
        type: 'district',
        icon: 'location-city',
        source: 'mock',
        accuracy: 0.93},
      // 유명 관광지/랜드마크
      {
        id: 'mock_2',
        name: 'Chợ Bến Thành (벤탄 시장)',
        detail: 'Chợ Bến Thành, Phường Bến Thành, Quận 1, TP.HCM',
        coordinates: [106.6981, 10.7729],
        type: 'landmark',
        icon: 'place',
        source: 'mock',
        accuracy: 0.98},
      {
        id: 'mock_2b',
        name: 'Dinh Độc Lập (통일궁)',
        detail: 'Dinh Độc Lập, Phường Bến Thành, Quận 1, TP.HCM',
        coordinates: [106.6958, 10.7769],
        type: 'landmark',
        icon: 'account-balance',
        source: 'mock',
        accuracy: 0.97},
      {
        id: 'mock_2c',
        name: 'Nhà thờ Đức Bà (성당)',
        detail: 'Nhà thờ Đức Bà Sài Gòn, Quận 1, TP.HCM',
        coordinates: [106.6990, 10.7797],
        type: 'landmark',
        icon: 'church',
        source: 'mock',
        accuracy: 0.96},
      // 쇼핑몰/비즈니스 센터
      {
        id: 'mock_3',
        name: 'Saigon Centre (사이공센터)',
        detail: 'Saigon Centre, 65 Lê Lợi, Quận 1, TP.HCM',
        coordinates: [106.7025, 10.7718],
        type: 'shopping_mall',
        icon: 'shopping-bag',
        source: 'mock',
        accuracy: 0.95},
      {
        id: 'mock_3b',
        name: 'Vincom Đồng Khởi',
        detail: 'Vincom Center, 72 Lê Thánh Tôn, Quận 1, TP.HCM',
        coordinates: [106.7033, 10.7751],
        type: 'shopping_mall',
        icon: 'shopping-bag',
        source: 'mock',
        accuracy: 0.94},
      {
        id: 'mock_3c',
        name: 'Bitexco Financial Tower',
        detail: 'Bitexco Financial Tower, 2 Hải Triều, Quận 1, TP.HCM',
        coordinates: [106.7054, 10.7718],
        type: 'building',
        icon: 'business',
        source: 'mock',
        accuracy: 0.93},
      // 주요 거리 및 정확한 주소 (Local 주소 체계)
      {
        id: 'mock_4',
        name: '123 Nguyễn Huệ',
        detail: '123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
        coordinates: [106.7017, 10.7757],
        type: 'address',
        icon: 'location-on',
        source: 'mock',
        accuracy: 0.98},
      {
        id: 'mock_5',
        name: '456 Lê Thánh Tôn',
        detail: '456 Đường Lê Thánh Tôn, Phường Bến Nghé, Quận 1, TP.HCM',
        coordinates: [106.6995, 10.7745],
        type: 'address',
        icon: 'location-on',
        source: 'mock',
        accuracy: 0.97},
      {
        id: 'mock_6',
        name: '789 Đồng Khởi',
        detail: '789 Đường Đồng Khởi, Phường Bến Nghé, Quận 1, TP.HCM',
        coordinates: [106.7033, 10.7791],
        type: 'address',
        icon: 'location-on',
        source: 'mock',
        accuracy: 0.96},
      // 주요 Ward (Phường) - Local 행정구역
      {
        id: 'mock_7',
        name: 'Phường Bến Nghé',
        detail: 'Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
        coordinates: [106.7017, 10.7740],
        type: 'ward',
        icon: 'location-city',
        source: 'mock',
        accuracy: 0.92},
      {
        id: 'mock_8',
        name: 'Phường Đa Kao',
        detail: 'Phường Đa Kao, Quận 1, Thành phố Hồ Chí Minh',
        coordinates: [106.6979, 10.7896],
        type: 'ward',
        icon: 'location-city',
        source: 'mock',
        accuracy: 0.91},
      // 장소 (App 특화)
      {
        id: 'mock_9',
        name: 'Phở Hòa Pasteur',
        detail: '260C Pasteur, Phường 8, Quận 3, TP.HCM',
        coordinates: [106.6879, 10.7756],
        type: 'store',
        icon: 'store',
        source: 'mock',
        accuracy: 0.95},
      {
        id: 'mock_10',
        name: 'Bún Bò Huế Đông Ba',
        detail: '12 Trần Cao Vân, Phường Đa Kao, Quận 1, TP.HCM',
        coordinates: [106.6990, 10.7869],
        type: 'store',
        icon: 'store',
        source: 'mock',
        accuracy: 0.94},
      // 호텔/숙박
      {
        id: 'mock_11',
        name: 'Hotel Continental Saigon',
        detail: '132-134 Đồng Khởi, Phường Bến Nghé, Quận 1, TP.HCM',
        coordinates: [106.7025, 10.7763],
        type: 'hotel',
        icon: 'hotel',
        source: 'mock',
        accuracy: 0.93},
      // 대학교/학교
      {
        id: 'mock_12',
        name: 'Đại học Bách Khoa TP.HCM',
        detail: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM',
        coordinates: [106.6588, 10.7723],
        type: 'university',
        icon: 'school',
        source: 'mock',
        accuracy: 0.92},
    ];

    // 향상된 검색 로직 - Local 주소 체계 및 다국어 지원
    const searchTerm = query.toLowerCase().trim();

    const filtered = mockData.filter(item => {
      const itemName = item.name.toLowerCase();
      const itemDetail = item.detail.toLowerCase();

      // 1. 정확한 매칭 (최우선)
      if (itemName.includes(searchTerm) || itemDetail.includes(searchTerm)) {
        return true;
      }

      // 2. 숫자가 포함된 주소 검색 (Local 주소 번호체계)
      if (/\d/.test(searchTerm)) {
        const numbers = searchTerm.match(/\d+/g);
        if (numbers) {
          return numbers.some(num =>
            itemName.includes(num) || itemDetail.includes(num)
          );
        }
      }

      // 3. Local 행정구역 검색 지원
      const vietnameseTerms = {
        'quan': 'quận',
        'phuong': 'phường',
        'duong': 'đường',
        'tp': 'thành phố',
        'hcm': 'hồ chí minh',
        'saigon': 'sài gòn'};

      let normalizedSearch = searchTerm;
      Object.keys(vietnameseTerms).forEach(key => {
        if (normalizedSearch.includes(key)) {
          normalizedSearch = normalizedSearch.replace(key, vietnameseTerms[key]);
        }
      });

      if (itemName.includes(normalizedSearch) || itemDetail.includes(normalizedSearch)) {
        return true;
      }

      // 4. 부분 단어 매칭 (개선된 알고리즘)
      const searchWords = searchTerm.split(' ');
      return searchWords.some(word => {
        if (word.length < 2) {return false;}

        // Local어 특수문자 정규화
        const normalizedWord = this.normalizeVietnameseText(word);
        const normalizedName = this.normalizeVietnameseText(itemName);
        const normalizedDetail = this.normalizeVietnameseText(itemDetail);

        return normalizedName.includes(normalizedWord) ||
               normalizedDetail.includes(normalizedWord);
      });
    });

    // 정확도 기반 정렬
    const sortedResults = filtered.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(searchTerm, a);
      const bScore = this.calculateRelevanceScore(searchTerm, b);
      return bScore - aScore;
    });

    // 검색 결과가 없는 경우 관련성 높은 기본 결과 제공
    if (sortedResults.length === 0) {
      // 숫자가 포함된 경우 주소 우선
      if (/\d/.test(searchTerm)) {
        return mockData.filter(item => item.type === 'address').slice(0, 5);
      }
      // 일반 검색의 경우 인기 지역 우선
      return mockData.filter(item =>
        ['district', 'landmark', 'shopping_mall'].includes(item.type)
      ).slice(0, 5);
    }

    return sortedResults.slice(0, 8); // 최대 8개 결과 반환
  }

  // 검색 관련도 점수 계산
  calculateRelevanceScore = (query, item) => {
    const queryLower = query.toLowerCase();
    const nameLower = item.name.toLowerCase();
    const detailLower = item.detail.toLowerCase();

    let score = item.accuracy || 0;

    // 이름에서 정확히 시작하는 경우 높은 점수
    if (nameLower.startsWith(queryLower)) {score += 0.5;}

    // 이름에 포함된 경우
    if (nameLower.includes(queryLower)) {score += 0.3;}

    // 상세 주소에 포함된 경우
    if (detailLower.includes(queryLower)) {score += 0.2;}

    // 숫자 매칭 보너스
    if (/\d/.test(queryLower)) {
      const numbers = queryLower.match(/\d+/g);
      if (numbers) {
        numbers.forEach(num => {
          if (nameLower.includes(num) || detailLower.includes(num)) {
            score += 0.4;
          }
        });
      }
    }

    return score;
  }

  // Local어 텍스트 정규화 (악센트 제거)
  normalizeVietnameseText = (text) => {
    const accentsMap = {
      'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
      'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
      'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
      'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
      'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
      'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
      'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
      'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
      'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
      'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
      'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
      'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
      'đ': 'd'};

    return text.toLowerCase().split('').map(char => accentsMap[char] || char).join('');
  }

  // API 사용량 조회
  getUsageStats = () => {
    return {
      mapbox: this.requestCount?.mapbox || 0,
      google: this.requestCount?.google || 0,
      total: (this.requestCount?.mapbox || 0) + (this.requestCount?.google || 0)};
  }

  // 사용량 리셋
  resetUsageStats = () => {
    this.requestCount = { mapbox: 0, google: 0 };
  }
}

export default new GeocodingService();
