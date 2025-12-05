/**
 * useModal.js - 모달 상태 관리 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 모달 열기/닫기 상태 관리
 * - 포커스 트랩 및 접근성 지원
 * - ESC 키 처리 및 배경 클릭 닫기
 * - 중첩 모달 지원 및 z-index 관리
 * - WCAG 2.1 AA 준수 (ARIA 속성, 키보드 네비게이션)
 */

'use client';

import { useState, useCallback, useEffect, useRef, useContext, createContext } from 'react';
import { useAccessibility } from '../useAccessibility';

// 모달 컨텍스트
const ModalContext = createContext({
  modals: [],
  openModal: () => {},
  closeModal: () => {},
  closeAllModals: () => {},
  getModalLevel: () => 0
});

// 모달 프로바이더
export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState([]);
  const modalIdCounter = useRef(0);

  const openModal = useCallback((modalId, config = {}) => {
    const id = modalId || `modal-${++modalIdCounter.current}`;
    const level = modals.length;
    
    setModals(prev => [...prev, { 
      id, 
      level, 
      zIndex: 1000 + level * 10,
      ...config
    }]);
    
    return id;
  }, [modals.length]);

  const closeModal = useCallback((modalId) => {
    setModals(prev => prev.filter(modal => modal.id !== modalId));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals([]);
  }, []);

  const getModalLevel = useCallback((modalId) => {
    return modals.find(modal => modal.id === modalId)?.level ?? -1;
  }, [modals]);

  const value = {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    getModalLevel
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

// 모달 컨텍스트 훅
export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext는 ModalProvider 내에서 사용해야 합니다');
  }
  return context;
};

// 기본 모달 훅
export const useModal = (initialIsOpen = false, options = {}) => {
  const {
    closeOnEscape = true,
    closeOnBackdrop = true,
    preventScroll = true,
    returnFocusOnClose = true,
    autoFocus = true,
    onOpen = null,
    onClose = null,
    onEscape = null,
    onBackdropClick = null
  } = options;

  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef(null);
  const triggerRef = useRef(null);
  const originalOverflowRef = useRef('');
  
  const { screenReader, focusManagement } = useAccessibility();
  const { enableFocusTrap, disableFocusTrap } = focusManagement;

  // 모달 열기
  const openModal = useCallback(() => {
    if (isOpen) return;

    // 현재 포커스된 요소 저장
    triggerRef.current = document.activeElement;
    
    setIsAnimating(true);
    setIsOpen(true);

    // 스크롤 방지
    if (preventScroll) {
      originalOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    // 접근성: 모달 열림 알림
    screenReader.announce('모달이 열렸습니다');

    // 콜백 실행
    onOpen?.();

    // 애니메이션 완료 후 포커스 처리
    setTimeout(() => {
      setIsAnimating(false);
      
      if (autoFocus && modalRef.current) {
        const firstFocusable = modalRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          modalRef.current.focus();
        }
      }
      
      // 포커스 트랩 활성화
      if (modalRef.current) {
        enableFocusTrap();
      }
    }, 150);
  }, [isOpen, preventScroll, autoFocus, screenReader, enableFocusTrap, onOpen]);

  // 모달 닫기
  const closeModal = useCallback(() => {
    if (!isOpen) return;

    setIsAnimating(true);

    // 포커스 트랩 해제
    disableFocusTrap();

    // 스크롤 복원
    if (preventScroll) {
      document.body.style.overflow = originalOverflowRef.current;
    }

    // 접근성: 모달 닫힘 알림
    screenReader.announce('모달이 닫혔습니다');

    // 콜백 실행
    onClose?.();

    // 애니메이션 완료 후 상태 업데이트
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimating(false);
      
      // 포커스 복원
      if (returnFocusOnClose && triggerRef.current) {
        triggerRef.current.focus();
      }
    }, 150);
  }, [isOpen, preventScroll, returnFocusOnClose, screenReader, disableFocusTrap, onClose]);

  // 토글
  const toggleModal = useCallback(() => {
    if (isOpen) {
      closeModal();
    } else {
      openModal();
    }
  }, [isOpen, openModal, closeModal]);

  // ESC 키 처리
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape?.(event) ?? closeModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeOnEscape, closeModal, onEscape]);

  // 배경 클릭 처리
  const handleBackdropClick = useCallback((event) => {
    if (!closeOnBackdrop) return;
    
    if (event.target === event.currentTarget) {
      onBackdropClick?.(event) ?? closeModal();
    }
  }, [closeOnBackdrop, closeModal, onBackdropClick]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (isOpen) {
        disableFocusTrap();
        if (preventScroll) {
          document.body.style.overflow = originalOverflowRef.current;
        }
      }
    };
  }, [isOpen, preventScroll, disableFocusTrap]);

  // 모달 props 생성기
  const getModalProps = useCallback((props = {}) => ({
    ref: modalRef,
    role: 'dialog',
    'aria-modal': 'true',
    'aria-hidden': !isOpen,
    tabIndex: -1,
    onClick: handleBackdropClick,
    ...props
  }), [isOpen, handleBackdropClick]);

  // 모달 콘텐츠 props 생성기
  const getModalContentProps = useCallback((props = {}) => ({
    onClick: (e) => {
      e.stopPropagation();
      props.onClick?.(e);
    },
    ...props
  }), []);

  return {
    // 상태
    isOpen,
    isAnimating,
    
    // 액션
    openModal,
    closeModal,
    toggleModal,
    
    // Props 생성기
    getModalProps,
    getModalContentProps,
    
    // 참조
    modalRef,
    triggerRef
  };
};

