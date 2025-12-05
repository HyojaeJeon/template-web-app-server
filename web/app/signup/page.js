'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { useAuth } from '@/shared/hooks/business/useAuth';
import { S_REGISTER_STORE_ACCOUNT } from '@/gql/mutations/auth';
import { tokenManager } from '@/lib/apolloClient';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/shared/i18n';
import CountrySelector from '@/shared/components/ui/inputs/CountrySelector';
import { 
  validatePhoneNumber, 
  formatPhoneNumber, 
  cleanVietnamesePhoneNumber,
  COUNTRY_DATA 
} from '@/shared/utils/phoneValidation';
import { 
  BuildingStorefrontIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  KeyIcon,
  MapPinIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  GiftIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  LanguageIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/solid';

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation(['auth', 'validation']);
  const [currentStep, setCurrentStep] = useState(1);
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const fieldRefs = useRef({});
  
  // Theme & Language State
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState('vi');
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: 'VN', // 기본값: Local
    password: '',
    confirmPassword: '',
    storeName: '',
    storeAddress: '',
    businessLicense: '',
    category: 'VIETNAMESE', // 기본값: Local 음식
    agreeToTerms: false
  });

  // Initialize theme and language
  useEffect(() => {
    setMounted(true);
    // Load saved language
    const savedLang = localStorage.getItem('language') || 'vi';
    setLanguage(savedLang);
    
    // Apply language
    if (i18n && i18n.changeLanguage) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  function handleThemeToggle() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  function handleLanguageChange(newLang) {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    if (i18n && i18n.changeLanguage) {
      i18n.changeLanguage(newLang);
    }
    setShowLangDropdown(false);
  }

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' }
  ];


  // GraphQL mutation
  const [registerMutation, { loading }] = useMutation(S_REGISTER_STORE_ACCOUNT, {
    onCompleted: (data) => {
      if (data.registerStoreAccount) {
        // 토큰 저장
        tokenManager.setTokens(
          data.registerStoreAccount.accessToken,
          data.registerStoreAccount.refreshToken
        );
        
        // 대시보드로 리다이렉트
        if (data.registerStoreAccount.store?.status === 'PENDING') {
          router.push('/dashboard?welcome=true&status=pending');
        } else {
          router.push('/dashboard?welcome=true');
        }
      }
    },
    onError: (error) => {
      console.error('Registration error:', error);
      setLocalError(error.message || '회원가입에 실패했습니다.');
    }
  });

  const handleInputChange = (field, value) => {
    let processedValue = value;
    
    // 전화번호 입력 시 Local 0 제거 및 포맷팅 적용
    if (field === 'phone') {
      if (formData.countryCode === 'VN') {
        const cleanValue = cleanVietnamesePhoneNumber(value);
        processedValue = formatPhoneNumber(cleanValue, formData.countryCode);
      } else {
        processedValue = formatPhoneNumber(value, formData.countryCode);
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
    
    // 실시간 필드 유효성 검사
    if (field !== 'confirmPassword' || formData.password) {
      const fieldError = validateField(field, processedValue);
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        if (fieldError) {
          newErrors[field] = fieldError;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    }
    
    if (localError) setLocalError('');
  };

  const handleCountryChange = (country) => {
    setFormData(prev => ({
      ...prev,
      countryCode: country.code,
      phone: '' // 국가 변경 시 전화번호 초기화
    }));
    // 국가 변경 시 전화번호 에러 초기화
    if (fieldErrors.phone) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.phone;
        return newErrors;
      });
    }
  };

  // 필드별 유효성 검사
  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case 'name':
        return value.trim() ? null : t('validation:required.name');
      case 'email':
        if (!value.trim()) return t('validation:required.email');
        return /\S+@\S+\.\S+/.test(value) ? null : t('validation:invalid.email');
      case 'phone':
        if (!value.trim()) return t('validation:required.phone');
        const cleanPhone = formData.countryCode === 'VN' ? 
          cleanVietnamesePhoneNumber(value) : 
          value.replace(/\D/g, '');
        const isValid = validatePhoneNumber(cleanPhone, formData.countryCode);
        return isValid ? null : t('validation:invalid.phoneFormat');
      case 'password':
        if (!value) return t('validation:required.password');
        return value.length >= 8 ? null : t('validation:invalid.password');
      case 'confirmPassword':
        if (!value) return t('validation:required.confirmPassword');
        return value === formData.password ? null : t('validation:invalid.confirmPassword');
      case 'storeName':
        return value.trim() ? null : t('validation:required.businessName');
      case 'storeAddress':
        return value.trim() ? null : t('validation:required.address');
      case 'agreeToTerms':
        return value ? null : t('validation:required.agreeTerms');
      default:
        return null;
    }
  };

  // 단계별 유효성 검사
  const validateStep = (step) => {
    const newErrors = {};
    let hasErrors = false;

    switch (step) {
      case 1:
        const nameError = validateField('name', formData.name);
        const emailError = validateField('email', formData.email);
        const phoneError = validateField('phone', formData.phone);
        
        if (nameError) newErrors.name = nameError;
        if (emailError) newErrors.email = emailError;
        if (phoneError) newErrors.phone = phoneError;
        
        hasErrors = nameError || emailError || phoneError;
        break;
      case 2:
        const storeNameError = validateField('storeName', formData.storeName);
        const storeAddressError = validateField('storeAddress', formData.storeAddress);
        
        if (storeNameError) newErrors.storeName = storeNameError;
        if (storeAddressError) newErrors.storeAddress = storeAddressError;
        
        hasErrors = storeNameError || storeAddressError;
        break;
      case 3:
        const passwordError = validateField('password', formData.password);
        const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword);
        const agreeError = validateField('agreeToTerms', formData.agreeToTerms);
        
        if (passwordError) newErrors.password = passwordError;
        if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
        if (agreeError) newErrors.agreeToTerms = agreeError;
        
        hasErrors = passwordError || confirmPasswordError || agreeError;
        break;
    }

    setFieldErrors(newErrors);
    
    if (hasErrors) {
      setLocalError(t('validation:step.' + (step === 1 ? 'account' : step === 2 ? 'business' : 'terms')));
      
      // 첫 번째 에러 필드로 스크롤
      const firstErrorField = Object.keys(newErrors)[0];
      if (firstErrorField && fieldRefs.current[firstErrorField]) {
        fieldRefs.current[firstErrorField].focus();
        fieldRefs.current[firstErrorField].scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }

    return !hasErrors;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setLocalError('');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setLocalError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;

    setLocalError('');
    
    try {
      const selectedCountry = COUNTRY_DATA.find(c => c.code === formData.countryCode);
      const fullPhoneNumber = `${selectedCountry.dialCode}${formData.phone.replace(/\D/g, '')}`;
      
      await registerMutation({
        variables: {
          input: {
            name: formData.name,
            email: formData.email,
            phone: fullPhoneNumber, // 국가코드 포함 전체 전화번호
            password: formData.password,
            storeName: formData.storeName,
            storeAddress: formData.storeAddress,
            storePhone: fullPhoneNumber, // 매장 전화번호도 동일하게 설정
            category: formData.category,
            businessLicense: formData.businessLicense,
            termsAccepted: formData.agreeToTerms,
            privacyAccepted: formData.agreeToTerms,
            marketingAccepted: false // 기본값: 마케팅 동의하지 않음
          }
        }
      });
    } catch (error) {
      // 에러는 onError에서 처리됨
    }
  };

  const steps = [
    { number: 1, title: t('signup.step_titles.step1'), description: t('signup.step_descriptions.step1') },
    { number: 2, title: t('signup.step_titles.step2'), description: t('signup.step_descriptions.step2') },
    { number: 3, title: t('signup.step_titles.step3'), description: t('signup.step_descriptions.step3') }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-mint-50 dark:from-slate-900 dark:via-mint-900/20 dark:to-slate-900 flex items-center justify-center p-2 sm:p-4 relative transition-colors duration-200">
      {/* 배경 효과 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-mint-500/10 via-transparent to-transparent dark:from-mint-900/20 dark:via-slate-900/40 dark:to-slate-900"></div>
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232AC1BC' fill-opacity='0.03'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>
      
      {/* Top Bar with Language and Theme Selectors */}
      <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <BuildingStorefrontIcon className="h-6 w-6 sm:h-8 sm:w-8 text-mint-500 dark:text-mint-400" />
            <span className="text-sm sm:text-xl font-bold text-gray-800 dark:text-white">DeliveryVN Store</span>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center space-x-2 px-3 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                <LanguageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-slate-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {languages.find(l => l.code === language)?.flag}
                </span>
              </button>
              
              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center space-x-3 ${
                        language === lang.code ? 'bg-mint-100 dark:bg-mint-900/30' : ''
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-sm text-gray-700 dark:text-slate-300">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={handleThemeToggle}
              className="p-2 sm:p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105"
              aria-label="Toggle theme"
              >
              {!mounted ? (
                <div className="h-5 w-5 bg-gray-400 dark:bg-slate-600 rounded animate-pulse" />
              ) : (
                <div className="relative">
                  {theme === 'dark' ? (
                    <SunIcon className="h-5 w-5 text-yellow-500 transition-transform duration-200 hover:rotate-12" />
                  ) : (
                    <MoonIcon className="h-5 w-5 text-blue-500 transition-transform duration-200 hover:-rotate-12" />
                  )}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="relative w-full max-w-2xl mt-16 sm:mt-0" style={{ zIndex: 10 }}>
        {/* 로고 및 타이틀 */}
        <div className="text-center mb-3 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-mint-500 to-green-500 rounded-xl sm:rounded-3xl shadow-2xl mb-2 sm:mb-6 transform hover:scale-105 transition-transform duration-300">
            <BuildingStorefrontIcon className="h-6 w-6 sm:h-10 sm:w-10 text-white" />
          </div>
          <h1 className="text-xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-2 tracking-tight">
            {t('signup.title')}
          </h1>
          <p className="text-gray-600 dark:text-slate-400 text-sm sm:text-lg px-2 sm:px-0">
            {t('signup.subtitle')}
          </p>
        </div>

        {/* 단계 표시기 */}
        <div className="mb-3 sm:mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center space-y-2">
                  <div
                    className={`
                      w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold text-xs sm:text-lg
                      transition-all duration-300 border-2
                      ${currentStep >= step.number 
                        ? 'bg-gradient-to-br from-mint-500 to-green-500 text-white border-mint-500 shadow-lg shadow-mint-500/25' 
                        : 'bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-300 dark:border-slate-600'
                      }
                    `}
                  >
                    {currentStep > step.number ? (
                      <CheckCircleIcon className="h-4 w-4 sm:h-6 sm:w-6" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className={`text-[10px] sm:text-sm font-medium ${currentStep >= step.number ? 'text-mint-600 dark:text-mint-300' : 'text-gray-600 dark:text-slate-500'}`}>
                      {step.title}
                    </p>
                    <p className="text-[8px] sm:text-xs text-gray-500 dark:text-slate-400">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`w-6 sm:w-16 h-0.5 ml-1 mr-1 sm:ml-4 sm:mr-4 mt-[-1rem] sm:mt-[-2rem] transition-all duration-300 ${
                      currentStep > step.number ? 'bg-mint-500' : 'bg-gray-300 dark:bg-slate-700'
                    }`} 
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 메인 폼 카드 */}
        <div className="bg-white/95 dark:bg-slate-800/95 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-white/20 p-5 sm:p-8 space-y-4 sm:space-y-6 relative">
          {/* 에러 메시지 */}
          {localError && (
            <div className="bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/30 rounded-lg sm:rounded-xl p-2 sm:p-4 flex items-center space-x-2 sm:space-x-3">
              <ExclamationTriangleIcon className="h-3 w-3 sm:h-5 sm:w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-300 text-[10px] sm:text-sm font-medium">{localError}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            {/* Step 1: 기본 정보 */}
            {currentStep === 1 && (
              <div className="space-y-3 sm:space-y-5">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">{t('signup.step_titles.step1')}</h2>
                  <p className="text-gray-600 dark:text-slate-400 text-xs">{t('signup.step_descriptions.step1')}</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* 이름 */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                      {t('signup.form.name')} <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
                      <input
                        type="text"
                        ref={ref => fieldRefs.current.name = ref}
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full h-12 pl-9 pr-3 bg-white dark:bg-slate-800/50 border rounded-lg text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-all duration-200 ${
                          fieldErrors.name 
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-slate-600/50'
                        }`}
                        placeholder={t('signup.form.placeholders.name')}
                      />
                      {fieldErrors.name && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {fieldErrors.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 이메일 */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                      {t('signup.form.email')} <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
                      <input
                        type="email"
                        ref={ref => fieldRefs.current.email = ref}
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full h-12 pl-9 pr-3 bg-white dark:bg-slate-800/50 border rounded-lg text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-all duration-200 ${
                          fieldErrors.email 
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-slate-600/50'
                        }`}
                        placeholder={t('signup.form.placeholders.email')}
                      />
                      {fieldErrors.email && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 전화번호 */}
                  <div className="space-y-1.5 relative z-[9999]">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                      {t('signup.form.phone')} <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <div className="flex space-x-2">
                      {/* 국가 선택 드롭다운 */}
                      <div className="w-28">
                        <CountrySelector
                          value={formData.countryCode}
                          onChange={handleCountryChange}
                        />
                      </div>
                      
                      {/* 전화번호 입력 */}
                      <div className="flex-1 relative">
                        <PhoneIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
                        <input
                          type="tel"
                          ref={ref => fieldRefs.current.phone = ref}
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={`w-full h-12 pl-9 pr-3 bg-white dark:bg-slate-800/50 border rounded-lg text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-all duration-200 ${
                            fieldErrors.phone 
                              ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-300 dark:border-slate-600/50'
                          }`}
                          placeholder={COUNTRY_DATA.find(c => c.code === formData.countryCode)?.phoneFormat || t('signup.form.placeholders.phone')}
                          maxLength={COUNTRY_DATA.find(c => c.code === formData.countryCode)?.maxLength + 5} // 포맷팅 문자 고려
                        />
                      </div>
                    </div>
                    {fieldErrors.phone ? (
                      <p className="text-xs text-red-400 ml-1 mt-1">
                        {fieldErrors.phone}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-slate-400 ml-1">
                        {(() => {
                          const country = COUNTRY_DATA.find(c => c.code === formData.countryCode);
                          return country ? t('signup.phone_format', { country: t(`signup.countries.${country.code}`), format: country.phoneFormat }) : '';
                        })()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: 매장 정보 */}
            {currentStep === 2 && (
              <div className="space-y-3 sm:space-y-5">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">{t('signup.step_titles.step2')}</h2>
                  <p className="text-gray-600 dark:text-slate-400 text-xs">{t('signup.step_descriptions.step2')}</p>
                </div>

                <div className="space-y-4">
                  {/* 매장명 */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                      {t('signup.form.store_name')} <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <BuildingStorefrontIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
                      <input
                        type="text"
                        ref={ref => fieldRefs.current.storeName = ref}
                        value={formData.storeName}
                        onChange={(e) => handleInputChange('storeName', e.target.value)}
                        className={`w-full h-12 pl-9 pr-3 bg-white dark:bg-slate-800/50 border rounded-lg text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-all duration-200 ${
                          fieldErrors.storeName 
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-slate-600/50'
                        }`}
                        placeholder={t('signup.form.placeholders.store_name')}
                      />
                      {fieldErrors.storeName && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {fieldErrors.storeName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 매장 주소 */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                      {t('signup.form.store_address')} <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-2.5 top-3 h-4 w-4 text-gray-400 dark:text-slate-400" />
                      <textarea
                        ref={ref => fieldRefs.current.storeAddress = ref}
                        value={formData.storeAddress}
                        onChange={(e) => handleInputChange('storeAddress', e.target.value)}
                        className={`w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800/50 border rounded-lg text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-all duration-200 resize-none ${
                          fieldErrors.storeAddress 
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-slate-600/50'
                        }`}
                        placeholder={t('signup.form.placeholders.store_address')}
                        rows={2}
                      />
                      {fieldErrors.storeAddress && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {fieldErrors.storeAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 사업자등록번호 */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                      {t('signup.form.business_license')} <span className="text-gray-500 dark:text-slate-500">({t('form.optional')})</span>
                    </label>
                    <div className="relative">
                      <DocumentTextIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
                      <input
                        type="text"
                        value={formData.businessLicense}
                        onChange={(e) => handleInputChange('businessLicense', e.target.value)}
                        className="w-full h-[42px] pl-9 pr-3 bg-white dark:bg-slate-800/50 border border-gray-300 dark:border-slate-600/50 rounded-lg text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-all duration-200"
                        placeholder={t('signup.form.placeholders.business_license')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: 계정 설정 */}
            {currentStep === 3 && (
              <div className="space-y-3 sm:space-y-5">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">{t('signup.step_titles.step3')}</h2>
                  <p className="text-gray-600 dark:text-slate-400 text-xs">{t('signup.step_descriptions.step3')}</p>
                </div>

                <div className="space-y-4">
                  {/* 비밀번호 */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                      {t('signup.form.password')} <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <KeyIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        ref={ref => fieldRefs.current.password = ref}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`w-full h-12 pl-9 pr-10 bg-white dark:bg-slate-800/50 border rounded-lg text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-all duration-200 ${
                          fieldErrors.password 
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-slate-600/50'
                        }`}
                        placeholder={t('signup.form.placeholders.password')}
                      />
                      {fieldErrors.password && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {fieldErrors.password}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                      >
                        {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 비밀번호 확인 */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                      {t('signup.form.confirm_password')} <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <KeyIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        ref={ref => fieldRefs.current.confirmPassword = ref}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`w-full h-12 pl-9 pr-10 bg-white dark:bg-slate-800/50 border rounded-lg text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-all duration-200 ${
                          fieldErrors.confirmPassword 
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-slate-600/50'
                        }`}
                        placeholder={t('signup.form.placeholders.confirm_password')}
                      />
                      {fieldErrors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {fieldErrors.confirmPassword}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5" /> : <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* 약관 동의 */}
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="flex items-start space-x-2 sm:space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          ref={ref => fieldRefs.current.agreeToTerms = ref}
                          checked={formData.agreeToTerms}
                          onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                          className={`mt-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 text-mint-600 bg-white dark:bg-slate-800 rounded focus:ring-mint-500 focus:ring-offset-0 flex-shrink-0 ${
                            fieldErrors.agreeToTerms 
                              ? 'border-red-500 focus:ring-red-500' 
                              : 'border-gray-300 dark:border-slate-600'
                          }`}
                        />
                        <span className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                          {t('signup.terms.agree_to')}{' '}
                          <span className="text-red-500 dark:text-red-400">*</span>
                        </span>
                      </label>
                      {fieldErrors.agreeToTerms && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {fieldErrors.agreeToTerms}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 버튼들 */}
            <div className="flex items-center justify-between pt-6">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex items-center space-x-2 px-6 py-2.5 border border-gray-300 dark:border-slate-600/50 rounded-lg text-gray-700 dark:text-slate-300 text-sm hover:bg-gray-100 dark:hover:bg-slate-800/30 hover:border-gray-400 dark:hover:border-slate-500/50 transition-all duration-200"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>{t('signup.form.previous')}</span>
                </button>
              )}

              <div className="flex-1 flex justify-end">
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-gradient-to-r from-mint-500 to-green-500 hover:from-mint-600 hover:to-green-600 text-white font-semibold rounded-lg text-sm transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                  >
                    {t('signup.form.next')}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg text-sm transition-all duration-200 transform hover:scale-[1.02] focus:ring-4 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>{t('signup.form.registering')}</span>
                      </div>
                    ) : (
                      t('signup.form.complete_registration')
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* 로그인 링크 */}
          <div className="pt-3 sm:pt-4 text-center border-t border-gray-300 dark:border-slate-600/50">
            <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm">
              {t('signup.have_account')}{' '}
              <Link 
                href="/login"
                className="text-mint-600 dark:text-mint-400 hover:text-mint-700 dark:hover:text-mint-300 font-medium transition-colors duration-200"
              >
                {t('signup.login_now')}
              </Link>
            </p>
          </div>
        </div>

        {/* 회원가입 혜택 */}
        <div className="mt-6 sm:mt-8 bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-slate-600 p-4 sm:p-6" style={{ position: 'relative', zIndex: -1 }}>
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-mint-500 to-green-500 rounded-lg sm:rounded-xl mb-2 sm:mb-3">
              <GiftIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-1 sm:mb-2">{t('signup.benefits.title')}</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <ShieldCheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-800 dark:text-white font-medium text-xs sm:text-sm">{t('signup.benefits.pos_integration')}</p>
                <p className="text-gray-600 dark:text-slate-400 text-[10px] sm:text-xs">{t('signup.benefits.pos_description')}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2 sm:space-x-3">
              <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-800 dark:text-white font-medium text-xs sm:text-sm">{t('signup.benefits.realtime_orders')}</p>
                <p className="text-gray-600 dark:text-slate-400 text-[10px] sm:text-xs">{t('signup.benefits.realtime_description')}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2 sm:space-x-3">
              <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-800 dark:text-white font-medium text-xs sm:text-sm">{t('signup.benefits.analytics')}</p>
                <p className="text-gray-600 dark:text-slate-400 text-[10px] sm:text-xs">{t('signup.benefits.analytics_description')}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2 sm:space-x-3">
              <GlobeAltIcon className="h-4 w-4 sm:h-5 sm:w-5 text-mint-500 dark:text-mint-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-800 dark:text-white font-medium text-xs sm:text-sm">{t('signup.benefits.multilingual')}</p>
                <p className="text-gray-600 dark:text-slate-400 text-[10px] sm:text-xs">{t('signup.benefits.multilingual_description')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 도움말 링크 */}
        <div className="mt-6 sm:mt-8 text-center text-gray-600 dark:text-slate-500 text-xs sm:text-sm">
          <p>
            {t('signup.help.need_help')}{' '}
            <a href="#" className="text-mint-600 dark:text-mint-400 hover:text-mint-700 dark:hover:text-mint-300 transition-colors">
              {t('signup.help.contact_support')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}