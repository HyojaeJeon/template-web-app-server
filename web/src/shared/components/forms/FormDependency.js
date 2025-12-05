'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * FormDependency - 폼 필드간 의존성 관리 컴포넌트
 * WCAG 2.1 준수 및 Local 테마 적용
 */
export default function FormDependency({ 
  children, 
  dependencies = [],
  onDependencyChange,
  debounceMs = 300,
  mode = 'all', // 'all' | 'any'
  className = '',
  disabled = false,
  loading = false,
  ...props 
}) {
  const [fieldValues, setFieldValues] = useState({});
  const [visibleFields, setVisibleFields] = useState(new Set());
  const [requiredFields, setRequiredFields] = useState(new Set());
  const debounceRef = useRef(null);

  // 의존성 규칙 평가
  const evaluateDependencies = (values) => {
    const newVisibleFields = new Set();
    const newRequiredFields = new Set();

    dependencies.forEach(dependency => {
      const { target, conditions, action = 'show', required = false } = dependency;
      
      let conditionsMet = false;
      
      if (mode === 'all') {
        conditionsMet = conditions.every(condition => {
          const value = values[condition.field];
          return evaluateCondition(value, condition);
        });
      } else {
        conditionsMet = conditions.some(condition => {
          const value = values[condition.field];
          return evaluateCondition(value, condition);
        });
      }

      if (conditionsMet) {
        if (action === 'show' || action === 'enable') {
          newVisibleFields.add(target);
        }
        if (required) {
          newRequiredFields.add(target);
        }
      }
    });

    setVisibleFields(newVisibleFields);
    setRequiredFields(newRequiredFields);

    // 의존성 변경 콜백 호출
    if (onDependencyChange) {
      onDependencyChange({
        visibleFields: Array.from(newVisibleFields),
        requiredFields: Array.from(newRequiredFields),
        fieldValues: values
      });
    }
  };

  // 조건 평가 함수
  const evaluateCondition = (value, condition) => {
    const { operator, value: expectedValue, values: expectedValues } = condition;

    switch (operator) {
      case 'equals':
        return value === expectedValue;
      case 'not_equals':
        return value !== expectedValue;
      case 'contains':
        return Array.isArray(value) ? value.includes(expectedValue) : 
               typeof value === 'string' ? value.includes(expectedValue) : false;
      case 'not_contains':
        return Array.isArray(value) ? !value.includes(expectedValue) : 
               typeof value === 'string' ? !value.includes(expectedValue) : true;
      case 'in':
        return expectedValues && expectedValues.includes(value);
      case 'not_in':
        return expectedValues && !expectedValues.includes(value);
      case 'greater_than':
        return Number(value) > Number(expectedValue);
      case 'less_than':
        return Number(value) < Number(expectedValue);
      case 'empty':
        return !value || (Array.isArray(value) && value.length === 0) || value === '';
      case 'not_empty':
        return value && (Array.isArray(value) ? value.length > 0 : value !== '');
      case 'length_equals':
        return value && value.length === Number(expectedValue);
      case 'length_greater':
        return value && value.length > Number(expectedValue);
      case 'length_less':
        return value && value.length < Number(expectedValue);
      case 'regex':
        return value && new RegExp(expectedValue).test(value);
      case 'custom':
        return typeof expectedValue === 'function' ? expectedValue(value) : false;
      default:
        return Boolean(value);
    }
  };

  // 필드 값 변경 핸들러
  const handleFieldChange = (fieldName, value) => {
    const newValues = { ...fieldValues, [fieldName]: value };
    setFieldValues(newValues);

    // 디바운싱 적용
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      evaluateDependencies(newValues);
    }, debounceMs);
  };

  // 필드 visibility 체크
  const isFieldVisible = (fieldName) => {
    // 의존성이 없는 필드는 기본적으로 보임
    const hasVisibilityDependency = dependencies.some(dep => dep.target === fieldName && 
      (dep.action === 'show' || dep.action === 'hide'));
    
    if (!hasVisibilityDependency) return true;
    
    return visibleFields.has(fieldName);
  };

  // 필드 required 체크
  const isFieldRequired = (fieldName) => {
    return requiredFields.has(fieldName);
  };

  // children에 의존성 정보 주입
  const enhanceChildren = (children) => {
    return Array.isArray(children) ? 
      children.map(child => enhanceChild(child)) : 
      enhanceChild(children);
  };

  const enhanceChild = (child) => {
    if (!child || typeof child !== 'object') return child;

    const { props: childProps = {} } = child;
    const fieldName = childProps.name || childProps.id;

    if (!fieldName) return child;

    // 필드 정보 계산
    const isVisible = isFieldVisible(fieldName);
    const isRequired = isFieldRequired(fieldName);
    const currentValue = fieldValues[fieldName];

    // props 확장
    const enhancedProps = {
      ...childProps,
      style: {
        display: isVisible ? undefined : 'none',
        ...childProps.style
      },
      required: isRequired || childProps.required,
      value: currentValue !== undefined ? currentValue : childProps.value,
      onChange: (e) => {
        const value = e.target ? e.target.value : e;
        handleFieldChange(fieldName, value);
        if (childProps.onChange) childProps.onChange(e);
      },
      'aria-required': isRequired,
      'aria-hidden': !isVisible,
      disabled: disabled || childProps.disabled || loading
    };

    return {
      ...child,
      props: enhancedProps,
      key: child.key || fieldName
    };
  };

  // 초기 평가
  useEffect(() => {
    evaluateDependencies(fieldValues);
  }, [dependencies, mode]);

  // cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div 
      className={`form-dependency-container ${className}`}
      {...props}
    >
      {/* 로딩 상태 */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#2AC1BC] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600 dark:text-gray-300">의존성 처리 중...</span>
          </div>
        </div>
      )}

      {/* 디버그 정보 (개발 환경) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-3 mb-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-xs">
          <details>
            <summary className="cursor-pointer font-medium text-blue-800 dark:text-blue-200 mb-2">
              의존성 디버그 정보
            </summary>
            <div className="space-y-1 text-blue-700 dark:text-blue-300">
              <div>모드: {mode}</div>
              <div>보이는 필드: {Array.from(visibleFields).join(', ') || '없음'}</div>
              <div>필수 필드: {Array.from(requiredFields).join(', ') || '없음'}</div>
              <div>필드 값: {JSON.stringify(fieldValues, null, 2)}</div>
            </div>
          </details>
        </div>
      )}

      {/* 향상된 children 렌더링 */}
      {enhanceChildren(children)}
    </div>
  );
}

