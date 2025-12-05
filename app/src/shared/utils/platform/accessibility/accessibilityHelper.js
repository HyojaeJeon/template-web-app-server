import { AccessibilityInfo, Platform, NativeModules } from 'react-native';
import logger from '@shared/utils/system/logger';

// Legacy Bridge 네이티브 모듈 직접 접근
const getLegacyAccessibilityModule = () => {
  try {
    if (Platform.OS === 'android') {
      // Android: AccessibilityInfo 모듈 직접 접근
      return NativeModules.AccessibilityInfo || null;
    } else {
      // iOS: AccessibilityManager 모듈 직접 접근
      return NativeModules.AccessibilityManager || null;
    }
  } catch (error) {
    logger.warn('[AccessibilityHelper] Legacy 모듈 접근 실패:', error);
    return null;
  }
};

// TurboModule vs Legacy Bridge 감지
const detectAccessibilityModuleType = () => {
  const legacyModule = getLegacyAccessibilityModule();

  return {
    hasTurboModule: AccessibilityInfo && typeof AccessibilityInfo === 'object',
    hasLegacyBridge: legacyModule !== null,
    legacyModule,
    preferredMode: legacyModule ? 'legacy' : 'turbo'};
};

// 모듈 정보 캐싱 (성능 최적화)
let moduleInfo = null;
const getModuleInfo = () => {
  if (!moduleInfo) {
    moduleInfo = detectAccessibilityModuleType();
    logger.info('[AccessibilityHelper] 모듈 정보:', moduleInfo);
  }
  return moduleInfo;
};

// AccessibilityInfo 네이티브 모듈 가용성 확인 (개선된 버전)
const isAccessibilityInfoAvailable = () => {
  try {
    const info = getModuleInfo();

    // Legacy Bridge 우선 사용 (더 안정적)
    if (info.hasLegacyBridge) {
      return true;
    }

    // TurboModule 사용 가능한 경우
    if (info.hasTurboModule) {
      const requiredMethods = ['isScreenReaderEnabled', 'isReduceMotionEnabled'];
      return requiredMethods.every(method =>
        typeof AccessibilityInfo[method] === 'function'
      );
    }

    return false;
  } catch (error) {
    logger.warn('[AccessibilityHelper] 가용성 확인 실패:', error);
    return false;
  }
};

// Legacy Bridge를 통한 안전한 메서드 호출
const callLegacyMethod = async (methodName, defaultValue = false) => {
  const info = getModuleInfo();

  if (!info.hasLegacyBridge) {
    logger.warn(`[AccessibilityHelper] Legacy 모듈 없음: ${methodName}`);
    return defaultValue;
  }

  return new Promise((resolve) => {
    try {
      const module = info.legacyModule;

      if (Platform.OS === 'android') {
        // Android Legacy 메서드 직접 호출
        switch (methodName) {
          case 'isReduceMotionEnabled':
            module.isReduceMotionEnabled?.(resolve) || resolve(defaultValue);
            break;
          case 'isTouchExplorationEnabled':
            module.isTouchExplorationEnabled?.(resolve) || resolve(defaultValue);
            break;
          case 'isGrayscaleEnabled':
            module.isGrayscaleEnabled?.(resolve) || resolve(defaultValue);
            break;
          case 'isInvertColorsEnabled':
            module.isInvertColorsEnabled?.(resolve) || resolve(defaultValue);
            break;
          case 'isHighTextContrastEnabled':
            module.isHighTextContrastEnabled?.(resolve) || resolve(defaultValue);
            break;
          default:
            resolve(defaultValue);
        }
      } else {
        // iOS Legacy 메서드 직접 호출
        switch (methodName) {
          case 'getCurrentReduceMotionState':
            module.getCurrentReduceMotionState?.(resolve, () => resolve(defaultValue));
            break;
          case 'getCurrentVoiceOverState':
            module.getCurrentVoiceOverState?.(resolve, () => resolve(defaultValue));
            break;
          case 'getCurrentBoldTextState':
            module.getCurrentBoldTextState?.(resolve, () => resolve(defaultValue));
            break;
          case 'getCurrentGrayscaleState':
            module.getCurrentGrayscaleState?.(resolve, () => resolve(defaultValue));
            break;
          case 'getCurrentInvertColorsState':
            module.getCurrentInvertColorsState?.(resolve, () => resolve(defaultValue));
            break;
          case 'getCurrentReduceTransparencyState':
            module.getCurrentReduceTransparencyState?.(resolve, () => resolve(defaultValue));
            break;
          default:
            resolve(defaultValue);
        }
      }
    } catch (error) {
      logger.warn(`[AccessibilityHelper] Legacy 메서드 실행 실패 ${methodName}:`, error);
      resolve(defaultValue);
    }
  });
};

// 하이브리드 접근: TurboModule → Legacy Bridge → Fallback
const callAccessibilityMethod = async (turboMethod, legacyMethod, defaultValue = false) => {
  const info = getModuleInfo();

  // 1순위: TurboModule 시도
  if (info.hasTurboModule) {
    try {
      return await AccessibilityInfo[turboMethod]();
    } catch (error) {
      logger.warn(`[AccessibilityHelper] TurboModule ${turboMethod} 실패:`, error);
    }
  }

  // 2순위: Legacy Bridge 시도
  if (info.hasLegacyBridge) {
    try {
      return await callLegacyMethod(legacyMethod, defaultValue);
    } catch (error) {
      logger.warn(`[AccessibilityHelper] Legacy ${legacyMethod} 실패:`, error);
    }
  }

  // 3순위: Fallback
  logger.warn(`[AccessibilityHelper] 모든 방법 실패, 기본값 사용: ${defaultValue}`);
  return defaultValue;
};

