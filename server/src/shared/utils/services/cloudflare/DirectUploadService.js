/**
 * Direct Upload Service
 * Location: /server/src/shared/utils/services/cloudflare/DirectUploadService.js
 * Purpose: Cloudflare Images Direct Upload v2 비즈니스 로직
 *
 * 클라이언트가 서버를 거치지 않고 Cloudflare에 직접 이미지를 업로드할 수 있도록
 * 1회용 업로드 URL을 생성하는 서비스
 *
 * 흐름:
 * 1. 클라이언트 → 서버: Direct Upload URL 요청
 * 2. 서버 → Cloudflare: Direct Upload URL 생성 요청
 * 3. Cloudflare → 서버: 1회용 URL + Image ID
 * 4. 서버 → 클라이언트: URL 반환
 * 5. 클라이언트 → Cloudflare: 직접 업로드 (multipart/form-data)
 * 6. 클라이언트 → 서버: Image ID 포함 뮤테이션
 * 7. 서버: Image ID 검증 → DB 저장
 */

import { cloudflareImages } from './index.js';
import { logger } from '../../utilities/Logger.js';

/**
 * 단일 Direct Upload URL 생성
 *
 * @param {Object} options - 옵션
 * @param {Object} options.metadata - 메타데이터 (소유권 검증용)
 * @param {Boolean} options.requireSignedURLs - Signed URL 사용 여부
 * @param {Number} options.expiry - 유효기간 (초 단위, 기본: 1800)
 * @param {String} options.userId - 사용자 ID (Mobile)
 * @param {String} options.storeAccountId - 점주 계정 ID (Store)
 * @returns {Promise<Object>} - { success, uploadUrl, message }
 */
