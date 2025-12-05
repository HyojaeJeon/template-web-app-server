/**
 * 확인 모달 컴포넌트
 * 로그아웃, 삭제 등 사용자 확인이 필요한 액션에 사용
 * EnhancedModal과 동일한 Local 테마 글래스모피즘 디자인 적용
 */
'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '@/shared/i18n';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger', // 'danger', 'warning', 'info'
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // 포커스 관리
  useEffect(() => {
    if (isOpen && modalRef.current) {
      previousActiveElement.current = document.activeElement;
      const focusableElements = modalRef.current.querySelectorAll(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
      document.body.style.overflow = 'hidden';
    }

    return () => {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 키보드 이벤트 처리
  const handleKeyDown = useCallback((e) => {
    if (!isOpen || isLoading) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
      onConfirm();
    }
  }, [isOpen, isLoading, onClose, onConfirm]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // variant별 아이콘 및 색상 - Local 테마 적용
  const variantConfig = {
    danger: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBgColor: 'bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/20 dark:to-red-800/10',
      iconColor: 'text-red-600 dark:text-red-400',
      buttonColor: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-500 dark:to-red-600 dark:hover:from-red-600 dark:hover:to-red-700',
      ring: 'focus:ring-red-500',
    },
    warning: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBgColor: 'bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:to-yellow-800/10',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      buttonColor: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 dark:from-yellow-500 dark:to-yellow-600 dark:hover:from-yellow-600 dark:hover:to-yellow-700',
      ring: 'focus:ring-yellow-500',
    },
    info: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBgColor: 'bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-800/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      buttonColor: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 dark:from-emerald-500 dark:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-700',
      ring: 'focus:ring-emerald-500',
    },
  };

  const config = variantConfig[variant] || variantConfig.danger;

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* 향상된 배경 오버레이 - Local 테마 */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/50 to-emerald-900/30 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* 모달 컨테이너 - 글래스모피즘 */}
      <div
        ref={modalRef}
        className="relative bg-gradient-to-br from-white/95 via-white/90 to-emerald-50/95 dark:from-gray-800/95 dark:via-gray-800/90 dark:to-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-emerald-500/10 border border-emerald-200/30 dark:border-emerald-700/20 max-w-md w-full p-6 transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'modalFadeIn 0.3s ease-out'
        }}
      >
        {/* 아이콘 - Local 테마 그라데이션 */}
        <div className="flex items-center justify-center mb-4">
          <div className={`flex items-center justify-center w-14 h-14 rounded-2xl ${config.iconBgColor} ${config.iconColor} shadow-lg transform transition-transform hover:scale-105`}>
            {config.icon}
          </div>
        </div>

        {/* 제목 - 향상된 타이포그래피 */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2 flex items-center justify-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full"></span>
          {title}
        </h3>

        {/* 메시지 */}
        <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed">
          {message}
        </p>

        {/* 버튼 그룹 - 향상된 디자인 */}
        <div className="flex gap-3">
          {/* 취소 버튼 - 글래스모피즘 */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-white/80 dark:hover:bg-gray-700/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
          >
            {cancelText || t('common.cancel')}
          </button>

          {/* 확인 버튼 - Local 테마 그라데이션 */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-3 text-sm font-semibold text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.ring} disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg ${config.buttonColor}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('common.processing')}
              </span>
            ) : (
              confirmText || t('common.confirm')
            )}
          </button>
        </div>
      </div>

      {/* CSS 애니메이션 */}
      <style jsx>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;
