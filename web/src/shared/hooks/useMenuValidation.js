'use client';
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@/shared/i18n';

const VALIDATION_RULES = {
  basic: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[가-힣a-zA-Z0-9\s\-_().àáãạảăắằẳẵặâấầẩẫậèéẹẻẽêếềểễệđìíĩỉịòóõọỏôốồổỗộơớờởỡợùúũụủưứừửữựỳýỵỷỹ]+$/,
      message: '메뉴명은 한글, 영문, 숫자, Local어만 사용 가능합니다'
    },
    price: {
      required: true,
      min: 1000,
      type: 'number',
      message: '가격은 1,000원 이상이어야 합니다'
    },
    categoryId: {
      required: true,
      message: '카테고리를 선택해주세요'
    },
    preparationTime: {
      required: true,
      min: 1,
      max: 120,
      type: 'integer',
      message: '조리시간은 1분 이상 120분 이하여야 합니다'
    }
  },
  images: {
    count: {
      min: 1,
      max: 10,
      message: '최소 1개, 최대 10개의 이미지를 업로드해주세요'
    },
    primaryImageRequired: true,
    fileSize: {
      max: 10 * 1024 * 1024, // 10MB
      message: '이미지 크기는 10MB 이하여야 합니다'
    },
    fileType: {
      allowed: ['image/jpeg', 'image/png', 'image/webp'],
      message: 'PNG, JPG, WebP 형식의 이미지만 업로드 가능합니다'
    }
  },
  optionGroups: {
    maxGroups: 15,
    groupName: {
      required: true,
      minLength: 2,
      maxLength: 50,
      message: '옵션 그룹명은 2-50자로 입력해주세요'
    },
    options: {
      minOptionsPerGroup: 1,
      maxOptionsPerGroup: 20,
      optionName: {
        required: true,
        minLength: 1,
        maxLength: 50,
        message: '옵션명은 1-50자로 입력해주세요'
      },
      price: {
        min: 0,
        type: 'number',
        message: '추가 가격은 0원 이상이어야 합니다'
      }
    }
  }
};

const ERROR_CODES = {
  REQUIRED: 'required',
  MIN_LENGTH: 'min_length',
  MAX_LENGTH: 'max_length',
  MIN_VALUE: 'min_value',
  MAX_VALUE: 'max_value',
  PATTERN: 'pattern',
  TYPE: 'type',
  CUSTOM: 'custom'
};

