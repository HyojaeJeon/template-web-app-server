/**
 * CardPaymentBadge - 카드결제 가능 뱃지
 */
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import BaseBadge from '@shared/components/ui/badges/BaseBadge';

const CardPaymentBadge = memo(() => {
  const { t } = useTranslation(['ui']);

  return (
    <BaseBadge
      backgroundColor="#059669"
      color="#FFFFFF"
      iconName="credit-card"
      text={t('ui:badges.cardPayment')}
    />
  );
});

CardPaymentBadge.displayName = 'CardPaymentBadge';

export default CardPaymentBadge;