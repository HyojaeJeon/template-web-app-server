/**
 * 폼 유효성 검사 컴포넌트 (점주용)
 * 실시간 검증, 에러 표시, WCAG 2.1 준수
 */
'use client';

import React, { useState, useEffect } from 'react';

// 기본 유효성 검사 규칙
const defaultValidationRules = {
  required: (value) => {
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    return value != null && value !== '';
  },
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !value || emailRegex.test(value);
  },
  phone: (value) => {
    const phoneRegex = /^[0-9\-\+\(\)\s]{8,15}$/;
    return !value || phoneRegex.test(value.replace(/\s/g, ''));
  },
  minLength: (min) => (value) => {
    return !value || value.length >= min;
  },
  maxLength: (max) => (value) => {
    return !value || value.length <= max;
  },
  min: (min) => (value) => {
    return !value || Number(value) >= min;
  },
  max: (max) => (value) => {
    return !value || Number(value) <= max;
  },
  pattern: (regex) => (value) => {
    return !value || regex.test(value);
  },
  url: (value) => {
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    return !value || urlRegex.test(value);
  },
  number: (value) => {
    return !value || !isNaN(Number(value));
  },
  integer: (value) => {
    return !value || (Number.isInteger(Number(value)) && !value.includes('.'));
  },
  positiveNumber: (value) => {
    return !value || (Number(value) > 0);
  },
  vietnamPhone: (value) => {
    // Local 전화번호 형식: +84 또는 0으로 시작, 9-11자리
    const vnPhoneRegex = /^(\+84|0)[0-9]{8,10}$/;
    return !value || vnPhoneRegex.test(value.replace(/\s|-/g, ''));
  },
  vndCurrency: (value) => {
    // VND 화폐 형식 (숫자만, 천단위 구분자 제외)
    const vndRegex = /^\d+$/;
    return !value || vndRegex.test(value.replace(/[,\s]/g, ''));
  }
};

// 기본 에러 메시지
const defaultErrorMessages = {
  required: '이 필드는 필수입니다',
  email: '유효한 이메일 주소를 입력해주세요',
  phone: '유효한 전화번호를 입력해주세요',
  minLength: (min) => `최소 ${min}자 이상 입력해주세요`,
  maxLength: (max) => `최대 ${max}자까지 입력 가능합니다`,
  min: (min) => `${min} 이상의 값을 입력해주세요`,
  max: (max) => `${max} 이하의 값을 입력해주세요`,
  pattern: '올바른 형식으로 입력해주세요',
  url: '유효한 URL을 입력해주세요',
  number: '숫자만 입력해주세요',
  integer: '정수만 입력해주세요',
  positiveNumber: '양수만 입력해주세요',
  vietnamPhone: '올바른 Local 전화번호를 입력해주세요',
  vndCurrency: '올바른 금액을 입력해주세요'
};

