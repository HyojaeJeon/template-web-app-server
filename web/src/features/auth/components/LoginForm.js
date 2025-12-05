'use client';

import { useState, useCallback } from 'react';
import EmailInput from '../../../shared/components/ui/inputs/EmailInput';
import PasswordInput from '../../../shared/components/ui/inputs/PasswordInput';
import LoadingButton from '../../../shared/components/ui/buttons/LoadingButton';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import SocialLoginButtons from './SocialLoginButtons';

/**
 * LoginForm 컴포넌트
 * WCAG 2.1 준수, 실시간 유효성 검사 지원
 */
export default function LoginForm({ onSubmit, loading = false, error = '' }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: ''
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false
  });

  // 입력 핸들러
  const handleInputChange = useCallback((field) => (value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 에러 클리어
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [validationErrors]);

  // 체크박스 핸들러
  const handleCheckboxChange = useCallback((e) => {
    setFormData(prev => ({
      ...prev,
      rememberMe: e.target.checked
    }));
  }, []);

  // 필드 블러 핸들러
  const handleBlur = useCallback((field) => () => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    // 간단한 유효성 검사
    const errors = {};
    if (field === 'email' && !formData.email) {
      errors.email = '이메일을 입력해주세요';
    } else if (field === 'email' && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = '올바른 이메일 형식이 아닙니다';
    }

    if (field === 'password' && !formData.password) {
      errors.password = '비밀번호를 입력해주세요';
    }

    setValidationErrors(prev => ({
      ...prev,
      ...errors
    }));
  }, [formData]);

  // 폼 제출 핸들러
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // 전체 유효성 검사
    const errors = {};
    if (!formData.email) {
      errors.email = '이메일을 입력해주세요';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = '올바른 이메일 형식이 아닙니다';
    }

    if (!formData.password) {
      errors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 8) {
      errors.password = '비밀번호는 8자 이상이어야 합니다';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setTouched({ email: true, password: true });
      return;
    }

    // 부모 컴포넌트에 제출
    await onSubmit({
      email: formData.email,
      password: formData.password,
      rememberMe: formData.rememberMe
    });
  }, [formData, onSubmit]);

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-4" 
      noValidate
      role="form"
      aria-label="로그인 폼"
    >
      {/* 전역 에러 메시지 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-3" role="alert">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 이메일 입력 */}
      <div>
        <EmailInput
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange('email')}
          onBlur={handleBlur('email')}
          label="이메일 주소"
          placeholder="store@example.com"
          required
          disabled={loading}
          error={touched.email ? validationErrors.email : ''}
          autoComplete="email"
          className="w-full"
        />
      </div>

      {/* 비밀번호 입력 */}
      <div>
        <PasswordInput
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange('password')}
          onBlur={handleBlur('password')}
          label="로그인 비밀번호"
          placeholder="비밀번호를 입력하세요"
          required
          disabled={loading}
          error={touched.password ? validationErrors.password : ''}
          autoComplete="current-password"
          showStrength={false}
          className="w-full"
        />
      </div>

      {/* 로그인 버튼 */}
      <LoadingButton
        type="submit"
        loading={loading}
        disabled={loading}
        loadingText="로그인 중..."
        style={{ minHeight: '44px' }}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-vietnam-mint to-vietnam-green hover:from-vietnam-mint-dark hover:to-vietnam-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-gray-800 focus:ring-vietnam-mint disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        로그인
      </LoadingButton>

      {/* 로그인 상태 유지 체크박스 */}
      <div className="flex items-center justify-between">
        <label className="flex items-center cursor-pointer min-h-[44px] py-2">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={handleCheckboxChange}
            disabled={loading}
            className="h-5 w-5 text-vietnam-mint focus:ring-vietnam-mint border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
            로그인 상태 유지
          </span>
        </label>

        <div className="text-sm">
          <a 
            href="/forgot-password" 
            className="inline-block min-h-[44px] py-3 px-2 font-medium text-vietnam-mint hover:text-vietnam-mint-dark focus:outline-none focus:ring-2 focus:ring-vietnam-mint rounded"
          >
            비밀번호 찾기
          </a>
        </div>
      </div>

      {/* 소셜 로그인 버튼 */}
      <SocialLoginButtons 
        mode="login"
        redirectTo="/dashboard"
        onSuccess={(result) => {
          console.log('소셜 로그인 성공:', result);
        }}
        onError={(error) => {
          console.error('소셜 로그인 실패:', error);
        }}
      />

      {/* 접근성을 위한 숨겨진 상태 메시지 */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {loading && '로그인 처리 중입니다. 잠시만 기다려주세요.'}
        {error && `오류: ${error}`}
      </div>
    </form>
  );
}