// 확인 다이얼로그 전용 훅
export const useConfirmModal = (options = {}) => {
  const {
    title = '확인',
    message = '정말로 실행하시겠습니까?',
    confirmText = '확인',
    cancelText = '취소',
    onConfirm = null,
    onCancel = null,
    ...modalOptions
  } = options;

  const [promiseRef, setPromiseRef] = useState(null);
  const modal = useModal(false, modalOptions);

  const showConfirm = useCallback((customOptions = {}) => {
    const finalOptions = { ...options, ...customOptions };
    
    return new Promise((resolve, reject) => {
      setPromiseRef({ resolve, reject, ...finalOptions });
      modal.openModal();
    });
  }, [modal, options]);

  const handleConfirm = useCallback(() => {
    if (promiseRef) {
      promiseRef.resolve(true);
      promiseRef.onConfirm?.();
    }
    modal.closeModal();
    setPromiseRef(null);
  }, [promiseRef, modal]);

  const handleCancel = useCallback(() => {
    if (promiseRef) {
      promiseRef.resolve(false);
      promiseRef.onCancel?.();
    }
    modal.closeModal();
    setPromiseRef(null);
  }, [promiseRef, modal]);

  return {
    ...modal,
    showConfirm,
    handleConfirm,
    handleCancel,
    confirmProps: promiseRef || { title, message, confirmText, cancelText }
  };
};

// 폼 모달 전용 훅
export const useFormModal = (options = {}) => {
  const {
    onSubmit = null,
    validateOnSubmit = true,
    resetOnClose = true,
    ...modalOptions
  } = options;

  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const modal = useModal(false, {
    ...modalOptions,
    onClose: () => {
      if (resetOnClose) {
        setFormData({});
        setErrors({});
      }
      setIsSubmitting(false);
      modalOptions.onClose?.();
    }
  });

  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 에러 클리어
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (event) => {
    event?.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      if (validateOnSubmit && onSubmit) {
        await onSubmit(formData);
      }
      modal.closeModal();
    } catch (error) {
      if (error.validation) {
        setErrors(error.validation);
      }
      console.error('폼 제출 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateOnSubmit, onSubmit, modal]);

  return {
    ...modal,
    formData,
    setFormData,
    updateFormData,
    errors,
    setErrors,
    isSubmitting,
    handleSubmit
  };
};

export default useModal;