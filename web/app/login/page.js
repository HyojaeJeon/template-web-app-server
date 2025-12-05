'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useAuth } from '@/shared/hooks/business/useAuth';
import { useToast } from '@/shared/providers/ToastProvider';
import { S_LOGIN_WITH_EMAIL, S_LOGIN_WITH_PHONE } from '@/gql/mutations/auth';
import { setAuth } from '@/store/slices/authSlice';
import { 
  BuildingStorefrontIcon, 
  EyeIcon, 
  EyeSlashIcon,
  UserIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  LanguageIcon,
  SunIcon,
  MoonIcon,
  ArrowRightIcon
} from '@heroicons/react/24/solid';
import { useTranslation } from '@/shared/i18n';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t, language: currentLanguage, setLanguage: changeLanguage } = useTranslation();
  const { showSuccess, showError, showWarning } = useToast();
  
  // State management
  const [loginType, setLoginType] = useState('email'); // 'email' or 'phone'
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isTestLogin, setIsTestLogin] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  // Theme & Language State
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState('vi');
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // GraphQL mutations
  const [loginWithEmail, { loading: emailLoading }] = useMutation(S_LOGIN_WITH_EMAIL, {
    onCompleted: handleLoginSuccess,
    onError: handleLoginError
  });

  const [loginWithPhone, { loading: phoneLoading }] = useMutation(S_LOGIN_WITH_PHONE, {
    onCompleted: handleLoginSuccess,
    onError: handleLoginError
  });

  const loading = emailLoading || phoneLoading;

  // Initialize theme and language
  useEffect(() => {
    setMounted(true);
    // Load saved language
    const savedLang = localStorage.getItem('language') || 'ko';
    setLanguage(savedLang);

    // Apply language using custom i18n system
    changeLanguage(savedLang);
  }, [changeLanguage]);

  function handleThemeToggle() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  function handleLanguageChange(newLang) {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    changeLanguage(newLang);
    setShowLangDropdown(false);
  }

  async function handleLoginSuccess(data) {
    console.log('=== 로그인 성공 처리 시작 ===', data);

    // 두 가지 로그인 타입에 따라 결과 추출
    let result = null;
    if (loginType === 'email' && data.sLoginWithEmail) {
      result = data.sLoginWithEmail;
    } else if (loginType === 'phone' && data.sLoginWithPhone) {
      result = data.sLoginWithPhone;
    }

    console.log('로그인 타입:', loginType);
    console.log('추출된 결과:', result);

    if (result && result.accessStoreToken) {
      // ✅ Redux에 StoreAccount + Store + 토큰 저장
      if (result.storeAccount) {
        dispatch(setAuth({
          storeAccount: result.storeAccount,
          store: result.store || null, // 매장 정보 (다국어 매장명 포함)
          accessToken: result.accessStoreToken,
          refreshToken: result.refreshStoreToken
        }));
        console.log('✅ Redux에 StoreAccount + Store 저장 완료:', {
          storeAccountId: result.storeAccount.id,
          storeId: result.storeAccount.storeId,
          storeName: result.store?.name,
          role: result.storeAccount.role,
          status: result.storeAccount.status
        });
      }

      // ✅ Redux Persist 저장 완료 대기 + 검증 (중요!)
      // 최대 3초까지 대기하며 토큰이 저장될 때까지 폴링
      await new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 15; // 15회 * 200ms = 3초

        const checkToken = () => {
          attempts++;
          const persisted = localStorage.getItem('persist:template-store');

          if (persisted) {
            try {
              const parsed = JSON.parse(persisted);
              const auth = parsed.auth ? JSON.parse(parsed.auth) : null;

              // 토큰이 실제로 저장되었는지 확인
              if (auth?.accessToken && auth?.refreshToken) {
                console.log('✅ Redux Persist 저장 확인 완료 (시도:', attempts, '회)');
                console.log('🔑 저장된 토큰 확인:', {
                  hasAccessToken: true,
                  hasRefreshToken: true,
                  accessTokenLength: auth.accessToken.length,
                  storeAccountId: auth.storeAccount?.id
                });
                resolve();
                return;
              }
            } catch (e) {
              console.error('localStorage 파싱 실패:', e);
            }
          }

          // 최대 시도 횟수 도달
          if (attempts >= maxAttempts) {
            console.warn('⚠️ Redux Persist 저장 확인 시간 초과');
            resolve(); // 타임아웃이어도 계속 진행
            return;
          }

          // 200ms 후 재시도
          setTimeout(checkToken, 200);
        };

        // 첫 번째 체크 시작
        checkToken();
      });

      // PENDING 상태 체크 - 첫 로그인 시 비밀번호 변경 필요
      if (result.storeAccount?.status === 'PENDING') {
        console.log('⚠️ PENDING 상태 - 비밀번호 변경 페이지로 이동');
        showWarning('첫 로그인입니다. 보안을 위해 비밀번호를 변경해주세요.');
        setLoginSuccess(true);

        setTimeout(() => {
          router.push('/change-password');
        }, 200);
        return;
      }

      // ✅ 일반 로그인 성공 - 토스트 표시
      // (테스트 로그인이 아닌 경우에만 토스트 표시)
      if (!isTestLogin) {
        showSuccess('auth.form.login_success');
      }
      setLoginSuccess(true);

      console.log('✅ 로그인 성공 - 대시보드로 이동 (SPA 방식)');
      setTimeout(() => {
        router.push('/dashboard');
      }, 200);
    } else {
      console.error('로그인 결과가 없거나 accessStoreToken이 누락됨:', {
        data,
        loginType,
        result
      });
    }
  }

  function handleLoginError(error) {
    console.error('Login error:', error);
    const errorMessage = error.graphQLErrors?.[0]?.message || error.message || t('auth.error.login_failed');

    // Show error toast - 에러 메시지 문자열 전달
    showError(errorMessage);

    setLocalError(errorMessage);
    setIsTestLogin(false);
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error
    if (localError) setLocalError('');
  };

  const formatPhoneNumber = (value) => {
    // Remove non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format Vietnamese phone number
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    } else if (cleaned.length <= 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (value) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange('phone', formatted);
  };

  const validateForm = () => {
    if (!formData.password) {
      setLocalError(t('auth.validation.password_required'));
      return false;
    }

    if (loginType === 'email') {
      if (!formData.email) {
        setLocalError(t('auth.validation.email_required'));
        return false;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setLocalError(t('auth.validation.email_invalid'));
        return false;
      }
    } else {
      if (!formData.phone) {
        setLocalError(t('auth.validation.phone_required'));
        return false;
      }
      // Remove spaces for validation
      const cleanPhone = formData.phone.replace(/\s/g, '');
      if (cleanPhone.length < 10) {
        setLocalError(t('auth.validation.phone_min_length'));
        return false;
      }
    }

    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLocalError('');
    
    try {
      if (loginType === 'email') {
        await loginWithEmail({
          variables: {
            email: formData.email,
            password: formData.password
          }
        });
      } else {
        // Remove spaces from phone number before sending
        const cleanPhone = formData.phone.replace(/\s/g, '');
        await loginWithPhone({
          variables: {
            phone: cleanPhone,
            password: formData.password
          }
        });
      }
    } catch (error) {
      // Error handled by onError callback
    }
  };

  const handleTestLogin = async (identifier, password, role) => {
    setIsTestLogin(true);
    setLocalError('');
    
    // Determine if identifier is email or phone
    const isEmail = identifier.includes('@');
    
    // 테스트 로그인 시 로그인 타입도 함께 설정
    const testLoginType = isEmail ? 'email' : 'phone';
    setLoginType(testLoginType);
    console.log('테스트 로그인 타입 설정:', testLoginType, '식별자:', identifier, '역할:', role);
    
    try {
      let result = null;

      if (isEmail) {
        const { data } = await loginWithEmail({
          variables: { email: identifier, password }
        });
        result = data?.sLoginWithEmail;
        console.log('이메일 로그인 응답:', data);
      } else {
        const { data } = await loginWithPhone({
          variables: { phone: identifier, password }
        });
        result = data?.sLoginWithPhone; // ✅ 올바른 필드명
        console.log('전화번호 로그인 응답:', data);
      }

      console.log('추출된 result:', result);

      // 테스트 로그인 성공 시 Redux에 저장
      if (result && result.accessStoreToken) {
        console.log(`=== 테스트 로그인 성공 (${role}) ===`, result);

        // ✅ Redux에 StoreAccount + Store + 토큰 저장
        if (result.storeAccount) {
          dispatch(setAuth({
            storeAccount: result.storeAccount,
            store: result.store || null, // 매장 정보 (다국어 매장명 포함)
            accessToken: result.accessStoreToken,
            refreshToken: result.refreshStoreToken
          }));
          console.log('✅ 테스트 로그인: StoreAccount + Store 저장 완료');
        }

        // ✅ Redux Persist 저장 완료 대기 + 검증 (중요!)
        // 최대 3초까지 대기하며 토큰이 저장될 때까지 폴링
        await new Promise((resolve) => {
          let attempts = 0;
          const maxAttempts = 15; // 15회 * 200ms = 3초

          const checkToken = () => {
            attempts++;
            const persisted = localStorage.getItem('persist:template-store');

            if (persisted) {
              try {
                const parsed = JSON.parse(persisted);
                const auth = parsed.auth ? JSON.parse(parsed.auth) : null;

                // 토큰이 실제로 저장되었는지 확인
                if (auth?.accessToken && auth?.refreshToken) {
                  console.log('✅ Redux Persist 저장 확인 완료 [테스트 로그인] (시도:', attempts, '회)');
                  console.log('🔑 저장된 토큰 확인:', {
                    hasAccessToken: true,
                    hasRefreshToken: true,
                    accessTokenLength: auth.accessToken.length,
                    storeAccountId: auth.storeAccount?.id
                  });
                  resolve();
                  return;
                }
              } catch (e) {
                console.error('localStorage 파싱 실패:', e);
              }
            }

            // 최대 시도 횟수 도달
            if (attempts >= maxAttempts) {
              console.warn('⚠️ Redux Persist 저장 확인 시간 초과 [테스트 로그인]');
              resolve(); // 타임아웃이어도 계속 진행
              return;
            }

            // 200ms 후 재시도
            setTimeout(checkToken, 200);
          };

          // 첫 번째 체크 시작
          checkToken();
        });

        showSuccess('auth.form.login_success');
        setLoginSuccess(true);

        setTimeout(() => {
          router.push('/dashboard');
        }, 200);
      } else {
        // ✅ 로그인은 성공했지만 토큰이 없는 경우
        console.error('로그인 응답에 토큰이 없습니다:', { result, isEmail, identifier });
        showError(t('auth.error.login_failed'));
        setLocalError('로그인 응답 형식이 올바르지 않습니다');
        setIsTestLogin(false);
      }

    } catch (error) {
      console.error('테스트 로그인 에러:', error);

      // GraphQL 에러 메시지 추출
      const errorMessage = error.graphQLErrors?.[0]?.message || error.message || t('auth.error.login_failed');

      // Show error toast
      showError(errorMessage);

      setLocalError(`${role} 로그인 실패: ${errorMessage}`);
      setIsTestLogin(false);
    }
  };

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-mint-50 dark:from-slate-900 dark:via-mint-900/20 dark:to-slate-900 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden transition-colors duration-200">
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
                className="flex items-center space-x-1 sm:space-x-2 px-2 py-1 sm:px-3 sm:py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors"
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
      
      <div className="relative w-full max-w-md z-10 mt-10 sm:mt-0">
        {/* 로고 및 타이틀 */}
        <div className="text-center mb-3 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-mint-500 to-green-500 rounded-xl sm:rounded-3xl shadow-2xl mb-2 sm:mb-6 transform hover:scale-105 transition-transform duration-300">
            <BuildingStorefrontIcon className="h-6 w-6 sm:h-10 sm:w-10 text-white" />
          </div>
          <h1 className="text-xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-0.5 sm:mb-2 tracking-tight">
            {t('auth.title.welcome')}
          </h1>
          <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-lg">
            {t('auth.subtitle.manage_store')}
          </p>
        </div>

        {/* Main Login Card */}
        <div className="bg-white dark:bg-white/10 backdrop-blur-xl rounded-lg sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-white/20 p-3 sm:p-8 space-y-3 sm:space-y-6">

          {/* Login Type Selector */}
          <div className="flex rounded-md sm:rounded-xl bg-gray-100 dark:bg-slate-800/50 p-0.5 sm:p-1 border border-gray-200 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => setLoginType('email')}
              className={`flex-1 flex items-center justify-center space-x-1 sm:space-x-2 py-1.5 sm:py-2.5 px-2 sm:px-4 rounded sm:rounded-lg transition-all duration-200 ${
                loginType === 'email'
                  ? 'bg-mint-500 dark:bg-slate-700 shadow-lg text-white dark:text-mint-400 font-semibold'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
              }`}
            >
              <EnvelopeIcon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-base font-medium">{t('auth.login_type.email')}</span>
            </button>
            <button
              type="button"
              onClick={() => setLoginType('phone')}
              className={`flex-1 flex items-center justify-center space-x-1 sm:space-x-2 py-1.5 sm:py-2.5 px-2 sm:px-4 rounded sm:rounded-lg transition-all duration-200 ${
                loginType === 'phone'
                  ? 'bg-mint-500 dark:bg-slate-700 shadow-lg text-white dark:text-mint-400 font-semibold'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
              }`}
            >
              <PhoneIcon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-base font-medium">{t('auth.login_type.phone')}</span>
            </button>
          </div>

          {/* Error Message */}
          {localError && (
            <div className="bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/30 rounded-md sm:rounded-xl p-2 sm:p-4 flex items-center space-x-2 sm:space-x-3">
              <ExclamationTriangleIcon className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-[10px] sm:text-sm text-red-700 dark:text-red-300 font-medium">{localError}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-2.5 sm:space-y-4">
            {/* Email or Phone Input */}
            {loginType === 'email' ? (
              <div>
                <label className="block text-[10px] sm:text-sm font-medium text-gray-700 dark:text-slate-300 mb-0.5 sm:mb-2">
                  {t('auth.form.email')}
                </label>
                <div className="relative flex items-center">
                  <EnvelopeIcon className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-5 sm:w-5 text-gray-400 dark:text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    autoComplete="email"
                    className="w-full pl-7 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-3 bg-white dark:bg-slate-800/50 border border-gray-300 dark:border-slate-600/50 rounded-md sm:rounded-xl text-xs sm:text-base text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-all duration-200"
                    placeholder={t('auth.form.placeholder.email')}
                    disabled={loading || isTestLogin}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] sm:text-sm font-medium text-gray-700 dark:text-slate-300 mb-0.5 sm:mb-2">
                  {t('auth.form.phone')}
                </label>
                <div className="relative flex items-center">
                  <PhoneIcon className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-5 sm:w-5 text-gray-400 dark:text-slate-400 pointer-events-none" />
                  <span className="absolute left-7 sm:left-10 top-1/2 -translate-y-1/2 text-xs sm:text-base text-gray-500 dark:text-slate-400 pointer-events-none">+84</span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    autoComplete="tel"
                    className="w-full pl-14 sm:pl-20 pr-3 sm:pr-4 py-1.5 sm:py-3 bg-white dark:bg-slate-800/50 border border-gray-300 dark:border-slate-600/50 rounded-md sm:rounded-xl text-xs sm:text-base text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-all duration-200"
                    placeholder={t('auth.form.placeholder.phone')}
                    disabled={loading || isTestLogin}
                  />
                </div>
              </div>
            )}

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {t('auth.form.password')}
              </label>
              <div className="relative flex items-center">
                <KeyIcon className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-5 sm:w-5 text-gray-400 dark:text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  autoComplete="current-password"
                  className="w-full pl-7 sm:pl-10 pr-8 sm:pr-12 py-1.5 sm:py-3 bg-white dark:bg-slate-800/50 border border-gray-300 dark:border-slate-600/50 rounded-md sm:rounded-xl text-xs sm:text-base text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-all duration-200"
                  placeholder={t('auth.form.placeholder.password')}
                  disabled={loading || isTestLogin}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                  ) : (
                    <EyeIcon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  className="w-4 h-4 text-mint-600 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 rounded focus:ring-mint-500"
                  disabled={loading || isTestLogin}
                />
                <span className="text-[10px] sm:text-sm text-gray-700 dark:text-slate-300">{t('auth.form.remember_me')}</span>
              </label>

              <Link
                href="/forgot-password"
                className="text-[10px] sm:text-sm text-mint-600 dark:text-mint-400 hover:text-mint-700 dark:hover:text-mint-300 transition-colors"
              >
                {t('auth.form.forgot_password')}
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || isTestLogin || loginSuccess}
              className={`w-full ${
                loginSuccess 
                  ? 'bg-gradient-to-r from-green-500 to-green-600' 
                  : 'bg-gradient-to-r from-mint-500 to-green-500 hover:from-mint-600 hover:to-green-600'
              } text-white font-semibold py-2 sm:py-3.5 px-3 sm:px-4 rounded-md sm:rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:ring-4 focus:ring-mint-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-base`}
            >
              {loginSuccess ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{t('auth.form.login_success')}</span>
                </>
              ) : loading || isTestLogin ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{t('auth.form.logging_in')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.form.login_button')}</span>
                  <ArrowRightIcon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 sm:px-4 bg-white dark:bg-white/10 text-[10px] sm:text-sm text-gray-600 dark:text-slate-400 font-medium rounded-md">
                {t('auth.test_login.divider')}
              </span>
            </div>
          </div>

          {/* Test Login Buttons */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={() => handleTestLogin('+84901234567', 'TestPass123', t('auth.test_login.store_owner'))}
              disabled={loading || isTestLogin}
              className="flex items-center justify-center space-x-1 sm:space-x-2 py-1.5 sm:py-2.5 px-1.5 sm:px-4 bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-md sm:rounded-xl text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] sm:text-sm font-medium"
            >
              <UserIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{t('auth.test_login.store_owner')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTestLogin('manager@phosaigon.vn', 'VnDelivery@Store2024', t('auth.test_login.manager'))}
              disabled={loading || isTestLogin}
              className="flex items-center justify-center space-x-1 sm:space-x-2 py-1.5 sm:py-2.5 px-1.5 sm:px-4 bg-violet-100 dark:bg-violet-500/10 border border-violet-300 dark:border-violet-500/30 rounded-md sm:rounded-xl text-violet-700 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] sm:text-sm font-medium"
            >
              <KeyIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{t('auth.test_login.manager')}</span>
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-[10px] sm:text-sm text-gray-600 dark:text-slate-400">
              {t('auth.signup.no_account')}{' '}
              <Link
                href="/signup"
                className="text-mint-600 dark:text-mint-400 hover:text-mint-700 dark:hover:text-mint-300 font-medium transition-colors text-[10px] sm:text-sm"
              >
                {t('auth.signup.register_now')}
              </Link>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-3 sm:mt-6 text-center">
          <div className="inline-flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-gradient-to-r from-mint-100 to-green-100 dark:from-mint-500/10 dark:to-green-500/10 border border-mint-300 dark:border-mint-500/30 rounded-md sm:rounded-xl backdrop-blur-sm">
            <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-mint-600 dark:text-mint-400" />
            <span className="text-[10px] sm:text-sm text-mint-700 dark:text-mint-300 font-medium">{t('auth.security.ssl_encrypted')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 sm:mt-8 text-center">
          <p className="text-[10px] sm:text-sm text-slate-400">
            {t('auth.footer.copyright')}
          </p>
          <div className="mt-1.5 sm:mt-2 flex items-center justify-center space-x-3 sm:space-x-4">
            <a href="#" className="text-[10px] sm:text-sm text-gray-600 dark:text-slate-400 hover:text-mint-600 dark:hover:text-mint-400 transition-colors">
              {t('auth.footer.terms')}
            </a>
            <span className="text-gray-400 dark:text-slate-600">•</span>
            <a href="#" className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 hover:text-mint-600 dark:hover:text-mint-400 transition-colors">
              {t('auth.footer.policy')}
            </a>
            <span className="text-gray-400 dark:text-slate-600">•</span>
            <a href="#" className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 hover:text-mint-600 dark:hover:text-mint-400 transition-colors">
              {t('auth.footer.support')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}