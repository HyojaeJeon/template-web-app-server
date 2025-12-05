/**
 * 알림 모달 컴포넌트
 * window.alert()를 대체하는 커스텀 디자인 모달
 * EnhancedModal과 동일한 Local 테마 글래스모피즘 디자인 적용
 */
'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '@/shared/i18n';

const AlertModal = ({
  isOpen,
  onClose,
  title,
  message,
  closeText,
  variant = 'info', // 'info', 'success', 'warning', 'danger'
}) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // 포커스 관리
  useEffect(() => {
    if (isOpen && modalRef.current) {
      previousActiveElement.current = document.activeElement;
      const button = modalRef.current.querySelector('button');
      if (button) {
        button.focus();
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
    if (!isOpen) return;

    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // variant별 아이콘 및 색상 - Local 테마 적용
  const variantConfig = {
    info: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBgColor: 'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      buttonColor: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700',
      ring: 'focus:ring-blue-500',
    },
    success: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBgColor: 'bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-800/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      buttonColor: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 dark:from-emerald-500 dark:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-700',
      ring: 'focus:ring-emerald-500',
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
    danger: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBgColor: 'bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/20 dark:to-red-800/10',
      iconColor: 'text-red-600 dark:text-red-400',
      buttonColor: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-500 dark:to-red-600 dark:hover:from-red-600 dark:hover:to-red-700',
      ring: 'focus:ring-red-500',
    },
  };

  const config = variantConfig[variant] || variantConfig.info;

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* 향상된 배경 오버레이 - Local 테마 */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/50 to-emerald-900/30 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
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

        {/* 닫기 버튼 - Local 테마 그라데이션 */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleClose}
            className={`px-8 py-3 text-sm font-semibold text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.ring} transition-all duration-200 shadow-lg ${config.buttonColor}`}
          >
            {closeText || t('common.close')}
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

export default AlertModal;
