// /server/src/shared/services/GoogleTranslationService.js

// CommonJS 모듈 import (default export 사용)
import translatePkg from '@google-cloud/translate';
const { v2 } = translatePkg;
import kv from '../../cache/kv.js';

// Google Cloud Translation API 클라이언트 초기화 (API Key 방식)
const translate = process.env.GOOGLE_APPLICATION_CREDENTIALS_KEY
  ? new v2.Translate({ key: process.env.GOOGLE_APPLICATION_CREDENTIALS_KEY })
  : null;

// 지원 언어 설정
const SUPPORTED_LANGUAGES = {
  ko: 'Korean',
  vi: 'Vietnamese',
  en: 'English'
};

const LANGUAGE_FIELD_MAP = {
  ko: { name: 'nameKo', description: 'descriptionKo', label: 'labelKo' },
  vi: { name: 'name', description: 'description', label: 'labelVi' },
  en: { name: 'nameEn', description: 'descriptionEn', label: 'labelEn' }
};

// 옵션 그룹/항목용 별도 매핑 (descriptionVi 사용)
const OPTION_FIELD_MAP = {
  ko: { label: 'labelKo', description: 'descriptionKo' },
  vi: { label: 'labelVi', description: 'descriptionVi' },
  en: { label: 'labelEn', description: 'descriptionEn' }
};

/**
 * 입력된 필드에서 사용 가능한 언어 감지 (name, description, label 독립 처리)
 * @param {Object} field - 다국어 필드 객체
 * @returns {Object} - {
 *   name: { availableLanguages, baseLanguage, baseText },
 *   description: { availableLanguages, baseLanguage, baseText },
 *   label: { availableLanguages, baseLanguage, baseText }
 * }
 */
function detectAvailableLanguages(field) {
  // name 필드 언어 감지
  const nameLanguages = [];
  let nameBaseLanguage = null;
  let nameBaseText = '';

  if (field.nameKo && field.nameKo.trim() !== '') {
    nameLanguages.push('ko');
    if (!nameBaseLanguage) {
      nameBaseLanguage = 'ko';
      nameBaseText = field.nameKo;
    }
  }

  if (field.name && field.name.trim() !== '') {
    nameLanguages.push('vi');
    if (!nameBaseLanguage) {
      nameBaseLanguage = 'vi';
      nameBaseText = field.name;
    }
  }

  if (field.nameEn && field.nameEn.trim() !== '') {
    nameLanguages.push('en');
    if (!nameBaseLanguage) {
      nameBaseLanguage = 'en';
      nameBaseText = field.nameEn;
    }
  }

  // description 필드 언어 감지 (독립적으로 처리)
  const descLanguages = [];
  let descBaseLanguage = null;
  let descBaseText = '';

  if (field.descriptionKo && field.descriptionKo.trim() !== '') {
    descLanguages.push('ko');
    if (!descBaseLanguage) {
      descBaseLanguage = 'ko';
      descBaseText = field.descriptionKo;
    }
  }

  // description (메뉴 아이템용) 또는 descriptionVi (옵션용) 체크
  if (field.description && field.description.trim() !== '') {
    descLanguages.push('vi');
    if (!descBaseLanguage) {
      descBaseLanguage = 'vi';
      descBaseText = field.description;
    }
  } else if (field.descriptionVi && field.descriptionVi.trim() !== '') {
    descLanguages.push('vi');
    if (!descBaseLanguage) {
      descBaseLanguage = 'vi';
      descBaseText = field.descriptionVi;
    }
  }

  if (field.descriptionEn && field.descriptionEn.trim() !== '') {
    descLanguages.push('en');
    if (!descBaseLanguage) {
      descBaseLanguage = 'en';
      descBaseText = field.descriptionEn;
    }
  }

  // label 필드 언어 감지 (옵션 그룹/항목용 - 독립적으로 처리)
  const labelLanguages = [];
  let labelBaseLanguage = null;
  let labelBaseText = '';

  if (field.labelKo && field.labelKo.trim() !== '') {
    labelLanguages.push('ko');
    if (!labelBaseLanguage) {
      labelBaseLanguage = 'ko';
      labelBaseText = field.labelKo;
    }
  }

  if (field.labelVi && field.labelVi.trim() !== '') {
    labelLanguages.push('vi');
    if (!labelBaseLanguage) {
      labelBaseLanguage = 'vi';
      labelBaseText = field.labelVi;
    }
  }

  if (field.labelEn && field.labelEn.trim() !== '') {
    labelLanguages.push('en');
    if (!labelBaseLanguage) {
      labelBaseLanguage = 'en';
      labelBaseText = field.labelEn;
    }
  }

  return {
    name: {
      availableLanguages: nameLanguages,
      baseLanguage: nameBaseLanguage,
      baseText: nameBaseText
    },
    description: {
      availableLanguages: descLanguages,
      baseLanguage: descBaseLanguage,
      baseText: descBaseText
    },
    label: {
      availableLanguages: labelLanguages,
      baseLanguage: labelBaseLanguage,
      baseText: labelBaseText
    }
  };
}

