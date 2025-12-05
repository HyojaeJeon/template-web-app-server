/**
 * FeaturedBadge - 추천/인기 매장 뱃지
 */
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import BaseBadge from '@shared/components/ui/badges/BaseBadge';

const FeaturedBadge = memo(() => {
  const { t } = useTranslation(['ui']);

  return (
    <BaseBadge
      backgroundColor="#EF4444"
      color="#FFFFFF"
      iconName="star"
      text={t('ui:badges.featured')}
    />
  );
});

FeaturedBadge.displayName = 'FeaturedBadge';

export default FeaturedBadge;