/**
 * PromotedBadge - 프로모션 진행중 뱃지
 */
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import BaseBadge from '@shared/components/ui/badges/BaseBadge';

const PromotedBadge = memo(() => {
  const { t } = useTranslation(['ui']);

  return (
    <BaseBadge
      backgroundColor="#9333EA"
      color="#FFFFFF"
      iconName="bullhorn"
      text={t('ui:badges.promoted')}
    />
  );
});

PromotedBadge.displayName = 'PromotedBadge';

export default PromotedBadge;