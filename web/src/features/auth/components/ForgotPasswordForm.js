'use client';

import { useState, useCallback } from 'react';
import EmailInput from '../../../shared/components/ui/inputs/EmailInput';
import PhoneInput from '../../../shared/components/ui/vietnam/VietnamPhoneInput';
import LoadingButton from '../../../shared/components/ui/buttons/LoadingButton';
import { ExclamationTriangleIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/shared/i18n';

/**
 * ForgotPasswordForm 컴포넌트
 * 비밀번호 재설정 요청 폼 (WCAG 2.1 준수)
 */
export default function ForgotPasswordForm({ 
  onSubmit, 
  loading = false, 
  error = '' 
}) {
  const { t } = useTranslation();
  
  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    identifier: '', // 이메일 또는 전화번호
    method: 'EMAIL' // EMAIL 또는 SMS
  });

  // 유효성 검사 에러
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});

  // 현재 선택된 방법이 이메일인지 확인
  const isEmailMethod = formData.method === 'EMAIL';

  // 입력 변경 핸들러
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 실시간 유효성 검사
    validateField(field, value);
  }, []);

  // 입력 필드 blur 핸들러
  const handleInputBlur = useCallback((field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  }, []);

  // 개별 필드 유효성 검사
  const validateField = useCallback((field, value) => {
    const errors = { ...validationErrors };

    switch (field) {
      case 'identifier':
        if (!value) {
          errors.identifier = t('common.form.validation.required', '필수 입력 항목입니다.');
        } else if (formData.method === 'EMAIL') {
          // 이메일 형식 검증
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.identifier = t('common.form.validation.invalidEmail', '올바른 이메일 주소를 입력하세요.');
          } else {
            delete errors.identifier;
          }
        } else {
          // 전화번호 형식 검증 (Local 형식)
          const phoneRegex = /^(\+84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-6|8|9]|9[0-4|6-9])[0-9]{7}$/;
          if (!phoneRegex.test(value.replace(/[\s\-]/g, ''))) {
            errors.identifier = t('common.form.validation.invalidPhone', '올바른 전화번호를 입력하세요.');
          } else {
            delete errors.identifier;
          }
        }
        break;
    }

    setValidationErrors(errors);
  }, [validationErrors, formData.method, t]);

  // 폼 제출 핸들러
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // 모든 필드를 touched로 설정하여 에러 표시
    setTouched({
      identifier: true
    });
    
    // 전체 유효성 검사
    validateField('identifier', formData.identifier);
    
    // 에러가 있으면 제출하지 않음
    if (Object.keys(validationErrors).length > 0 || !formData.identifier) {
      return;
    }
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  }, [formData, validationErrors, onSubmit, validateField]);

  // 방법 변경 핸들러
  const handleMethodChange = useCallback((method) => {
    setFormData(prev => ({
      ...prev,
      method,
      identifier: '' // 방법 변경 시 입력값 초기화
    }));
    setValidationErrors({});
    setTouched({});
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 transition-colors duration-300" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 dark:text-red-300" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-200 transition-colors duration-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 재설정 방법 선택 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors duration-300">
          {t('common.auth.resetMethod', '재설정 방법')}
        </label>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => handleMethodChange('EMAIL')}
            className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
              isEmailMethod
                ? 'border-vietnam-green bg-vietnam-green-pale dark:bg-vietnam-green-dark/20 text-vietnam-green-dark dark:text-vietnam-green-light border-vietnam-green dark:border-vietnam-green-light'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <EnvelopeIcon className="h-5 w-5 mr-2" />
            {t('common.auth.email', '이메일')}
          </button>
          <button
            type="button"
            onClick={() => handleMethodChange('SMS')}
            className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
              !isEmailMethod
                ? 'border-vietnam-green bg-vietnam-green-pale dark:bg-vietnam-green-dark/20 text-vietnam-green-dark dark:text-vietnam-green-light border-vietnam-green dark:border-vietnam-green-light'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <DevicePhoneMobileIcon className="h-5 w-5 mr-2" />
            {t('common.auth.sms', 'SMS')}
          </button>
        </div>
      </div>

      {/* 식별자 입력 (이메일 또는 전화번호) */}
      <div className="space-y-1">
        {isEmailMethod ? (
          <EmailInput
            id="identifier"
            label={t('common.auth.email', '이메일')}
            value={formData.identifier}
            onChange={(value) => handleInputChange('identifier', value)}
            onBlur={() => handleInputBlur('identifier')}
            error={touched.identifier && validationErrors.identifier}
            required
            autoComplete="email"
            placeholder={t('common.auth.enterEmail', '이메일 주소를 입력하세요')}
          />
        ) : (
          <PhoneInput
            id="identifier"
            label={t('common.auth.phone', '전화번호')}
            value={formData.identifier}
            onChange={(value) => handleInputChange('identifier', value)}
            onBlur={() => handleInputBlur('identifier')}
            error={touched.identifier && validationErrors.identifier}
            required
            autoComplete="tel"
            placeholder={t('common.auth.enterPhone', '전화번호를 입력하세요')}
          />
        )}
      </div>

      {/* 안내 메시지 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 transition-colors duration-300">
        <div className="text-sm text-blue-800 dark:text-blue-200 transition-colors duration-300">
          <p className="font-medium mb-1">
            {isEmailMethod 
              ? t('common.auth.emailResetInfo', '이메일로 재설정 링크를 보내드립니다')
              : t('common.auth.smsResetInfo', 'SMS로 재설정 코드를 보내드립니다')
            }
          </p>
          <p>
            {t('common.auth.resetTimeLimit', '재설정 링크는 30분 후 만료됩니다.')}
          </p>
        </div>
      </div>

      {/* 제출 버튼 */}
      <LoadingButton
        type="submit"
        loading={loading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-vietnam-green hover:bg-vietnam-green-dark dark:bg-vietnam-mint dark:hover:bg-vietnam-mint-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-vietnam-green dark:focus:ring-vietnam-mint disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        disabled={loading || Object.keys(validationErrors).length > 0 || !formData.identifier}
      >
        {isEmailMethod 
          ? t('common.auth.sendResetLink', '재설정 링크 전송')
          : t('common.auth.sendResetCode', '재설정 코드 전송')
        }
      </LoadingButton>
    </form>
  );
}