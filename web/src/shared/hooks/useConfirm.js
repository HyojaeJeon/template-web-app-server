'use client';

import { useState, useCallback } from 'react';

/**
 * ConfirmModal을 위한 커스텀 훅
 * window.confirm()을 대체하는 Promise 기반 API 제공
 *
 * @example
 * const { confirm, ConfirmDialog } = useConfirm();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: '삭제 확인',
 *     message: '정말 삭제하시겠습니까?',
 *     variant: 'danger'
 *   });
 *
 *   if (confirmed) {
 *     // 삭제 로직
 *   }
 * };
 *
 * return (
 *   <>
 *     <button onClick={handleDelete}>Delete</button>
 *     <ConfirmDialog />
 *   </>
 * );
 */
export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({});
  const [resolveRef, setResolveRef] = useState(null);

  const confirm = useCallback((options = {}) => {
    setConfig(options);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveRef) {
      resolveRef(true);
    }
    setIsOpen(false);
    setResolveRef(null);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    if (resolveRef) {
      resolveRef(false);
    }
    setIsOpen(false);
    setResolveRef(null);
  }, [resolveRef]);

  const ConfirmDialog = useCallback(() => {
    if (!isOpen) return null;

    // ConfirmModal 컴포넌트를 동적으로 import하여 사용
    const ConfirmModal = require('@/shared/components/ui/modals/ConfirmModal').default;

    return (
      <ConfirmModal
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={config.title}
        message={config.message}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        variant={config.variant || 'warning'}
        isLoading={config.isLoading || false}
      />
    );
  }, [isOpen, config, handleConfirm, handleCancel]);

  return {
    confirm,
    ConfirmDialog,
    isOpen
  };
}
