/**
 * Cloudflare Images 유틸리티 클래스                                                                     // Y축 정렬된 한국어 주석
 * 
 * @description
 * Cloudflare Images API를 위한 완전한 Node.js 클라이언트 라이브러리                                      // 통합된 이미지 관리 시스템
 * 이미지 업로드, 관리, 변형, 배치 처리 등 모든 기능을 지원합니다.                                      // 모든 이미지 처리 기능 포함
 * 
 * @features
 * - 다양한 업로드 방식 (파일, URL, Base64, Direct Upload)                                             // 유연한 업로드 방법 지원
 * - 이미지 변형 (Variants) 관리                                                                       // 다양한 크기 변형 관리
 * - 배치 업로드 (속도 제한 우회)                                                                     // 대량 업로드 최적화
 * - 유연한 변형 (Flexible Variants)                                                                  // 동적 이미지 변형
 * - 다국어 메시지 지원 (한국어, 영어, Local어)                                                       // 국제화 지원
 * 
 * @author Delivery VN Team
 * @version 2.0.0
 * @license MIT
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { createReadStream } from 'fs';
import dotenv from 'dotenv';

// 환경 변수 로드                                                                                        // 설정 파일 불러오기
dotenv.config();

// ========================================
// Cloudflare API 설정                                                                                  // API 인증 정보 설정
// ========================================
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;                                       // 계정 ID
const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_API_KEY;                                            // Global API Key
const CLOUDFLARE_EMAIL = process.env.CLOUDFLARE_EMAIL;                                                // 이메일 주소
const CLOUDFLARE_IMAGE_KEY = process.env.CLOUDFLARE_IMAGE_KEY || process.env.CLOUDFLARE_API_KEY;       // 이미지 전용 키
const CLOUDFLARE_ACCOUNT_HASH = process.env.CLOUDFLARE_ACCOUNT_HASH;                                  // 계정 해시
const CLOUDFLARE_IMAGE_URL = process.env.CLOUDFLARE_IMAGE_URL;                                        // 이미지 베이스 URL

// API 엔드포인트 URL                                                                                   // 서비스 엔드포인트 정의
const API_BASE_URL = 'https://api.cloudflare.com/client/v4';                                          // 메인 API 서버
const BATCH_API_URL = 'https://batch.imagedelivery.net';                                             // 배치 업로드 서버
const UPLOAD_API_URL = 'https://upload.imagedelivery.net';                                           // 직접 업로드 서버

/**
 * 다국어 메시지 객체                                                                                    // 국제화 메시지 관리
 */
const messages = {
  ko: {
    warning: {
      apiKeyNotSet: '⚠️  Cloudflare API 키가 설정되지 않았습니다. 환경 변수를 확인하세요.',
      invalidImageFormat: '지원하지 않는 이미지 형식입니다',
      fileTooLarge: '파일 크기가 너무 큽니다',
      uploadFailed: '이미지 업로드에 실패했습니다'
    },
    success: {
      uploadComplete: '이미지 업로드가 완료되었습니다',
      deleteComplete: '이미지 삭제가 완료되었습니다'
    }
  },
  en: {
    warning: {
      apiKeyNotSet: '⚠️  Cloudflare API key is not set. Please check your environment variables.',
      invalidImageFormat: 'Unsupported image format',
      fileTooLarge: 'File size too large',
      uploadFailed: 'Image upload failed'
    },
    success: {
      uploadComplete: 'Image upload completed',
      deleteComplete: 'Image deletion completed'
    }
  },
  vi: {
    warning: {
      apiKeyNotSet: '⚠️  Khóa API Cloudflare không được thiết lập. Vui lòng kiểm tra các biến môi trường.',
      invalidImageFormat: 'Định dạng hình ảnh không được hỗ trợ',
      fileTooLarge: 'Kích thước tệp quá lớn',
      uploadFailed: 'Tải lên hình ảnh thất bại'
    },
    success: {
      uploadComplete: 'Tải lên hình ảnh hoàn tất',
      deleteComplete: 'Xóa hình ảnh hoàn tất'
    }
  }
};

/**
 * 메시지 조회 함수                                                                                      // 언어별 메시지 반환
 * @param {string} lang - 언어 코드 ('ko', 'en', 'vi')
 * @param {string} key - 메시지 키 ('warning.apiKeyNotSet')
 * @returns {string} 해당 언어의 메시지
 */
