/**
 * NewStoreBadge - 신규 매장 뱃지
 */
import React, { memo } from 'react';
import BaseBadge from '@shared/components/ui/badges/BaseBadge';
import { useTranslation } from 'react-i18next';

const NewStoreBadge = memo(() => {
  const { t } = useTranslation(['ui']);
  return (
    <BaseBadge
      backgroundColor="#FEF3C7"
      color="#D97706"
      iconName="new-box"
      text={t('badges.status.new', 'NEW')}
    />
  );
});

NewStoreBadge.displayName = 'NewStoreBadge';

export default NewStoreBadge;
