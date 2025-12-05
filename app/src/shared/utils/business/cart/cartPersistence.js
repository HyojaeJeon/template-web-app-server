/**
 * Cart Persistence Utility
 * 장바구니 데이터 지속성을 위한 AsyncStorage 기반 유틸리티
 * Local 배달 앱 특화 - 오프라인 상황 대응
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage 키 상수
const CART_STORAGE_KEY = '@DeliveryVN:cart';
const CART_METADATA_KEY = '@DeliveryVN:cart_metadata';
const MAX_CART_AGE = 24 * 60 * 60 * 1000; // 24시간

/**
 * 장바구니 데이터를 로컬 스토리지에 저장
 * @param {Object} cartData - 장바구니 데이터
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export const persistCart = async (cartData) => {
  try {
    if (!cartData || typeof cartData !== 'object') {
      console.warn('[CartPersistence] Invalid cart data provided');
      return false;
    }

    // 메타데이터 생성
    const metadata = {
      timestamp: Date.now(),
      version: '1.0',
      itemCount: cartData.items?.length || 0,
      storeId: cartData.storeId || null
    };

    // 데이터와 메타데이터를 동시에 저장
    await Promise.all([
      AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData)),
      AsyncStorage.setItem(CART_METADATA_KEY, JSON.stringify(metadata))
    ]);

    console.log('[CartPersistence] Cart saved successfully', {
      itemCount: metadata.itemCount,
      storeId: metadata.storeId
    });

    return true;
  } catch (error) {
    console.error('[CartPersistence] Failed to persist cart:', error);
    return false;
  }
};

/**
 * 로컬 스토리지에서 장바구니 데이터 복원
 * @returns {Promise<Object|null>} 장바구니 데이터 또는 null
 */
export const restoreCart = async () => {
  try {
    // 데이터와 메타데이터를 동시에 가져오기
    const [cartDataStr, metadataStr] = await Promise.all([
      AsyncStorage.getItem(CART_STORAGE_KEY),
      AsyncStorage.getItem(CART_METADATA_KEY)
    ]);

    if (!cartDataStr || !metadataStr) {
      console.log('[CartPersistence] No cart data found');
      return null;
    }

    const metadata = JSON.parse(metadataStr);
    const currentTime = Date.now();

    // 장바구니 데이터 만료 확인
    if (currentTime - metadata.timestamp > MAX_CART_AGE) {
      console.log('[CartPersistence] Cart data expired, clearing...');
      await clearPersistedCart();
      return null;
    }

    const cartData = JSON.parse(cartDataStr);

    // 데이터 유효성 검증
    if (!cartData || typeof cartData !== 'object') {
      console.warn('[CartPersistence] Invalid cart data structure');
      await clearPersistedCart();
      return null;
    }

    console.log('[CartPersistence] Cart restored successfully', {
      itemCount: cartData.items?.length || 0,
      storeId: cartData.storeId,
      age: Math.round((currentTime - metadata.timestamp) / 1000 / 60) + ' minutes'
    });

    return {
      ...cartData,
      isRestored: true,
      restoredAt: currentTime
    };
  } catch (error) {
    console.error('[CartPersistence] Failed to restore cart:', error);
    await clearPersistedCart();
    return null;
  }
};

/**
 * 저장된 장바구니 데이터를 완전히 삭제
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
export const clearPersistedCart = async () => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(CART_STORAGE_KEY),
      AsyncStorage.removeItem(CART_METADATA_KEY)
    ]);

    console.log('[CartPersistence] Cart data cleared');
    return true;
  } catch (error) {
    console.error('[CartPersistence] Failed to clear cart:', error);
    return false;
  }
};

/**
 * 장바구니 메타데이터만 가져오기 (데이터 로드 없이)
 * @returns {Promise<Object|null>} 메타데이터 또는 null
 */
export const getCartMetadata = async () => {
  try {
    const metadataStr = await AsyncStorage.getItem(CART_METADATA_KEY);
    if (!metadataStr) return null;

    const metadata = JSON.parse(metadataStr);
    const currentTime = Date.now();

    return {
      ...metadata,
      isExpired: (currentTime - metadata.timestamp) > MAX_CART_AGE,
      ageInMinutes: Math.round((currentTime - metadata.timestamp) / 1000 / 60)
    };
  } catch (error) {
    console.error('[CartPersistence] Failed to get metadata:', error);
    return null;
  }
};

/**
 * 장바구니 데이터 존재 여부 확인
 * @returns {Promise<boolean>} 존재 여부
 */
export const hasPersistedCart = async () => {
  try {
    const metadata = await getCartMetadata();
    return metadata && !metadata.isExpired;
  } catch (error) {
    console.error('[CartPersistence] Failed to check cart existence:', error);
    return false;
  }
};

export default {
  persistCart,
  restoreCart,
  clearPersistedCart,
  getCartMetadata,
  hasPersistedCart
};