// 안전한 AccessibilityInfo API 래퍼 (개선된 버전)
export const SafeAccessibilityInfo = {
  // 스크린 리더 활성화 상태 확인
  isScreenReaderEnabled: async () => {
    const legacyMethod = Platform.OS === 'android'
      ? 'isTouchExplorationEnabled'
      : 'getCurrentVoiceOverState';

    return await callAccessibilityMethod(
      'isScreenReaderEnabled',
      legacyMethod,
      false
    );
  },

  // Reduce Motion 설정 확인 (핵심 문제 해결)
  isReduceMotionEnabled: async () => {
    const legacyMethod = Platform.OS === 'android'
      ? 'isReduceMotionEnabled'
      : 'getCurrentReduceMotionState';

    return await callAccessibilityMethod(
      'isReduceMotionEnabled',
      legacyMethod,
      false
    );
  },

  // Reduce Transparency 설정 확인
  isReduceTransparencyEnabled: async () => {
    if (Platform.OS === 'android') {
      return false; // Android 미지원
    }

    return await callAccessibilityMethod(
      'isReduceTransparencyEnabled',
      'getCurrentReduceTransparencyState',
      false
    );
  },

  // Bold Text 설정 확인 (iOS)
  isBoldTextEnabled: async () => {
    if (Platform.OS === 'android') {
      return false;
    }

    return await callAccessibilityMethod(
      'isBoldTextEnabled',
      'getCurrentBoldTextState',
      false
    );
  },

  // Invert Colors 설정 확인
  isInvertColorsEnabled: async () => {
    const legacyMethod = Platform.OS === 'android'
      ? 'isInvertColorsEnabled'
      : 'getCurrentInvertColorsState';

    return await callAccessibilityMethod(
      'isInvertColorsEnabled',
      legacyMethod,
      false
    );
  },

  // Grayscale 설정 확인
  isGrayscaleEnabled: async () => {
    const legacyMethod = Platform.OS === 'android'
      ? 'isGrayscaleEnabled'
      : 'getCurrentGrayscaleState';

    return await callAccessibilityMethod(
      'isGrayscaleEnabled',
      legacyMethod,
      false
    );
  },

  // 동적 타입 크기 배율 확인 (iOS)
  getPreferredContentSizeMultiplier: async () => {
    if (Platform.OS === 'android') {
      return 1.0;
    }

    // iOS에서는 별도 처리 (복잡한 구조체 반환)
    const info = getModuleInfo();

    if (info.hasLegacyBridge) {
      return new Promise((resolve) => {
        try {
          const module = info.legacyModule;
          if (module?.getPreferredContentSizeMultiplier) {
            module.getPreferredContentSizeMultiplier(resolve, () => resolve(1.0));
          } else {
            resolve(1.0);
          }
        } catch (error) {
          logger.warn('[AccessibilityHelper] getPreferredContentSizeMultiplier 실패:', error);
          resolve(1.0);
        }
      });
    }

    return 1.0;
  },

  // 접근성 공지 전송 (하이브리드 방식)
  announceForAccessibility: (message) => {
    const info = getModuleInfo();

    // TurboModule 우선 시도
    if (info.hasTurboModule) {
      try {
        AccessibilityInfo.announceForAccessibility?.(message);
        return;
      } catch (error) {
        logger.warn('[AccessibilityHelper] TurboModule 공지 실패:', error);
      }
    }

    // Legacy Bridge 시도
    if (info.hasLegacyBridge) {
      try {
        const module = info.legacyModule;
        module?.announceForAccessibility?.(message);
        return;
      } catch (error) {
        logger.warn('[AccessibilityHelper] Legacy 공지 실패:', error);
      }
    }

    // Fallback: 콘솔 로그
    logger.info('[AccessibilityHelper] 접근성 공지 대체:', message);
  },

  // 포커스 설정 (하이브리드 방식)
  setAccessibilityFocus: (nodeHandle) => {
    if (!nodeHandle) {
      return;
    }

    const info = getModuleInfo();

    // TurboModule 우선 시도
    if (info.hasTurboModule) {
      try {
        AccessibilityInfo.setAccessibilityFocus?.(nodeHandle);
        return;
      } catch (error) {
        logger.warn('[AccessibilityHelper] TurboModule 포커스 실패:', error);
      }
    }

    // Legacy Bridge 시도
    if (info.hasLegacyBridge) {
      try {
        const module = info.legacyModule;
        module?.setAccessibilityFocus?.(nodeHandle);
        return;
      } catch (error) {
        logger.warn('[AccessibilityHelper] Legacy 포커스 실패:', error);
      }
    }
  },

  // 이벤트 리스너 등록 (개선된 안전 버전)
  addEventListener: (eventName, handler) => {
    if (!isAccessibilityInfoAvailable()) {
      logger.warn('[AccessibilityHelper] addEventListener 사용 불가, 빈 구독 반환');
      return { remove: () => {} };
    }

    try {
      // AccessibilityInfo.addEventListener는 RCTDeviceEventEmitter 기반으로 안전
      if (AccessibilityInfo?.addEventListener && typeof AccessibilityInfo.addEventListener === 'function') {
        return AccessibilityInfo.addEventListener(eventName, handler);
      }
      return { remove: () => {} };
    } catch (error) {
      logger.warn('[AccessibilityHelper] addEventListener 실패:', error);
      return { remove: () => {} };
    }
  },

  // 네이티브 모듈 상태 확인 (개선된 버전)
  isNativeModuleAvailable: () => {
    const info = getModuleInfo();
    return info.hasLegacyBridge || info.hasTurboModule;
  },

  // 디버깅을 위한 모듈 상태 정보
  getModuleDebugInfo: () => {
    return getModuleInfo();
  }};

// 기본 내보내기
export default SafeAccessibilityInfo;
