/**
 * 이미지 업로드 핸들러 - 서버 측 재사용 함수                                                           // 통합 이미지 업로드 시스템
 * Cloudflare Images 업로드만 처리하고 데이터 반환                                                     // 업로드만 담당, DB는 별도 처리
 * DB 저장은 각 리졸버에서 처리                                                                       // 관심사 분리 원칙 적용
 * 
 * @module ImageUploadHandler
 * @version 1.0.0
 * 
 * ===== 주요 기능 =====                                                                             // 핵심 기능 목록
 * 1. 단일/다중 이미지 업로드 (Cloudflare Images)                                                     // 개별 및 대량 업로드
 * 2. Base64 → Buffer 변환 및 검증                                                                   // 데이터 형식 변환
 * 3. 재시도 로직 (최대 3회)                                                                         // 안정성 보장
 * 4. 메타데이터 보강                                                                               // 추가 정보 자동 생성
 * 5. 변형(Variants) URL 자동 생성                                                                   // 다양한 크기 URL 생성
 * 6. 이미지 삭제                                                                                   // 리소스 정리 기능
 * 
 * ===== 사용 흐름 =====                                                                             // 처리 과정 설명
 * 1. 클라이언트에서 압축된 Base64 이미지 전송                                                        // 클라이언트 데이터 수신
 * 2. handleImageUpload() 호출하여 Cloudflare 업로드                                                 // 메인 처리 함수 실행
 * 3. 반환된 데이터로 리졸버에서 DB 저장 결정                                                         // DB 처리는 리졸버 책임
 * 4. 리졸버가 최종 응답 구성                                                                         // 최종 응답 생성
 * 
 * ===== 반환 데이터 구조 =====                                                                       // 응답 형식 정의
 * handleImageUpload() 반환 객체:
 * {
 *   success: true,                              // 성공 여부                                       // 처리 결과 상태
 *   cloudflareId: "2cdc28f0-017a-49c4",        // Cloudflare ID                                  // 고유 식별자
 *   cloudflareUrl: "https://imagedelivery...",  // 메인 URL                                       // 접근 주소
 *   filename: "menu.jpg",                       // 파일명                                         // 원본 파일명
 *   mimetype: "image/jpeg",                     // MIME 타입                                      // 파일 형식
 *   size: 245760,                               // 바이트                                         // 파일 크기
 *   sizeMB: "0.24",                            // MB 단위                                        // 사용자 친화적 크기
 *   urls: {                                     // 모든 변형 URL                                  // 다양한 크기 주소들 
 *     original: "...",
 *     thumbnail: "...",
 *     "store-thumb": "...",
 *     "store-card": "..."
 *   },
 *   metadata: {                                 // 보강된 메타데이터                              // 추가 정보
 *     uploadedAt: "2025-01-01T12:00:00Z",
 *     uploadedBy: "user123",
 *     storeId: "store456",
 *     [customFields]: "..."                    // 사용자 정의 필드
 *   },
 *   cloudflareResponse: { ... },               // 원본 응답                                      // 디버깅용 원본 데이터
 *   uploadedAt: "2025-01-01T12:00:00Z",       // 업로드 시간                                    // 시간 정보
 *   uploadedBy: "user123",                     // 업로드 사용자                                  // 사용자 정보
 *   blurPreview: "data:image/jpeg;base64,..." // Blur 프리뷰 (선택)                            // 미리보기 이미지
 * }
 * 
 * ===== 사용 예시 =====                                                                             // 실제 사용법
 * @example
 * // 리졸버에서 사용
 * import { handleImageUpload } from '@graphql/shared/utils/services/cloudflare/ImageUploadHandler';
 * 
 * const uploadMenuImageResolver = async (_, { input }, context) => {
 *   // 1. Cloudflare 업로드                                                                        // 이미지 업로드 처리
 *   const result = await handleImageUpload(input, context);
 *   
 *   // 2. DB 저장 (리졸버 책임)                                                                    // 데이터베이스 저장
 *   const menuImage = await db.MenuImage.create({
 *     cloudflareId: result.cloudflareId,
 *     url: result.cloudflareUrl,
 *     thumbnailUrl: result.urls.thumbnail,
 *     // ... 기타 필드
 *   });
 *   
 *   return { success: true, menuImage };
 * };
 */

import cloudflareImages from './CloudflareImages.js';
import { GraphQLError } from 'graphql';

/**
 * Base64 이미지를 Buffer로 변환                                                                       // 데이터 형식 변환 함수
 * @param {string} base64String - Base64 인코딩된 이미지 데이터
 * @returns {Buffer} 이미지 버퍼
 */
