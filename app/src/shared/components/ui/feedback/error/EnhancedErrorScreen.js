/**
 * Enhanced Error Screen Component
 *
 * Modern and user-friendly error screen with improved button design
 * Features smooth animations and better visual hierarchy
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import PrimaryButton from '@shared/components/ui/buttons/PrimaryButton';
import SecondaryButton from '@shared/components/ui/buttons/SecondaryButton';

const { width: screenWidth } = Dimensions.get('window');

const EnhancedErrorScreen = ({
  error,
  errorInfo,
  onRetry,
  onGoBack,
  onContactSupport,
  showErrorDetails = __DEV__,
  retryCount = 0,
  maxRetries = 3,
  feature = 'Application',
  isRetrying = false}) => {
  const { t } = useTranslation();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const buttonSlideAnim = useRef(new Animated.Value(100)).current;

  const [showDetails, setShowDetails] = useState(false);

  // Entry animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true}),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true}),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true}),
      Animated.timing(buttonSlideAnim, {
        toValue: 0,
        duration: 800,
        delay: 300,
        useNativeDriver: true}),
    ]).start();

    // Pulse animation for error icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true}),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true}),
      ])
    ).start();
  }, []);

  const canRetry = retryCount < maxRetries;

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: 40}}
      showsVerticalScrollIndicator={false}
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={['#FFF5F5', '#FFFFFF', '#FFFFFF']}
        className="absolute inset-0"
      />

      <Animated.View
        className="flex-1 px-5"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]}}
      >
        {/* Error Icon Section */}
        <View className="items-center mt-20 mb-8">
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }],
              backgroundColor: '#FEE2E2',
              borderRadius: 40,
              padding: 16,
            }}
          >
            <Icon name="warning" size={64} color="#EF4444" />
          </Animated.View>
        </View>

        {/* Error Message Section */}
        <Animated.View
          className="items-center mb-8"
          style={{
            transform: [{ scale: scaleAnim }]}}
        >
          <Text className="text-3xl font-bold text-gray-900 mb-4 text-center">
            {t('errors:general.title')}
          </Text>

          <Text className="text-base text-gray-600 text-center leading-6 px-4">
            {t('errors:general.description',
              'Application 기능에서 예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
            ).replace('Application', feature)}
          </Text>
        </Animated.View>

        {/* Error Details Section (Collapsible) */}
        {showErrorDetails && error && (
          <TouchableOpacity
            onPress={() => setShowDetails(!showDetails)}
            className="mx-4 mb-6"
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFF5F5', '#FFEDED']}
              className="rounded-2xl p-4 border border-red-100"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Icon name="info-outline" size={20} color="#DC2626" />
                  <Text className="text-sm font-semibold text-red-800 ml-2">
                    {t('errors:technicalDetails')}
                  </Text>
                </View>
                <Icon
                  name={showDetails ? 'expand-less' : 'expand-more'}
                  size={24}
                  color="#DC2626"
                />
              </View>

              {showDetails && (
                <View className="mt-3 pt-3 border-t border-red-100">
                  <Text className="text-xs text-red-700 font-mono mb-2">
                    {error.message || 'Unknown error'}
                  </Text>
                  {errorInfo && (
                    <Text className="text-xs text-red-600 font-mono opacity-80">
                      {errorInfo.componentStack?.slice(0, 200)}
                      {errorInfo.componentStack?.length > 200 ? '...' : ''}
                    </Text>
                  )}
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Action Buttons Section */}
        <Animated.View
          className="px-4 mt-auto mb-8"
          style={{
            transform: [{ translateY: buttonSlideAnim }]}}
        >
          {/* Primary Action Button - Retry */}
          {canRetry && onRetry && (
            <View className="mb-4">
              <PrimaryButton
                title={isRetrying
                  ? t('errors:retrying')
                  : `${t('errors:retry')}${retryCount > 0 ? ` (${retryCount}/${maxRetries})` : ''}`
                  }
                icon={isRetrying ? null : 'refresh'}
                onPress={onRetry}
                loading={isRetrying}
                disabled={isRetrying}
                variant="primary"
                size="large"
                animated={true}
              />
            </View>
          )}

          {/* Secondary Action Button - Go Back */}
          {onGoBack && (
            <View className="mb-4">
              <SecondaryButton
                title={t('errors:goBack')}
                icon="arrow-back"
                onPress={onGoBack}
                variant="default"
                size="large"
                animated={true}
              />
            </View>
          )}

          {/* Tertiary Action - Contact Support */}
          {!canRetry && onContactSupport && (
            <View className="mt-4">
              <View className="border-t border-gray-100 pt-4">
                <Text className="text-center text-sm text-gray-500 mb-4">
                  {t('errors:persistentIssue')}
                </Text>

                <TouchableOpacity
                  onPress={onContactSupport}
                  className="py-3"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center justify-center">
                    <View className="bg-primary-50 rounded-full p-2 mr-3">
                      <Icon name="headset-mic" size={20} color="#2AC1BC" />
                    </View>
                    <Text className="text-primary-600 font-semibold text-base">
                      {t('errors:contactSupport')}
                    </Text>
                    <Icon name="chevron-right" size={20} color="#2AC1BC" style={{ marginLeft: 4 }} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </ScrollView>
  );
};

EnhancedErrorScreen.propTypes = {
  error: PropTypes.object,
  errorInfo: PropTypes.object,
  onRetry: PropTypes.func,
  onGoBack: PropTypes.func,
  onContactSupport: PropTypes.func,
  showErrorDetails: PropTypes.bool,
  retryCount: PropTypes.number,
  maxRetries: PropTypes.number,
  feature: PropTypes.string,
  isRetrying: PropTypes.bool};

EnhancedErrorScreen.defaultProps = {
  showErrorDetails: __DEV__,
  retryCount: 0,
  maxRetries: 3,
  feature: 'Application',
  isRetrying: false};

export default EnhancedErrorScreen;
