'use client';

import { useState, useCallback, useEffect } from 'react';
import EmailInput from '../../../shared/components/ui/inputs/EmailInput';
import PasswordInput from '../../../shared/components/ui/inputs/PasswordInput';
import PhoneInput from '../../../shared/components/ui/vietnam/VietnamPhoneInput';
import TextInput from '../../../shared/components/ui/inputs/TextInput';
import LoadingButton from '../../../shared/components/ui/buttons/LoadingButton';
import { ExclamationTriangleIcon, CheckIcon } from '@heroicons/react/24/outline';

/**
 * RegisterForm 컴포넌트
 * 단계별 회원가입 프로세스 (WCAG 2.1 준수)
 */
export default function RegisterForm({ 
  onSubmit, 
  loading = false, 
  error = '', 
  currentStep = 1,
  onStepChange 
}) {
  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    // Step 1: 기본 정보
    email: '',
    password: '',
    confirmPassword: '',
    ownerName: '',
    phone: '',
    
    // Step 2: 매장 정보
    storeName: '',
    businessNumber: '',
    storeAddress: '',
    storePhone: '',
    storeCategory: '',
    
    // Step 3: 인증 설정
    termsAccepted: false,
    privacyAccepted: false,
    marketingAccepted: false,
    emailVerified: false,
    verificationCode: ''
  });

  // 유효성 검사 에러
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});

  // 비밀번호 요구사항 체크
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecial: false
  });

  // 비밀번호 강도 체크
  useEffect(() => {
    const password = formData.password;
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*]/.test(password)
    });
  }, [formData.password]);

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
  const handleCheckboxChange = useCallback((field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.checked
    }));
  }, []);

  // 필드 블러 핸들러
  const handleBlur = useCallback((field) => () => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    validateField(field);
  }, [formData]);

  // 필드별 유효성 검사
  const validateField = (field) => {
    const errors = {};

    switch (field) {
      case 'email':
        if (!formData.email) {
          errors.email = '이메일을 입력해주세요';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          errors.email = '올바른 이메일 형식이 아닙니다';
        }
        break;
      case 'password':
        if (!formData.password) {
          errors.password = '비밀번호를 입력해주세요';
        } else if (formData.password.length < 8) {
          errors.password = '비밀번호는 8자 이상이어야 합니다';
        }
        break;
      case 'confirmPassword':
        if (!formData.confirmPassword) {
          errors.confirmPassword = '비밀번호 확인을 입력해주세요';
        } else if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = '비밀번호가 일치하지 않습니다';
        }
        break;
      case 'phone':
        if (!formData.phone) {
          errors.phone = '전화번호를 입력해주세요';
        } else if (!/^[0-9-+()]*$/.test(formData.phone)) {
          errors.phone = '올바른 전화번호 형식이 아닙니다';
        }
        break;
      case 'businessNumber':
        if (!formData.businessNumber) {
          errors.businessNumber = '사업자 등록번호를 입력해주세요';
        } else if (!/^\d{3}-\d{2}-\d{5}$/.test(formData.businessNumber)) {
          errors.businessNumber = '올바른 사업자 등록번호 형식이 아닙니다 (예: 123-45-67890)';
        }
        break;
    }

    setValidationErrors(prev => ({
      ...prev,
      ...errors
    }));

    return Object.keys(errors).length === 0;
  };

  // 단계별 유효성 검사
  const validateStep = (step) => {
    let fieldsToValidate = [];
    
    switch (step) {
      case 1:
        fieldsToValidate = ['email', 'password', 'confirmPassword', 'ownerName', 'phone'];
        break;
      case 2:
        fieldsToValidate = ['storeName', 'businessNumber', 'storeAddress', 'storePhone', 'storeCategory'];
        break;
      case 3:
        return formData.termsAccepted && formData.privacyAccepted;
    }

    const errors = {};
    let isValid = true;

    fieldsToValidate.forEach(field => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  };

  // 다음 단계 이동
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      onStepChange(currentStep + 1);
    } else {
      // 현재 단계의 모든 필드를 touched로 표시
      const stepFields = getStepFields(currentStep);
      const newTouched = {};
      stepFields.forEach(field => {
        newTouched[field] = true;
      });
      setTouched(prev => ({ ...prev, ...newTouched }));
    }
  }, [currentStep, formData, onStepChange]);

  // 이전 단계로
  const handlePrevious = useCallback(() => {
    onStepChange(currentStep - 1);
  }, [currentStep, onStepChange]);

  // 단계별 필드 가져오기
  const getStepFields = (step) => {
    switch (step) {
      case 1:
        return ['email', 'password', 'confirmPassword', 'ownerName', 'phone'];
      case 2:
        return ['storeName', 'businessNumber', 'storeAddress', 'storePhone', 'storeCategory'];
      case 3:
        return ['termsAccepted', 'privacyAccepted'];
      default:
        return [];
    }
  };

  // 이메일 인증 요청
  const handleEmailVerification = useCallback(async () => {
    // 이메일 인증 코드 전송 API 호출
    console.log('이메일 인증 코드 전송:', formData.email);
  }, [formData.email]);

  // 폼 제출
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (currentStep < 3) {
      handleNext();
      return;
    }

    // 마지막 단계에서 전체 유효성 검사
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    // 부모 컴포넌트에 제출
    await onSubmit(formData);
  }, [currentStep, formData, handleNext, onSubmit]);

  // Step 1: 기본 정보
  const renderStep1 = () => (
    <div className="space-y-6">
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
        className="w-full"
      />

      <PasswordInput
        id="password"
        name="password"
        value={formData.password}
        onChange={handleInputChange('password')}
        onBlur={handleBlur('password')}
        label="비밀번호"
        placeholder="8자 이상의 비밀번호"
        required
        disabled={loading}
        error={touched.password ? validationErrors.password : ''}
        showStrengthIndicator={true}
        showRequirements={true}
        className="w-full"
      />

      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleInputChange('confirmPassword')}
        onBlur={handleBlur('confirmPassword')}
        label="비밀번호 확인"
        placeholder="비밀번호를 다시 입력해주세요"
        required
        disabled={loading}
        error={touched.confirmPassword ? validationErrors.confirmPassword : ''}
        showStrength={false}
        className="w-full"
      />

      <TextInput
        id="ownerName"
        name="ownerName"
        value={formData.ownerName}
        onChange={handleInputChange('ownerName')}
        onBlur={handleBlur('ownerName')}
        label="점주명"
        placeholder="실명을 입력해주세요"
        required
        disabled={loading}
        error={touched.ownerName ? validationErrors.ownerName : ''}
        className="w-full"
      />

      <PhoneInput
        id="phone"
        name="phone"
        value={formData.phone}
        onChange={handleInputChange('phone')}
        onBlur={handleBlur('phone')}
        label="연락처"
        placeholder="010-0000-0000"
        required
        disabled={loading}
        error={touched.phone ? validationErrors.phone : ''}
        className="w-full"
      />
    </div>
  );

  // Step 2: 매장 정보
  const renderStep2 = () => (
    <div className="space-y-6">
      <TextInput
        id="storeName"
        name="storeName"
        value={formData.storeName}
        onChange={handleInputChange('storeName')}
        onBlur={handleBlur('storeName')}
        label="매장명"
        placeholder="매장 이름을 입력해주세요"
        required
        disabled={loading}
        error={touched.storeName ? validationErrors.storeName : ''}
        className="w-full"
      />

      <TextInput
        id="businessNumber"
        name="businessNumber"
        value={formData.businessNumber}
        onChange={handleInputChange('businessNumber')}
        onBlur={handleBlur('businessNumber')}
        label="사업자 등록번호"
        placeholder="123-45-67890"
        required
        disabled={loading}
        error={touched.businessNumber ? validationErrors.businessNumber : ''}
        helperText="하이픈(-)을 포함하여 입력해주세요"
        className="w-full"
      />

      <TextInput
        id="storeAddress"
        name="storeAddress"
        value={formData.storeAddress}
        onChange={handleInputChange('storeAddress')}
        onBlur={handleBlur('storeAddress')}
        label="매장 주소"
        placeholder="매장 주소를 입력해주세요"
        required
        disabled={loading}
        error={touched.storeAddress ? validationErrors.storeAddress : ''}
        className="w-full"
      />

      <PhoneInput
        id="storePhone"
        name="storePhone"
        value={formData.storePhone}
        onChange={handleInputChange('storePhone')}
        onBlur={handleBlur('storePhone')}
        label="매장 전화번호"
        placeholder="02-0000-0000"
        required
        disabled={loading}
        error={touched.storePhone ? validationErrors.storePhone : ''}
        className="w-full"
      />

      <div>
        <label htmlFor="storeCategory" className="block text-sm font-medium text-gray-300 mb-2">
          매장 카테고리 *
        </label>
        <select
          id="storeCategory"
          name="storeCategory"
          value={formData.storeCategory}
          onChange={(e) => handleInputChange('storeCategory')(e.target.value)}
          onBlur={handleBlur('storeCategory')}
          disabled={loading}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          required
        >
          <option value="">카테고리 선택</option>
          <option value="korean">한식</option>
          <option value="chinese">중식</option>
          <option value="japanese">일식</option>
          <option value="western">양식</option>
          <option value="vietnamese">Local 음식</option>
          <option value="fastfood">패스트푸드</option>
          <option value="cafe">카페/디저트</option>
          <option value="other">기타</option>
        </select>
      </div>
    </div>
  );

  // Step 3: 인증 및 약관 동의
  const renderStep3 = () => (
    <div className="space-y-6">
      {/* 이메일 인증 */}
      <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
        <h3 className="text-sm font-medium text-gray-200 mb-3">이메일 인증</h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">{formData.email}</p>
          <button
            type="button"
            onClick={handleEmailVerification}
            disabled={loading || formData.emailVerified}
            className="px-4 py-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            {formData.emailVerified ? '인증 완료' : '인증 메일 발송'}
          </button>
        </div>
        {!formData.emailVerified && (
          <div className="mt-3">
            <TextInput
              id="verificationCode"
              name="verificationCode"
              value={formData.verificationCode}
              onChange={handleInputChange('verificationCode')}
              placeholder="인증 코드 입력"
              disabled={loading}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* 약관 동의 */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-200">약관 동의</h3>
        
        <div className="space-y-3">
          <label className="flex items-start cursor-pointer min-h-[44px] py-2">
            <input
              type="checkbox"
              checked={formData.termsAccepted}
              onChange={handleCheckboxChange('termsAccepted')}
              disabled={loading}
              className="mt-1 h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-600 rounded bg-gray-700"
            />
            <span className="ml-3 text-sm text-gray-300">
              <span className="text-red-500">*</span> 서비스 이용약관에 동의합니다{' '}
              <a href="#" className="inline-block py-1 px-1 text-emerald-400 hover:text-emerald-300 underline focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded">보기</a>
            </span>
          </label>

          <label className="flex items-start cursor-pointer min-h-[44px] py-2">
            <input
              type="checkbox"
              checked={formData.privacyAccepted}
              onChange={handleCheckboxChange('privacyAccepted')}
              disabled={loading}
              className="mt-1 h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-600 rounded bg-gray-700"
            />
            <span className="ml-3 text-sm text-gray-300">
              <span className="text-red-500">*</span> 개인정보 처리방침에 동의합니다{' '}
              <a href="#" className="inline-block py-1 px-1 text-emerald-400 hover:text-emerald-300 underline focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded">보기</a>
            </span>
          </label>

          <label className="flex items-start cursor-pointer min-h-[44px] py-2">
            <input
              type="checkbox"
              checked={formData.marketingAccepted}
              onChange={handleCheckboxChange('marketingAccepted')}
              disabled={loading}
              className="mt-1 h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-600 rounded bg-gray-700"
            />
            <span className="ml-3 text-sm text-gray-300">
              마케팅 정보 수신에 동의합니다 (선택)
            </span>
          </label>
        </div>
      </div>

      {/* 전체 동의 버튼 */}
      <button
        type="button"
        onClick={() => {
          setFormData(prev => ({
            ...prev,
            termsAccepted: true,
            privacyAccepted: true,
            marketingAccepted: true
          }));
        }}
        disabled={loading}
        className="w-full py-3 px-4 min-h-[44px] border border-gray-600 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        전체 동의하기
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* 단계 진행 표시기 */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>단계 {currentStep} / 3</span>
          <span>{currentStep === 1 ? '기본정보' : currentStep === 2 ? '매장정보' : '인증완료'}</span>
        </div>
        <div className="mt-2 w-full bg-gray-700 rounded-full h-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={3} aria-label={`단계 진행률 ${Math.round((currentStep / 3) * 100)}%`}>
          <div 
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>
      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4" role="alert">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 단계별 콘텐츠 */}
      <div className="min-h-[400px]">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      {/* 버튼 영역 */}
      <div className="flex justify-between space-x-4">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={handlePrevious}
            disabled={loading}
            className="flex-1 py-3 px-4 border border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-300 bg-gray-800/30 hover:bg-gray-700/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
          >
            이전
          </button>
        )}

        <LoadingButton
          type="submit"
          loading={loading}
          disabled={loading || (currentStep === 3 && (!formData.termsAccepted || !formData.privacyAccepted))}
          loadingText={currentStep === 3 ? '회원가입 중...' : '다음'}
          className={`${currentStep === 1 ? 'w-full' : 'flex-1'} flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
        >
          {currentStep === 3 ? '회원가입 완료' : '다음'}
        </LoadingButton>
      </div>

      {/* 접근성을 위한 숨겨진 상태 메시지 */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {loading && '처리 중입니다. 잠시만 기다려주세요.'}
        {error && `오류: ${error}`}
        현재 {currentStep}단계입니다.
      </div>
    </form>
  );
}