function getMessage(lang, key) {
  const keys = key.split('.');
  let message = messages[lang] || messages.ko;
  
  for (const k of keys) {
    message = message[k];
    if (!message) break;
  }
  
  return message || key;
}

/**
 * Cloudflare Images 유틸리티 메인 클래스                                                                // 메인 이미지 처리 클래스
 * @class CloudflareImagesUtil
 */
class CloudflareImagesUtil {
  /**
   * CloudflareImagesUtil 생성자                                                                        // 클래스 초기화
   * 환경 변수에서 API 설정을 로드하고 axios 클라이언트를 초기화합니다.
   * 
   * @constructor
   */
  constructor() {
    // 기본 언어 설정 (환경 변수 또는 기본값)                                                            // 사용자 언어 설정
    this.language = process.env.DEFAULT_LANGUAGE || 'ko';
    
    // API 인증 정보                                                                                   // 인증 키 저장
    this.accountId = CLOUDFLARE_ACCOUNT_ID;
    this.apiKey = CLOUDFLARE_IMAGE_KEY;
    this.globalApiKey = CLOUDFLARE_API_KEY;
    this.email = CLOUDFLARE_EMAIL;
    this.accountHash = CLOUDFLARE_ACCOUNT_HASH;
    
    // 이미지 전송 URL (CDN 엔드포인트)                                                                 // CDN 주소 설정
    this.baseUrl = CLOUDFLARE_IMAGE_URL || `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}`;
    
    // API 키 검증 및 경고 메시지                                                                       // 설정 유효성 검사
    if (!this.accountId || (!this.apiKey && !this.globalApiKey)) {
      console.warn(getMessage(this.language, 'warning.apiKeyNotSet'));
      console.warn('CLOUDFLARE_ACCOUNT_ID:', this.accountId ? '✓' : '✗');
      console.warn('CLOUDFLARE_IMAGE_KEY:', this.apiKey ? '✓' : '✗');
      console.warn('CLOUDFLARE_API_KEY:', this.globalApiKey ? '✓' : '✗');
    }
    
    // Axios 클라이언트 초기화 (API v4 사용)                                                           // HTTP 클라이언트 설정
    const headers = this.globalApiKey && this.email ? {
      'X-Auth-Email': this.email,
      'X-Auth-Key': this.globalApiKey,
      'Content-Type': 'application/json'
    } : {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
    
    this.apiClient = axios.create({
      baseURL: `${API_BASE_URL}/accounts/${this.accountId}`,
      headers: headers,
      timeout: 30000
    });
    
    // 배치 업로드용 토큰 캐시                                                                          // 토큰 관리 시스템
    this.batchToken = null;
    this.batchTokenExpiry = null;
    
    // 유연한 변형 기능 활성화 상태                                                                     // 기능 플래그 관리
    this.flexibleVariantsEnabled = true;
  }

  /**
   * 언어 설정 변경                                                                                     // 사용자 언어 변경
   * @param {string} language - 언어 코드 ('ko', 'en', 'vi')
   */
  setLanguage(language) {
    this.language = language;
  }

  /**
   * 현재 설정 조회                                                                                     // 설정 정보 반환
   * @returns {Object} 현재 설정 객체
   */
  getConfig() {
    return {
      accountId: this.accountId,
      language: this.language,
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      hasGlobalApiKey: !!this.globalApiKey
    };
  }

  /**
   * 이미지 URL 생성                                                                                   // 변형 이미지 URL 생성
   * @param {string} imageId - 이미지 ID
   * @param {string} variant - 변형 이름 (기본: 'public')
   * @returns {string} 완전한 이미지 URL
   */
  getImageUrl(imageId, variant = 'public') {
    if (!imageId) return null;
    return `${this.baseUrl}/${imageId}/${variant}`;
  }

  /**
   * 유연한 변형 URL 생성                                                                              // 동적 이미지 변형 URL
   * @param {string} imageId - 이미지 ID
   * @param {Object} options - 변형 옵션
   * @returns {string} 완전한 이미지 URL
   */
  getFlexibleImageUrl(imageId, options = {}) {
    if (!imageId) return null;
    
    const params = [];
    if (options.width) params.push(`w=${options.width}`);
    if (options.height) params.push(`h=${options.height}`);
    if (options.fit) params.push(`fit=${options.fit}`);
    if (options.quality) params.push(`q=${options.quality}`);
    if (options.format) params.push(`f=${options.format}`);
    
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    return `${this.baseUrl}/${imageId}/public${queryString}`;
  }

  /**
   * 파일 업로드                                                                                       // 메인 업로드 함수
   * @param {Buffer|string} file - 파일 버퍼 또는 파일 경로
   * @param {Object} options - 업로드 옵션
   * @returns {Promise<Object>} 업로드 결과
   */
  async uploadFile(file, options = {}) {
    try {
      const formData = new FormData();
      
      // 파일 데이터 처리                                                                              // 파일 형태별 처리
      if (Buffer.isBuffer(file)) {
        formData.append('file', file, {
          filename: options.filename || 'image.jpg',
          contentType: options.contentType || 'image/jpeg'
        });
      } else if (typeof file === 'string') {
        formData.append('file', createReadStream(file));
      }
      
      // 메타데이터 추가                                                                               // 추가 정보 첨부
      if (options.metadata) {
        formData.append('metadata', JSON.stringify(options.metadata));
      }
      
      // 서명된 URL 요구 설정                                                                          // 보안 옵션 설정
      if (options.requireSignedURLs) {
        formData.append('requireSignedURLs', 'true');
      }

      // API 호출                                                                                     // 서버 업로드 요청
      const response = await this.apiClient.post('/images/v1', formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Length': formData.getLengthSync()
        }
      });

      return {
        success: true,
        data: response.data.result
      };

    } catch (error) {
      console.error('❌ 업로드 오류:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * 이미지 삭제                                                                                       // 이미지 제거 함수
   * @param {string} imageId - 삭제할 이미지 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteImage(imageId) {
    try {
      await this.apiClient.delete(`/images/v1/${imageId}`);
      
      return {
        success: true,
        message: getMessage(this.language, 'success.deleteComplete')
      };
      
    } catch (error) {
      console.error('❌ 삭제 오류:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * 이미지 정보 조회                                                                                   // 이미지 메타데이터 조회
   * @param {string} imageId - 조회할 이미지 ID
   * @returns {Promise<Object>} 이미지 정보
   */
  async getImageInfo(imageId) {
    try {
      const response = await this.apiClient.get(`/images/v1/${imageId}`);
      
      return {
        success: true,
        data: response.data.result
      };
      
    } catch (error) {
      console.error('❌ 조회 오류:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * 이미지 목록 조회                                                                                   // 전체 이미지 목록
   * @param {Object} options - 조회 옵션
   * @returns {Promise<Object>} 이미지 목록
   */
  async listImages(options = {}) {
    try {
      const params = {};
      if (options.page) params.page = options.page;
      if (options.per_page) params.per_page = options.per_page;
      
      const response = await this.apiClient.get('/images/v1', { params });
      
      return {
        success: true,
        data: response.data.result
      };
      
    } catch (error) {
      console.error('❌ 목록 조회 오류:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * 지원 형식 확인                                                                                     // 파일 형식 검증
   * @param {string} filename - 파일명 또는 MIME 타입
   * @returns {boolean} 지원 여부
   */
  isSupportedFormat(filename) {
    const supportedFormats = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp'
    ];
    
    const ext = filename.toLowerCase();
    return supportedFormats.some(format => ext.includes(format));
  }

  /**
   * 이미지 크기 검증                                                                                   // 크기 제한 확인
   * @param {number} width - 너비
   * @param {number} height - 높이
   * @param {number} fileSize - 파일 크기 (bytes)
   * @returns {Object} 검증 결과
   */
  validateImageDimensions(width, height, fileSize) {
    const maxWidth = 12000;
    const maxHeight = 12000;
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    const errors = [];

    if (width > maxWidth) {
      errors.push(`너비가 최대값(${maxWidth}px)을 초과했습니다: ${width}px`);
    }

    if (height > maxHeight) {
      errors.push(`높이가 최대값(${maxHeight}px)을 초과했습니다: ${height}px`);
    }

    if (fileSize > maxFileSize) {
      errors.push(`파일 크기가 최대값(10MB)을 초과했습니다: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Direct Upload URL 생성 (새로운 방식)                                                             // 클라이언트 직접 업로드용
   * 클라이언트가 Cloudflare에 직접 업로드할 수 있는 1회용 URL 생성
   *
   * @param {Object} options - 업로드 옵션
   * @param {Object} options.metadata - 메타데이터 (선택)
   * @param {boolean} options.requireSignedURLs - 서명된 URL 요구 여부 (기본: false)
   * @param {number} options.expiry - 만료 시간 (초, 기본: 1800 = 30분)
   * @returns {Promise<Object>} Direct Upload URL 정보
   *
   * @example
   * const result = await cloudflareImages.createDirectUploadUrl({
   *   metadata: { userId: '123', storeId: '456' }
   * });
   * // => { uploadURL: "https://upload.imagedelivery.net/...", id: "..." }
   */
  async createDirectUploadUrl(options = {}) {
    try {
      const { metadata = {}, requireSignedURLs = false, expiry } = options;

      // ✅ Cloudflare API는 multipart/form-data 형식을 요구합니다
      const formData = new FormData();

      // form 필드로 추가
      formData.append('requireSignedURLs', String(requireSignedURLs));

      // metadata는 JSON 문자열로 변환
      if (metadata && Object.keys(metadata).length > 0) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      // ✅ expiry는 RFC3339 형식 타임스탬프 또는 생략
      // expiry를 초(seconds)로 받았다면 RFC3339로 변환, 없으면 생략 (기본 30분)
      if (expiry) {
        let expiryTimestamp;

        if (typeof expiry === 'number') {
          // 초 단위로 받은 경우 → RFC3339 형식으로 변환
          const expiryDate = new Date(Date.now() + expiry * 1000);
          expiryTimestamp = expiryDate.toISOString();
        } else if (typeof expiry === 'string') {
          // 이미 문자열이면 그대로 사용
          expiryTimestamp = expiry;
        }

        if (expiryTimestamp) {
          formData.append('expiry', expiryTimestamp);
        }
      }

      // API v2 엔드포인트 사용 (Direct Upload 전용)
      const response = await this.apiClient.post('/images/v2/direct_upload', formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Length': formData.getLengthSync()
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.errors?.[0]?.message || 'Direct Upload URL 생성 실패');
      }

      const result = response.data.result;

      // 만료 시간 계산 (expiry가 제공되지 않으면 기본 30분)
      const expirySeconds = expiry || 1800;
      const expiresAt = new Date(Date.now() + expirySeconds * 1000).toISOString();

      return {
        success: true,
        uploadURL: result.uploadURL,
        imageId: result.id,
        expiry: expirySeconds,
        expiresAt: expiresAt,
        metadata: metadata
      };

    } catch (error) {
      console.error('❌ Direct Upload URL 생성 오류:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * 다중 Direct Upload URL 생성                                                                      // 여러 이미지 업로드용
   *
   * @param {number} count - 생성할 URL 개수
   * @param {Object} options - 업로드 옵션
   * @returns {Promise<Object>} Direct Upload URL 배열
   */
  async createMultipleDirectUploadUrls(count, options = {}) {
    try {
      if (count <= 0 || count > 100) {
        throw new Error('URL 생성 개수는 1-100 사이여야 합니다');
      }

      const urls = [];
      const errors = [];

      // 병렬 생성 (최대 10개씩)
      const batchSize = 10;
      for (let i = 0; i < count; i += batchSize) {
        const batch = Math.min(batchSize, count - i);
        const promises = Array.from({ length: batch }, (_, index) =>
          this.createDirectUploadUrl({
            ...options,
            metadata: {
              ...options.metadata,
              uploadIndex: i + index
            }
          })
        );

        const results = await Promise.allSettled(promises);

        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success) {
            urls.push(result.value);
          } else {
            errors.push({
              index: i + index,
              error: result.reason?.message || result.value?.error || '생성 실패'
            });
          }
        });
      }

      return {
        success: errors.length === 0,
        totalRequested: count,
        successCount: urls.length,
        failedCount: errors.length,
        urls,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('❌ 다중 Direct Upload URL 생성 오류:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 이미지 ID 검증 (Direct Upload 후)                                                               // 업로드 완료 확인
   * 클라이언트가 업로드한 이미지가 실제로 존재하고 소유권이 있는지 확인
   *
   * @param {string} imageId - 검증할 이미지 ID
   * @param {Object} options - 검증 옵션
   * @param {Object} options.expectedMetadata - 예상되는 메타데이터 (소유권 확인용)
   * @returns {Promise<Object>} 검증 결과
   */
  async verifyImageId(imageId, options = {}) {
    try {
      const { expectedMetadata = {} } = options;

      // 이미지 정보 조회
      const imageInfo = await this.getImageInfo(imageId);

      if (!imageInfo.success) {
        return {
          success: false,
          valid: false,
          error: '이미지를 찾을 수 없습니다',
          imageId
        };
      }

      const image = imageInfo.data;

      // 메타데이터 검증 (소유권 확인)
      let metadataValid = true;
      const metadataErrors = [];

      if (Object.keys(expectedMetadata).length > 0) {
        const actualMetadata = image.meta || {};

        for (const [key, expectedValue] of Object.entries(expectedMetadata)) {
          const actualValue = actualMetadata[key];

          if (actualValue !== expectedValue) {
            metadataValid = false;
            metadataErrors.push({
              field: key,
              expected: expectedValue,
              actual: actualValue
            });
          }
        }
      }

      return {
        success: true,
        valid: metadataValid,
        imageId,
        imageInfo: {
          id: image.id,
          filename: image.filename,
          uploaded: image.uploaded,
          variants: image.variants,
          metadata: image.meta
        },
        metadataErrors: metadataErrors.length > 0 ? metadataErrors : undefined
      };

    } catch (error) {
      console.error('❌ 이미지 ID 검증 오류:', error.message);
      return {
        success: false,
        valid: false,
        error: error.message,
        imageId
      };
    }
  }

  /**
   * 다중 이미지 ID 검증                                                                              // 여러 이미지 확인
   *
   * @param {Array<string>} imageIds - 검증할 이미지 ID 배열
   * @param {Object} options - 검증 옵션
   * @returns {Promise<Object>} 검증 결과
   */
  async verifyMultipleImageIds(imageIds, options = {}) {
    try {
      if (!Array.isArray(imageIds) || imageIds.length === 0) {
        throw new Error('이미지 ID 배열이 비어있습니다');
      }

      const results = await Promise.allSettled(
        imageIds.map(imageId => this.verifyImageId(imageId, options))
      );

      const verified = [];
      const failed = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.valid) {
          verified.push(result.value);
        } else {
          failed.push({
            imageId: imageIds[index],
            error: result.reason?.message || result.value?.error || '검증 실패'
          });
        }
      });

      return {
        success: failed.length === 0,
        totalCount: imageIds.length,
        verifiedCount: verified.length,
        failedCount: failed.length,
        verified,
        failed: failed.length > 0 ? failed : undefined
      };

    } catch (error) {
      console.error('❌ 다중 이미지 ID 검증 오류:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cloudflare URL에서 이미지 ID 추출                                                               // URL 파싱 유틸리티
   * @param {string} url - Cloudflare 이미지 URL
   * @returns {string|null} 이미지 ID 또는 null
   *
   * @example
   * extractImageId('https://imagedelivery.net/abc123/def456/public') // => 'def456'
   * extractImageId('https://imagedelivery.net/abc123/def456/thumbnail') // => 'def456'
   */
  extractImageId(url) {
    if (!url) return null;

    try {
      // Cloudflare Images URL 패턴: https://imagedelivery.net/{accountHash}/{imageId}/{variant}
      const regex = /imagedelivery\.net\/[^/]+\/([^/]+)/;
      const match = url.match(regex);

      return match ? match[1] : null;
    } catch (error) {
      console.error('❌ 이미지 ID 추출 오류:', error.message);
      return null;
    }
  }

  /**
   * 다중 이미지 삭제                                                                                // 여러 이미지 삭제
   * @param {Array<string>} imageIds - 삭제할 이미지 ID 배열
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteMultipleImages(imageIds) {
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return {
        success: true,
        totalCount: 0,
        deletedCount: 0,
        failedCount: 0,
        deleted: [],
        failed: []
      };
    }

    const results = await Promise.allSettled(
      imageIds.map(imageId => this.deleteImage(imageId))
    );

    const deleted = [];
    const failed = [];

    results.forEach((result, index) => {
      const imageId = imageIds[index];

      if (result.status === 'fulfilled' && result.value.success) {
        deleted.push(imageId);
      } else {
        failed.push({
          imageId,
          error: result.reason?.message || result.value?.error || '삭제 실패'
        });
      }
    });

    return {
      success: failed.length === 0,
      totalCount: imageIds.length,
      deletedCount: deleted.length,
      failedCount: failed.length,
      deleted,
      failed: failed.length > 0 ? failed : undefined
    };
  }
}

// 기본 인스턴스 생성                                                                                   // 싱글톤 패턴 구현
const cloudflareImages = new CloudflareImagesUtil();

// 기본 exports                                                                                       // 모듈 내보내기
export default cloudflareImages;
export { CloudflareImagesUtil, getMessage };