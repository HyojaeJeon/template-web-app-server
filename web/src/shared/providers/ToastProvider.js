'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useTranslation } from '@/shared/i18n';
import { getMessageType, ALL_MESSAGE_CODES } from '@/shared/messages/MessageCodes';
import { useTheme } from 'next-themes';

/**
 * Toast 컨텍스트
 */
const ToastContext = createContext();

/**
 * Toast 메시지 타입
 */
const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

/**
 * Toast 메시지 표시 지속 시간 (밀리초)
 */
const TOAST_DURATION = {
  SUCCESS: 4000,
  ERROR: 6000,
  WARNING: 5000,
  INFO: 4000,
};

/**
 * Toast Provider 컴포넌트
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const { t } = useTranslation();

  /**
   * Toast 메시지 추가 (메시지 코드, 번역 키 또는 문자열 지원)
   */
  const addToast = useCallback((messageOrCode, type = TOAST_TYPES.INFO, params = {}) => {
    const id = Date.now() + Math.random();

    let finalMessage = messageOrCode;
    let finalType = type;

    // 메시지 코드인 경우 (숫자)
    if (typeof messageOrCode === 'number') {
      // 메시지 타입 자동 결정
      const autoType = getMessageType(messageOrCode);
      finalType = autoType;

      // 메시지 코드명 가져오기
      const messageCodeName = ALL_MESSAGE_CODES[messageOrCode];

      // 다국어 번역 키 생성
      const translationKey = `messages.${messageCodeName}`;

      // 번역된 메시지 가져오기 (실패 시 코드명 사용)
      finalMessage = t(translationKey, params);

      // 번역이 없으면 기본 메시지 사용
      if (finalMessage === translationKey) {
        finalMessage = getDefaultMessage(messageCodeName, messageOrCode);
      }
    }
    // 번역 키인 경우 (문자열 + i18n 패턴)
    else if (typeof messageOrCode === 'string' && messageOrCode.includes('.')) {
      // 번역 시도
      const translated = t(messageOrCode, params);

      // 번역이 성공했는지 확인 (번역이 없으면 키 그대로 반환됨)
      if (translated !== messageOrCode) {
        finalMessage = translated;
      }
      // 번역이 없으면 원래 메시지 사용 (fallback)
    }
    // 일반 문자열인 경우 (그대로 사용)

    const toast = {
      id,
      message: finalMessage,
      type: finalType,
      duration: TOAST_DURATION[finalType?.toUpperCase()] || TOAST_DURATION.INFO,
    };

    setToasts(prev => [...prev, toast]);

    // 자동 제거 타이머
    setTimeout(() => {
      removeToast(id);
    }, toast.duration);

    return id;
  }, [t]);

  // ✅ 글로벌 toast 함수 등록 (Apollo errorLink 등 외부에서 사용)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__TOAST_SYSTEM__ = {
        showSuccess: (message) => addToast(message, TOAST_TYPES.SUCCESS),
        showError: (message) => addToast(message, TOAST_TYPES.ERROR),
        showWarning: (message) => addToast(message, TOAST_TYPES.WARNING),
        showInfo: (message) => addToast(message, TOAST_TYPES.INFO),
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.__TOAST_SYSTEM__;
      }
    };
  }, [addToast]);

  /**
   * Toast 메시지 제거
   */
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * 편의 함수들
   */
  const showSuccess = useCallback((message) => addToast(message, TOAST_TYPES.SUCCESS), [addToast]);
  const showError = useCallback((message) => addToast(message, TOAST_TYPES.ERROR), [addToast]);
  const showWarning = useCallback((message) => addToast(message, TOAST_TYPES.WARNING), [addToast]);
  const showInfo = useCallback((message) => addToast(message, TOAST_TYPES.INFO), [addToast]);

  /**
   * 범용 showToast 함수 (message, type) 형태로 호출 가능
   */
  const showToast = useCallback((message, type = 'info') => {
    const typeMap = {
      success: TOAST_TYPES.SUCCESS,
      error: TOAST_TYPES.ERROR,
      warning: TOAST_TYPES.WARNING,
      info: TOAST_TYPES.INFO,
    };
    addToast(message, typeMap[type] || TOAST_TYPES.INFO);
  }, [addToast]);

  /**
   * 모든 Toast 제거
   */
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value = {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Toast Hook
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    console.warn('useToast must be used within a ToastProvider');
    // fallback 함수들 반환
    return {
      toasts: [],
      addToast: () => {},
      removeToast: () => {},
      showSuccess: () => {},
      showError: () => {},
      showWarning: () => {},
      showInfo: () => {},
      showToast: () => {},
      clearAllToasts: () => {},
    };
  }
  return context;
}

/**
 * Toast 컨테이너 컴포넌트 - 모던 디자인
 */
function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] space-y-3 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

/**
 * 개별 Toast 아이템 컴포넌트 - 세련된 애니메이션과 디자인
 */
