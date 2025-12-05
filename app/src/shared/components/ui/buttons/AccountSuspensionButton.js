/**
 * AccountSuspensionButton Component - 계정 일시 정지 버튼
 * CLAUDE.md 가이드라인 준수: SOLID 원칙, DRY, WCAG 2.1
 * Local 배달 앱 특화 계정 관리 시스템
 */
import React, { memo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useToast } from '@providers/ToastProvider';

/**
 * AccountSuspensionButton Component
 *
 * Single Responsibility: 계정 일시 정지 처리만 담당
 * Open/Closed: 새로운 정지 유형이나 기간 추가 시 수정 없이 확장 가능
 *
 * @param {Function} onSuspendAccount - 계정 일시 정지 처리 함수
 * @param {boolean} loading - 로딩 상태
 * @param {string} variant - 버튼 스타일 (warning, outline, text)
 * @param {string} size - 버튼 크기 (small, medium, large)
 * @param {string} className - 추가 스타일 클래스
 * @param {boolean} disabled - 비활성화 상태
 */
const AccountSuspensionButton = memo(({
  onSuspendAccount = () => {},
  loading = false,
  variant = 'warning',
  size = 'medium',
  className = '',
  disabled = false}) => {
  const { t } = useTranslation(['profile', 'common']);
  const { showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [suspensionPeriod, setSuspensionPeriod] = useState('');
  const [reasonSelected, setReasonSelected] = useState('');
  const [customReason, setCustomReason] = useState('');

  // 일시 정지 기간 옵션
  const suspensionPeriods = [
    { id: '1_week', key: 'suspension.periods.oneWeek', days: 7 },
    { id: '2_weeks', key: 'suspension.periods.twoWeeks', days: 14 },
    { id: '1_month', key: 'suspension.periods.oneMonth', days: 30 },
    { id: '3_months', key: 'suspension.periods.threeMonths', days: 90 },
    { id: '6_months', key: 'suspension.periods.sixMonths', days: 180 },
  ];

  // 일시 정지 사유 목록
  const suspensionReasons = [
    { id: 'need_break', key: 'suspension.reasons.needBreak' },
    { id: 'too_much_spending', key: 'suspension.reasons.tooMuchSpending' },
    { id: 'privacy_concerns', key: 'suspension.reasons.privacyConcerns' },
    { id: 'temporary_issue', key: 'suspension.reasons.temporaryIssue' },
    { id: 'other', key: 'suspension.reasons.other' },
  ];

  // 스타일 정의
  const getButtonStyle = useCallback(() => {
    const baseStyle = 'items-center justify-center rounded-lg flex-row';
    const sizeStyles = {
      small: 'px-3 py-2',
      medium: 'px-4 py-3',
      large: 'px-6 py-4'};

    const variantStyles = {
      warning: 'bg-yellow-600 border border-yellow-600',
      outline: 'bg-transparent border border-yellow-600',
      text: 'bg-transparent'};

    const disabledStyle = disabled || loading ? 'opacity-50' : '';

    return `${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${disabledStyle} ${className}`;
  }, [variant, size, disabled, loading, className]);

  const getTextStyle = useCallback(() => {
    const sizeStyles = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg'};

    const variantStyles = {
      warning: 'text-white font-medium',
      outline: 'text-yellow-700 font-medium',
      text: 'text-yellow-700'};

    return `${sizeStyles[size]} ${variantStyles[variant]}`;
  }, [variant, size]);

  // 초기 확인 다이얼로그
  const showInitialConfirmation = useCallback(() => {
    // 직접 모달을 열어 단계별 진행
    setShowModal(true);
  }, []);

  // 기간 선택 처리
  const handlePeriodSelect = useCallback((periodId) => {
    setSuspensionPeriod(periodId);
  }, []);

  // 사유 선택 처리
  const handleReasonSelect = useCallback((reasonId) => {
    setReasonSelected(reasonId);
    if (reasonId !== 'other') {
      setCustomReason('');
    }
  }, []);

  // 계정 일시 정지 처리
  const handleAccountSuspension = useCallback(async () => {
    if (!suspensionPeriod) {
      showToast('VALIDATION_SUSPENSION_PERIOD_REQUIRED');
      return;
    }

    if (!reasonSelected) {
      showToast('VALIDATION_SUSPENSION_REASON_REQUIRED');
      return;
    }

    if (reasonSelected === 'other' && !customReason.trim()) {
      showToast('VALIDATION_SUSPENSION_CUSTOM_REASON_REQUIRED');
      return;
    }

    try {
      const selectedPeriod = suspensionPeriods.find(p => p.id === suspensionPeriod);
      const suspensionData = {
        period: suspensionPeriod,
        days: selectedPeriod?.days,
        reason: reasonSelected,
        customReason: reasonSelected === 'other' ? customReason : '',
        timestamp: new Date().toISOString(),
        resumeDate: new Date(Date.now() + (selectedPeriod?.days * 24 * 60 * 60 * 1000)).toISOString()};

      await onSuspendAccount(suspensionData);

      setShowModal(false);
      setSuspensionPeriod('');
      setReasonSelected('');
      setCustomReason('');

      showToast('ACCOUNT_SUSPENSION_SUCCESS');
    } catch (error) {
      console.error('계정 일시정지 처리 오류:', error);
      showToast('OPERATION_FAILED');
    }
  }, [suspensionPeriod, reasonSelected, customReason, suspensionPeriods, onSuspendAccount, showToast]);

  return (
    <>
      {/* 일시정지 버튼 */}
      <TouchableOpacity
        onPress={showInitialConfirmation}
        disabled={disabled || loading}
        className={`flex-row items-center justify-center px-4 py-2 rounded-lg ${getButtonStyle()}`}
      >
        <MaterialCommunityIcons 
          name="pause-circle-outline" 
          size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
          color={variant === 'warning' ? '#FFFFFF' : '#B45309'} 
          className="mr-2" 
        />
        <Text className={getTextStyle()}>
          {t('common:actions.suspend')}
        </Text>
      </TouchableOpacity>

      {/* 일시정지 설정 모달 */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 bg-white">
          <View className="p-4 border-b border-gray-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900">
                {t('suspension.title')}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1 p-4">
            <Text className="text-sm text-gray-600 mb-4">
              {t('suspension.description')}
            </Text>

            {/* 기간 선택 섹션 */}
            <View className="mb-6">
              <Text className="text-base font-medium text-gray-900 mb-3">
                {t('suspension.selectPeriod')}
              </Text>
              {suspensionPeriods.map((period) => (
                <TouchableOpacity
                  key={period.id}
                  onPress={() => handlePeriodSelect(period.id)}
                  className={`p-4 border rounded-lg mb-2 ${
                    suspensionPeriod === period.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <Text className={`font-medium ${
                    suspensionPeriod === period.id ? 'text-primary' : 'text-gray-900'
                  }`}>
                    {t(period.key)}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {period.days} {t('suspension.days')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 사유 선택 섹션 */}
            <View className="mb-6">
              <Text className="text-base font-medium text-gray-900 mb-3">
                {t('suspension.selectReason')}
              </Text>
              {suspensionReasons.map((reason) => (
                <TouchableOpacity
                  key={reason.id}
                  onPress={() => handleReasonSelect(reason.id)}
                  className={`p-4 border rounded-lg mb-2 ${
                    reasonSelected === reason.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <Text className={`font-medium ${
                    reasonSelected === reason.id ? 'text-primary' : 'text-gray-900'
                  }`}>
                    {t(reason.key)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 기타 사유 입력 */}
            {reasonSelected === 'other' && (
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-900 mb-3">
                  {t('suspension.customReason')}
                </Text>
                <TextInput
                  value={customReason}
                  onChangeText={setCustomReason}
                  placeholder={t('suspension.customReasonPlaceholder')}
                  multiline
                  numberOfLines={3}
                  className="border border-gray-300 rounded-lg p-3 text-gray-900"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>
            )}
          </ScrollView>

          {/* 하단 버튼 */}
          <View className="p-4 border-t border-gray-200">
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
              >
                <Text className="text-center text-gray-700 font-medium">
                  {t('common:actions.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAccountSuspension}
                disabled={!suspensionPeriod || !reasonSelected}
                className={`flex-1 px-4 py-3 rounded-lg ${
                  suspensionPeriod && reasonSelected
                    ? 'bg-yellow-500'
                    : 'bg-gray-200'
                }`}
              >
                <Text className={`text-center font-medium ${
                  suspensionPeriod && reasonSelected
                    ? 'text-white'
                    : 'text-gray-400'
                }`}>
                  {t('suspension.confirm')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
});

export default AccountSuspensionButton;