/**
 * MainNavigator - 앱의 메인 네비게이터 (기본 뼈대)
 * 인증 상태에 따라 Auth/Main 화면 전환
 */

import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { AppState } from 'react-native';
import { checkAuthStatus, clearTokens } from '@services/apollo/tokenManager';
import { logout } from '@store/slices/authSlice';
import { resetApolloStore } from '@services/apollo/apolloClient';
import AuthNavigator from '@navigation/navigators/AuthNavigator';
import TabNavigator from '@navigation/navigators/TabNavigator';

const Stack = createStackNavigator();

const MainNavigator = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(state => state.auth?.isAuthenticated || false);

  console.log('[MainNavigator] 인증 상태:', isAuthenticated);

  useEffect(() => {
    let isProcessing = false;

    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'active' && isAuthenticated && !isProcessing) {
        isProcessing = true;
        console.log('[MainNavigator] 앱 포그라운드 진입 - 토큰 상태 재검증');

        try {
          const authStatus = await checkAuthStatus();

          if (!authStatus.isAuthenticated && !authStatus?.refreshToken) {
            console.log('[MainNavigator] 토큰 만료 - 자동 로그아웃');
            await clearTokens();
            dispatch(logout());

            try {
              await resetApolloStore();
            } catch (error) {
              console.warn('Apollo 리셋 실패:', error);
            }
          }
        } catch (error) {
          console.error('[MainNavigator] 토큰 상태 재검증 오류', error);
        } finally {
          isProcessing = false;
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      isProcessing = false;
    };
  }, [isAuthenticated, dispatch]);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={isAuthenticated ? 'Main' : 'Auth'}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default MainNavigator;
