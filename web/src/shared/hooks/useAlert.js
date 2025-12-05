'use client';

import { useState, useCallback } from 'react';

/**
 * AlertModal을 위한 커스텀 훅
 * window.alert()를 대체하는 Promise 기반 API 제공
 *
 * @example
 * const { alert, AlertDialog } = useAlert();
 *
 * const handleSubmit = async () => {
 *   await alert({
 *     title: '성공',
 *     message: '저장되었습니다.',
 *     variant: 'success'
 *   });
 * };
 *
 * return (
 *   <>
 *     <button onClick={handleSubmit}>Submit</button>
 *     <AlertDialog />
 *   </>
 * );
 */
export function useAlert() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({});
  const [resolveRef, setResolveRef] = useState(null);

  const alert = useCallback((options = {}) => {
    setConfig(options);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolveRef(() => resolve);
    });
  }, []);

  const handleClose = useCallback(() => {
    if (resolveRef) {
      resolveRef();
    }
    setIsOpen(false);
    setResolveRef(null);
  }, [resolveRef]);

  const AlertDialog = useCallback(() => {
    if (!isOpen) return null;

    // AlertModal 컴포넌트를 동적으로 import하여 사용
    const AlertModal = require('@/shared/components/ui/modals/AlertModal').default;

    return (
      <AlertModal
        isOpen={isOpen}
        onClose={handleClose}
        title={config.title}
        message={config.message}
        closeText={config.closeText}
        variant={config.variant || 'info'}
      />
    );
  }, [isOpen, config, handleClose]);

  return {
    alert,
    AlertDialog,
    isOpen
  };
}
