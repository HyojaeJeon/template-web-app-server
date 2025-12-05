/**
 * useMutationWithRollback Hook
 *
 * 이미지 업로드가 포함된 mutation에서 에러 발생 시
 * 자동으로 업로드된 이미지를 롤백하는 custom hook
 *
 * @example
 * const [createMenuItem, { loading, error }] = useMutationWithRollback(CREATE_MENU_ITEM, {
 *   onCompleted: (data) => {
 *     console.log('Success:', data);
 *   },
 *   onError: (error) => {
 *     console.error('Error:', error);
 *   }
 * });
 *
 * // 사용 시
 * const imageUrls = ['https://imagedelivery.net/xxx/yyy/public'];
 * await createMenuItem({
 *   variables: { input: { imageUrls, ...otherData } },
 *   context: { rollbackImages: imageUrls } // ✅ 롤백할 이미지 URL 지정
 * });
 */

import { useMutation } from '@apollo/client';
import { useCallback, useRef } from 'react';
import { rollbackUploadedImagesInBackground, extractImageIds } from '@/shared/utils/imageRollback';

/**
 * Mutation with automatic image rollback on error
 *
 * @param {DocumentNode} mutation - GraphQL mutation
 * @param {Object} options - useMutation options
 * @param {Function} options.onCompleted - Success callback
 * @param {Function} options.onError - Error callback
 * @param {boolean} options.autoRollback - 자동 롤백 활성화 여부 (기본: true)
 * @returns {Array} [mutateFunction, mutationResult]
 */
export function useMutationWithRollback(mutation, options = {}) {
  const {
    onCompleted,
    onError,
    autoRollback = true,
    ...restOptions
  } = options;

  // 롤백할 이미지 URL을 저장하는 ref (mutation 실행 중에만 유지)
  const rollbackImagesRef = useRef(null);

  // 원본 mutation 실행
  const [mutateFn, mutationResult] = useMutation(mutation, {
    ...restOptions,
    onCompleted: (data, clientOptions) => {
      // 성공 시 롤백 이미지 클리어
      rollbackImagesRef.current = null;

      if (onCompleted) {
        onCompleted(data, clientOptions);
      }
    },
    onError: (error, clientOptions) => {
      console.error('[useMutationWithRollback] ❌ Mutation 실패:', {
        operation: mutation.definitions?.[0]?.name?.value,
        error: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError
      });

      // 자동 롤백이 활성화되어 있고 롤백할 이미지가 있으면 실행
      if (autoRollback && rollbackImagesRef.current && rollbackImagesRef.current.length > 0) {
        const imageUrls = rollbackImagesRef.current;
        const imageIds = extractImageIds(imageUrls);

        console.log(`🗑️  [useMutationWithRollback] 이미지 롤백 시작: ${imageIds.length}개 (이유: Mutation 실패)`);

        // 백그라운드에서 이미지 롤백 실행
        rollbackUploadedImagesInBackground(imageUrls, {
          reason: `Mutation 실패: ${error.message}`,
          silent: false
        });
      }

      // 롤백 이미지 클리어
      rollbackImagesRef.current = null;

      // 사용자 정의 에러 핸들러 호출
      if (onError) {
        onError(error, clientOptions);
      }
    }
  });

  // Mutation 래퍼 함수
  const mutateWithRollback = useCallback((mutationOptions = {}) => {
    // context에서 롤백할 이미지 URL 추출
    const rollbackImages = mutationOptions.context?.rollbackImages;

    if (rollbackImages && Array.isArray(rollbackImages) && rollbackImages.length > 0) {
      console.log(`[useMutationWithRollback] 📸 롤백 이미지 등록: ${rollbackImages.length}개`);
      rollbackImagesRef.current = rollbackImages;
    } else {
      rollbackImagesRef.current = null;
    }

    // 원본 mutation 실행
    return mutateFn(mutationOptions);
  }, [mutateFn]);

  return [mutateWithRollback, mutationResult];
}

/**
 * 이미지 URL 배열 추출 헬퍼 함수
 * variables에서 이미지 URL을 자동으로 찾아서 추출합니다
 *
 * @param {Object} variables - Mutation variables
 * @param {string[]} imageFields - 이미지 필드명 배열 (기본: ['imageUrl', 'imageUrls', 'images'])
 * @returns {string[]} 추출된 이미지 URL 배열
 */
export function extractImageUrlsFromVariables(variables, imageFields = ['imageUrl', 'imageUrls', 'images', 'receiptImageUrl', 'profileImageUrl']) {
  const imageUrls = [];

  const searchObject = (obj) => {
    if (!obj || typeof obj !== 'object') return;

    for (const key of Object.keys(obj)) {
      const value = obj[key];

      // 이미지 필드명이 매치되면
      if (imageFields.includes(key)) {
        if (typeof value === 'string' && value.startsWith('http')) {
          imageUrls.push(value);
        } else if (Array.isArray(value)) {
          imageUrls.push(...value.filter(url => typeof url === 'string' && url.startsWith('http')));
        }
      }

      // 재귀적으로 중첩 객체 탐색
      if (typeof value === 'object' && value !== null) {
        searchObject(value);
      }
    }
  };

  searchObject(variables);
  return imageUrls;
}

export default useMutationWithRollback;
