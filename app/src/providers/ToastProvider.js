/**
 * Liquid Aurora Toast System
 * 혁신적인 글래스모피즘 2.0 토스트 UI
 *
 * 특징:
 * - Liquid Aurora 디자인 - 유동적인 오로라 글로우 효과
 * - 글래스모피즘 2.0 - 반투명 배경 + 블러 + 그라데이션 보더
 * - 모핑 애니메이션 - 부드러운 출현/사라짐 효과
 * - 싱글 토스트 - 새 토스트가 기존 토스트를 대체 (스택 X)
 * - 마이크로 인터랙션 - 터치 피드백
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, AccessibilityInfo, Platform, Dimensions, StyleSheet } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { TOAST_MESSAGES, getMessageType } from '@services/toast';
import i18n from '@shared/i18n';
import globalToast from '@services/toast/globalToast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Toast Context
const ToastContext = createContext(null);

// Aurora 컬러 시스템 - 각 타입별 오로라 글로우 색상
const AURORA_COLORS = {
  success: {
    primary: '#10B981',      // Emerald
    secondary: '#34D399',    // Light emerald
    glow: 'rgba(16, 185, 129, 0.4)',
    gradient: ['rgba(16, 185, 129, 0.15)', 'rgba(52, 211, 153, 0.08)'],
    borderGradient: ['rgba(16, 185, 129, 0.6)', 'rgba(52, 211, 153, 0.3)', 'rgba(16, 185, 129, 0.1)'],
    icon: 'check-circle',
  },
  error: {
    primary: '#EF4444',      // Red
    secondary: '#F87171',    // Light red
    glow: 'rgba(239, 68, 68, 0.4)',
    gradient: ['rgba(239, 68, 68, 0.15)', 'rgba(248, 113, 113, 0.08)'],
    borderGradient: ['rgba(239, 68, 68, 0.6)', 'rgba(248, 113, 113, 0.3)', 'rgba(239, 68, 68, 0.1)'],
    icon: 'error-outline',
  },
  warning: {
    primary: '#F59E0B',      // Amber
    secondary: '#FBBF24',    // Light amber
    glow: 'rgba(245, 158, 11, 0.4)',
    gradient: ['rgba(245, 158, 11, 0.15)', 'rgba(251, 191, 36, 0.08)'],
    borderGradient: ['rgba(245, 158, 11, 0.6)', 'rgba(251, 191, 36, 0.3)', 'rgba(245, 158, 11, 0.1)'],
    icon: 'warning-amber',
  },
  info: {
    primary: '#3B82F6',      // Blue
    secondary: '#60A5FA',    // Light blue
    glow: 'rgba(59, 130, 246, 0.4)',
    gradient: ['rgba(59, 130, 246, 0.15)', 'rgba(96, 165, 250, 0.08)'],
    borderGradient: ['rgba(59, 130, 246, 0.6)', 'rgba(96, 165, 250, 0.3)', 'rgba(59, 130, 246, 0.1)'],
    icon: 'info-outline',
  },
  loading: {
    primary: '#8B5CF6',      // Violet
    secondary: '#A78BFA',    // Light violet
    glow: 'rgba(139, 92, 246, 0.4)',
    gradient: ['rgba(139, 92, 246, 0.15)', 'rgba(167, 139, 250, 0.08)'],
    borderGradient: ['rgba(139, 92, 246, 0.6)', 'rgba(167, 139, 250, 0.3)', 'rgba(139, 92, 246, 0.1)'],
    icon: 'autorenew',
  },
};

// Liquid Aurora Toast Item Component
const LiquidAuroraToast = ({ toast, onRemove, index }) => {
  const { i18n } = useTranslation();

  // 애니메이션 값들
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;

  const aurora = AURORA_COLORS[toast.type] || AURORA_COLORS.info;
  const duration = toast.duration || 3500;

  useEffect(() => {
    // 등장 애니메이션 - Liquid morphing 효과
    Animated.parallel([
      // 슬라이드 업
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      // 페이드 인
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 스케일 업
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Aurora 글로우 펄스 애니메이션
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    // 로딩 타입일 경우 아이콘 회전
    let iconRotation;
    if (toast.type === 'loading') {
      iconRotation = Animated.loop(
        Animated.timing(iconRotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      iconRotation.start();
    }

    // 자동 제거 타이머
    let timer;
    if (duration > 0) {
      timer = setTimeout(() => {
        handleRemove();
      }, duration);
    }

    return () => {
      if (timer) clearTimeout(timer);
      glowLoop.stop();
      if (iconRotation) iconRotation.stop();
    };
  }, []);

  const handleRemove = () => {
    // 퇴장 애니메이션 - Liquid dissolve 효과
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onRemove(toast.id);
    });
  };

  const currentLang = i18n.language || 'vi';

  // 메시지 가져오기
  const getMessage = () => {
    if (typeof toast.message === 'string') {
      return toast.message || '';
    }
    if (typeof toast.message === 'object' && toast.message) {
      return toast.message[currentLang] || toast.message.vi || toast.message.en || '';
    }
    return '';
  };

  // 아이콘 회전 보간
  const iconSpin = iconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // 글로우 불투명도 보간
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  // 스택 오프셋 계산
  const stackOffset = index * 8;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
            { translateY: -stackOffset },
          ],
          opacity: opacityAnim,
          zIndex: 100 - index,
        },
      ]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={getMessage()}
    >
      {/* 그라데이션 보더 */}
      <LinearGradient
        colors={aurora.borderGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        {/* 글래스모피즘 내부 컨테이너 */}
        <View style={styles.glassContainer}>
          {/* 블러 배경 */}
          {Platform.OS === 'ios' ? (
            <BlurView
              style={styles.blurView}
              blurType="dark"
              blurAmount={20}
              reducedTransparencyFallbackColor="rgba(17, 24, 39, 0.95)"
            />
          ) : (
            <View style={[styles.blurView, { backgroundColor: 'rgba(17, 24, 39, 0.92)' }]} />
          )}

          {/* 내부 그라데이션 오버레이 */}
          <LinearGradient
            colors={aurora.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.innerGradient}
          />

          {/* 콘텐츠 */}
          <View style={styles.contentWrapper}>
            <View style={styles.contentRow}>
              {/* 아이콘 컨테이너 */}
              <View style={[styles.iconContainer, { backgroundColor: `${aurora.primary}20` }]}>
                <Animated.View
                  style={
                    toast.type === 'loading'
                      ? { transform: [{ rotate: iconSpin }] }
                      : undefined
                  }
                >
                  <Icon name={aurora.icon} size={16} color={aurora.primary} />
                </Animated.View>
              </View>

              {/* 메시지 */}
              <Text style={styles.messageText} numberOfLines={2}>
                {getMessage()}
              </Text>

              {/* 닫기 버튼 */}
              <TouchableOpacity
                onPress={handleRemove}
                style={styles.closeButton}
                accessible={true}
                accessibilityLabel={i18n.t('common:actions.close')}
                accessibilityRole="button"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={14} color="rgba(255, 255, 255, 0.6)" />
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

LiquidAuroraToast.displayName = 'LiquidAuroraToast';

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <View
      style={styles.containerWrapper}
      pointerEvents="box-none"
    >
      {toasts.map((toast, index) => (
        <LiquidAuroraToast
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
          index={index}
        />
      ))}
    </View>
  );
};