function base64ToBuffer(base64String) {
  // data:image/jpeg;base64, 부분 제거                                                               // 헤더 정보 제거
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

/**
 * 이미지 크기 검증                                                                                   // 파일 크기 제한 확인
 * @param {Buffer} buffer - 이미지 버퍼
 * @param {number} maxSizeMB - 최대 크기 (MB)
 */
function validateImageSize(buffer, maxSizeMB = 10) {
  const sizeMB = buffer.length / 1024 / 1024;
  if (sizeMB > maxSizeMB) {
    throw new GraphQLError(
      `이미지 크기가 너무 큽니다. (최대 ${maxSizeMB}MB, 현재 ${sizeMB.toFixed(2)}MB)`,
      {
        extensions: {
          code: 'IMAGE_TOO_LARGE',
          maxSize: maxSizeMB * 1024 * 1024,
          actualSize: buffer.length
        }
      }
    );
  }
}

/**
 * 메타데이터 보강                                                                                     // 추가 정보 자동 생성
 * @param {Object} metadata - 클라이언트에서 받은 메타데이터
 * @param {Object} context - GraphQL context
 * @returns {Object} 보강된 메타데이터
 */
function enrichMetadata(metadata = {}, context = {}) {
  const now = new Date().toISOString();
  
  return {
    ...metadata,
    
    // 서버 측 추가 정보                                                                             // 서버에서 생성하는 정보
    uploadedAt: now,
    uploadedBy: context.userId || null,
    storeId: context.storeId || metadata.storeId || null,
    
    // IP 및 User Agent (보안/추적용)                                                               // 보안 및 추적 정보
    ipAddress: context.req?.ip || context.req?.connection?.remoteAddress || null,
    userAgent: context.req?.headers?.['user-agent'] || null,
    
    // 버전 정보                                                                                   // 시스템 버전 정보
    apiVersion: 'v2',
    handlerVersion: '1.0.0'
  };
}

/**
 * 이미지 업로드 메인 핸들러                                                                           // 핵심 업로드 처리 함수
 * 
 * @param {Object} input - 업로드 입력 데이터
 * @param {string} input.image - Base64 인코딩된 이미지
 * @param {string} input.filename - 파일명
 * @param {string} input.mimetype - MIME 타입
 * @param {Object} input.metadata - 메타데이터
 * @param {Array} input.variants - 필요한 변형 목록
 * @param {string} input.blurPreview - Blur 프리뷰 (선택)
 * @param {Object} context - GraphQL context
 * @param {Object} options - 추가 옵션
 * 
 * @returns {Promise<Object>} 업로드 결과 객체                                                         // 상세한 업로드 결과
 * @returns {boolean} result.success - 업로드 성공 여부 (항상 true, 실패시 에러 throw)
 * @returns {string} result.cloudflareId - Cloudflare 이미지 고유 ID
 * @returns {string} result.cloudflareUrl - 기본 이미지 URL
 * @returns {string} result.filename - 파일명
 * @returns {string} result.mimetype - MIME 타입
 * @returns {number} result.size - 파일 크기 (bytes)
 * @returns {string} result.sizeMB - 파일 크기 (MB)
 * @returns {Object} result.urls - 모든 변형 URL 객체
 * @returns {Object} result.metadata - 보강된 메타데이터 객체
 * @returns {Object} result.cloudflareResponse - Cloudflare API 원본 응답
 * @returns {string} result.uploadedAt - 업로드 시간 (ISO 8601 형식)
 * @returns {string} result.uploadedBy - 업로드한 사용자 ID
 * @returns {string} result.blurPreview - Blur 프리뷰 데이터 URL (제공된 경우)
 */
export async function handleImageUpload(input, context = {}, options = {}) {
  const {
    image,
    filename,
    mimetype,
    metadata = {},
    variants = [],
    blurPreview = null
  } = input;

  const {
    maxSizeMB = 10,
    requireSignedURLs = false,
    maxRetries = 3,
    validateMimeType = true
  } = options;

  try {
    // 1. 입력 검증                                                                                 // 필수 데이터 확인
    if (!image) {
      throw new GraphQLError('이미지 데이터가 없습니다', {
        extensions: { code: 'MISSING_IMAGE_DATA' }
      });
    }

    if (!filename) {
      throw new GraphQLError('파일명이 없습니다', {
        extensions: { code: 'MISSING_FILENAME' }
      });
    }

    // 2. MIME 타입 검증 (선택적)                                                                   // 파일 형식 확인
    if (validateMimeType) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(mimetype)) {
        throw new GraphQLError(`지원하지 않는 이미지 형식입니다: ${mimetype}`, {
          extensions: { 
            code: 'INVALID_MIME_TYPE',
            allowedTypes 
          }
        });
      }
    }

    // 3. Base64를 Buffer로 변환                                                                   // 데이터 변환 처리
    const buffer = base64ToBuffer(image);
    
    // 4. 크기 검증                                                                               // 파일 크기 확인
    validateImageSize(buffer, maxSizeMB);

    // 5. 메타데이터 보강                                                                          // 추가 정보 생성
    const enrichedMetadata = enrichMetadata(metadata, context);
    
    // Blur 프리뷰가 있으면 메타데이터에 추가                                                        // 미리보기 이미지 처리
    if (blurPreview) {
      enrichedMetadata.blurPreview = blurPreview.substring(0, 500); // 크기 제한
    }

    // 필요한 variants 정보 추가                                                                   // 변형 목록 저장
    if (variants && variants.length > 0) {
      enrichedMetadata.requiredVariants = variants;
    }

    // 6. Cloudflare Images로 업로드 (재시도 로직 포함)                                            // 실제 업로드 처리
    let uploadResult = null;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 이미지 업로드 시도 ${attempt}/${maxRetries}: ${filename}`);
        
        uploadResult = await cloudflareImages.uploadFile(buffer, {
          filename,
          contentType: mimetype,
          metadata: enrichedMetadata,
          requireSignedURLs
        });
        
        if (uploadResult.success) {
          console.log(`✅ 이미지 업로드 성공: ${uploadResult.data.id}`);
          break;
        }
        
      } catch (error) {
        lastError = error;
        console.error(`❌ 업로드 시도 ${attempt} 실패:`, error.message);
        
        // 마지막 시도가 아니면 대기 후 재시도                                                      // 재시도 로직
        if (attempt < maxRetries) {
          const waitTime = attempt * 1000; // 1초, 2초, 3초...
          console.log(`⏳ ${waitTime/1000}초 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // 7. 모든 재시도 실패 시                                                                       // 최종 실패 처리
    if (!uploadResult || !uploadResult.success) {
      throw new GraphQLError(
        `이미지 업로드 실패 (${maxRetries}회 시도)`,
        {
          extensions: {
            code: 'UPLOAD_FAILED',
            originalError: lastError?.message,
            attempts: maxRetries
          }
        }
      );
    }

    // 8. 업로드 결과 가공                                                                          // 결과 데이터 처리
    const cloudflareData = uploadResult.data || uploadResult;
    
    // 9. 변형 URL 생성                                                                            // 다양한 크기 URL 생성
    const variantUrls = {};
    if (variants && variants.length > 0) {
      variants.forEach(variant => {
        variantUrls[variant] = cloudflareImages.getImageUrl(cloudflareData.id, variant);
      });
    }
    
    // 기본 변형 추가                                                                              // 표준 변형 URL 추가
    variantUrls.public = cloudflareImages.getImageUrl(cloudflareData.id, 'public');
    variantUrls.thumbnail = cloudflareImages.getImageUrl(cloudflareData.id, 'thumbnail');

    // 10. 최종 결과 반환                                                                          // 완성된 결과 구성
    const result = {
      success: true,
      
      // Cloudflare 정보                                                                          // 클라우드플레어 관련 정보
      cloudflareId: cloudflareData.id,
      cloudflareUrl: cloudflareData.variants?.[0] || variantUrls.public,
      
      // 이미지 정보                                                                              // 파일 기본 정보
      filename: cloudflareData.filename || filename,
      mimetype: mimetype,
      size: buffer.length,
      sizeMB: (buffer.length / 1024 / 1024).toFixed(2),
      
      // URL 정보                                                                                // 접근 주소 정보
      urls: {
        original: variantUrls.public,
        ...variantUrls
      },
      
      // 메타데이터                                                                              // 추가 정보
      metadata: enrichedMetadata,
      
      // Cloudflare 원본 응답 (디버깅용)                                                          // 원본 응답 데이터
      cloudflareResponse: {
        id: cloudflareData.id,
        uploadURL: cloudflareData.uploadURL,
        variants: cloudflareData.variants,
        draft: cloudflareData.draft
      },
      
      // 업로드 정보                                                                              // 업로드 관련 정보
      uploadedAt: enrichedMetadata.uploadedAt,
      uploadedBy: enrichedMetadata.uploadedBy
    };

    // Blur 프리뷰가 있으면 추가                                                                   // 미리보기 추가
    if (blurPreview) {
      result.blurPreview = blurPreview;
    }

    return result;

  } catch (error) {
    // GraphQL 에러인 경우 그대로 전달                                                             // 에러 타입별 처리
    if (error instanceof GraphQLError) {
      throw error;
    }
    
    // 일반 에러를 GraphQL 에러로 변환                                                             // 일반 에러 변환
    throw new GraphQLError(
      `이미지 업로드 중 오류 발생: ${error.message}`,
      {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          originalError: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      }
    );
  }
}

