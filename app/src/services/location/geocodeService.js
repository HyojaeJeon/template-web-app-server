/**
 * Local 지오코딩 서비스
 * OSM Nominatim 기반 주소 검색 및 역지오코딩
 */

import { normalizeNominatimAddress } from '@shared/utils/addressModel';

class GeocodeService {
  constructor() {
    this.baseUrl = 'https://nominatim.openstreetmap.org';
    this.appName = 'VietnamDeliveryApp';
    this.contactEmail = 'support@deliveryvn.com';

    // 요청 취소를 위한 AbortController 관리
    this.activeRequests = new Map();
  }

  /**
   * HTTP 헤더 생성 (OSM 정책 준수)
   */
  getHeaders() {
    return {
      'User-Agent': `${this.appName}/1.0 (${this.contactEmail})`,
      'Accept': 'application/json',
      'Accept-Language': 'vi,ko,en',
      'Referer': 'https://deliveryvn.com'
    };
  }

  /**
   * 요청 취소 및 레이스 컨디션 방지
   */
  cancelPreviousRequest(requestId) {
    if (this.activeRequests.has(requestId)) {
      this.activeRequests.get(requestId).abort();
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * 역지오코딩: 좌표 → 주소
   */
  async reverseGeocode(latitude, longitude) {
    const requestId = `reverse_${latitude}_${longitude}`;
    this.cancelPreviousRequest(requestId);

    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    try {
      const url = `${this.baseUrl}/reverse?` + new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        format: 'json',
        addressdetails: '1',
        extratags: '1',
        namedetails: '1',
        'accept-language': 'vi,ko,en'
      });

      console.log('GeocodeService: 역지오코딩 요청:', { latitude, longitude });

      const response = await fetch(url, {
        headers: this.getHeaders(),
        signal: controller.signal,
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || data.error) {
        throw new Error(data?.error || '주소를 찾을 수 없습니다');
      }

      console.log('GeocodeService: 역지오코딩 성공:', data.display_name);

      return normalizeNominatimAddress(data);

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('GeocodeService: 역지오코딩 요청 취소됨');
        throw new Error('요청이 취소되었습니다');
      }

      console.error('GeocodeService: 역지오코딩 실패:', error);

      // 폴백: 좌표 기반 기본 주소
      return {
        formattedAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        components: {},
        coordinates: { latitude, longitude }
      };

    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * 순방향 지오코딩: 주소 검색
   */
  async searchAddress(query, options = {}) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const requestId = `search_${query}`;
    this.cancelPreviousRequest(requestId);

    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    try {
      const {
        limit = 5,
        countryCode = 'vn',
        viewbox = null // Local 경계: "102.14,8.18,109.46,23.39"
      } = options;

      const searchParams = {
        q: query.trim(),
        format: 'json',
        addressdetails: '1',
        extratags: '1',
        namedetails: '1',
        limit: limit.toString(),
        countrycodes: countryCode,
        'accept-language': 'vi,ko,en'
      };

      if (viewbox) {
        searchParams.viewbox = viewbox;
        searchParams.bounded = '1';
      }

      const url = `${this.baseUrl}/search?` + new URLSearchParams(searchParams);

      console.log('GeocodeService: 주소 검색 요청:', { query, limit });

      const response = await fetch(url, {
        headers: this.getHeaders(),
        signal: controller.signal,
        timeout: 8000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.warn('GeocodeService: 예상과 다른 응답 형식:', data);
        return [];
      }

      console.log(`GeocodeService: 주소 검색 성공: ${data.length}개 결과`);

      return data.map(item => ({
        address: normalizeNominatimAddress(item),
        location: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        },
        importance: item.importance || 0,
        type: item.type,
        category: item.category
      }));

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('GeocodeService: 주소 검색 요청 취소됨');
        return [];
      }

      console.error('GeocodeService: 주소 검색 실패:', error);
      return [];

    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Local 특화 주소 검색
   */
  async searchVietnameseAddress(query, options = {}) {
    const vietnamViewbox = "102.14,8.18,109.46,23.39"; // Local 경계

    return this.searchAddress(query, {
      ...options,
      countryCode: 'vn',
      viewbox: vietnamViewbox
    });
  }

  /**
   * 모든 활성 요청 취소
   */
  cancelAllRequests() {
    this.activeRequests.forEach(controller => controller.abort());
    this.activeRequests.clear();
  }

  /**
   * 디바운스된 검색 (React Hook에서 사용)
   */
  createDebouncedSearch(delay = 300) {
    let timeoutId;

    return (query, options) => {
      clearTimeout(timeoutId);

      return new Promise((resolve) => {
        timeoutId = setTimeout(async () => {
          try {
            const results = await this.searchVietnameseAddress(query, options);
            resolve(results);
          } catch (error) {
            console.error('디바운스된 검색 실패:', error);
            resolve([]);
          }
        }, delay);
      });
    };
  }
}

// 싱글톤 인스턴스
const geocodeService = new GeocodeService();

// 편의 함수들
export const reverseGeocode = (latitude, longitude) =>
  geocodeService.reverseGeocode(latitude, longitude);

export const searchAddress = (query, options) =>
  geocodeService.searchAddress(query, options);

export const searchVietnameseAddress = (query, options) =>
  geocodeService.searchVietnameseAddress(query, options);

export const createDebouncedSearch = (delay) =>
  geocodeService.createDebouncedSearch(delay);

export const cancelAllRequests = () =>
  geocodeService.cancelAllRequests();

export default geocodeService;