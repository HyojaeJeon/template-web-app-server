'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * 폼 유효성 검증 훅과 유틸리티
 * Local 현지화 지원과 접근성 고려
 */

// 유효성 검증 규칙 타입
const VALIDATION_RULES = {
  REQUIRED: 'required',
  EMAIL: 'email',
  PHONE: 'phone',
  PHONE_VN: 'phoneVN', // Local 전화번호
  MIN_LENGTH: 'minLength',
  MAX_LENGTH: 'maxLength',
  PATTERN: 'pattern',
  CUSTOM: 'custom'
};

// Local 전화번호 패턴
const VN_PHONE_PATTERN = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

// 기본 유효성 검증 함수들
const validators = {
  required: (value) => {
    const trimmed = typeof value === 'string' ? value.trim() : value;
    return trimmed !== '' && trimmed !== null && trimmed !== undefined;
  },
  
  email: (value) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !value || emailPattern.test(value);
  },
  
  phone: (value) => {
    const phonePattern = /^[+]?[(]?[\d\s\-()]{10,}$/;
    return !value || phonePattern.test(value.replace(/\s/g, ''));
  },
  
  phoneVN: (value) => {
    return !value || VN_PHONE_PATTERN.test(value.replace(/\s/g, ''));
  },
  
  minLength: (value, min) => {
    return !value || value.length >= min;
  },
  
  maxLength: (value, max) => {
    return !value || value.length <= max;
  },
  
  pattern: (value, pattern) => {
    return !value || pattern.test(value);
  }
};

// 기본 에러 메시지 (다국어 지원)
const getDefaultErrorMessage = (rule, param, lang = 'ko') => {
  const messages = {
    ko: {
      required: '필수 입력 항목입니다.',
      email: '올바른 이메일 주소를 입력해주세요.',
      phone: '올바른 전화번호를 입력해주세요.',
      phoneVN: '올바른 Local 전화번호를 입력해주세요. (예: +84 90 123 4567)',
      minLength: `최소 ${param}자 이상 입력해주세요.`,
      maxLength: `최대 ${param}자까지 입력 가능합니다.`,
      pattern: '입력 형식이 올바르지 않습니다.'
    },
    vi: {
      required: 'Trường này là bắt buộc.',
      email: 'Vui lòng nhập địa chỉ email hợp lệ.',
      phone: 'Vui lòng nhập số điện thoại hợp lệ.',
      phoneVN: 'Vui lòng nhập số điện thoại Việt Nam hợp lệ. (VD: +84 90 123 4567)',
      minLength: `Vui lòng nhập ít nhất ${param} ký tự.`,
      maxLength: `Tối đa ${param} ký tự được phép.`,
      pattern: 'Định dạng nhập không hợp lệ.'
    },
    en: {
      required: 'This field is required.',
      email: 'Please enter a valid email address.',
      phone: 'Please enter a valid phone number.',
      phoneVN: 'Please enter a valid Vietnamese phone number. (e.g., +84 90 123 4567)',
      minLength: `Please enter at least ${param} characters.`,
      maxLength: `Maximum ${param} characters allowed.`,
      pattern: 'Invalid input format.'
    }
  };
  
  return messages[lang]?.[rule] || messages.ko[rule];
};

// 유효성 검증 프리셋 (Local 배달 앱 특화)
export const validationPresets = {
  // 매장명 검증
  storeName: [
    { type: VALIDATION_RULES.REQUIRED },
    { type: VALIDATION_RULES.MIN_LENGTH, param: 2 },
    { type: VALIDATION_RULES.MAX_LENGTH, param: 50 }
  ],

  // Local 전화번호 검증
  phone: [
    { type: VALIDATION_RULES.REQUIRED },
    { type: VALIDATION_RULES.PHONE_VN }
  ],

  // 이메일 검증
  email: [
    { type: VALIDATION_RULES.EMAIL }
  ],

  // 주소 검증
  address: [
    { type: VALIDATION_RULES.REQUIRED },
    { type: VALIDATION_RULES.MIN_LENGTH, param: 10 },
    { type: VALIDATION_RULES.MAX_LENGTH, param: 200 }
  ],

  // 메뉴 가격 검증 (VND)
  menuPrice: [
    { type: VALIDATION_RULES.REQUIRED },
    { type: VALIDATION_RULES.PATTERN, param: /^[1-9]\d*000$/ } // 1000 VND 단위
  ],

  // 배달료 검증
  deliveryFee: [
    { type: VALIDATION_RULES.PATTERN, param: /^\d*000$/ } // 1000 VND 단위, 선택사항
  ]
};

/**
 * 단일 필드 유효성 검증 함수
 * @param {*} value - 검증할 값
 * @param {Array} rules - 검증 규칙 배열
 * @param {string} lang - 언어 설정
 * @returns {Object} { isValid, error }
 */
export const validateField = (value, rules = [], lang = 'ko') => {
  if (!rules || rules.length === 0) {
    return { isValid: true, error: null };
  }

  for (const rule of rules) {
    let isValid = false;
    let errorMessage = null;

    if (typeof rule === 'string') {
      // 단순 규칙
      isValid = validators[rule]?.(value) ?? true;
      if (!isValid) {
        errorMessage = getDefaultErrorMessage(rule, null, lang);
      }
    } else if (typeof rule === 'object') {
      // 복합 규칙
      const { type, param, message } = rule;
      
      if (type === VALIDATION_RULES.CUSTOM && typeof param === 'function') {
        // 커스텀 검증 함수
        const result = param(value);
        isValid = typeof result === 'boolean' ? result : result.isValid;
        errorMessage = message || (typeof result === 'object' ? result.error : null);
      } else if (validators[type]) {
        // 내장 검증 함수
        isValid = validators[type](value, param);
        if (!isValid) {
          errorMessage = message || getDefaultErrorMessage(type, param, lang);
        }
      }
    }

    if (!isValid) {
      return { isValid: false, error: errorMessage };
    }
  }

  return { isValid: true, error: null };
};

