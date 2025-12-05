'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAccessToken, selectRefreshToken } from '@/store/slices/authSlice';

// Redux Persist 복원 완료 확인 컴포넌트
function TokenVerifyComponent({ children }) {
  const accessToken = useSelector(selectAccessToken);
  const refreshToken = useSelector(selectRefreshToken);

  useEffect(() => {
    // Redux Persist가 토큰을 복원했는지 확인 (tokenManager는 Redux에서 자동으로 읽음)
    // 로그는 제거됨
  }, [accessToken, refreshToken]);

  return children;
}

export default function ReduxProvider({ children }) {
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
          </div>
        }
        persistor={persistor}
      >
        <TokenVerifyComponent>
          {children}
        </TokenVerifyComponent>
      </PersistGate>
    </Provider>
  );
}