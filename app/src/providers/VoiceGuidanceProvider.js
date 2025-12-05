/**
 * Voice Guidance Provider
 * 시각 장애인을 위한 음성 안내 기능 제공 (기본 뼈대)
 */
import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAccessibilityInfo } from '@shared/utils';

const VoiceGuidanceContext = createContext(null);

export const useVoiceGuidance = () => {
  const context = useContext(VoiceGuidanceContext);
  if (!context) {
    throw new Error('useVoiceGuidance must be used within VoiceGuidanceProvider');
  }
  return context;
};

const VoiceGuidanceProvider = ({ children, enabled = true }) => {
  const lastAnnouncementRef = useRef('');
  const announceTimeoutRef = useRef(null);
  const isScreenReaderEnabledRef = useRef(false);

  useEffect(() => {
    const checkScreenReader = async () => {
      try {
        const isEnabled = await SafeAccessibilityInfo.isScreenReaderEnabled();
        isScreenReaderEnabledRef.current = isEnabled;
      } catch (error) {
        console.warn('스크린 리더 상태 확인 실패:', error);
        isScreenReaderEnabledRef.current = false;
      }
    };

    checkScreenReader();

    const subscription = SafeAccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (isEnabled) => {
        isScreenReaderEnabledRef.current = isEnabled;
      }
    );

    return () => {
      if (announceTimeoutRef.current) {
        clearTimeout(announceTimeoutRef.current);
      }
      subscription?.remove?.();
    };
  }, []);

  const announce = useCallback((message, options = {}) => {
    if (!enabled || !message) return;

    const {
      priority = 'polite',
      delay = 0,
      preventDuplicate = true
    } = options;

    if (preventDuplicate && lastAnnouncementRef.current === message) {
      return;
    }

    const executeAnnouncement = () => {
      if (Platform.OS === 'ios') {
        SafeAccessibilityInfo.announceForAccessibility(message);
      } else if (Platform.OS === 'android') {
        SafeAccessibilityInfo.setAccessibilityFocus(message);
      }
      lastAnnouncementRef.current = message;
    };

    if (delay > 0) {
      announceTimeoutRef.current = setTimeout(executeAnnouncement, delay);
    } else {
      executeAnnouncement();
    }
  }, [enabled]);

  const value = {
    announce,
    isScreenReaderEnabled: () => isScreenReaderEnabledRef.current
  };

  return (
    <VoiceGuidanceContext.Provider value={value}>
      {children}
    </VoiceGuidanceContext.Provider>
  );
};

export default VoiceGuidanceProvider;
