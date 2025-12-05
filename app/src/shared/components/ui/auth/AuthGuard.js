/**
 * AuthGuard - 인증 상태 관리 및 자동 로그아웃 처리
 * 앱 시작 시 토큰 상태 확인 및 만료된 토큰 정리
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkAuthStatus, clearTokens } from '@services/apollo/tokenManager';
import { autoLoginSuccess, logout } from '@store/slices/authSlice';
import { resetApolloStore } from '@services/apollo/apolloClient';
import { useTranslation } from 'react-i18next';

const AuthGuard = ({ children }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation(['auth']);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 AuthGuard: 인증 상태 초기화 시작');

        // AsyncStorage에서 토큰 상태 확인
        const authStatus = await checkAuthStatus();
        console.log('🔐 AuthGuard: 토큰 상태 확인 결과', authStatus);

        if (authStatus.isAuthenticated && !authStatus.needsRefresh) {
          // 유효한 토큰이 있는 경우 Redux에 복원
          dispatch(autoLoginSuccess({
            user: authStatus.user,
            accessToken: authStatus.accessToken,
            refreshToken: authStatus.refreshToken}));
          console.log('[SUCCESS] AuthGuard: 자동 로그인 성공');
        } else if (authStatus.needsRefresh || (!!authStatus.refreshToken && !authStatus.isAuthenticated)) {
          // 토큰이 만료되었지만 Refresh Token이 있는 경우
          // Apollo Client에서 자동으로 토큰 갱신을 시도할 예정
          console.log('[SYNC] AuthGuard: 토큰 갱신 필요 - Apollo Client가 자동 처리');
          dispatch(autoLoginSuccess({
            user: authStatus.user,
            accessToken: null, // 만료된 토큰은 제거
            refreshToken: authStatus.refreshToken}));
        } else {
          // 토큰이 없거나 모두 만료된 경우 로그아웃 처리
          console.log('[ERROR] AuthGuard: 토큰 없음 또는 만료 - 로그아웃 처리');
          await clearTokens();
          dispatch(logout());

          // Apollo Store도 초기화
          try {
            await resetApolloStore();
          } catch (error) {
            console.warn('Apollo Store 리셋 실패:', error);
          }
        }
      } catch (error) {
        console.error('[CRITICAL] AuthGuard: 초기화 오류', error);
        // 오류 발생 시 안전하게 로그아웃
        // 단, refreshToken이 남아있는 경우는 보류 (오프라인 가능성)
        try {
          const storedRefresh = await AsyncStorage.getItem('refreshToken');
          if (!storedRefresh) {
            await clearTokens();
            dispatch(logout());
          } else {
            console.log('[WARN] AuthGuard: 초기화 오류 발생했지만 refreshToken 존재 - 로그아웃 보류');
          }
        } catch (_) {
          await clearTokens();
          dispatch(logout());
        }

        try {
          await resetApolloStore();
        } catch (resetError) {
          console.warn('Apollo Store 리셋 실패:', resetError);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [dispatch]);

  // 초기화 로딩 화면
  if (isInitializing) {
    return (
      <View className="flex-1 items-center justify-center bg-[#2AC1BC]">
        <ActivityIndicator size="large" color="white" />
        <Text className="text-white text-lg mt-4">{t('auth:verifying')}</Text>
      </View>
    );
  }

  return children;
};

export default AuthGuard;
