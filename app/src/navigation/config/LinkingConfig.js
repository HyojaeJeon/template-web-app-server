/**
 * Deep Link 설정 (기본 뼈대)
 */
import { Linking } from 'react-native';

const LinkingConfiguration = {
  prefixes: [
    'deliveryvn://',
    'https://deliveryvn.app',
    'http://deliveryvn.app',
  ],
  config: {
    screens: {
      // 인증 네비게이터
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          OTPVerification: 'verify-otp',
          ForgotPassword: 'forgot-password'
        }
      },

      // 메인 탭 네비게이션
      Main: {
        screens: {
          // 홈 탭
          HomeTab: {
            screens: {
              Home: 'home'
            }
          },

          // 프로필 탭
          ProfileTab: {
            screens: {
              Profile: 'profile',
              Settings: 'settings'
            }
          }
        }
      },

      // 404 페이지
      NotFound: '*'
    }
  },

  getInitialURL: async () => {
    const url = await Linking.getInitialURL();
    return url;
  },

  subscribe: (listener) => {
    const onReceiveURL = ({ url }) => listener(url);
    const subscription = Linking.addEventListener('url', onReceiveURL);

    return () => {
      subscription?.remove();
    };
  }
};

export default LinkingConfiguration;
