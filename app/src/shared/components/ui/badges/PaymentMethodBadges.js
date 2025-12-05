/**
 * PaymentMethodBadges - 결제 수단 배지 컴포넌트
 * Local 현지 결제 수단을 시각적 배지로 표시
 */
import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// 결제 수단별 아이콘 매핑
const PAYMENT_ICONS = {
  cod: 'cash',
  momo: 'wallet',
  zaloPay: 'wallet-outline',
  vnPay: 'credit-card',
  napasQR: 'qrcode',
  creditCard: 'credit-card-outline',
  bankTransfer: 'bank-transfer'};

// 결제 수단별 색상
const PAYMENT_COLORS = {
  cod: '#10B981',      // 녹색
  momo: '#A01F7A',     // MoMo 브랜드 색상
  zaloPay: '#0068FF',  // ZaloPay 브랜드 색상
  vnPay: '#005BAA',    // VNPay 브랜드 색상
  napasQR: '#1E40AF',  // 파란색
  creditCard: '#6B7280', // 회색
  bankTransfer: '#059669', // 진한 녹색
};

export const PaymentMethodBadges = ({ methods = {}, compact = false }) => {
  const { t } = useTranslation();
  
  // 활성화된 결제 수단만 필터링
  const activePayments = Object.entries(methods).filter(([_, enabled]) => enabled);
  
  if (activePayments.length === 0) {
    return null;
  }
  
  return (
    <View className={`flex-row flex-wrap ${compact ? 'gap-1' : 'gap-2'}`}>
      {activePayments.map(([key, _]) => (
        <View 
          key={key} 
          className={`flex-row items-center bg-gray-100 rounded-full ${
            compact ? 'px-2 py-0.5' : 'px-3 py-1'
          }`}
        >
          <MaterialCommunityIcons 
            name={PAYMENT_ICONS[key] || 'cash'} 
            size={compact ? 14 : 16} 
            color={PAYMENT_COLORS[key] || '#6B7280'}
            style={{ marginRight: 4 }}
          />
          <Text className={`${compact ? 'text-xs' : 'text-sm'} text-gray-700 font-medium`}>
            {t(`payment.method.${key}`)}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default PaymentMethodBadges;