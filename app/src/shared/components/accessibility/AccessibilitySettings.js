/**
 * AccessibilitySettings
 * 접근성 설정 관리 컴포넌트
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Slider,
  Alert} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import AccessibilityWrapper, {
  AccessibleButton,
  AccessibleText,
  useAccessibilityAnnouncement,
  AccessibilityUtils} from '@shared/components/accessibility/AccessibilityWrapper';

// 접근성 설정 저장 키
const ACCESSIBILITY_STORAGE_KEY = 'accessibility_settings';

// 기본 설정값
const DEFAULT_SETTINGS = {
  // 폰트 크기 (0.8 ~ 1.5)
  fontSize: 1.0,

  // 고대비 모드
  highContrast: false,

  // 색상 반전
  colorInversion: false,

  // 애니메이션 감소
  reduceMotion: false,

  // 터치 지연 (길게 누르기 인식 시간)
  touchDelay: 500,

  // 음성 안내
  voiceGuidance: true,

  // 햅틱 피드백
  hapticFeedback: true,

  // 자동 스크롤 속도
  autoScrollSpeed: 1.0};

// 브랜드 컬러 (고대비 모드 지원)
const getBrandColors = (highContrast) => {
  if (highContrast) {
    return {
      primary: '#000000',
      secondary: '#000000',
      background: '#FFFFFF',
      text: '#000000',
      textLight: '#000000',
      border: '#000000',
      success: '#000000',
      error: '#000000',
      warning: '#000000'};
  }

  return {
    primary: '#2AC1BC',
    secondary: '#00B14F',
    background: '#FFFFFF',
    text: '#1F2937',
    textLight: '#6B7280',
    border: '#E5E7EB',
    success: '#00B14F',
    error: '#DA020E',
    warning: '#FFDD00'};
};

const AccessibilitySettings = ({ onSettingsChange }) => {
  const { t } = useTranslation();
  const { announce } = useAccessibilityAnnouncement();

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  const colors = getBrandColors(settings.highContrast);

  // 설정 로드
  useEffect(() => {
    loadSettings();
    checkAccessibilityServices();
  }, []);

  // 설정 변경 시 부모에 알림
  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  }, [settings, onSettingsChange]);

  // 설정 로드
  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // 설정 저장
  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
      Alert.alert(
        t('accessibility.settings.saveError.title'),
        t('accessibility.settings.saveError.message')
      );
    }
  };

  // 접근성 서비스 상태 확인
  const checkAccessibilityServices = async () => {
    const screenReaderStatus = await AccessibilityUtils.isScreenReaderEnabled();
    setScreenReaderEnabled(screenReaderStatus);
  };

  // 설정 변경 핸들러
  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);

    // 음성 안내
    if (settings.voiceGuidance) {
      announce(t(`accessibility.settings.${key}.changed`, { value }));
    }
  };

  // 설정 초기화
  const handleResetSettings = () => {
    Alert.alert(
      t('accessibility.settings.reset.title'),
      t('accessibility.settings.reset.message'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel'},
        {
          text: t('accessibility.settings.reset.confirm'),
          style: 'destructive',
          onPress: () => {
            saveSettings(DEFAULT_SETTINGS);
            announce(t('accessibility.settings.reset.success'));
          }},
      ]
    );
  };

  // 폰트 크기 설정
  const FontSizeSettings = () => (
    <View className="mb-6">
      <AccessibleText level={2}>
        <Text
          className="text-lg font-bold mb-4"
          style={{ color: colors.text }}
        >
          {t('accessibility.settings.fontSize.title')}
        </Text>
      </AccessibleText>

      <View className="bg-white rounded-lg p-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text style={{ color: colors.textLight }}>
            {t('accessibility.settings.fontSize.small')}
          </Text>
          <Text style={{ color: colors.textLight }}>
            {t('accessibility.settings.fontSize.large')}
          </Text>
        </View>

        <AccessibilityWrapper
          accessibilityRole="slider"
          accessibilityLabel={t('accessibility.settings.fontSize.label')}
          accessibilityValue={{
            min: 0.8,
            max: 1.5,
            now: settings.fontSize}}
        >
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0.8}
            maximumValue={1.5}
            step={0.1}
            value={settings.fontSize}
            onValueChange={(value) => handleSettingChange('fontSize', value)}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbStyle={{ backgroundColor: colors.primary }}
          />
        </AccessibilityWrapper>

        {/* 미리보기 텍스트 */}
        <View className="mt-4 p-3 bg-gray-50 rounded">
          <Text
            style={{
              fontSize: 16 * settings.fontSize,
              color: colors.text}}
          >
            {t('accessibility.settings.fontSize.preview')}
          </Text>
        </View>
      </View>
    </View>
  );

  // 시각적 설정
  const VisualSettings = () => (
    <View className="mb-6">
      <AccessibleText level={2}>
        <Text
          className="text-lg font-bold mb-4"
          style={{ color: colors.text }}
        >
          {t('accessibility.settings.visual.title')}
        </Text>
      </AccessibleText>

      <View className="bg-white rounded-lg p-4">
        {/* 고대비 모드 */}
        <AccessibilityWrapper
          accessibilityRole="switch"
          accessibilityLabel={t('accessibility.settings.highContrast.label')}
          accessibilityValue={{ text: settings.highContrast ? t('common.enabled') : t('common.disabled') }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-base font-medium" style={{ color: colors.text }}>
                {t('accessibility.settings.highContrast.title')}
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textLight }}>
                {t('accessibility.settings.highContrast.description')}
              </Text>
            </View>
            <Switch
              value={settings.highContrast}
              onValueChange={(value) => handleSettingChange('highContrast', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={settings.highContrast ? '#FFFFFF' : colors.textLight}
            />
          </View>
        </AccessibilityWrapper>

        {/* 색상 반전 */}
        <AccessibilityWrapper
          accessibilityRole="switch"
          accessibilityLabel={t('accessibility.settings.colorInversion.label')}
          accessibilityValue={{ text: settings.colorInversion ? t('common.enabled') : t('common.disabled') }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-base font-medium" style={{ color: colors.text }}>
                {t('accessibility.settings.colorInversion.title')}
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textLight }}>
                {t('accessibility.settings.colorInversion.description')}
              </Text>
            </View>
            <Switch
              value={settings.colorInversion}
              onValueChange={(value) => handleSettingChange('colorInversion', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={settings.colorInversion ? '#FFFFFF' : colors.textLight}
            />
          </View>
        </AccessibilityWrapper>

        {/* 애니메이션 감소 */}
        <AccessibilityWrapper
          accessibilityRole="switch"
          accessibilityLabel={t('accessibility.settings.reduceMotion.label')}
          accessibilityValue={{ text: settings.reduceMotion ? t('common.enabled') : t('common.disabled') }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-medium" style={{ color: colors.text }}>
                {t('accessibility.settings.reduceMotion.title')}
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textLight }}>
                {t('accessibility.settings.reduceMotion.description')}
              </Text>
            </View>
            <Switch
              value={settings.reduceMotion}
              onValueChange={(value) => handleSettingChange('reduceMotion', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={settings.reduceMotion ? '#FFFFFF' : colors.textLight}
            />
          </View>
        </AccessibilityWrapper>
      </View>
    </View>
  );

  // 상호작용 설정
  const InteractionSettings = () => (
    <View className="mb-6">
      <AccessibleText level={2}>
        <Text
          className="text-lg font-bold mb-4"
          style={{ color: colors.text }}
        >
          {t('accessibility.settings.interaction.title')}
        </Text>
      </AccessibleText>

      <View className="bg-white rounded-lg p-4">
        {/* 음성 안내 */}
        <AccessibilityWrapper
          accessibilityRole="switch"
          accessibilityLabel={t('accessibility.settings.voiceGuidance.label')}
          accessibilityValue={{ text: settings.voiceGuidance ? t('common.enabled') : t('common.disabled') }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-base font-medium" style={{ color: colors.text }}>
                {t('accessibility.settings.voiceGuidance.title')}
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textLight }}>
                {t('accessibility.settings.voiceGuidance.description')}
              </Text>
            </View>
            <Switch
              value={settings.voiceGuidance}
              onValueChange={(value) => handleSettingChange('voiceGuidance', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={settings.voiceGuidance ? '#FFFFFF' : colors.textLight}
            />
          </View>
        </AccessibilityWrapper>

        {/* 햅틱 피드백 */}
        <AccessibilityWrapper
          accessibilityRole="switch"
          accessibilityLabel={t('accessibility.settings.hapticFeedback.label')}
          accessibilityValue={{ text: settings.hapticFeedback ? t('common.enabled') : t('common.disabled') }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-medium" style={{ color: colors.text }}>
                {t('accessibility.settings.hapticFeedback.title')}
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textLight }}>
                {t('accessibility.settings.hapticFeedback.description')}
              </Text>
            </View>
            <Switch
              value={settings.hapticFeedback}
              onValueChange={(value) => handleSettingChange('hapticFeedback', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={settings.hapticFeedback ? '#FFFFFF' : colors.textLight}
            />
          </View>
        </AccessibilityWrapper>
      </View>
    </View>
  );

  // 시스템 정보
  const SystemInfo = () => (
    <View className="mb-6">
      <AccessibleText level={2}>
        <Text
          className="text-lg font-bold mb-4"
          style={{ color: colors.text }}
        >
          {t('accessibility.settings.system.title')}
        </Text>
      </AccessibleText>

      <View className="bg-white rounded-lg p-4">
        <View className="flex-row items-center mb-3">
          <MaterialCommunityIcons
            name="account-voice"
            size={20}
            color={screenReaderEnabled ? colors.success : colors.textLight}
          />
          <Text className="ml-3 flex-1" style={{ color: colors.text }}>
            {t('accessibility.settings.system.screenReader')}
          </Text>
          <Text style={{ color: screenReaderEnabled ? colors.success : colors.textLight }}>
            {screenReaderEnabled ? t('common.enabled') : t('common.disabled')}
          </Text>
        </View>

        <AccessibleButton
          accessibilityLabel={t('accessibility.settings.system.checkServices')}
          onPress={checkAccessibilityServices}
        >
          <TouchableOpacity
            className="flex-row items-center justify-center py-2 px-4 rounded border"
            style={{ borderColor: colors.primary }}
          >
            <MaterialIcons name="refresh" size={16} color={colors.primary} />
            <Text className="ml-2" style={{ color: colors.primary }}>
              {t('accessibility.settings.system.refresh')}
            </Text>
          </TouchableOpacity>
        </AccessibleButton>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text style={{ color: colors.textLight }}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: colors.background }}>
      <FontSizeSettings />
      <VisualSettings />
      <InteractionSettings />
      <SystemInfo />

      {/* 초기화 버튼 */}
      <View className="mb-6">
        <AccessibleButton
          accessibilityLabel={t('accessibility.settings.reset.button')}
          onPress={handleResetSettings}
        >
          <TouchableOpacity
            className="bg-red-500 py-3 px-6 rounded-lg mx-4"
            activeOpacity={0.7}
          >
            <Text className="text-white text-center font-semibold">
              {t('accessibility.settings.reset.button')}
            </Text>
          </TouchableOpacity>
        </AccessibleButton>
      </View>
    </View>
  );
};

export default AccessibilitySettings;

// 접근성 설정을 앱 전체에 적용하는 Provider
export const AccessibilityProvider = ({ children, settings = DEFAULT_SETTINGS }) => {
  // 글로벌 스타일 적용 로직
  // 실제 구현에서는 Context API 또는 테마 시스템과 연동

  return children;
};

// 접근성 설정 훅
export const useAccessibilitySettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    loadStoredSettings();
  }, []);

  const loadStoredSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
  };

  return {
    settings,
    colors: getBrandColors(settings.highContrast),
    fontSize: settings.fontSize,
    isHighContrast: settings.highContrast,
    isReducedMotion: settings.reduceMotion,
    hasHapticFeedback: settings.hapticFeedback,
    hasVoiceGuidance: settings.voiceGuidance};
};
