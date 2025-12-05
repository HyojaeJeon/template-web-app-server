import { Platform } from 'react-native';

// 공통 스크린 옵션
export const defaultScreenOptions = {
  headerShown: true,
  headerBackTitle: '',
  headerTintColor: '#333',
  headerTitleStyle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerStyle: {
    backgroundColor: '#fff',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardStyleInterpolator: Platform.OS === 'android'
    ? undefined
    : ({ current: { progress } }) => ({
        cardStyle: {
          opacity: progress,
        },
      }),
};

// 모달 스크린 옵션
export const modalScreenOptions = {
  presentation: 'modal',
  headerShown: true,
  headerStyle: {
    backgroundColor: '#fff',
  },
  cardStyle: {
    backgroundColor: 'transparent',
  },
};

// 투명 헤더 옵션
export const transparentHeaderOptions = {
  headerTransparent: true,
  headerTintColor: '#fff',
  headerTitleStyle: {
    color: '#fff',
  },
};

// 탭 네비게이터 옵션
export const tabBarOptions = {
  activeTintColor: '#2AC1BC',
  inactiveTintColor: '#8E8E93',
  labelStyle: {
    fontSize: 11,
    fontWeight: '500',
  },
  style: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: 5,
    paddingTop: 5,
  },
};

// 스택별 기본 옵션
export const stackOptions = {
  home: {
    ...defaultScreenOptions,
    headerShown: false,
  },
  store: {
    ...defaultScreenOptions,
    headerTintColor: '#2AC1BC',
  },
  order: {
    ...defaultScreenOptions,
    headerStyle: {
      ...defaultScreenOptions.headerStyle,
      backgroundColor: '#fafafa',
    },
  },
  profile: {
    ...defaultScreenOptions,
  },
  chat: {
    ...defaultScreenOptions,
    headerStyle: {
      ...defaultScreenOptions.headerStyle,
      borderBottomWidth: 0,
    },
  },
};

// 애니메이션 설정
export const screenTransitions = {
  slide: {
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    cardStyleInterpolator: ({ current, layouts }) => ({
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
      },
    }),
  },
  fade: {
    cardStyleInterpolator: ({ current }) => ({
      cardStyle: {
        opacity: current.progress,
      },
    }),
  },
  modal: {
    gestureEnabled: true,
    gestureDirection: 'vertical',
    cardStyleInterpolator: ({ current, layouts }) => ({
      cardStyle: {
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height, 0],
            }),
          },
        ],
      },
    }),
  },
};