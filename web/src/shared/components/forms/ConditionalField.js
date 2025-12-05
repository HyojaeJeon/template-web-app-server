'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConditionalField = ({
  children,
  condition,
  watchValue,
  expectedValue,
  operator = 'equals',
  className = '',
  animationDuration = 0.3,
  'data-testid': testId,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // 조건 평가 함수
  const evaluateCondition = () => {
    if (typeof condition === 'function') {
      return condition(watchValue);
    }

    if (typeof condition === 'boolean') {
      return condition;
    }

    if (watchValue !== undefined && expectedValue !== undefined) {
      switch (operator) {
        case 'equals':
          return watchValue === expectedValue;
        case 'not_equals':
          return watchValue !== expectedValue;
        case 'greater_than':
          return Number(watchValue) > Number(expectedValue);
        case 'less_than':
          return Number(watchValue) < Number(expectedValue);
        case 'greater_equal':
          return Number(watchValue) >= Number(expectedValue);
        case 'less_equal':
          return Number(watchValue) <= Number(expectedValue);
        case 'contains':
          return String(watchValue).toLowerCase().includes(String(expectedValue).toLowerCase());
        case 'not_contains':
          return !String(watchValue).toLowerCase().includes(String(expectedValue).toLowerCase());
        case 'starts_with':
          return String(watchValue).toLowerCase().startsWith(String(expectedValue).toLowerCase());
        case 'ends_with':
          return String(watchValue).toLowerCase().endsWith(String(expectedValue).toLowerCase());
        case 'in_array':
          return Array.isArray(expectedValue) && expectedValue.includes(watchValue);
        case 'not_in_array':
          return Array.isArray(expectedValue) && !expectedValue.includes(watchValue);
        case 'empty':
          return !watchValue || (Array.isArray(watchValue) && watchValue.length === 0) || String(watchValue).trim() === '';
        case 'not_empty':
          return watchValue && !(Array.isArray(watchValue) && watchValue.length === 0) && String(watchValue).trim() !== '';
        default:
          return false;
      }
    }

    return false;
  };

  useEffect(() => {
    const newVisibility = evaluateCondition();
    setIsVisible(newVisibility);
  }, [watchValue, expectedValue, condition, operator]);

  // 애니메이션 variants
  const fieldVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      marginTop: 0,
      marginBottom: 0,
      transition: {
        duration: animationDuration,
        ease: 'easeInOut'
      }
    },
    visible: {
      opacity: 1,
      height: 'auto',
      marginTop: '0.5rem',
      marginBottom: '0.5rem',
      transition: {
        duration: animationDuration,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="conditional-field"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={fieldVariants}
          className={`overflow-hidden ${className}`}
          data-testid={testId}
          role="group"
          aria-live="polite"
          aria-label="조건부 필드"
          {...props}
        >
          <div className="space-y-2">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 고급 조건부 필드 그룹 컴포넌트
export const ConditionalFieldGroup = ({
  children,
  conditions = [],
  logic = 'AND', // 'AND' | 'OR'
  className = '',
  animationStagger = 0.1,
  'data-testid': testId,
  ...props
}) => {
  const [groupVisible, setGroupVisible] = useState(false);

  const evaluateGroupCondition = () => {
    if (conditions.length === 0) return true;

    if (logic === 'OR') {
      return conditions.some(condition => {
        if (typeof condition === 'function') return condition();
        if (typeof condition === 'boolean') return condition;
        return false;
      });
    }

    // AND logic (기본값)
    return conditions.every(condition => {
      if (typeof condition === 'function') return condition();
      if (typeof condition === 'boolean') return condition;
      return false;
    });
  };

  useEffect(() => {
    setGroupVisible(evaluateGroupCondition());
  }, [conditions, logic]);

  const groupVariants = {
    hidden: {
      opacity: 0,
      transition: {
        staggerChildren: animationStagger,
        staggerDirection: -1
      }
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: animationStagger,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: {
      y: -10,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <AnimatePresence>
      {groupVisible && (
        <motion.div
          key="conditional-group"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={groupVariants}
          className={`space-y-4 ${className}`}
          data-testid={testId}
          role="group"
          aria-live="polite"
          aria-label={`조건부 필드 그룹 (${logic} 조건)`}
          {...props}
        >
          {React.Children.map(children, (child, index) => (
            <motion.div key={index} variants={itemVariants}>
              {child}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 중첩된 조건부 필드
export const NestedConditionalField = ({
  children,
  parentCondition,
  childCondition,
  className = '',
  'data-testid': testId,
  ...props
}) => {
  return (
    <ConditionalField
      condition={parentCondition}
      className={className}
      data-testid={testId}
      {...props}
    >
      <ConditionalField condition={childCondition}>
        {children}
      </ConditionalField>
    </ConditionalField>
  );
};

// 조건부 필드 빌더 (동적 조건 생성용)
export const ConditionalFieldBuilder = ({
  fieldConfig = [],
  values = {},
  className = '',
  'data-testid': testId,
  ...props
}) => {
  const renderField = (config, index) => {
    const { condition, component: Component, props: fieldProps = {} } = config;

    let evaluatedCondition = false;

    if (typeof condition === 'function') {
      evaluatedCondition = condition(values);
    } else if (condition && condition.field && condition.value !== undefined) {
      const { field, value, operator = 'equals' } = condition;
      const fieldValue = values[field];

      switch (operator) {
        case 'equals':
          evaluatedCondition = fieldValue === value;
          break;
        case 'not_equals':
          evaluatedCondition = fieldValue !== value;
          break;
        case 'in_array':
          evaluatedCondition = Array.isArray(value) && value.includes(fieldValue);
          break;
        default:
          evaluatedCondition = false;
      }
    }

    return (
      <ConditionalField
        key={index}
        condition={evaluatedCondition}
        className="transition-all duration-300"
      >
        {Component && <Component {...fieldProps} />}
      </ConditionalField>
    );
  };

  return (
    <div
      className={`space-y-4 ${className}`}
      data-testid={testId}
      role="group"
      aria-label="동적 조건부 필드"
      {...props}
    >
      {fieldConfig.map(renderField)}
    </div>
  );
};

export default ConditionalField;