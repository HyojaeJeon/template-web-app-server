/**
 * AccountDeletionButton Component - 계정 탈퇴 버튼
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
 * AccountDeletionButton Component
 *
 * Single Responsibility: 계정 탈퇴 처리만 담당
 * Open/Closed: 새로운 탈퇴 유형이나 확인 단계 추가 시 수정 없이 확장 가능
 *
 * @param {Function} onDeleteAccount - 계정 탈퇴 처리 함수
 * @param {boolean} loading - 로딩 상태
 * @param {string} variant - 버튼 스타일 (danger, outline, text)
 * @param {string} size - 버튼 크기 (small, medium, large)
 * @param {string} className - 추가 스타일 클래스
 * @param {boolean} disabled - 비활성화 상태
 */
const AccountDeletionButton = memo(({
  onDeleteAccount = () => {},
  loading = false,
  variant = 'danger',
  size = 'medium',
  className = '',
  disabled = false}) => {
  const { t } = useTranslation(['profile', 'common']);

  const [showModal, setShowModal] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState(1);
  const [confirmationText, setConfirmationText] = useState('');
  const [reasonSelected, setReasonSelected] = useState('');
  const [customReason, setCustomReason] = useState('');

  // 탈퇴 사유 목록
  const deletionReasons = [
    { id: 'not_using', key: 'deletion.reasons.notUsing' },
    { id: 'privacy_concerns', key: 'deletion.reasons.privacyConcerns' },
    { id: 'too_many_notifications', key: 'deletion.reasons.tooManyNotifications' },
    { id: 'poor_service', key: 'deletion.reasons.poorService' },
    { id: 'found_alternative', key: 'deletion.reasons.foundAlternative' },
    { id: 'other', key: 'deletion.reasons.other' },
  ];

  // 스타일 정의
  const getButtonStyle = useCallback(() => {
    const baseStyle = 'items-center justify-center rounded-lg flex-row';
    const sizeStyles = {
      small: 'px-3 py-2',
      medium: 'px-4 py-3',
      large: 'px-6 py-4'};

    const variantStyles = {
      danger: 'bg-red-600 border border-red-600',
      outline: 'bg-transparent border border-red-600',
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
      danger: 'text-white font-medium',
      outline: 'text-red-600 font-medium',
      text: 'text-red-600'};

    return `${sizeStyles[size]} ${variantStyles[variant]}`;
  }, [variant, size]);

  // 첫 번째 확인 다이얼로그
  const showInitialConfirmation = useCallback(() => {
    // 직접 모달을 열어 단계별 진행
    setShowModal(true);
  }, []);

  // 사유 선택 처리
  const handleReasonSelect = useCallback((reasonId) => {
    setReasonSelected(reasonId);
    if (reasonId !== 'other') {
      setCustomReason('');
    }
  }, []);

  // 다음 단계로 진행
  const handleNextStep = useCallback(() => {
    if (confirmationStep === 1) {
      if (!reasonSelected) {
        showToast('warning', t('deletion.selectReason'));
        return;
      }
      if (reasonSelected === 'other' && !customReason.trim()) {
        showToast('warning', t('deletion.enterCustomReason'));
        return;
      }
      setConfirmationStep(2);
    } else if (confirmationStep === 2) {
      const expectedText = t('deletion.confirmationText');
      if (confirmationText.trim() !== expectedText) {
        showToast('LOADING');
        return;
      }
      handleFinalDeletion();
    }
  }, [confirmationStep, reasonSelected, customReason, confirmationText, t]);

  // 최종 계정 탈퇴 처리
  const handleFinalDeletion = useCallback(async () => {
    try {
      const deletionData = {
        reason: reasonSelected,
        customReason: reasonSelected === 'other' ? customReason : '',
        timestamp: new Date().toISOString(),
        confirmed: true};

      await onDeleteAccount(deletionData);

      setShowModal(false);
      setConfirmationStep(1);
      setConfirmationText('');
      setReasonSelected('');
      setCustomReason('');

      showToast('success', t('deletion.success'));
    } catch (error) {
      console.error('계정 탈퇴 실패:', error);
      showToast('error', t('deletion.failed'));
    }
  }, [reasonSelected, customReason, onDeleteAccount, t]);

  // 모달 닫기
  const closeModal = useCallback(() => {
    setShowModal(false);
    setConfirmationStep(1);
    setConfirmationText('');
    setReasonSelected('');
    setCustomReason('');
  }, []);

  return (
    <>
      <TouchableOpacity
        className={getButtonStyle()}
        onPress={showInitialConfirmation}
        disabled={disabled || loading}
        activeOpacity={0.7}
        accessibilityLabel={t('deletion.buttonLabel')}
        accessibilityHint={t('deletion.buttonHint')}
        accessibilityRole="button"
      >
        {loading ? (
          <MaterialCommunityIcons
            name="loading"
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            color={variant === 'danger' ? 'white' : '#DC2626'}
          />
        ) : (
          <MaterialIcons
            name="delete-forever"
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            color={variant === 'danger' ? 'white' : '#DC2626'}
          />
        )}
        <Text className={`${getTextStyle()} ml-2`}>
          {loading ? t('deletion.processing') : t('deletion.deleteAccount')}
        </Text>
      </TouchableOpacity>

      {/* 계정 탈퇴 확인 모달 */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl px-6 py-8 max-h-4/5">
            {/* 모달 헤더 */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-gray-900">
                {confirmationStep === 1 ? t('deletion.step1Title') : t('deletion.step2Title')}
              </Text>
              <TouchableOpacity onPress={closeModal} className="p-2 -mr-2">
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {confirmationStep === 1 ? (
              // 1단계: 사유 선택
              <View className="flex-1">
                <Text className="text-gray-600 mb-6 leading-6">
                  {t('deletion.step1Description')}
                </Text>

                {deletionReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason.id}
                    onPress={() => handleReasonSelect(reason.id)}
                    className={`flex-row items-center p-4 mb-3 rounded-lg border ${
                      reasonSelected === reason.id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                      reasonSelected === reason.id
                        ? 'border-red-500 bg-red-500'
                        : 'border-gray-300'
                    }`}>
                      {reasonSelected === reason.id && (
                        <MaterialIcons name="check" size={12} color="white" />
                      )}
                    </View>
                    <Text className={`flex-1 ${
                      reasonSelected === reason.id
                        ? 'text-red-700 font-medium'
                        : 'text-gray-700'
                    }`}>
                      {t(reason.key)}
                    </Text>
                  </TouchableOpacity>
                ))}

                {reasonSelected === 'other' && (
                  <View className="mt-4">
                    <Text className="text-gray-700 mb-2 font-medium">
                      {t('deletion.customReasonLabel')}
                    </Text>
                    <TextInput
                      value={customReason}
                      onChangeText={setCustomReason}
                      placeholder={t('deletion.customReasonPlaceholder')}
                      className="border border-gray-300 rounded-lg p-3 text-gray-900"
                      multiline
                      numberOfLines={3}
                      maxLength={200}
                    />
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleNextStep}
                  className={`mt-8 py-4 rounded-lg ${
                    reasonSelected && (reasonSelected !== 'other' || customReason.trim())
                      ? 'bg-red-600'
                      : 'bg-gray-300'
                  }`}
                  disabled={!reasonSelected || (reasonSelected === 'other' && !customReason.trim())}
                >
                  <Text className="text-white text-center font-semibold">
                    {t('deletion.nextStep')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // 2단계: 최종 확인
              <View className="flex-1">
                <Text className="text-gray-600 mb-4 leading-6">
                  {t('deletion.step2Description')}
                </Text>

                <View className="bg-red-50 p-4 rounded-lg mb-6">
                  <Text className="text-red-800 font-semibold mb-2">
                    {t('deletion.warningTitle')}
                  </Text>
                  <Text className="text-red-700 text-sm leading-5">
                    {t('deletion.warningDescription')}
                  </Text>
                </View>

                <Text className="text-gray-700 mb-2 font-medium">
                  {t('deletion.confirmationInstruction')}
                </Text>
                <Text className="text-red-600 font-bold mb-4 text-lg">
                  "{t('deletion.confirmationText')}"
                </Text>

                <TextInput
                  value={confirmationText}
                  onChangeText={setConfirmationText}
                  placeholder={t('deletion.confirmationPlaceholder')}
                  className="border border-gray-300 rounded-lg p-3 text-gray-900 mb-8"
                />

                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={() => setConfirmationStep(1)}
                    className="flex-1 py-4 border border-gray-300 rounded-lg"
                  >
                    <Text className="text-gray-600 text-center font-semibold">
                      {t('common.back')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleNextStep}
                    className={`flex-1 py-4 rounded-lg ${
                      confirmationText.trim() === t('deletion.confirmationText')
                        ? 'bg-red-600'
                        : 'bg-gray-300'
                    }`}
                    disabled={confirmationText.trim() !== t('deletion.confirmationText')}
                  >
                    <Text className="text-white text-center font-semibold">
                      {t('deletion.finalDelete')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
});

export default AccountDeletionButton;