ToastContainer.displayName = 'ToastContainer';

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const { i18n } = useTranslation();

  // Toast 추가
  const showToast = useCallback((messageCodeOrString, options = {}) => {
    const id = ++toastIdRef.current;

    if (typeof messageCodeOrString !== 'string') {
      console.warn(`Invalid toast message format: ${String(messageCodeOrString)}`);
      return null;
    }

    const raw = messageCodeOrString.trim();
    let type = options.type || 'info';
    let message;

    // 1) i18n 키(ns:key) 형태
    if (raw.includes(':')) {
      const tFor = (lng) => i18n.getFixedT(lng);
      message = {
        ko: tFor('ko')(raw),
        vi: tFor('vi')(raw),
        en: tFor('en')(raw)
      };
    } else {
      // 2) 코드(UPPER_SNAKE_CASE)
      const inferred = getMessageType(raw) || (raw.endsWith('_SUCCESS') ? 'success' : /ERROR|FAILED/.test(raw) ? 'error' : 'info');
      type = options.type || inferred;

      const def = TOAST_MESSAGES[raw];
      if (def) {
        message = {
          ko: def.ko || raw,
          vi: def.vi || raw,
          en: def.en || raw
        };
      } else {
        const ns = raw.split('_')[0].toLowerCase();
        const keys = [
          `${ns}:toast.${raw}`,
          `${ns}:toastMessages.${raw}`,
          `messages:toastMessages.${raw}`,
          `common:toast.${raw}`,
          `common:toastMessages.${raw}`
        ];
        const tPick = (lng) => {
          const ft = i18n.getFixedT(lng);
          for (const k of keys) {
            const translated = ft(k);
            if (translated && translated !== k) return translated;
          }
          return raw;
        };
        message = { ko: tPick('ko'), vi: tPick('vi'), en: tPick('en') };
      }
    }

    const toast = {
      id,
      type,
      message,
      duration: options.duration || 3500,
      ...options,
    };

    // 기존 토스트 제거하고 새 토스트만 표시 (스택 X)
    setToasts([toast]);

    // 접근성 알림
    const currentLang = i18n.language || 'vi';
    const textMessage = toast.message[currentLang] || toast.message.vi || toast.message.en;
    AccessibilityInfo.announceForAccessibility(textMessage);
    return id;
  }, [i18n.language]);

  // 타입별 헬퍼 함수
  const showSuccess = useCallback((messageCodeOrString, options = {}) => {
    showToast(messageCodeOrString, { ...options, type: 'success' });
  }, [showToast]);

  const showError = useCallback((messageCodeOrString, options = {}) => {
    showToast(messageCodeOrString, { ...options, type: 'error' });
  }, [showToast]);

  const showWarning = useCallback((messageCodeOrString, options = {}) => {
    showToast(messageCodeOrString, { ...options, type: 'warning' });
  }, [showToast]);

  const showInfo = useCallback((messageCodeOrString, options = {}) => {
    showToast(messageCodeOrString, { ...options, type: 'info' });
  }, [showToast]);

  const showLoading = useCallback((messageCodeOrString, options = {}) => {
    return showToast(messageCodeOrString, { ...options, type: 'loading', duration: 0 });
  }, [showToast]);

  // Toast 제거
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // 모든 Toast 제거
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // showToast 함수를 global에 설정
  useEffect(() => {
    global.showToast = showToast;
    return () => {
      delete global.showToast;
    };
  }, [showToast]);

  // globalToast 서비스와 통합
  useEffect(() => {
    globalToast.registerToast(showToast);
    return () => {
      globalToast.registerToast(null);
    };
  }, [showToast]);

  const value = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    removeToast,
    clearToasts,
    toasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

ToastProvider.displayName = 'ToastProvider';

// useToast Hook
export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
};

// 스타일 정의
const styles = StyleSheet.create({
  containerWrapper: {
    position: 'absolute',
    bottom: Platform.select({ ios: 100, android: 90 }),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastContainer: {
    alignSelf: 'center',
    maxWidth: SCREEN_WIDTH - 40,
    marginBottom: 6,
  },
  gradientBorder: {
    borderRadius: 12,
    padding: 1,
  },
  glassContainer: {
    borderRadius: 11,
    overflow: 'hidden',
    position: 'relative',
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  innerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  contentWrapper: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  messageText: {
    flexShrink: 1,
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  closeButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

// Re-export TOAST_MESSAGES for convenience
export { TOAST_MESSAGES } from '@services/toast';

export default {
  ToastProvider,
  useToast,
  TOAST_MESSAGES,
};
