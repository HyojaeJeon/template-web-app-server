/**
 * Rollback Service for Direct Upload
 * Location: /server/src/shared/utils/services/cloudflare/RollbackService.js
 * Purpose: 뮤테이션 실패 시 Cloudflare에 업로드된 이미지 자동 삭제
 *
 * 사용 시나리오:
 * 1. 클라이언트가 Direct Upload로 이미지를 Cloudflare에 업로드
 * 2. Image ID를 받아서 뮤테이션 호출
 * 3. 뮤테이션 실패 (검증 실패, DB 저장 실패 등)
 * 4. 업로드된 이미지를 자동으로 삭제 (롤백)
 */

import { cloudflareImages } from './index.js';
import { logger } from '../../utilities/Logger.js';

/**
 * 단일 업로드 이미지 롤백
 *
 * 뮤테이션 실패 시 Cloudflare에 업로드된 이미지를 삭제합니다.
 * 에러가 발생해도 조용히 실패하며 로그만 남깁니다.
 *
 * @param {String} imageId - Cloudflare Image ID
 * @param {Object} options - 옵션
 * @param {String} options.reason - 롤백 사유 (로그용)
 * @param {String} options.mutationName - 뮤테이션 이름 (로그용)
 * @returns {Promise<Boolean>} - 삭제 성공 여부
 */