/**
 * 단일 텍스트 번역 (캐싱 포함)
 * GraphQL Non-Nullable 스키마 준수: null 대신 빈 문자열 반환
 * @param {string} text - 번역할 텍스트
 * @param {string} sourceLanguage - 원본 언어
 * @param {string} targetLanguage - 대상 언어
 * @returns {Promise<string>} - 번역된 텍스트 (빈 텍스트나 에러 시 빈 문자열)
 */
async function translateText(text, sourceLanguage, targetLanguage) {
  if (!text || text.trim() === '') {
    return ''; // GraphQL Non-Nullable 준수: null 대신 빈 문자열 반환
  }

  // 같은 언어면 번역 불필요
  if (sourceLanguage === targetLanguage) {
    return text;
  }

  // 캐시 키 생성
  const cacheKey = `translation:${sourceLanguage}:${targetLanguage}:${text}`;

  try {
    // Redis 캐시 확인
    const cached = await kv.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Google API 키가 없으면 원본 텍스트 반환 (개발용)
    if (!translate) {
      console.warn(`⚠️ Google API 키 없음 - 원본 반환: ${sourceLanguage} → ${targetLanguage}`);
      await kv.setex(cacheKey, 7 * 24 * 60 * 60, text);
      return text;
    }

    // Google Translation API 호출
    const [translation] = await translate.translate(text, {
      from: sourceLanguage,
      to: targetLanguage
    });

    // 캐시 저장 (7일)
    await kv.setex(cacheKey, 7 * 24 * 60 * 60, translation);

    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    // 에러 발생 시 원본 텍스트 반환
    return text;
  }
}

/**
 * 다국어 필드 배열 번역 (동적 언어 감지 및 처리 - name, description, label, optionGroups 독립)
 * @param {Array<Object>} fields - 다국어 필드 배열
 * @returns {Promise<Object>} - { translatedFields, translatedCount, cachedCount, apiCallsCount }
 */
