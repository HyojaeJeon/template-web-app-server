'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/shared/i18n';
import { 
  BuildingStorefrontIcon,
  EnvelopeIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  SparklesIcon,
  LanguageIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/solid';

// GraphQL Mutation - StoreAccount 비밀번호 재설정
const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordResetWithEmail($email: String!) {
    requestPasswordResetWithEmail(email: $email) {
      success
      message
      sentTo
    }
  }
`;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation('auth');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  
  // Theme & Language State
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState('vi');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  
  const [requestPasswordReset, { loading }] = useMutation(REQUEST_PASSWORD_RESET_MUTATION);

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
    setShowThemeDropdown(false);
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

  const themes = [
    { value: 'light', label: 'Light', icon: SunIcon },
    { value: 'dark', label: 'Dark', icon: MoonIcon }
  ];

  function handleThemeChange(newTheme) {
    setTheme(newTheme);
    setShowThemeDropdown(false);
  }


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 이메일 유효성 검사
    if (!email) {
      setValidationError(t('validation.email_required'));
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError(t('validation.email_invalid'));
      return;
    }

    setError('');
    setValidationError('');

    try {
      const { data } = await requestPasswordReset({
        variables: { email },
      });

      if (data?.requestPasswordResetWithEmail?.success) {
        setSuccess(true);
      } else {
        throw new Error(data?.requestPasswordResetWithEmail?.message || t('forgot_password.email_not_found'));
      }
    } catch (err) {
      console.error('Password reset error:', err);
      
      // GraphQL 에러 처리
      if (err.graphQLErrors?.length > 0) {
        setError(err.graphQLErrors[0].message);
      } else if (err.networkError) {
        if (err.networkError.statusCode === 404) {
          setError('GraphQL server connection failed. Please contact administrator.');
        } else {
          setError('Please check your network connection.');
        }
      } else {
        setError(err.message || 'An error occurred during processing.');
      }
    }
  };

  // 성공 화면
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-mint-50 dark:from-slate-900 dark:via-mint-900/20 dark:to-slate-900 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
        {/* 배경 효과 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-mint-500/10 via-transparent to-transparent dark:from-mint-900/20 dark:via-slate-900/40 dark:to-slate-900"></div>
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232AC1BC' fill-opacity='0.03'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
        
        {/* Top Bar with Language and Theme Selectors */}
        <div className="absolute top-0 left-0 right-0 p-4 z-20">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <BuildingStorefrontIcon className="h-8 w-8 text-mint-500 dark:text-mint-400" />
              <span className="text-xl font-bold text-gray-800 dark:text-white">DeliveryVN Store</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                >
                  <LanguageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-slate-400" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300">
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
        
        <div className="relative w-full max-w-md z-10 mt-16 sm:mt-0">
          <div className="bg-white dark:bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-white/20 p-6 sm:p-8 text-center">
            {/* 성공 아이콘 */}
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-mint-500 to-green-500 rounded-full shadow-2xl mb-4 sm:mb-6">
              <CheckCircleIcon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">
              {t('forgot_password.success_title')}
            </h2>
            
            <div className="space-y-3 mb-6 sm:mb-8">
              <p className="text-gray-700 dark:text-slate-300 text-sm sm:text-base">
                {t('forgot_password.success_message', { email })}
              </p>
              <div className="bg-blue-100 dark:bg-blue-500/20 border border-blue-300 dark:border-blue-500/30 rounded-xl p-3 sm:p-4">
                <p className="text-blue-700 dark:text-blue-300 text-xs sm:text-sm">
                  {t('forgot_password.success_instruction')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-mint-500 to-green-500 hover:from-mint-600 hover:to-green-600 text-white text-sm sm:text-base font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-sm sm:text-base">{t('forgot_password.back_to_login')}</span>
              </Link>

              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                className="w-full py-1.5 sm:py-2 text-gray-600 dark:text-slate-400 hover:text-mint-600 dark:hover:text-mint-300 text-xs sm:text-sm transition-colors duration-200"
              >
                {t('forgot_password.resend_email')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 이메일 입력 화면
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-mint-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-slate-900 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* 배경 효과 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-mint-500/10 via-transparent to-transparent dark:from-blue-900/20 dark:via-slate-900/40 dark:to-slate-900"></div>
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>
      
      {/* Top Bar with Language and Theme Selectors */}
      <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <BuildingStorefrontIcon className="h-6 w-6 sm:h-8 sm:w-8 text-mint-500 dark:text-mint-400" />
            <span className="text-base sm:text-xl font-bold text-gray-800 dark:text-white">DeliveryVN Store</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center space-x-2 px-3 py-2 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
              >
                <LanguageIcon className="h-5 w-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">
                  {languages.find(l => l.code === language)?.flag}
                </span>
              </button>
              
              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full px-4 py-2 text-left hover:bg-slate-700 flex items-center space-x-3 ${
                        language === lang.code ? 'bg-emerald-900/30' : ''
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-sm text-slate-300">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Selector */}
            <div className="relative">
              <button
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className="flex items-center space-x-2 px-3 py-2 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
              >
                {!mounted ? (
                  <div className="h-5 w-5 bg-slate-600 rounded animate-pulse" />
                ) : (
                  <>
                    {theme === 'light' ? (
                      <SunIcon className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <MoonIcon className="h-5 w-5 text-blue-400" />
                    )}
                  </>
                )}
              </button>
              
              {showThemeDropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
                  {themes.map((themeOption) => {
                    const Icon = themeOption.icon;
                    return (
                      <button
                        key={themeOption.value}
                        onClick={() => handleThemeChange(themeOption.value)}
                        className={`w-full px-4 py-2 text-left hover:bg-slate-700 flex items-center space-x-3 ${
                          theme === themeOption.value ? 'bg-emerald-900/30' : ''
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${
                          themeOption.value === 'light' ? 'text-yellow-500' :
                          themeOption.value === 'dark' ? 'text-blue-400' :
                          'text-slate-400'
                        }`} />
                        <span className="text-sm text-slate-300">{themeOption.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative w-full max-w-md z-10 mt-16 sm:mt-0">
        {/* 로고 및 타이틀 */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-mint-500 to-green-500 rounded-3xl shadow-2xl mb-4 sm:mb-6 transform hover:scale-105 transition-transform duration-300">
            <EnvelopeIcon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-2 tracking-tight">
            {t('forgot_password.title')}
          </h1>
          <p className="text-gray-600 dark:text-slate-400 text-sm sm:text-lg px-4 sm:px-0">
            {t('forgot_password.subtitle')}
          </p>
        </div>

        {/* 메인 폼 카드 */}
        <div className="bg-white dark:bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-white/20 p-6 sm:p-8 space-y-5 sm:space-y-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
              <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-300 text-xs sm:text-sm font-medium">{error}</p>
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="bg-blue-100 dark:bg-blue-500/20 border border-blue-300 dark:border-blue-500/30 rounded-xl p-4 flex items-start space-x-3">
            <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-700 dark:text-blue-300 text-xs sm:text-sm">
                {t('forgot_password.email_placeholder')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이메일 입력 */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300">
                {t('form.email')}
              </label>
              <div className="relative flex items-center">
                <EnvelopeIcon className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setValidationError('');
                    setError('');
                  }}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 bg-white dark:bg-slate-800/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-sm sm:text-base text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-all duration-200"
                  placeholder={t('forgot_password.email_placeholder')}
                  disabled={loading}
                />
              </div>
              {validationError && (
                <p className="text-red-600 dark:text-red-300 text-xs sm:text-sm font-medium">{validationError}</p>
              )}
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-mint-500 to-green-500 hover:from-mint-600 hover:to-green-600 text-white text-sm sm:text-base font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:ring-4 focus:ring-mint-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-sm sm:text-base">{t('forgot_password.sending')}</span>
                </div>
              ) : (
                t('forgot_password.send_link')
              )}
            </button>
          </form>

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 sm:px-3 bg-white dark:bg-white/10 text-gray-600 dark:text-slate-400 text-xs sm:text-sm rounded-lg">{t('common.or')}</span>
            </div>
          </div>

          {/* 링크들 */}
          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/30 hover:border-gray-400 dark:hover:border-slate-500/50 transition-all duration-200"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-sm sm:text-base">{t('forgot_password.back_to_login')}</span>
            </Link>

            <Link
              href="/signup"
              className="w-full flex justify-center py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 dark:text-slate-400 hover:text-mint-600 dark:hover:text-mint-300 transition-colors duration-200"
            >
              {t('signup.register_now')}
            </Link>
          </div>
        </div>

        {/* 도움말 링크 */}
        <div className="mt-6 sm:mt-8 text-center text-gray-600 dark:text-slate-500 text-xs sm:text-sm">
          <p>
            {t('forgot_password.contact_help')}{' '}
            <a href="#" className="text-mint-600 dark:text-mint-400 hover:text-mint-700 dark:hover:text-mint-300 transition-colors">
              {t('footer.support')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}