function ToastItem({ toast, onRemove }) {
  const { id, message, type } = toast;
  const { theme, resolvedTheme } = useTheme();

  // 실제 적용된 테마 확인 (system일 경우 resolvedTheme 사용)
  const isDark = resolvedTheme === 'dark';

  // 타입별 스타일 정의 (inline style 사용)
  const getToastStyle = () => {
    const baseStyle = {
      pointerEvents: 'auto',
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '16px 48px 16px 16px',
      borderRadius: '16px',
      minWidth: '320px',
      maxWidth: '480px',
      boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.15)',
      backdropFilter: 'blur(8px)',
      border: '2px solid',
      transition: 'all 0.3s ease',
    };

    const typeStyles = {
      [TOAST_TYPES.SUCCESS]: {
        background: isDark
          ? 'linear-gradient(135deg, rgba(6,95,70,0.5) 0%, rgba(4,120,87,0.6) 50%, rgba(5,150,105,0.5) 100%)'
          : 'linear-gradient(135deg, rgba(209,250,229,0.7) 0%, rgba(167,243,208,0.8) 50%, rgba(110,231,183,0.7) 100%)',
        borderColor: isDark ? 'rgba(16,185,129,0.5)' : 'rgba(110,231,183,0.5)',
        color: isDark ? '#ffffff' : '#064e3b',
      },
      [TOAST_TYPES.ERROR]: {
        background: isDark
          ? 'linear-gradient(135deg, rgba(127,29,29,0.5) 0%, rgba(153,27,27,0.6) 50%, rgba(185,28,28,0.5) 100%)'
          : 'linear-gradient(135deg, rgba(254,226,226,0.7) 0%, rgba(254,202,202,0.8) 50%, rgba(252,165,165,0.7) 100%)',
        borderColor: isDark ? 'rgba(239,68,68,0.5)' : 'rgba(252,165,165,0.5)',
        color: isDark ? '#ffffff' : '#7f1d1d',
      },
      [TOAST_TYPES.WARNING]: {
        background: isDark
          ? 'linear-gradient(135deg, rgba(120,53,15,0.5) 0%, rgba(146,64,14,0.6) 50%, rgba(180,83,9,0.5) 100%)'
          : 'linear-gradient(135deg, rgba(254,243,199,0.7) 0%, rgba(253,230,138,0.8) 50%, rgba(252,211,77,0.7) 100%)',
        borderColor: isDark ? 'rgba(245,158,11,0.5)' : 'rgba(252,211,77,0.5)',
        color: isDark ? '#ffffff' : '#78350f',
      },
      [TOAST_TYPES.INFO]: {
        background: isDark
          ? 'linear-gradient(135deg, rgba(7,89,133,0.5) 0%, rgba(2,132,199,0.6) 50%, rgba(14,165,233,0.5) 100%)'
          : 'linear-gradient(135deg, rgba(219,234,254,0.7) 0%, rgba(191,219,254,0.8) 50%, rgba(147,197,253,0.7) 100%)',
        borderColor: isDark ? 'rgba(56,189,248,0.5)' : 'rgba(147,197,253,0.5)',
        color: isDark ? '#ffffff' : '#075985',
      },
    };

    return { ...baseStyle, ...typeStyles[type] };
  };

  // 아이콘 배경 스타일
  const getIconBgStyle = () => {
    const iconStyles = {
      [TOAST_TYPES.SUCCESS]: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      [TOAST_TYPES.ERROR]: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      [TOAST_TYPES.WARNING]: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      [TOAST_TYPES.INFO]: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    };

    return {
      flexShrink: 0,
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      background: iconStyles[type],
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    };
  };

  // 아이콘 렌더링
  const renderIcon = () => {
    const icons = {
      [TOAST_TYPES.SUCCESS]: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      ),
      [TOAST_TYPES.ERROR]: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
      ),
      [TOAST_TYPES.WARNING]: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      ),
      [TOAST_TYPES.INFO]: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    };

    return (
      <div style={getIconBgStyle()}>
        <svg
          style={{ width: '20px', height: '20px', color: '#ffffff' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {icons[type] || icons[TOAST_TYPES.INFO]}
        </svg>
      </div>
    );
  };

  return (
    <div style={getToastStyle()} className="animate-slideIn hover:scale-[1.02]">
      {/* 아이콘 */}
      {renderIcon()}

      {/* 메시지 */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: '2px', paddingBottom: '2px' }}>
        <p style={{
          fontSize: '14px',
          fontWeight: 600,
          lineHeight: 1.6,
          wordBreak: 'break-word',
          margin: 0
        }}>
          {message}
        </p>
      </div>

      {/* 닫기 버튼 */}
      <button
        onClick={() => onRemove(id)}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          border: 'none',
          cursor: 'pointer',
          opacity: 0.6,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.6';
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
        }}
        aria-label="닫기"
      >
        <svg
          style={{ width: '16px', height: '16px', color: 'currentColor' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * 기본 메시지 생성 (번역이 없는 경우 폴백)
 */
function getDefaultMessage(messageCodeName, messageCode) {
  // 일반적인 메시지 패턴
  const defaultMessages = {
    // 성공 메시지
    'MENU_AVAILABILITY_UPDATED': '메뉴 가용성이 변경되었습니다',
    'MENU_BULK_UPDATED': '메뉴가 일괄 업데이트되었습니다',
    'MENU_UPDATED': '메뉴가 업데이트되었습니다',
    'OPERATION_SUCCESS': '작업이 완료되었습니다',
    'DATA_SAVED': '저장되었습니다',
    'DATA_UPDATED': '업데이트되었습니다',

    // 에러 메시지
    'MENU_AVAILABILITY_UPDATE_FAILED': '메뉴 가용성 변경에 실패했습니다',
    'MENU_BULK_UPDATE_FAILED': '메뉴 일괄 업데이트에 실패했습니다',
    'INVALID_INPUT': '올바른 입력값을 입력해주세요',
    'UNKNOWN_ERROR': '알 수 없는 오류가 발생했습니다',
    'NETWORK_ERROR': '네트워크 오류가 발생했습니다',
    'SERVER_ERROR': '서버 오류가 발생했습니다',
  };

  return defaultMessages[messageCodeName] || `[${messageCode}] ${messageCodeName || '알 수 없는 메시지'}`;
}

// 타입과 지속시간 상수들도 Export
export { TOAST_TYPES, TOAST_DURATION };
