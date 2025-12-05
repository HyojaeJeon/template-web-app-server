/**
 * Open24HoursBadge - 24시간 영업 뱃지
 */
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import BaseBadge from '@shared/components/ui/badges/BaseBadge';

const Open24HoursBadge = memo(() => {
  const { t } = useTranslation(['ui']);

  return (
    <BaseBadge
      backgroundColor="#DC2626"
      color="#FFFFFF"
      iconName="clock-outline"
      text={t('ui:badges.open24Hours')}
    />
  );
});

Open24HoursBadge.displayName = 'Open24HoursBadge';

export default Open24HoursBadge;