/**
 * 폼 유효성 검증 훅
 * @param {Object} initialValues - 초기값
 * @param {Object} validationRules - 각 필드별 검증 규칙
 * @param {string} lang - 언어 설정
 */
export const useFormValidation = (initialValues = {}, validationRules = {}, lang = 'ko') => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 단일 필드 값 업데이트
  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // 실시간 검증 (이미 터치된 필드만)
    if (touched[name] && validationRules[name]) {
      const validation = validateField(value, validationRules[name], lang);
      setErrors(prev => ({ 
        ...prev, 
        [name]: validation.error 
      }));
    }
  }, [validationRules, touched, lang]);

  // 필드 터치 상태 업데이트
  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
    
    // 터치 시 검증 수행
    if (isTouched && validationRules[name]) {
      const validation = validateField(values[name], validationRules[name], lang);
      setErrors(prev => ({ 
        ...prev, 
        [name]: validation.error 
      }));
    }
  }, [values, validationRules, lang]);

  // 전체 폼 검증
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isFormValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const validation = validateField(values[fieldName], validationRules[fieldName], lang);
      if (!validation.isValid) {
        newErrors[fieldName] = validation.error;
        isFormValid = false;
      }
    });

    setErrors(newErrors);
    return isFormValid;
  }, [values, validationRules, lang]);

  // 특정 필드 검증
  const validateSingleField = useCallback((fieldName) => {
    if (!validationRules[fieldName]) return true;
    
    const validation = validateField(values[fieldName], validationRules[fieldName], lang);
    setErrors(prev => ({ 
      ...prev, 
      [fieldName]: validation.error 
    }));
    
    return validation.isValid;
  }, [values, validationRules, lang]);

  // 에러 초기화
  const clearErrors = useCallback((fieldNames = null) => {
    if (fieldNames) {
      const fieldsArray = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
      setErrors(prev => {
        const newErrors = { ...prev };
        fieldsArray.forEach(name => delete newErrors[name]);
        return newErrors;
      });
    } else {
      setErrors({});
    }
  }, []);

  // 폼 리셋
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setWarnings({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // 필드 핸들러들
  const handleChange = useCallback((fieldName, value) => {
    setValue(fieldName, value);
  }, [setValue]);

  const handleBlur = useCallback((fieldName) => {
    setFieldTouched(fieldName, true);
  }, [setFieldTouched]);

  const handleFocus = useCallback((fieldName) => {
    // 포커스 시 특별한 로직이 필요한 경우 여기에 추가
    // 현재는 기본 구현
  }, []);

  // 필드 핸들러 생성기
  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] || '',
    error: errors[name],
    onChange: (e) => {
      const value = e.target ? e.target.value : e;
      setValue(name, value);
    },
    onBlur: () => setFieldTouched(name, true)
  }), [values, errors, setValue, setFieldTouched]);

  // 폼 제출 핸들러
  const handleSubmit = useCallback((onSubmit) => (e) => {
    if (e) e.preventDefault();
    
    setIsSubmitting(true);
    
    // 모든 필드를 터치됨으로 표시
    const allFieldNames = Object.keys(validationRules);
    const touchedState = {};
    allFieldNames.forEach(name => touchedState[name] = true);
    setTouched(touchedState);
    
    // 폼 검증
    const isValid = validateForm();
    
    if (isValid && onSubmit) {
      Promise.resolve(onSubmit(values))
        .finally(() => setIsSubmitting(false));
    } else {
      setIsSubmitting(false);
    }
  }, [values, validateForm, validationRules]);

  // 폼 상태
  const isValid = Object.keys(errors).length === 0;
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);
  const hasErrors = Object.keys(errors).some(key => errors[key]);

  return {
    values,
    errors,
    warnings,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    hasErrors,
    setValue,
    setValues,
    setFieldTouched,
    validateForm,
    validateSingleField,
    clearErrors,
    resetForm,
    getFieldProps,
    handleSubmit,
    handleChange,
    handleBlur,
    handleFocus
  };
};

/**
 * 실시간 검증 컴포넌트
 */
export const FormValidation = ({ 
  children, 
  validationRules = {}, 
  lang = 'ko',
  onValidationChange 
}) => {
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const validateField_ = useCallback((name, value) => {
    if (!validationRules[name]) return;
    
    const validation = validateField(value, validationRules[name], lang);
    setFieldErrors(prev => ({
      ...prev,
      [name]: validation.error
    }));
    
    if (onValidationChange) {
      onValidationChange(name, validation);
    }
  }, [validationRules, lang, onValidationChange]);

  const handleFieldChange = useCallback((name, value) => {
    setFieldValues(prev => ({ ...prev, [name]: value }));
    validateField_(name, value);
  }, [validateField_]);

  return (
    <div className="form-validation-wrapper">
      {typeof children === 'function' ? 
        children({ 
          fieldValues, 
          fieldErrors, 
          handleFieldChange, 
          validateField: validateField_
        }) : 
        children
      }
    </div>
  );
};

// 내보내기
export {
  VALIDATION_RULES,
  validators,
  getDefaultErrorMessage
};

// 기본 내보내기 추가
export default FormValidation;