export const useMenuValidation = (formData, options = {}) => {
  const { t } = useTranslation();
  const { autoValidate = true } = options; // 자동 검증 옵션 (기본값: true)
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [validationHistory, setValidationHistory] = useState([]);

  // 필드별 검증 함수
  const validateField = useCallback((field, value, schema, context = {}) => {
    const fieldErrors = [];

    // 필수 검증
    if (schema.required && (!value || value.toString().trim() === '')) {
      const messageKey = `${field}Required`;
      fieldErrors.push({
        code: ERROR_CODES.REQUIRED,
        message: t(`menu:validation.${messageKey}`, { defaultValue: schema.message || t('menu:validation.nameRequired') }),
        severity: 'error'
      });
      return fieldErrors; // 필수값이 없으면 다른 검증 생략
    }

    // 값이 있을 때만 추가 검증
    if (value !== null && value !== undefined && value !== '') {
      // 최소 길이 검증
      if (schema.minLength && value.toString().length < schema.minLength) {
        const messageKey = `${field}MinLength`;
        fieldErrors.push({
          code: ERROR_CODES.MIN_LENGTH,
          message: t(`menu:validation.${messageKey}`, {
            minLength: schema.minLength,
            defaultValue: t('menu:validation.nameMinLength', { minLength: schema.minLength })
          }),
          severity: 'error'
        });
      }

      // 최대 길이 검증
      if (schema.maxLength && value.toString().length > schema.maxLength) {
        const messageKey = `${field}MaxLength`;
        fieldErrors.push({
          code: ERROR_CODES.MAX_LENGTH,
          message: t(`menu:validation.${messageKey}`, {
            maxLength: schema.maxLength,
            defaultValue: t('menu:validation.nameMaxLength', { maxLength: schema.maxLength })
          }),
          severity: 'error'
        });
      }

      // 최소값 검증
      if (schema.min !== undefined && parseFloat(value) < schema.min) {
        const messageKey = `${field}Min`;
        fieldErrors.push({
          code: ERROR_CODES.MIN_VALUE,
          message: t(`menu:validation.${messageKey}`, {
            min: schema.min,
            defaultValue: schema.message || t('menu:validation.priceMin', { min: schema.min })
          }),
          severity: 'error'
        });
      }

      // 최대값 검증
      if (schema.max !== undefined && parseFloat(value) > schema.max) {
        const messageKey = `${field}Max`;
        fieldErrors.push({
          code: ERROR_CODES.MAX_VALUE,
          message: t(`menu:validation.${messageKey}`, {
            max: schema.max,
            defaultValue: schema.message || t('menu:validation.preparationTimeMax', { max: schema.max })
          }),
          severity: 'error'
        });
      }

      // 패턴 검증
      if (schema.pattern && !schema.pattern.test(value.toString())) {
        const messageKey = `${field}Pattern`;
        fieldErrors.push({
          code: ERROR_CODES.PATTERN,
          message: t(`menu:validation.${messageKey}`, {
            defaultValue: schema.message || t('menu:validation.namePattern')
          }),
          severity: 'error'
        });
      }

      // 스텝 검증 (가격 등)
      if (schema.step && parseFloat(value) % schema.step !== 0) {
        const messageKey = `${field}Step`;
        fieldErrors.push({
          code: ERROR_CODES.CUSTOM,
          message: t(`menu:validation.${messageKey}`, {
            step: schema.step,
            defaultValue: schema.message || t('menu:validation.priceStep', { step: schema.step })
          }),
          severity: 'warning'
        });
      }

      // 타입 검증
      if (schema.type === 'integer' && !Number.isInteger(parseFloat(value))) {
        const messageKey = `${field}Integer`;
        fieldErrors.push({
          code: ERROR_CODES.TYPE,
          message: t(`menu:validation.${messageKey}`, {
            defaultValue: schema.message || t('menu:validation.preparationTimeInteger')
          }),
          severity: 'error'
        });
      }
    }

    return fieldErrors;
  }, [t]);

  // 이미지 검증
  const validateImages = useCallback((images, imageUrl, profileImage) => {
    const imageErrors = [];

    // 이미지 개수 검증 (업로드된 이미지, URL, profileImage 중 하나는 있어야 함)
    // ✅ 기존 메뉴 수정 시 profileImage가 있으면 이미지 필수 검증 패스
    if (images.length === 0 && !imageUrl && !profileImage) {
      imageErrors.push({
        field: 'images',
        code: ERROR_CODES.REQUIRED,
        message: t('menu:validation.imagesRequired'),
        severity: 'error'
      });
    }

    // 업로드된 이미지가 있는 경우
    if (images.length > 0) {
      // 최대 개수 검증
      if (images.length > VALIDATION_RULES.images.count.max) {
        imageErrors.push({
          field: 'images',
          code: ERROR_CODES.MAX_VALUE,
          message: t('menu:validation.imagesMaxCount', { max: VALIDATION_RULES.images.count.max }),
          severity: 'error'
        });
      }

      // 대표 이미지 검증
      if (!images.find(img => img.isPrimary)) {
        imageErrors.push({
          field: 'primaryImage',
          code: ERROR_CODES.REQUIRED,
          message: t('menu:add.validation.primaryImageRequired'),
          severity: 'error'
        });
      }

      // 개별 이미지 검증
      images.forEach((image, index) => {
        if (image.size > VALIDATION_RULES.images.fileSize.max) {
          imageErrors.push({
            field: `image_${index}`,
            code: ERROR_CODES.MAX_VALUE,
            message: `${image.originalName || t('common:image')}: ${t('menu:validation.imageMaxSize', { max: 10 })}`,
            severity: 'error'
          });
        }

        if (image.type && !VALIDATION_RULES.images.fileType.allowed.includes(image.type)) {
          imageErrors.push({
            field: `image_${index}`,
            code: ERROR_CODES.TYPE,
            message: `${image.originalName || t('common:image')}: ${t('menu:validation.imageType')}`,
            severity: 'error'
          });
        }
      });
    }

    return imageErrors;
  }, [t]);

  // 옵션 그룹 검증
  const validateOptionGroups = useCallback((optionGroups) => {
    const optionErrors = [];

    // 그룹 개수 검증
    if (optionGroups.length > VALIDATION_RULES.optionGroups.maxGroups) {
      optionErrors.push({
        field: 'optionGroups',
        code: ERROR_CODES.MAX_VALUE,
        message: t('menu:validation.optionGroupsMaxCount', { max: VALIDATION_RULES.optionGroups.maxGroups }),
        severity: 'error'
      });
    }

    // 각 그룹별 검증
    optionGroups.forEach((group, groupIndex) => {
      const groupPrefix = `optionGroup_${groupIndex}`;

      // 그룹명 검증 (다국어 지원: name, nameKo, nameEn 중 하나라도 있으면 통과)
      const groupName = group.name || group.nameKo || group.nameEn || '';
      const groupNameErrors = validateField(
        'optionGroupName',
        groupName,
        VALIDATION_RULES.optionGroups.groupName
      );
      groupNameErrors.forEach(error => {
        optionErrors.push({
          field: `${groupPrefix}_name`,
          ...error
        });
      });

      // selectionType 필수 검증 (SINGLE 또는 MULTIPLE)
      if (!group.selectionType || !['SINGLE', 'MULTIPLE'].includes(group.selectionType)) {
        optionErrors.push({
          field: `${groupPrefix}_selectionType`,
          code: ERROR_CODES.REQUIRED,
          message: t('menu:validation.selectionTypeRequired'),
          severity: 'error'
        });
      }

      // 옵션 개수 검증
      if (!group.options || group.options.length === 0) {
        optionErrors.push({
          field: `${groupPrefix}_options`,
          code: ERROR_CODES.REQUIRED,
          message: t('menu:validation.optionGroupMinOptions'),
          severity: 'error'
        });
      } else {
        // 유효한 옵션 필터링 (이름이 있는 옵션만)
        const validOptions = group.options.filter(opt => {
          const optName = (opt.name || opt.nameKo || opt.nameEn || '').trim();
          return optName !== '';
        });

        // 유효한 옵션이 하나도 없으면 에러
        if (validOptions.length === 0) {
          optionErrors.push({
            field: `${groupPrefix}_options`,
            code: ERROR_CODES.REQUIRED,
            message: t('menu:validation.optionGroupMinOptions'),
            severity: 'error'
          });
        }

        // 최대 개수 검증 (유효한 옵션 기준)
        if (group.options.length > VALIDATION_RULES.optionGroups.options.maxOptionsPerGroup) {
          optionErrors.push({
            field: `${groupPrefix}_options`,
            code: ERROR_CODES.MAX_VALUE,
            message: t('menu:validation.optionGroupMaxOptions', { max: VALIDATION_RULES.optionGroups.options.maxOptionsPerGroup }),
            severity: 'error'
          });
        }
      }

      // 각 옵션별 검증
      group.options.forEach((option, optionIndex) => {
        const optionPrefix = `option_${groupIndex}_${optionIndex}`;

        // 옵션명 검증 (다국어 지원: name, nameKo, nameEn 중 하나라도 있으면 통과)
        const optionName = option.name || option.nameKo || option.nameEn || '';
        const optionNameErrors = validateField(
          'optionName',
          optionName,
          VALIDATION_RULES.optionGroups.options.optionName
        );
        optionNameErrors.forEach(error => {
          optionErrors.push({
            field: `${optionPrefix}_name`,
            ...error
          });
        });

        // 추가 가격 검증
        const priceErrors = validateField(
          'optionAdditionalPrice',
          option.price,
          VALIDATION_RULES.optionGroups.options.price
        );
        priceErrors.forEach(error => {
          optionErrors.push({
            field: `${optionPrefix}_price`,
            ...error
          });
        });
      });
    });

    return optionErrors;
  }, [validateField, t]);

  // 전체 검증
  const validateComplete = useCallback(() => {
    const allErrors = {};
    let errorCount = 0;

    // 기본 정보 검증
    Object.entries(VALIDATION_RULES.basic).forEach(([field, schema]) => {
      // ✅ name 필드는 다국어 지원: nameKo, name, nameEn 중 하나라도 있으면 통과
      let valueToValidate = formData[field];
      if (field === 'name') {
        valueToValidate = formData.nameKo || formData.name || formData.nameEn || '';
      }

      const fieldErrors = validateField(field, valueToValidate, schema);
      if (fieldErrors.length > 0) {
        allErrors[field] = fieldErrors;
        errorCount += fieldErrors.filter(e => e && (e.severity === 'error' || !e.severity)).length;
      }
    });
    
    // 재고 관계 검증
    if (formData.minStock && formData.stock && formData.minStock > formData.stock) {
      allErrors.minStock = allErrors.minStock || [];
      allErrors.minStock.push({
        code: ERROR_CODES.CUSTOM,
        message: t('menu:validation.minStockExceedsStock'),
        severity: 'warning'
      });
    }

    // 원가격 검증
    if (formData.originalPrice && formData.price && parseFloat(formData.originalPrice) <= parseFloat(formData.price)) {
      allErrors.originalPrice = allErrors.originalPrice || [];
      allErrors.originalPrice.push({
        code: ERROR_CODES.CUSTOM,
        message: t('menu:validation.originalPriceExceedsPrice'),
        severity: 'warning'
      });
    }
    
    // 이미지 검증 (profileImage 포함)
    const imageErrors = validateImages(
      formData.images || [],
      formData.imageUrl,
      formData.profileImage // ✅ 기존 이미지 URL 전달
    );
    imageErrors.forEach(error => {
      allErrors[error.field] = allErrors[error.field] || [];
      allErrors[error.field].push(error);
      if (error && (error.severity === 'error' || !error.severity)) errorCount++;
    });
    
    // 옵션 그룹 검증
    const optionErrors = validateOptionGroups(formData.optionGroups || []);
    optionErrors.forEach(error => {
      allErrors[error.field] = allErrors[error.field] || [];
      allErrors[error.field].push(error);
      if (error && (error.severity === 'error' || !error.severity)) errorCount++;
    });
    
    // 검증 결과 업데이트
    setErrors(allErrors);
    const isFormValid = errorCount === 0;
    setIsValid(isFormValid);
    
    // 검증 이력 저장
    setValidationHistory(prev => [
      ...prev.slice(-9), // 최근 10개만 유지
      {
        timestamp: new Date(),
        errorCount,
        warningCount: Object.values(allErrors).flat().filter(e => e && e.severity === 'warning').length,
        isValid: isFormValid
      }
    ]);
    
    return allErrors;
  }, [formData, validateField, validateImages, validateOptionGroups]);

  // 특정 필드 검증
  const validateSingleField = useCallback((field) => {
    if (VALIDATION_RULES.basic[field]) {
      const fieldErrors = validateField(field, formData[field], VALIDATION_RULES.basic[field]);
      
      setErrors(prev => ({
        ...prev,
        [field]: fieldErrors.length > 0 ? fieldErrors : undefined
      }));
      
      return fieldErrors;
    }
    return [];
  }, [formData, validateField]);

  // 에러가 있는 필드로 스크롤
  const scrollToFirstError = useCallback(() => {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const errorElement = document.querySelector(`[data-field="${firstErrorField}"], [name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // 포커스 설정 (약간의 딜레이 후)
        setTimeout(() => {
          errorElement.focus?.();
        }, 500);
      }
    }
  }, [errors]);

  // 실시간 검증 (autoValidate가 true일 때만)
  useEffect(() => {
    if (!autoValidate) return; // autoValidate가 false면 실시간 검증 비활성화

    const debounceTimer = setTimeout(() => {
      if (formData && Object.keys(formData).length > 0) {
        validateComplete();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [formData, validateComplete, autoValidate]);

  // 에러 통계 (방어적 처리)
  const errorStats = {
    total: Object.keys(errors).length,
    errors: Object.values(errors).flat().filter(e => e && (e.severity === 'error' || !e.severity)).length,
    warnings: Object.values(errors).flat().filter(e => e && e.severity === 'warning').length,
    hasErrors: Object.values(errors).flat().some(e => e && (e.severity === 'error' || !e.severity)),
    hasWarnings: Object.values(errors).flat().some(e => e && e.severity === 'warning')
  };

  return {
    errors,
    isValid,
    errorStats,
    validationHistory,
    validateComplete,
    validateSingleField,
    scrollToFirstError,
    
    // 유틸리티 함수들 (방어적 처리)
    hasErrors: () => errorStats.hasErrors,
    hasFieldError: (field) => errors[field]?.some(e => e && (e.severity === 'error' || !e.severity)),
    hasFieldWarning: (field) => errors[field]?.some(e => e && e.severity === 'warning'),
    getFieldError: (field) => errors[field]?.find(e => e && (e.severity === 'error' || !e.severity))?.message || null,
    getFieldErrors: (field) => errors[field]?.filter(e => e && (e.severity === 'error' || !e.severity)) || [],
    getFieldWarnings: (field) => errors[field]?.filter(e => e && e.severity === 'warning') || [],
    getFieldMessages: (field) => errors[field]?.map(e => e?.message).filter(Boolean) || [],
    clearErrors: (field) => {
      if (field) {
        setErrors(prev => ({
          ...prev,
          [field]: undefined
        }));
      } else {
        setErrors({});
      }
    },
    validationErrors: errors
  };
};