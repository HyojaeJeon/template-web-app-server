/**
 * KoreanOwnedBadge - 한국인 사장님 매장 뱃지
 */
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import BaseBadge from '@shared/components/ui/badges/BaseBadge';

const KoreanOwnedBadge = memo(() => {
  const { t } = useTranslation(['ui']);

  return (
    <BaseBadge
      backgroundColor="#0EA5E9"
      color="#FFFFFF"
      iconName="flag"
      text={t('ui:badges.koreanOwned')}
    />
  );
});

KoreanOwnedBadge.displayName = 'KoreanOwnedBadge';

export default KoreanOwnedBadge;