export async function rollbackUploadedImage(imageId, options = {}) {
  try {
    const { reason = '뮤테이션 실패', mutationName = 'unknown' } = options;

    if (!imageId) {
      logger.warn('롤백할 이미지 ID가 없습니다', { mutationName });
      return false;
    }

    logger.info('이미지 롤백 시작', {
      imageId,
      reason,
      mutationName
    });

    // Cloudflare Images API를 통해 이미지 삭제
    const result = await cloudflareImages.deleteImage(imageId);

    if (result.success) {
      // 🗑️ 롤백 성공 로깅 (1줄, 눈에 띄게)
      console.log(`🗑️✨ [CLOUDFLARE DELETE SUCCESS] ID: ${imageId} | Rollback completed | Reason: ${reason} | Mutation: ${mutationName} 💥`);

      logger.info('이미지 롤백 성공', {
        imageId,
        reason,
        mutationName
      });
      return true;
    } else {
      logger.warn('이미지 롤백 실패 (이미지가 이미 삭제되었거나 존재하지 않을 수 있음)', {
        imageId,
        error: result.error,
        mutationName
      });
      return false;
    }

  } catch (error) {
    // 롤백 실패는 치명적이지 않으므로 에러를 던지지 않고 로그만 남김
    logger.error('이미지 롤백 중 예외 발생', {
      imageId,
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

/**
 * 다중 업로드 이미지 롤백
 *
 * 여러 이미지를 동시에 롤백합니다.
 * 일부 삭제 실패해도 나머지 계속 진행합니다.
 *
 * @param {Array<String>} imageIds - Cloudflare Image ID 배열
 * @param {Object} options - 옵션
 * @param {String} options.reason - 롤백 사유 (로그용)
 * @param {String} options.mutationName - 뮤테이션 이름 (로그용)
 * @returns {Promise<Object>} - { totalRequested, successCount, failedCount }
 */
export async function rollbackMultipleUploadedImages(imageIds, options = {}) {
  try {
    const { reason = '뮤테이션 실패', mutationName = 'unknown' } = options;

    if (!imageIds || imageIds.length === 0) {
      logger.warn('롤백할 이미지 ID가 없습니다', { mutationName });
      return {
        totalRequested: 0,
        successCount: 0,
        failedCount: 0
      };
    }

    logger.info('다중 이미지 롤백 시작', {
      count: imageIds.length,
      reason,
      mutationName
    });

    // 모든 이미지를 병렬로 삭제 (실패해도 계속 진행)
    const results = await Promise.allSettled(
      imageIds.map(imageId =>
        rollbackUploadedImage(imageId, { reason, mutationName })
      )
    );

    // 성공/실패 카운트
    const successCount = results.filter(r =>
      r.status === 'fulfilled' && r.value === true
    ).length;
    const failedCount = results.length - successCount;

    logger.info('다중 이미지 롤백 완료', {
      totalRequested: imageIds.length,
      successCount,
      failedCount,
      mutationName
    });

    return {
      totalRequested: imageIds.length,
      successCount,
      failedCount
    };

  } catch (error) {
    logger.error('다중 이미지 롤백 중 예외 발생', {
      count: imageIds?.length || 0,
      error: error.message,
      stack: error.stack
    });
    return {
      totalRequested: imageIds?.length || 0,
      successCount: 0,
      failedCount: imageIds?.length || 0
    };
  }
}

/**
 * 트랜잭션 롤백 헬퍼
 *
 * Sequelize 트랜잭션과 함께 사용하는 헬퍼 함수입니다.
 * 트랜잭션 롤백 시 자동으로 이미지도 롤백합니다.
 *
 * @param {Object} transaction - Sequelize 트랜잭션 객체
 * @param {String|Array<String>} imageIds - 단일 Image ID 또는 배열
 * @param {Object} options - 옵션
 * @returns {Promise<void>}
 *
 * @example
 * const transaction = await sequelize.transaction();
 * const uploadedImageIds = [];
 *
 * try {
 *   // 클라이언트가 업로드한 이미지 ID들
 *   uploadedImageIds.push(input.imageId);
 *
 *   // DB 작업
 *   await MenuItem.create({ imageId: input.imageId }, { transaction });
 *   await transaction.commit();
 * } catch (error) {
 *   await rollbackWithImages(transaction, uploadedImageIds, {
 *     reason: '메뉴 생성 실패',
 *     mutationName: 'sCreateMenuItem'
 *   });
 *   throw error;
 * }
 */
export async function rollbackWithImages(transaction, imageIds, options = {}) {
  try {
    // Sequelize 트랜잭션 롤백
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      logger.info('트랜잭션 롤백 완료', options);
    }

    // 이미지 롤백
    if (!imageIds) {
      return;
    }

    if (Array.isArray(imageIds)) {
      await rollbackMultipleUploadedImages(imageIds, options);
    } else {
      await rollbackUploadedImage(imageIds, options);
    }

  } catch (error) {
    logger.error('트랜잭션 및 이미지 롤백 중 오류', {
      error: error.message,
      stack: error.stack,
      ...options
    });
    // 에러를 던지지 않음 - 롤백은 최선의 노력(best effort)
  }
}

/**
 * 조건부 롤백 헬퍼
 *
 * 특정 조건이 만족되지 않으면 자동으로 이미지를 롤백합니다.
 *
 * @param {Boolean} condition - 유지 조건 (true면 유지, false면 롤백)
 * @param {String|Array<String>} imageIds - Image ID
 * @param {Object} options - 옵션
 * @returns {Promise<Boolean>} - condition 값 그대로 반환
 *
 * @example
 * // 검증 실패 시 자동 롤백
 * const isValid = await conditionalRollback(
 *   item.storeId === storeAccount.storeId, // 조건
 *   input.imageId, // 롤백할 이미지
 *   { reason: '매장 소유권 불일치', mutationName: 'sUpdateMenuItem' }
 * );
 *
 * if (!isValid) {
 *   throw new Error('S4001'); // 권한 없음
 * }
 */
export async function conditionalRollback(condition, imageIds, options = {}) {
  if (!condition && imageIds) {
    // 조건 불만족 시 롤백
    if (Array.isArray(imageIds)) {
      await rollbackMultipleUploadedImages(imageIds, options);
    } else {
      await rollbackUploadedImage(imageIds, options);
    }
  }
  return condition;
}

// Default export
export default {
  rollbackUploadedImage,
  rollbackMultipleUploadedImages,
  rollbackWithImages,
  conditionalRollback
};
