/**
 * 이미지 유틸리티
 * 이미지 압축, 리사이징, 캐싱 전략
 */

import { Dimensions, PixelRatio } from 'react-native';
import logger from '@shared/utils/system/logger';

// 디바이스 정보
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const pixelRatio = PixelRatio.get();

// 이미지 품질 설정
export const IMAGE_QUALITY = {
  LOW: 40,
  MEDIUM: 70,
  HIGH: 90,
  ORIGINAL: 100};

// 이미지 크기 사전 정의
export const IMAGE_SIZES = {
  THUMBNAIL: { width: 150, height: 150 },
  SMALL: { width: 300, height: 200 },
  MEDIUM: { width: 600, height: 400 },
  LARGE: { width: 1200, height: 800 },
  HERO: { width: screenWidth, height: Math.round(screenWidth * 0.6) }};

// Cloudflare Images 변환 옵션
const CLOUDFLARE_TRANSFORMS = {
  quality: (q) => `q_${q}`,
  width: (w) => `w_${w}`,
  height: (h) => `h_${h}`,
  fit: (mode) => `fit_${mode}`, // scale-down, contain, cover, crop, pad
  format: (fmt) => `f_${fmt}`, // auto, webp, avif, jpg, png
  blur: (radius) => `blur_${radius}`,
  sharpen: (amount) => `sharpen_${amount}`,
  brightness: (value) => `brightness_${value}`,
  contrast: (value) => `contrast_${value}`,
  gamma: (value) => `gamma_${value}`};

/**
 * 디바이스 해상도에 따른 최적 이미지 크기 계산
 */
export const getOptimalImageSize = (baseSize, maxSize = null) => {
  const optimalWidth = Math.ceil(baseSize.width * pixelRatio);
  const optimalHeight = Math.ceil(baseSize.height * pixelRatio);

  if (maxSize) {
    return {
      width: Math.min(optimalWidth, maxSize.width),
      height: Math.min(optimalHeight, maxSize.height)};
  }

  return { width: optimalWidth, height: optimalHeight };
};

/**
 * 네트워크 상태에 따른 품질 선택
 */
export const getQualityByNetworkType = (networkType) => {
  switch (networkType) {
    case '2g':
    case 'slow-2g':
      return IMAGE_QUALITY.LOW;
    case '3g':
      return IMAGE_QUALITY.MEDIUM;
    case '4g':
    case '5g':
    case 'wifi':
    default:
      return IMAGE_QUALITY.HIGH;
  }
};

/**
 * Cloudflare Images URL 생성
 */
export const buildCloudflareImageUrl = (baseUrl, options = {}) => {
  if (!baseUrl || !baseUrl.includes('imagedelivery.net')) {
    return baseUrl;
  }

  const {
    width,
    height,
    quality = IMAGE_QUALITY.HIGH,
    fit = 'cover',
    format = 'auto',
    blur,
    sharpen,
    brightness,
    contrast,
    gamma} = options;

  const transforms = [];

  // 필수 변환
  if (width) {transforms.push(CLOUDFLARE_TRANSFORMS.width(width));}
  if (height) {transforms.push(CLOUDFLARE_TRANSFORMS.height(height));}
  transforms.push(CLOUDFLARE_TRANSFORMS.quality(quality));
  transforms.push(CLOUDFLARE_TRANSFORMS.fit(fit));
  transforms.push(CLOUDFLARE_TRANSFORMS.format(format));

  // 선택적 변환
  if (blur) {transforms.push(CLOUDFLARE_TRANSFORMS.blur(blur));}
  if (sharpen) {transforms.push(CLOUDFLARE_TRANSFORMS.sharpen(sharpen));}
  if (brightness) {transforms.push(CLOUDFLARE_TRANSFORMS.brightness(brightness));}
  if (contrast) {transforms.push(CLOUDFLARE_TRANSFORMS.contrast(contrast));}
  if (gamma) {transforms.push(CLOUDFLARE_TRANSFORMS.gamma(gamma));}

  return `${baseUrl}/${transforms.join(',')}`;
};

/**
 * 반응형 이미지 URL 생성
 */
export const generateResponsiveImageUrl = (baseUrl, targetSize, options = {}) => {
  if (!baseUrl) {return null;}

  const optimalSize = getOptimalImageSize(targetSize, options.maxSize);

  // Cloudflare Images 사용 시
  if (baseUrl.includes('imagedelivery.net')) {
    return buildCloudflareImageUrl(baseUrl, {
      width: optimalSize.width,
      height: optimalSize.height,
      quality: options.quality || IMAGE_QUALITY.HIGH,
      fit: options.fit || 'cover',
      format: options.format || 'auto'});
  }

  // 일반 URL에 쿼리 파라미터 추가
  const url = new URL(baseUrl);
  url.searchParams.set('w', optimalSize.width);
  url.searchParams.set('h', optimalSize.height);
  url.searchParams.set('q', options.quality || IMAGE_QUALITY.HIGH);

  return url.toString();
};

