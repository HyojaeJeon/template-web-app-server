/**
 * 소셜 로그인 버튼 컴포넌트
 * Google, Facebook OAuth 로그인 지원
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useToast } from '@/shared/providers/ToastProvider';
import { loginWithSocial } from '@store/slices/authSlice';

const SOCIAL_PROVIDERS = {
  google: {
    name: 'Google',
    icon: 'google',
    bgColor: 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700',
    textColor: 'text-gray-700 dark:text-gray-300',
    borderColor: 'border border-gray-300 dark:border-gray-600',
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  },
  facebook: {
    name: 'Facebook',
    icon: 'facebook',
    bgColor: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800',
    textColor: 'text-white',
    borderColor: '',
    appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
  }
};

export default function SocialLoginButtons({
  onSuccess,
  onError,
  redirectTo = '/dashboard',
  mode = 'login' // 'login' | 'register' | 'link'
}) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState({ google: false, facebook: false });

  /**
   * Google OAuth 로그인 처리
   */
  const handleGoogleLogin = async () => {
    try {
      setIsLoading({ ...isLoading, google: true });

      // Google OAuth2 URL 생성
      const params = new URLSearchParams({
        client_id: SOCIAL_PROVIDERS.google.clientId,
        redirect_uri: `${window.location.origin}/api/auth/google/callback`,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
        state: JSON.stringify({ mode, redirectTo })
      });

      // Google OAuth 페이지로 리다이렉트
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

    } catch (error) {
      console.error('Google 로그인 실패:', error);
      setIsLoading({ ...isLoading, google: false });
      handleError('Google 로그인 중 오류가 발생했습니다');
    }
  };

  /**
   * Facebook OAuth 로그인 처리
   */
  const handleFacebookLogin = async () => {
    try {
      setIsLoading({ ...isLoading, facebook: true });

      // Facebook SDK 초기화 확인
      if (!window.FB) {
        await initFacebookSDK();
      }

      // Facebook 로그인 다이얼로그
      window.FB.login(
        async (response) => {
          if (response.authResponse) {
            const { accessToken, userID } = response.authResponse;
            
            // 서버로 토큰 전송하여 인증 처리
            const result = await dispatch(loginWithSocial({
              provider: 'facebook',
              accessToken,
              userId: userID,
              mode
            })).unwrap();

            handleSuccess(result);
          } else {
            setIsLoading({ ...isLoading, facebook: false });
            console.log('Facebook 로그인 취소됨');
          }
        },
        { scope: 'public_profile,email' }
      );

    } catch (error) {
      console.error('Facebook 로그인 실패:', error);
      setIsLoading({ ...isLoading, facebook: false });
      handleError('Facebook 로그인 중 오류가 발생했습니다');
    }
  };

  /**
   * Facebook SDK 초기화
   */
  const initFacebookSDK = () => {
    return new Promise((resolve) => {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: SOCIAL_PROVIDERS.facebook.appId,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        resolve();
      };

      // Facebook SDK 로드
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/ko_KR/sdk.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    });
  };

  /**
   * 로그인 성공 처리
   */
  const handleSuccess = (result) => {
    if (mode === 'link') {
      showSuccess('소셜 계정이 연결되었습니다');
    } else {
      showSuccess('로그인 되었습니다');

      // 리다이렉트
      setTimeout(() => {
        router.push(redirectTo);
      }, 1000);
    }

    onSuccess?.(result);
  };

  /**
   * 에러 처리
   */
  const handleError = (message) => {
    showError(message);
    onError?.(message);
  };

  /**
   * 버튼 텍스트 생성
   */
  const getButtonText = (provider) => {
    if (isLoading[provider]) {
      return mode === 'link' ? '연결 중...' : '로그인 중...';
    }

    switch (mode) {
      case 'register':
        return `${SOCIAL_PROVIDERS[provider].name}로 회원가입`;
      case 'link':
        return `${SOCIAL_PROVIDERS[provider].name} 계정 연결`;
      default:
        return `${SOCIAL_PROVIDERS[provider].name}로 로그인`;
    }
  };

  return (
    <div className="space-y-3">
      {/* 구분선 */}
      {mode !== 'link' && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
              또는
            </span>
          </div>
        </div>
      )}

      {/* Google 로그인 버튼 */}
      <button
        onClick={handleGoogleLogin}
        disabled={isLoading.google || isLoading.facebook}
        className={`
          w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg
          font-medium transition-colors duration-200
          ${SOCIAL_PROVIDERS.google.bgColor}
          ${SOCIAL_PROVIDERS.google.textColor}
          ${SOCIAL_PROVIDERS.google.borderColor}
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        `}
        aria-label={getButtonText('google')}
      >
        {isLoading.google ? (
          <span className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        <span>{getButtonText('google')}</span>
      </button>

      {/* Facebook 로그인 버튼 */}
      <button
        onClick={handleFacebookLogin}
        disabled={isLoading.google || isLoading.facebook}
        className={`
          w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg
          font-medium transition-colors duration-200
          ${SOCIAL_PROVIDERS.facebook.bgColor}
          ${SOCIAL_PROVIDERS.facebook.textColor}
          ${SOCIAL_PROVIDERS.facebook.borderColor}
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        `}
        aria-label={getButtonText('facebook')}
      >
        {isLoading.facebook ? (
          <span className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        )}
        <span>{getButtonText('facebook')}</span>
      </button>

      {/* 안내 텍스트 */}
      {mode === 'register' && (
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          소셜 계정으로 회원가입 시 서비스 약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다
        </p>
      )}
    </div>
  );
}