/**
 * 다중 이미지 업로드 핸들러 (롤백 지원)                                                              // 대량 업로드 처리 함수
 *
 * @param {Array} images - 이미지 배열
 * @param {Object} context - GraphQL context
 * @param {Object} options - 추가 옵션
 * @param {boolean} options.parallel - 병렬 처리 여부 (기본: true)
 * @param {number} options.maxConcurrent - 최대 동시 처리 수 (기본: 3)
 * @param {boolean} options.stopOnError - 에러 시 중단 여부 (기본: true)
 * @param {boolean} options.rollbackOnError - 에러 시 롤백 여부 (기본: true)
 *
 * @returns {Promise<Object>} 업로드 결과 객체                                                        // 상세 결과 객체
 * @returns {boolean} result.success - 전체 성공 여부
 * @returns {number} result.totalCount - 전체 이미지 수
 * @returns {number} result.successCount - 성공한 이미지 수
 * @returns {number} result.failedCount - 실패한 이미지 수
 * @returns {Array} result.results - 개별 업로드 결과 배열
 * @returns {Array} result.uploadedImages - 성공한 이미지 정보
 * @returns {string} result.firstError - 첫 번째 에러 메시지 (실패 시)
 */
export async function handleMultipleImageUploads(images, context = {}, options = {}) {
  const {
    parallel = true,
    maxConcurrent = 3,
    stopOnError = true,  // 🆕 기본값 true로 변경 (안전성 우선)
    rollbackOnError = true  // 🆕 롤백 기능 추가
  } = options;

  const results = [];
  const uploadedCloudflareIds = [];  // 🆕 롤백용 추적
  const uploadedImages = [];  // 🆕 성공한 이미지 정보
  let firstError = null;

  try {
    if (parallel) {
      // 병렬 처리 (동시 실행 제한)                                                                   // 동시 처리 방식
      for (let i = 0; i < images.length; i += maxConcurrent) {
        const batch = images.slice(i, i + maxConcurrent);

        const batchResults = await Promise.allSettled(
          batch.map(image => handleImageUpload(image, context, options))
        );

        batchResults.forEach((result, index) => {
          const currentIndex = i + index;

          if (result.status === 'fulfilled') {
            uploadedCloudflareIds.push(result.value.cloudflareId);  // 🆕 성공 ID 추적
            uploadedImages.push(result.value);  // 🆕 성공 이미지 저장

            results.push({
              index: currentIndex,
              success: true,
              data: result.value
            });
          } else {
            const error = {
              index: currentIndex,
              success: false,
              error: result.reason.message
            };
            results.push(error);

            if (!firstError) {
              firstError = result.reason.message;  // 🆕 첫 에러 기록
            }

            if (stopOnError) {
              throw new GraphQLError(
                `이미지 ${currentIndex + 1} 업로드 실패: ${result.reason.message}`,
                {
                  extensions: {
                    code: 'BATCH_UPLOAD_FAILED',
                    failedIndex: currentIndex,
                    totalImages: images.length
                  }
                }
              );
            }
          }
        });
      }
    } else {
      // 순차 처리                                                                                  // 순서대로 처리 방식
      for (let i = 0; i < images.length; i++) {
        try {
          const result = await handleImageUpload(images[i], context, options);

          uploadedCloudflareIds.push(result.cloudflareId);  // 🆕 성공 ID 추적
          uploadedImages.push(result);  // 🆕 성공 이미지 저장

          results.push({
            index: i,
            success: true,
            data: result
          });
        } catch (error) {
          const errorResult = {
            index: i,
            success: false,
            error: error.message
          };
          results.push(errorResult);

          if (!firstError) {
            firstError = error.message;  // 🆕 첫 에러 기록
          }

          if (stopOnError) {
            throw error;
          }
        }
      }
    }

    // 🆕 성공 응답
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return {
      success: failedCount === 0,
      totalCount: images.length,
      successCount,
      failedCount,
      results,
      uploadedImages,
      firstError: failedCount > 0 ? firstError : null
    };

  } catch (error) {
    // 🆕 롤백 처리
    if (rollbackOnError && uploadedCloudflareIds.length > 0) {
      console.log(`🔄 [다중 업로드 롤백] ${uploadedCloudflareIds.length}개 이미지 삭제 시작`);

      try {
        await handleMultipleImageDeletes(uploadedCloudflareIds, context, { ignoreErrors: true });
        console.log('✅ [다중 업로드 롤백] 성공한 이미지 모두 삭제 완료');
      } catch (rollbackError) {
        console.error('⚠️  [다중 업로드 롤백] 실패 (수동 정리 필요):', rollbackError);
      }
    }

    // 원래 에러 다시 throw
    throw error;
  }
}