/**
 * 이미지 사전로드
 */
export const preloadImage = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const Image = require('react-native').Image;

    Image.prefetch(imageUrl)
      .then(() => resolve(imageUrl))
      .catch(reject);
  });
};

/**
 * 여러 이미지 일괄 사전로드
 */
export const preloadImages = async (imageUrls, options = {}) => {
  const { concurrency = 3, timeout = 5000 } = options;

  const loadWithTimeout = (url) => {
    return Promise.race([
      preloadImage(url),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout: ${url}`)), timeout)
      ),
    ]);
  };

  const results = [];
  for (let i = 0; i < imageUrls.length; i += concurrency) {
    const batch = imageUrls.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(loadWithTimeout)
    );
    results.push(...batchResults);
  }

  return results;
};

/**
 * 이미지 캐시 관리
 */
export class ImageCacheManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100; // MB
    this.maxAge = options.maxAge || 7 * 24 * 60 * 60 * 1000; // 7일
    this.cache = new Map();
  }

  // 캐시 키 생성
  generateKey(url, transformOptions) {
    return `${url}_${JSON.stringify(transformOptions)}`;
  }

  // 캐시에서 이미지 URL 조회
  get(originalUrl, transformOptions = {}) {
    const key = this.generateKey(originalUrl, transformOptions);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      return cached.url;
    }

    return null;
  }

  // 캐시에 이미지 URL 저장
  set(originalUrl, transformedUrl, transformOptions = {}) {
    const key = this.generateKey(originalUrl, transformOptions);

    this.cache.set(key, {
      url: transformedUrl,
      timestamp: Date.now(),
      originalUrl,
      transformOptions});

    // 캐시 크기 관리
    this.cleanupIfNeeded();
  }

  // 만료된 캐시 정리
  cleanup() {
    const now = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }

  // 필요시 캐시 정리
  cleanupIfNeeded() {
    if (this.cache.size > this.maxSize * 10) { // 항목 수 기준
      this.cleanup();
    }
  }

  // 캐시 클리어
  clear() {
    this.cache.clear();
  }

  // 캐시 통계
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      maxAge: this.maxAge,
      oldestEntry: Math.min(...Array.from(this.cache.values()).map(v => v.timestamp))};
  }
}

// 전역 캐시 인스턴스
export const globalImageCache = new ImageCacheManager();

/**
 * 최적화된 이미지 소스 생성
 */
export const createOptimizedImageSource = (
  originalUrl,
  targetSize,
  options = {}
) => {
  if (!originalUrl) {return null;}

  const {
    quality = IMAGE_QUALITY.HIGH,
    format = 'auto',
    fit = 'cover',
    useCache = true,
    networkType = 'wifi'} = options;

  // 네트워크 상태에 따른 품질 조정
  const adjustedQuality = options.quality || getQualityByNetworkType(networkType);

  const transformOptions = {
    ...targetSize,
    quality: adjustedQuality,
    format,
    fit};

  // 캐시 확인
  if (useCache) {
    const cachedUrl = globalImageCache.get(originalUrl, transformOptions);
    if (cachedUrl) {
      return { uri: cachedUrl };
    }
  }

  // 최적화된 URL 생성
  const optimizedUrl = generateResponsiveImageUrl(
    originalUrl,
    targetSize,
    transformOptions
  );

  // 캐시 저장
  if (useCache && optimizedUrl) {
    globalImageCache.set(originalUrl, optimizedUrl, transformOptions);
  }

  return optimizedUrl ? { uri: optimizedUrl } : null;
};

/**
 * 프로그레시브 JPEG 지원 확인
 */
export const supportsProgressiveJPEG = () => {
  // React Native는 기본적으로 프로그레시브 JPEG를 지원
  return true;
};

/**
 * 이미지 메타데이터 추출
 */
export const getImageMetadata = async (imageUrl) => {
  try {
    const Image = require('react-native').Image;

    return new Promise((resolve, reject) => {
      Image.getSize(
        imageUrl,
        (width, height) => resolve({ width, height }),
        reject
      );
    });
  } catch (error) {
    logger.warn('이미지 메타데이터 추출 실패:', error);
    return null;
  }
};

/**
 * 이미지 로드 성능 측정
 */
export const measureImageLoadTime = async (imageUrl) => {
  const startTime = Date.now();

  try {
    await preloadImage(imageUrl);
    return Date.now() - startTime;
  } catch (error) {
    return -1; // 로드 실패
  }
};

// 기본 내보내기
export default {
  IMAGE_QUALITY,
  IMAGE_SIZES,
  getOptimalImageSize,
  getQualityByNetworkType,
  buildCloudflareImageUrl,
  generateResponsiveImageUrl,
  preloadImage,
  preloadImages,
  ImageCacheManager,
  globalImageCache,
  createOptimizedImageSource,
  supportsProgressiveJPEG,
  getImageMetadata,
  measureImageLoadTime};