const FormValidation = ({
  children,
  validationRules = {},
  errorMessages = {},
  validateOnChange = true,
  validateOnBlur = true,
  showSuccessIcon = true,
  debounceMs = 300,
  onValidationChange,
  className = '',
  ...props
}) => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const rules = { ...defaultValidationRules, ...validationRules };
  const messages = { ...defaultErrorMessages, ...errorMessages };

  // 개별 필드 검증
  const validateField = (name, value, showError = true) => {
    const fieldRules = rules[name] || {};
    const fieldErrors = [];

    Object.entries(fieldRules).forEach(([ruleName, rule]) => {
      let isValid = false;
      let ruleValue = rule;

      if (typeof rule === 'function') {
        isValid = rule(value);
      } else if (typeof rule === 'object' && rule.validator) {
        isValid = rule.validator(value);
        ruleValue = rule.value;
      } else if (typeof rule === 'boolean' && rule) {
        // 기본 규칙 사용
        const defaultRule = defaultValidationRules[ruleName];
        if (defaultRule) {
          isValid = defaultRule(value);
        }
      }

      if (!isValid) {
        const errorMessage = messages[name]?.[ruleName] || 
                           (typeof messages[ruleName] === 'function' 
                             ? messages[ruleName](ruleValue) 
                             : messages[ruleName]);
        fieldErrors.push(errorMessage);
      }
    });

    if (showError) {
      setErrors(prev => ({
        ...prev,
        [name]: fieldErrors.length > 0 ? fieldErrors[0] : null
      }));
    }

    return fieldErrors.length === 0;
  };

  // 전체 폼 검증
  const validateForm = () => {
    const formErrors = {};
    let formIsValid = true;

    Object.keys(values).forEach(name => {
      const fieldIsValid = validateField(name, values[name], false);
      if (!fieldIsValid) {
        const fieldRules = rules[name] || {};
        const fieldErrors = [];

        Object.entries(fieldRules).forEach(([ruleName, rule]) => {
          let isValid = false;
          let ruleValue = rule;

          if (typeof rule === 'function') {
            isValid = rule(values[name]);
          } else if (typeof rule === 'object' && rule.validator) {
            isValid = rule.validator(values[name]);
            ruleValue = rule.value;
          } else if (typeof rule === 'boolean' && rule) {
            const defaultRule = defaultValidationRules[ruleName];
            if (defaultRule) {
              isValid = defaultRule(values[name]);
            }
          }

          if (!isValid) {
            const errorMessage = messages[name]?.[ruleName] || 
                               (typeof messages[ruleName] === 'function' 
                                 ? messages[ruleName](ruleValue) 
                                 : messages[ruleName]);
            fieldErrors.push(errorMessage);
          }
        });

        formErrors[name] = fieldErrors[0] || null;
        formIsValid = false;
      }
    });

    setErrors(formErrors);
    setIsValid(formIsValid);
    return formIsValid;
  };

  // 디바운스된 검증
  const debouncedValidation = (name, value) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    setDebounceTimer(setTimeout(() => {
      validateField(name, value);
    }, debounceMs));
  };

  // 값 변경 핸들러
  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));

    if (validateOnChange && touched[name]) {
      if (debounceMs > 0) {
        debouncedValidation(name, value);
      } else {
        validateField(name, value);
      }
    }
  };

  // 블러 핸들러
  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));

    if (validateOnBlur) {
      validateField(name, values[name]);
    }
  };

  // 검증 상태 변경 시 콜백 호출
  useEffect(() => {
    const allFieldsValid = Object.keys(values).every(name => 
      errors[name] == null && (rules[name] == null || Object.keys(rules[name] || {}).length === 0 || validateField(name, values[name], false))
    );

    setIsValid(allFieldsValid);

    if (onValidationChange) {
      onValidationChange({
        isValid: allFieldsValid,
        errors,
        values
      });
    }
  }, [errors, values]);

  // 자식 컴포넌트에 프롭스 주입
  const enhancedChildren = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.props.name) {
      const { name } = child.props;
      const hasError = touched[name] && errors[name];
      const hasSuccess = touched[name] && !errors[name] && showSuccessIcon;

      return React.cloneElement(child, {
        value: values[name] || '',
        onChange: (e) => {
          const value = e.target ? e.target.value : e;
          handleChange(name, value);
          if (child.props.onChange) {
            child.props.onChange(e);
          }
        },
        onBlur: (e) => {
          handleBlur(name);
          if (child.props.onBlur) {
            child.props.onBlur(e);
          }
        },
        error: hasError ? errors[name] : undefined,
        success: hasSuccess,
        'aria-invalid': hasError ? 'true' : undefined,
        'aria-describedby': hasError ? `${name}-error` : undefined
      });
    }
    return child;
  });

  return (
    <div className={`form-validation ${className}`} {...props}>
      {enhancedChildren}
      
      {/* 폼 검증 요약 (접근성) */}
      <div className="sr-only" role="status" aria-live="polite">
        {Object.keys(errors).length > 0 && (
          <p>
            폼에 {Object.keys(errors).length}개의 오류가 있습니다
          </p>
        )}
      </div>
    </div>
  );
};

// 커스텀 훅으로도 사용 가능
export const useFormValidation = (initialValues = {}, validationRules = {}, options = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValid, setIsValid] = useState(false);

  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300
  } = options;

  const rules = { ...defaultValidationRules, ...validationRules };

  const validateField = (name, value) => {
    const fieldRules = rules[name] || {};
    const fieldErrors = [];

    Object.entries(fieldRules).forEach(([ruleName, rule]) => {
      let isValid = false;

      if (typeof rule === 'function') {
        isValid = rule(value);
      } else if (typeof rule === 'boolean' && rule) {
        const defaultRule = defaultValidationRules[ruleName];
        if (defaultRule) {
          isValid = defaultRule(value);
        }
      }

      if (!isValid) {
        const errorMessage = defaultErrorMessages[ruleName];
        fieldErrors.push(typeof errorMessage === 'function' ? errorMessage() : errorMessage);
      }
    });

    setErrors(prev => ({
      ...prev,
      [name]: fieldErrors.length > 0 ? fieldErrors[0] : null
    }));

    return fieldErrors.length === 0;
  };

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));

    if (validateOnChange && touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));

    if (validateOnBlur) {
      validateField(name, values[name]);
    }
  };

  const validateForm = () => {
    let formIsValid = true;
    
    Object.keys(values).forEach(name => {
      if (!validateField(name, values[name])) {
        formIsValid = false;
      }
    });

    setIsValid(formIsValid);
    return formIsValid;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsValid(false);
  };

  return {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    validateField,
    validateForm,
    reset
  };
};

export default FormValidation;