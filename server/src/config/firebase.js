/**
 * Firebase Admin SDK 초기화 설정
 * ================================
 *
 * FCM 푸시 알림 전송을 위한 Firebase Admin SDK 초기화
 * 환경별 설정 사용 (_DEV, _PROD)
 *
 * @module config/firebase
 */

import admin from 'firebase-admin';
import { firebaseConfig as envFirebaseConfig } from './env.js';

/**
 * Firebase Admin SDK 초기화 상태
 */
let isInitialized = false;

/**
 * Firebase Admin SDK 초기화
 *
 * - 서버 시작 시 단 한 번만 호출됨
 * - 환경변수에서 서비스 계정 정보를 가져와 초기화
 * - 이미 초기화된 경우 재초기화하지 않음
 */
export const initializeFirebase = () => {
  // 이미 초기화된 경우 스킵
  if (isInitialized || admin.apps.length > 0) {
    console.log('✅ [Firebase] Firebase Admin SDK 이미 초기화됨');
    return admin;
  }

  try {
    // 환경별 설정에서 값 가져오기
    const projectId = envFirebaseConfig.projectId;
    const privateKey = envFirebaseConfig.privateKey;
    const clientEmail = envFirebaseConfig.clientEmail;

    // 필수 환경변수 검증
    if (!projectId || !privateKey || !clientEmail) {
      console.warn('⚠️ [Firebase] Firebase 환경변수가 설정되지 않았습니다.');
      console.warn('⚠️ [Firebase] FCM 푸시 알림 기능이 비활성화됩니다.');
      console.warn('⚠️ [Firebase] 필수 환경변수: FIREBASE_PROJECT_ID_DEV/PROD, FIREBASE_PRIVATE_KEY_DEV/PROD, FIREBASE_CLIENT_EMAIL_DEV/PROD');
      return null;
    }

    // Private Key 포맷팅 (\\n → \n 변환)
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    // Firebase Admin 초기화
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: formattedPrivateKey,
        clientEmail
      })
    });

    isInitialized = true;

    console.log('✅ [Firebase] Firebase Admin SDK 초기화 성공');
    console.log('📱 [Firebase] FCM 푸시 알림 기능 활성화됨');
    console.log(`🔑 [Firebase] Project ID: ${projectId}`);

    return admin;

  } catch (error) {
    console.error('❌ [Firebase] Firebase Admin SDK 초기화 실패:', error.message);
    console.error('❌ [Firebase] FCM 푸시 알림 기능이 비활성화됩니다.');

    // 초기화 실패 시에도 서버는 계속 동작
    return null;
  }
};

/**
 * Firebase Admin 인스턴스 가져오기
 *
 * @returns {admin.app.App|null} Firebase Admin 인스턴스 또는 null
 */
export const getFirebaseAdmin = () => {
  if (!isInitialized && admin.apps.length === 0) {
    console.warn('⚠️ [Firebase] Firebase Admin SDK가 초기화되지 않았습니다.');
    return null;
  }

  return admin;
};

/**
 * Firebase Messaging 인스턴스 가져오기
 *
 * @returns {admin.messaging.Messaging|null} Firebase Messaging 인스턴스 또는 null
 */
export const getFirebaseMessaging = () => {
  const firebaseAdmin = getFirebaseAdmin();

  if (!firebaseAdmin) {
    return null;
  }

  return firebaseAdmin.messaging();
};

/**
 * Firebase 초기화 상태 확인
 *
 * @returns {boolean} 초기화 여부
 */
export const isFirebaseInitialized = () => {
  return isInitialized && admin.apps.length > 0;
};

// 기본 export
export default admin;
