'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';

/**
 * Toast 컴포넌트 - 간단한 알림 메시지
 * Local App MVP - 점주용 관리자 시스템
 */

// Toast Context for managing toasts globally
const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      variant: options.variant || 'default',
      duration: options.duration || 3000,
      ...options
    };

    setToasts(prev => [...prev, toast]);

    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

// Toast Container Component
const ToastContainer = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => onClose(toast.id)} />
      ))}
    </div>
  );
};

// Individual Toast Item
const ToastItem = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  const variantStyles = {
    default: 'bg-gray-800 text-white',
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-600 text-white',
    info: 'bg-blue-600 text-white'
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`
        pointer-events-auto px-4 py-3 rounded-lg shadow-lg
        flex items-center gap-3 min-w-[300px] max-w-[500px]
        transition-all duration-300 ease-out
        ${variantStyles[toast.variant]}
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-1 text-sm font-medium">
        {toast.message}
      </div>
      <button
        onClick={handleClose}
        className="text-white/80 hover:text-white transition-colors"
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

// Standalone Toast Component (can be used without provider)
const Toast = ({
  message,
  variant = 'default',
  isOpen = false,
  onClose,
  duration = 3000,
  className = ''
}) => {
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    setVisible(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;

  const variantStyles = {
    default: 'bg-gray-800 text-white',
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-600 text-white',
    info: 'bg-blue-600 text-white'
  };

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50
        px-4 py-3 rounded-lg shadow-lg
        flex items-center gap-3 min-w-[300px] max-w-[500px]
        transition-all duration-300 ease-out
        ${variantStyles[variant]}
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-1 text-sm font-medium">
        {message}
      </div>
      {onClose && (
        <button
          onClick={() => {
            setVisible(false);
            onClose();
          }}
          className="text-white/80 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Toast;