export async function requestDirectUploadUrl(options = {}) {
  try {
    const {
      metadata = {},
      requireSignedURLs = false,
      expiry = 1800,
      userId,
      storeAccountId
    } = options;

    // 메타데이터에 소유권 정보 추가
    const enrichedMetadata = {
      ...metadata,
      uploadedBy: userId || storeAccountId,
      uploadedAt: new Date().toISOString(),
      source: userId ? 'mobile' : 'store'
    };

    logger.info('Direct Upload URL 요청', {
      userId,
      storeAccountId,
      metadata: enrichedMetadata,
      expiry
    });

    // Cloudflare Direct Upload URL 생성
    const result = await cloudflareImages.createDirectUploadUrl({
      metadata: enrichedMetadata,
      requireSignedURLs,
      expiry
    });

    if (!result.success) {
      logger.error('Direct Upload URL 생성 실패', { error: result.error });
      return {
        success: false,
        errorCode: 'S1020', // UPLOAD_URL_GENERATION_FAILED
        uploadUrl: null
      };
    }

    logger.info('Direct Upload URL 생성 성공', {
      imageId: result.imageId,
      expiresAt: result.expiresAt
    });

    return {
      success: true,
      uploadUrl: {
        uploadURL: result.uploadURL,
        imageId: result.imageId,
        expiry: result.expiry,
        expiresAt: result.expiresAt
      }
    };

  } catch (error) {
    logger.error('Direct Upload URL 생성 중 오류', {
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      errorCode: 'S1020', // UPLOAD_URL_GENERATION_FAILED
      uploadUrl: null
    };
  }
}

/**
 * 다중 Direct Upload URL 생성
 *
 * @param {Number} count - 생성할 URL 개수
 * @param {Object} options - 옵션
 * @param {Object} options.metadata - 메타데이터 (소유권 검증용)
 * @param {Boolean} options.requireSignedURLs - Signed URL 사용 여부
 * @param {Number} options.expiry - 유효기간 (초 단위, 기본: 1800)
 * @param {String} options.userId - 사용자 ID (Mobile)
 * @param {String} options.storeAccountId - 점주 계정 ID (Store)
 * @returns {Promise<Object>} - { success, urls, totalRequested, successCount, failedCount, message }
 */
export async function requestMultipleDirectUploadUrls(count, options = {}) {
  try {
    const {
      metadata = {},
      requireSignedURLs = false,
      expiry = 1800,
      userId,
      storeAccountId
    } = options;

    // 개수 검증
    if (!count || count < 1) {
      return {
        success: false,
        errorCode: 'S1021', // INVALID_UPLOAD_COUNT
        urls: [],
        totalRequested: 0,
        successCount: 0,
        failedCount: 0
      };
    }

    if (count > 20) {
      return {
        success: false,
        errorCode: 'S1022', // UPLOAD_COUNT_EXCEEDED
        urls: [],
        totalRequested: count,
        successCount: 0,
        failedCount: count
      };
    }

    // 메타데이터에 소유권 정보 추가
    const enrichedMetadata = {
      ...metadata,
      uploadedBy: userId || storeAccountId,
      uploadedAt: new Date().toISOString(),
      source: userId ? 'mobile' : 'store'
    };

    logger.info('다중 Direct Upload URL 요청', {
      count,
      userId,
      storeAccountId,
      metadata: enrichedMetadata,
      expiry
    });

    // Cloudflare Direct Upload URL 생성
    const result = await cloudflareImages.createMultipleDirectUploadUrls(count, {
      metadata: enrichedMetadata,
      requireSignedURLs,
      expiry
    });

    if (!result.success) {
      logger.error('다중 Direct Upload URL 생성 실패', { error: result.error });
      return {
        success: false,
        errorCode: 'S1020', // UPLOAD_URL_GENERATION_FAILED
        urls: [],
        totalRequested: count,
        successCount: 0,
        failedCount: count
      };
    }

    logger.info('다중 Direct Upload URL 생성 성공', {
      totalRequested: result.totalRequested,
      successCount: result.successCount,
      failedCount: result.failedCount
    });

    // URLs 포맷 변환
    const formattedUrls = result.urls.map(url => ({
      uploadURL: url.uploadURL,
      imageId: url.imageId,
      expiry: url.expiry,
      expiresAt: url.expiresAt
    }));

    return {
      success: result.successCount > 0,
      urls: formattedUrls,
      totalRequested: result.totalRequested,
      successCount: result.successCount,
      failedCount: result.failedCount
    };

  } catch (error) {
    logger.error('다중 Direct Upload URL 생성 중 오류', {
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      errorCode: 'S1020', // UPLOAD_URL_GENERATION_FAILED
      urls: [],
      totalRequested: count,
      successCount: 0,
      failedCount: count
    };
  }
}

/**
 * 이미지 ID 검증
 * 업로드된 이미지가 실제로 존재하는지, 메타데이터가 일치하는지 확인
 *
 * @param {String} imageId - Cloudflare Image ID
 * @param {Object} options - 옵션
 * @param {String} options.userId - 사용자 ID (Mobile)
 * @param {String} options.storeAccountId - 점주 계정 ID (Store)
 * @returns {Promise<Object>} - { success, verified, message }
 */
export async function verifyUploadedImageId(imageId, options = {}) {
  try {
    const { userId, storeAccountId } = options;

    logger.info('이미지 ID 검증 요청', { imageId, userId, storeAccountId });

    // ✅ Direct Upload는 클라이언트가 직접 업로드하므로 서버 metadata가 포함되지 않음
    // 따라서 storeAccountId 또는 userId로 검증 (실제 Cloudflare에 저장된 필드 사용)
    const expectedMetadata = {};

    if (storeAccountId) {
      expectedMetadata.storeAccountId = storeAccountId;
    }
    if (userId) {
      expectedMetadata.userId = userId;
    }

    const result = await cloudflareImages.verifyImageId(imageId, {
      expectedMetadata
    });

    if (!result.success) {
      logger.warn('이미지 ID 검증 실패', { imageId, error: result.error });
      return {
        success: false,
        verified: false,
        errorCode: 'S1031' // IMAGE_NOT_FOUND
      };
    }

    // ✅ valid 필드를 verified로 사용 (CloudflareImages.verifyImageId 반환값)
    const isVerified = result.valid !== false; // valid가 false가 아니면 검증 성공

    logger.info('이미지 ID 검증 완료', {
      imageId,
      verified: isVerified,
      metadata: result.imageInfo?.metadata
    });

    return {
      success: true,
      verified: isVerified,
      errorCode: isVerified ? null : 'S1032' // IMAGE_OWNERSHIP_MISMATCH
    };

  } catch (error) {
    logger.error('이미지 ID 검증 중 오류', {
      imageId,
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      verified: false,
      errorCode: 'S1030' // IMAGE_VERIFICATION_FAILED
    };
  }
}

/**
 * 다중 이미지 ID 검증
 *
 * @param {Array<String>} imageIds - Cloudflare Image ID 배열
 * @param {Object} options - 옵션
 * @param {String} options.userId - 사용자 ID (Mobile)
 * @param {String} options.storeAccountId - 점주 계정 ID (Store)
 * @returns {Promise<Object>} - { success, results, verifiedCount, failedCount }
 */
export async function verifyMultipleUploadedImageIds(imageIds, options = {}) {
  try {
    const { userId, storeAccountId } = options;

    if (!imageIds || imageIds.length === 0) {
      return {
        success: false,
        results: [],
        verifiedCount: 0,
        failedCount: 0,
        errorCode: 'S1033' // INVALID_IMAGE_ID
      };
    }

    logger.info('다중 이미지 ID 검증 요청', {
      count: imageIds.length,
      userId,
      storeAccountId
    });

    const result = await cloudflareImages.verifyMultipleImageIds(imageIds, {
      expectedMetadata: {
        uploadedBy: userId || storeAccountId
      }
    });

    const verifiedCount = result.results.filter(r => r.verified).length;
    const failedCount = result.results.length - verifiedCount;

    logger.info('다중 이미지 ID 검증 완료', {
      total: imageIds.length,
      verifiedCount,
      failedCount
    });

    return {
      success: result.success,
      results: result.results,
      verifiedCount,
      failedCount,
      errorCode: verifiedCount === imageIds.length ? null : 'S1030' // IMAGE_VERIFICATION_FAILED
    };

  } catch (error) {
    logger.error('다중 이미지 ID 검증 중 오류', {
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      results: [],
      verifiedCount: 0,
      failedCount: imageIds.length,
      errorCode: 'S1030' // IMAGE_VERIFICATION_FAILED
    };
  }
}

// Default export
export default {
  requestDirectUploadUrl,
  requestMultipleDirectUploadUrls,
  verifyUploadedImageId,
  verifyMultipleUploadedImageIds
};