/**
 * 이미지 삭제 핸들러                                                                                 // 이미지 제거 함수
 *
 * @param {string} cloudflareId - Cloudflare 이미지 ID
 * @param {Object} context - GraphQL context
 *
 * @returns {Promise<Object>} 삭제 결과 객체                                                         // 삭제 처리 결과
 */
export async function handleImageDelete(cloudflareId, context = {}) {
  try {
    const result = await cloudflareImages.deleteImage(cloudflareId);

    if (result.success) {
      // 🗑️ 삭제 성공 로깅 (1줄, 눈에 띄게)
      console.log(`🗑️✨ [CLOUDFLARE DELETE SUCCESS] ID: ${cloudflareId} | Image removed | Timestamp: ${new Date().toISOString()} 💥`);

      return {
        success: true,
        deletedId: cloudflareId,
        deletedAt: new Date().toISOString(),
        deletedBy: context.userId || null
      };
    } else {
      throw new Error(result.error || '이미지 삭제 실패');
    }
  } catch (error) {
    throw new GraphQLError(
      `이미지 삭제 중 오류: ${error.message}`,
      {
        extensions: {
          code: 'DELETE_FAILED',
          cloudflareId
        }
      }
    );
  }
}

/**
 * 다중 이미지 삭제 핸들러 (롤백용)                                                                    // 대량 이미지 삭제 함수
 *
 * @param {Array<string>} cloudflareIds - 삭제할 Cloudflare 이미지 ID 배열
 * @param {Object} context - GraphQL context
 * @param {Object} options - 삭제 옵션
 * @param {boolean} options.ignoreErrors - 에러 무시 여부 (기본: true, 롤백 시 안전)
 *
 * @returns {Promise<Object>} 삭제 결과 통계                                                          // 삭제 결과 요약
 */
