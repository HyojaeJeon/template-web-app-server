/**
 * Flipper 플러그인 초기화 설정
 *
 * 설치된 플러그인들:
 * - react-native-flipper-databases
 * - flipper-plugin-react-navigation
 * - flipper-plugin-redux-debugger
 * - flipper-plugin-async-storage
 * - flipper-plugin-react-native-performance
 * - flipper-plugin-bridgespy
 * - flipper-plugin-reactotron
 */

import logger from '@shared/utils/system/logger';

let isFlipperInitialized = false;

/**
 * Flipper 플러그인들을 초기화합니다
 */
export const initializeFlipper = () => {
  // 개발 모드이고 아직 초기화되지 않은 경우에만 실행
  if (!__DEV__ || isFlipperInitialized) {
    return;
  }

  try {
    logger.info('🔧 Flipper 플러그인 초기화 시작...');

    // Flipper가 사용 가능한지 확인
    const Flipper = require('react-native-flipper');
    if (!Flipper || !Flipper.addPlugin) {
      logger.warn('⚠️ react-native-flipper를 찾을 수 없습니다');
      return;
    }

    const { addPlugin } = Flipper;

    // 1. Redux Debugger 플러그인
    try {
      addPlugin({
        getId() { return 'Redux'; },
        onConnect(connection) {
          // Redux 상태 변경 리스너 등록 (나중에 Redux store와 연결)
          logger.info('✅ Redux Debugger 플러그인 연결됨');
        },
        onDisconnect() {
          logger.info('❌ Redux Debugger 플러그인 연결 해제됨');
        },
        runInBackground() { return false; }
      });
    } catch (error) {
      logger.warn('⚠️ Redux Debugger 플러그인 초기화 실패:', error);
    }

    // 2. React Navigation 플러그인
    try {
      addPlugin({
        getId() { return 'ReactNavigation'; },
        onConnect(connection) {
          logger.info('✅ React Navigation 플러그인 연결됨');
        },
        onDisconnect() {
          logger.info('❌ React Navigation 플러그인 연결 해제됨');
        },
        runInBackground() { return false; }
      });
    } catch (error) {
      logger.warn('⚠️ React Navigation 플러그인 초기화 실패:', error);
    }

    // 3. AsyncStorage 플러그인
    try {
      addPlugin({
        getId() { return 'AsyncStorage'; },
        onConnect(connection) {
          logger.info('✅ AsyncStorage 플러그인 연결됨');
        },
        onDisconnect() {
          logger.info('❌ AsyncStorage 플러그인 연결 해제됨');
        },
        runInBackground() { return false; }
      });
    } catch (error) {
      logger.warn('⚠️ AsyncStorage 플러그인 초기화 실패:', error);
    }

    // 4. Performance Monitor 플러그인 (제거됨 - 호환성 문제)

    // 5. Bridge Spy 플러그인
    try {
      addPlugin({
        getId() { return 'BridgeSpy'; },
        onConnect(connection) {
          logger.info('✅ Bridge Spy 플러그인 연결됨');
        },
        onDisconnect() {
          logger.info('❌ Bridge Spy 플러그인 연결 해제됨');
        },
        runInBackground() { return false; }
      });
    } catch (error) {
      logger.warn('⚠️ Bridge Spy 플러그인 초기화 실패:', error);
    }

    // 6. Databases 플러그인
    try {
      addPlugin({
        getId() { return 'Databases'; },
        onConnect(connection) {
          logger.info('✅ Databases 플러그인 연결됨');
        },
        onDisconnect() {
          logger.info('❌ Databases 플러그인 연결 해제됨');
        },
        runInBackground() { return false; }
      });
    } catch (error) {
      logger.warn('⚠️ Databases 플러그인 초기화 실패:', error);
    }

    isFlipperInitialized = true;
    logger.info('🎉 Flipper 플러그인 초기화 완료');

  } catch (error) {
    logger.error('❌ Flipper 초기화 중 오류 발생:', error);
  }
};

/**
 * Redux store와 Flipper Redux 플러그인을 연결합니다
 * @param {object} store - Redux store 인스턴스
 */
export const connectReduxToFlipper = (store) => {
  if (!__DEV__ || !store) {
    return;
  }

  try {
    const { addPlugin } = require('react-native-flipper');

    addPlugin({
      getId() { return 'Redux'; },
      onConnect(connection) {
        // 현재 상태 전송
        connection.send('state', { state: store.getState() });

        // 상태 변경 리스너 등록
        const unsubscribe = store.subscribe(() => {
          connection.send('state', { state: store.getState() });
        });

        connection.receive('dispatch', (data, responder) => {
          store.dispatch(data.action);
          responder.success();
        });

        return unsubscribe;
      },
      onDisconnect() {
        logger.info('Redux Flipper 플러그인 연결 해제');
      },
      runInBackground() { return false; }
    });

    logger.info('🔗 Redux store가 Flipper에 연결됨');
  } catch (error) {
    logger.warn('⚠️ Redux Flipper 연결 실패:', error);
  }
};

export default {
  initializeFlipper,
  connectReduxToFlipper
};