export async function translateMultilingualFields(fields) {
  const translatedFields = [];
  let translatedCount = 0;
  let cachedCount = 0;
  let apiCallsCount = 0;

  for (const field of fields) {
    // name, description, label 독립적으로 언어 감지
    const detected = detectAvailableLanguages(field);

    // 번역 결과 초기화 (GraphQL Non-Nullable 준수: null 대신 빈 문자열)
    const result = {
      id: field.id,
      // 기존 필드 복사
      nameKo: field.nameKo || '',
      name: field.name || '',
      nameEn: field.nameEn || '',
      descriptionKo: field.descriptionKo || '',
      description: field.description || '',
      descriptionEn: field.descriptionEn || '',
      // label 필드 복사 (옵션 그룹/항목용)
      labelKo: field.labelKo || '',
      labelVi: field.labelVi || '',
      labelEn: field.labelEn || ''
    };

    // name 필드 번역
    if (detected.name.baseLanguage && detected.name.baseText) {
      const nameTargetLanguages = Object.keys(SUPPORTED_LANGUAGES).filter(
        lang => !detected.name.availableLanguages.includes(lang)
      );

      for (const targetLang of nameTargetLanguages) {
        const fieldMap = LANGUAGE_FIELD_MAP[targetLang];
        const translatedName = await translateText(detected.name.baseText, detected.name.baseLanguage, targetLang);
        if (translatedName) {
          result[fieldMap.name] = translatedName;
          translatedCount++;
          apiCallsCount++;
        }
      }
    }

    // description 필드 번역 (독립적으로 처리)
    if (detected.description.baseLanguage && detected.description.baseText) {
      const descTargetLanguages = Object.keys(SUPPORTED_LANGUAGES).filter(
        lang => !detected.description.availableLanguages.includes(lang)
      );

      for (const targetLang of descTargetLanguages) {
        const fieldMap = LANGUAGE_FIELD_MAP[targetLang];
        const translatedDescription = await translateText(detected.description.baseText, detected.description.baseLanguage, targetLang);
        if (translatedDescription) {
          result[fieldMap.description] = translatedDescription;
          translatedCount++;
          apiCallsCount++;
        }
      }
    }

    // label 필드 번역 (옵션 그룹/항목용 - 독립적으로 처리)
    if (detected.label.baseLanguage && detected.label.baseText) {
      const labelTargetLanguages = Object.keys(SUPPORTED_LANGUAGES).filter(
        lang => !detected.label.availableLanguages.includes(lang)
      );

      for (const targetLang of labelTargetLanguages) {
        const fieldMap = LANGUAGE_FIELD_MAP[targetLang];
        const translatedLabel = await translateText(detected.label.baseText, detected.label.baseLanguage, targetLang);
        if (translatedLabel) {
          result[fieldMap.label] = translatedLabel;
          translatedCount++;
          apiCallsCount++;
        }
      }
    }

    // optionGroups 배열 처리 (재귀적으로 번역)
    if (field.optionGroups && Array.isArray(field.optionGroups)) {
      result.optionGroups = [];

      for (const group of field.optionGroups) {
        // 옵션 그룹 label/description 번역
        const groupDetected = detectAvailableLanguages(group);
        const translatedGroup = {
          ...group,
          labelKo: group.labelKo || '',
          labelVi: group.labelVi || '',
          labelEn: group.labelEn || '',
          descriptionKo: group.descriptionKo || '',
          descriptionVi: group.descriptionVi || '',
          descriptionEn: group.descriptionEn || ''
        };

        // 그룹 label 번역
        if (groupDetected.label.baseLanguage && groupDetected.label.baseText) {
          const labelTargets = Object.keys(SUPPORTED_LANGUAGES).filter(
            lang => !groupDetected.label.availableLanguages.includes(lang)
          );

          for (const targetLang of labelTargets) {
            const fieldMap = OPTION_FIELD_MAP[targetLang];
            const translatedLabel = await translateText(groupDetected.label.baseText, groupDetected.label.baseLanguage, targetLang);
            if (translatedLabel) {
              translatedGroup[fieldMap.label] = translatedLabel;
              translatedCount++;
              apiCallsCount++;
            }
          }
        }

        // 그룹 description 번역
        if (groupDetected.description.baseLanguage && groupDetected.description.baseText) {
          const descTargets = Object.keys(SUPPORTED_LANGUAGES).filter(
            lang => !groupDetected.description.availableLanguages.includes(lang)
          );

          for (const targetLang of descTargets) {
            const fieldMap = OPTION_FIELD_MAP[targetLang];
            const translatedDesc = await translateText(groupDetected.description.baseText, groupDetected.description.baseLanguage, targetLang);
            if (translatedDesc) {
              translatedGroup[fieldMap.description] = translatedDesc;
              translatedCount++;
              apiCallsCount++;
            }
          }
        }

        // 옵션 항목(options) 배열 처리
        if (group.options && Array.isArray(group.options)) {
          translatedGroup.options = [];

          for (const option of group.options) {
            const optionDetected = detectAvailableLanguages(option);
            const translatedOption = {
              ...option,
              labelKo: option.labelKo || '',
              labelVi: option.labelVi || '',
              labelEn: option.labelEn || '',
              descriptionKo: option.descriptionKo || '',
              descriptionVi: option.descriptionVi || '',
              descriptionEn: option.descriptionEn || ''
            };

            // 옵션 label 번역
            if (optionDetected.label.baseLanguage && optionDetected.label.baseText) {
              const labelTargets = Object.keys(SUPPORTED_LANGUAGES).filter(
                lang => !optionDetected.label.availableLanguages.includes(lang)
              );

              for (const targetLang of labelTargets) {
                const fieldMap = OPTION_FIELD_MAP[targetLang];
                const translatedLabel = await translateText(optionDetected.label.baseText, optionDetected.label.baseLanguage, targetLang);
                if (translatedLabel) {
                  translatedOption[fieldMap.label] = translatedLabel;
                  translatedCount++;
                  apiCallsCount++;
                }
              }
            }

            // 옵션 description 번역
            if (optionDetected.description.baseLanguage && optionDetected.description.baseText) {
              const descTargets = Object.keys(SUPPORTED_LANGUAGES).filter(
                lang => !optionDetected.description.availableLanguages.includes(lang)
              );

              for (const targetLang of descTargets) {
                const fieldMap = OPTION_FIELD_MAP[targetLang];
                const translatedDesc = await translateText(optionDetected.description.baseText, optionDetected.description.baseLanguage, targetLang);
                if (translatedDesc) {
                  translatedOption[fieldMap.description] = translatedDesc;
                  translatedCount++;
                  apiCallsCount++;
                }
              }
            }

            translatedGroup.options.push(translatedOption);
          }
        }

        result.optionGroups.push(translatedGroup);
      }
    }

    translatedFields.push(result);
  }

  return {
    translatedFields,
    translatedCount,
    cachedCount,
    apiCallsCount
  };
}
