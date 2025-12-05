/**
 * useMultilingualTranslation Hook
 * Google Cloud Translation API를 활용한 다국어 자동 번역 Hook
 *
 * 기능:
 * - 동적 언어 감지 및 자동 번역
 * - localStorage 기반 미리보기 저장
 * - Toast 알림 통합
 * - 배치 번역 지원 (GraphQL API)
 *
 * @example
 * ```jsx
 * const { translate, translateSingle, isTranslating } = useMultilingualTranslation();
 *
 * // 단일 항목 번역
 * const result = await translateSingle({
 *   id: "menu-1",
 *   name: "Phở bò"
 * });
 *
 * // 다중 항목 번역
 * const results = await translate([
 *   { id: "menu-1", name: "Phở bò" },
 *   { id: "menu-2", nameKo: "비빔밥" }
 * ], "menu");
 * ```
 */

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useToast } from '@/shared/providers/ToastProvider';
import { S_TRANSLATE_MULTILINGUAL_FIELDS } from '@/gql/mutations/translation';

/**
 * 다국어 번역 Hook
 */
export function useMultilingualTranslation() {
  const { showSuccess, showError } = useToast();
  const [isTranslating, setIsTranslating] = useState(false);

  // GraphQL 번역 뮤테이션
  const [translateMutation] = useMutation(S_TRANSLATE_MULTILINGUAL_FIELDS);

  /**
   * 필드를 Gemma3 번역 요청으로 변환
   */
  const convertFieldsToTranslations = (fields) => {
    const translations = [];

    fields.forEach(field => {
      // 각 필드에서 번역이 필요한 언어 조합 생성
      if (field.nameKo) {
        // 한국어 -> Local어
        if (!field.name) {
          translations.push({
            id: `${field.id}_ko_vi`,
            fieldId: field.id,
            fieldName: 'name',
            text: field.nameKo,
            source_lang: 'ko',
            target_lang: 'vi'
          });
        }
        // 한국어 -> 영어
        if (!field.nameEn) {
          translations.push({
            id: `${field.id}_ko_en`,
            fieldId: field.id,
            fieldName: 'nameEn',
            text: field.nameKo,
            source_lang: 'ko',
            target_lang: 'en'
          });
        }
      }

      if (field.name) {
        // Local어 -> 한국어
        if (!field.nameKo) {
          translations.push({
            id: `${field.id}_vi_ko`,
            fieldId: field.id,
            fieldName: 'nameKo',
            text: field.name,
            source_lang: 'vi',
            target_lang: 'ko'
          });
        }
        // Local어 -> 영어
        if (!field.nameEn) {
          translations.push({
            id: `${field.id}_vi_en`,
            fieldId: field.id,
            fieldName: 'nameEn',
            text: field.name,
            source_lang: 'vi',
            target_lang: 'en'
          });
        }
      }

      if (field.nameEn) {
        // 영어 -> 한국어
        if (!field.nameKo) {
          translations.push({
            id: `${field.id}_en_ko`,
            fieldId: field.id,
            fieldName: 'nameKo',
            text: field.nameEn,
            source_lang: 'en',
            target_lang: 'ko'
          });
        }
        // 영어 -> Local어
        if (!field.name) {
          translations.push({
            id: `${field.id}_en_vi`,
            fieldId: field.id,
            fieldName: 'name',
            text: field.nameEn,
            source_lang: 'en',
            target_lang: 'vi'
          });
        }
      }
    });

    return translations;
  };

  /**
   * 번역 결과를 필드 형식으로 변환
   */
  const convertTranslationsToFields = (fields, translationResults) => {
    const fieldMap = new Map();

    // 원본 필드로 초기화
    fields.forEach(field => {
      fieldMap.set(field.id, { ...field });
    });

    // 번역 결과 적용
    translationResults.forEach(result => {
      if (!result.success) return;

      const { fieldId, fieldName, translated_text } = result;
      const field = fieldMap.get(fieldId);

      if (field) {
        field[fieldName] = translated_text;
      }
    });

    return Array.from(fieldMap.values());
  };

  /**
   * 배치 번역 함수 (Google Cloud Translation API 사용)
   *
   * @param {Array} fields - 번역할 필드 배열
   * @param {string} context - 컨텍스트 (예: 'menu', 'category', 'bundle', 'promotion', 'store')
   * @returns {Promise<Object>} 번역 결과
   */
  const translate = async (fields, context = 'unknown') => {
    const startTime = Date.now();
    setIsTranslating(true);

    try {
      if (!fields || fields.length === 0) {
        showSuccess('chat.settings.messages.noMessagesToTranslate');
        setIsTranslating(false);
        return { success: true, translatedFields: [] };
      }

      console.log('[Google Translation] Translation started:', {
        context,
        totalFields: fields.length
      });

      // GraphQL 뮤테이션 호출
      const { data } = await translateMutation({
        variables: {
          input: {
            fields: fields.map(field => ({
              id: field.id || `field-${Math.random()}`,
              nameKo: field.nameKo || '',
              name: field.name || '',
              nameEn: field.nameEn || '',
              descriptionKo: field.descriptionKo || '',
              description: field.description || '',
              descriptionEn: field.descriptionEn || ''
            })),
            context
          }
        }
      });

      const result = data?.sTranslateMultilingualFields;

      if (!result?.success) {
        throw new Error(result?.message || '번역에 실패했습니다');
      }

      const duration = Date.now() - startTime;

      console.log('[Google Translation] Translation completed:', {
        context,
        totalFields: result.translatedFields?.length || 0,
        stats: result.stats,
        duration: `${duration}ms`
      });

      showSuccess(result.message || 'chat.settings.messages.translationSuccess');

      return result;

    } catch (error) {
      console.error('[Google Translation] Translation error:', error);
      showError('chat.settings.messages.translationError');

      return { success: false, translatedFields: [] };
    } finally {
      setIsTranslating(false);
    }
  };

  /**
   * 단일 항목 번역 함수 (편의 함수)
   *
   * @param {Object} field - 번역할 단일 필드
   * @param {string} context - 컨텍스트
   * @returns {Promise<Object|null>} 번역된 필드 또는 null
   */
  const translateSingle = async (field, context = 'unknown') => {
    const result = await translate([field], context);

    // translate는 { success, translatedFields, ... } 객체를 반환
    if (result?.success && result.translatedFields?.length > 0) {
      return result.translatedFields[0];
    }

    return null;
  };

  /**
   * localStorage에 번역 미리보기 저장
   *
   * @param {string} key - 저장 키 (예: 'menu-123-preview')
   * @param {Object} translatedData - 번역된 데이터
   */
  const saveTranslationPreview = (key, translatedData) => {
    try {
      const previewKey = `translation_preview_${key}`;
      localStorage.setItem(previewKey, JSON.stringify(translatedData));
      console.log(`[Translation] Preview saved: ${previewKey}`);
    } catch (error) {
      console.error('[Translation] Failed to save preview:', error);
    }
  };

  /**
   * localStorage에서 번역 미리보기 불러오기
   *
   * @param {string} key - 저장 키
   * @returns {Object|null} 저장된 번역 데이터 또는 null
   */
  const loadTranslationPreview = (key) => {
    try {
      const previewKey = `translation_preview_${key}`;
      const saved = localStorage.getItem(previewKey);

      if (saved) {
        console.log(`[Translation] Preview loaded: ${previewKey}`);
        return JSON.parse(saved);
      }

      return null;
    } catch (error) {
      console.error('[Translation] Failed to load preview:', error);
      return null;
    }
  };

  /**
   * localStorage에서 번역 미리보기 삭제
   *
   * @param {string} key - 저장 키
   */
  const clearTranslationPreview = (key) => {
    try {
      const previewKey = `translation_preview_${key}`;
      localStorage.removeItem(previewKey);
      console.log(`[Translation] Preview cleared: ${previewKey}`);
    } catch (error) {
      console.error('[Translation] Failed to clear preview:', error);
    }
  };

  return {
    // 번역 함수
    translate,
    translateSingle,

    // 상태
    isTranslating,

    // localStorage 헬퍼
    saveTranslationPreview,
    loadTranslationPreview,
    clearTranslationPreview
  };
}

export default useMultilingualTranslation;