export async function handleMultipleImageDeletes(cloudflareIds, context = {}, options = {}) {
  const { ignoreErrors = true } = options;

  if (!cloudflareIds || cloudflareIds.length === 0) {
    return {
      success: true,
      totalCount: 0,
      successCount: 0,
      failedCount: 0,
      results: []
    };
  }

  const results = [];
  let successCount = 0;
  let failedCount = 0;

  console.log(`🗑️  [롤백] ${cloudflareIds.length}개 이미지 삭제 시작`);

  for (const cloudflareId of cloudflareIds) {
    try {
      const result = await cloudflareImages.deleteImage(cloudflareId);

      if (result.success) {
        successCount++;
        results.push({
          cloudflareId,
          success: true,
          deletedAt: new Date().toISOString()
        });
        // 🗑️ 삭제 성공 로깅 (1줄, 눈에 띄게)
        console.log(`🗑️✨ [CLOUDFLARE DELETE SUCCESS] ID: ${cloudflareId} | Image removed | Timestamp: ${new Date().toISOString()} 💥`);
      } else {
        failedCount++;
        results.push({
          cloudflareId,
          success: false,
          error: result.error
        });
        console.warn(`⚠️  [롤백] 이미지 삭제 실패: ${cloudflareId} - ${result.error}`);
      }
    } catch (error) {
      failedCount++;
      results.push({
        cloudflareId,
        success: false,
        error: error.message
      });
      console.error(`❌ [롤백] 이미지 삭제 오류: ${cloudflareId} - ${error.message}`);

      if (!ignoreErrors) {
        throw new GraphQLError(
          `이미지 롤백 실패: ${error.message}`,
          {
            extensions: {
              code: 'ROLLBACK_DELETE_FAILED',
              cloudflareId,
              partialResults: results
            }
          }
        );
      }
    }
  }

  console.log(`🗑️  [롤백] 이미지 삭제 완료: ${successCount}/${cloudflareIds.length} 성공`);

  return {
    success: true,
    totalCount: cloudflareIds.length,
    successCount,
    failedCount,
    results,
    deletedBy: context.userId || null
  };
}

// Named exports                                                                                    // 함수별 내보내기
export default {
  handleImageUpload,
  handleMultipleImageUploads,
  handleImageDelete,
  handleMultipleImageDeletes
};