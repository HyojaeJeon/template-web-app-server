/**
 * @format
 */
import 'react-native-gesture-handler'; // iOS에서 필수 - 최상단에 위치해야 함

import { AppRegistry, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// =====================================================
// 백그라운드 메시지 핸들러 (앱 시작 전 필수 등록!)
// =====================================================
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[Background] FCM 메시지 수신:', {
    messageId: remoteMessage?.messageId,
    notification: remoteMessage?.notification,
    data: remoteMessage?.data,
  });

  try {
    // 채널 생성 (Android)
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'delivery-channel',
        name: '배달 알림',
        importance: 4, // HIGH
        sound: 'default',
        vibration: true,
        vibrationPattern: [300, 500],
      });
    }

    // 알림 표시
    const { notification, data } = remoteMessage;

    await notifee.displayNotification({
      title: notification?.title || '새 알림',
      body: notification?.body || '',
      data: data || {},
      android: {
        channelId: data?.channelId || 'delivery-channel',
        smallIcon: 'ic_notification',
        priority: 4,
        importance: 4,
        sound: 'default',
        vibrationPattern: [300, 500],
        pressAction: {
          id: 'default',
        },
      },
      ios: {
        sound: 'default',
      },
    });

    console.log('[Background] 알림 표시 완료');
  } catch (error) {
    console.error('[Background] 알림 표시 실패:', error);
  }
});

console.log('[Background Handler] 등록 완료');

AppRegistry.registerComponent(appName, () => App);