// Hook for using form dependency
export function useFormDependency() {
  const [dependencies, setDependencies] = useState([]);
  const [fieldValues, setFieldValues] = useState({});

  const addDependency = (dependency) => {
    setDependencies(prev => [...prev, dependency]);
  };

  const removeDependency = (target) => {
    setDependencies(prev => prev.filter(dep => dep.target !== target));
  };

  const updateFieldValue = (field, value) => {
    setFieldValues(prev => ({ ...prev, [field]: value }));
  };

  const clearDependencies = () => {
    setDependencies([]);
    setFieldValues({});
  };

  return {
    dependencies,
    fieldValues,
    addDependency,
    removeDependency,
    updateFieldValue,
    clearDependencies
  };
}

// 미리 정의된 일반적인 의존성 규칙들
export const CommonDependencies = {
  // 선택에 따라 다른 필드 표시
  showOnSelect: (sourceField, targetField, value) => ({
    target: targetField,
    conditions: [{ field: sourceField, operator: 'equals', value }],
    action: 'show'
  }),

  // 체크박스 상태에 따라 필드 표시
  showOnCheck: (sourceField, targetField) => ({
    target: targetField,
    conditions: [{ field: sourceField, operator: 'equals', value: true }],
    action: 'show'
  }),

  // 값이 비어있지 않을 때 표시
  showOnNotEmpty: (sourceField, targetField) => ({
    target: targetField,
    conditions: [{ field: sourceField, operator: 'not_empty' }],
    action: 'show'
  }),

  // 특정 값들 중 하나일 때 필수
  requiredOnValues: (sourceField, targetField, values) => ({
    target: targetField,
    conditions: [{ field: sourceField, operator: 'in', values }],
    action: 'show',
    required: true
  })
};