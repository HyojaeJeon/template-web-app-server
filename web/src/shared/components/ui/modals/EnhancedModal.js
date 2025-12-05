'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function EnhancedModal({
  isOpen,
  onClose,
  title,
  children,
  footer, // 새로운 footer prop 추가
  className = '',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  closeOnEsc, // closeOnEsc prop 추가 (하위 호환성)
  size = 'md', // sm, md, lg, xl, xxl, full
  variant = 'default', // default, glass, vietnamese
  ...props
}) {
  // Portal을 위한 클라이언트 마운트 상태
  const [mounted, setMounted] = useState(false);

  // closeOnEsc와 closeOnEscape 통합 (하위 호환성)
  const shouldCloseOnEscape = closeOnEsc !== undefined ? closeOnEsc : closeOnEscape;
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);
  const firstFocusableRef = useRef(null);
  const lastFocusableRef = useRef(null);

  // 클라이언트 사이드에서만 마운트 (SSR hydration 이슈 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 포커스 가능한 요소들을 찾는 함수
  const getFocusableElements = useCallback((container) => {
    if (!container) return [];
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]'
    ].join(', ');

    return container.querySelectorAll(focusableSelectors);
  }, []);

  // 모달이 열릴 때 포커스 관리
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // 현재 포커스된 요소를 저장
      previousActiveElement.current = document.activeElement;
      
      // 모달 내 포커스 가능한 요소들 찾기
      const focusableElements = getFocusableElements(modalRef.current);
      const elementsArray = Array.from(focusableElements || []);
      
      if (elementsArray.length > 0) {
        firstFocusableRef.current = elementsArray[0];
        lastFocusableRef.current = elementsArray[elementsArray.length - 1];
      }

      // body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      // 모달이 닫힐 때 원래 요소로 포커스 복원
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, getFocusableElements]);

  // 탭 트래핑 및 키보드 이벤트 처리
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    if (e.key === 'Escape' && shouldCloseOnEscape) {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'Tab') {
      const focusableElements = getFocusableElements(modalRef.current);
      const elementsArray = Array.from(focusableElements || []);
      
      if (elementsArray.length === 0) return;

      const firstElement = elementsArray[0];
      const lastElement = elementsArray[elementsArray.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [isOpen, shouldCloseOnEscape, onClose, getFocusableElements]);

  // 백드롭 클릭 처리
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  }, [closeOnBackdrop, onClose]);

  // 키보드 이벤트 리스너 등록
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // 클라이언트 마운트 전이거나 모달이 열리지 않았으면 null 반환
  if (!mounted || !isOpen) return null;

  // 크기별 스타일 - 메뉴 모달용 대형 크기 추가
  const sizeStyles = {
    sm: 'max-w-md w-full',
    md: 'max-w-lg w-full',
    lg: 'max-w-2xl w-full',
    xl: 'max-w-4xl w-full',
    xxl: 'max-w-6xl w-full', // 새로 추가 - 메뉴 모달용
    full: 'w-full h-full max-w-none max-h-none m-0' // 전체 화면
  };

  // 높이 스타일
  const heightStyles = {
    sm: 'max-h-[60vh]',
    md: 'max-h-[70vh]',
    lg: 'max-h-[80vh]',
    xl: 'max-h-[85vh]',
    xxl: 'max-h-[90vh]', // 메뉴 모달용
    full: 'h-full'
  };

  // Local 테마 글래스모피즘 스타일
  const variantStyles = {
    default: 'bg-white dark:bg-gray-800',
    glass: `
      bg-white/95 dark:bg-gray-800/95
      backdrop-blur-xl
      border border-white/20 dark:border-gray-700/50
    `,
    vietnamese: `
      bg-gradient-to-br from-white/95 via-white/90 to-emerald-50/95
      dark:from-gray-800/95 dark:via-gray-800/90 dark:to-gray-900/95
      backdrop-blur-xl
      border border-emerald-200/30 dark:border-emerald-700/20
      shadow-2xl shadow-emerald-500/10
    `,
    danger: `
      bg-white dark:bg-gray-800
      border-2 border-red-200 dark:border-red-800
    `
  };

  // variant에 따른 배경 스타일
  const backdropStyles = {
    default: 'bg-black/50 dark:bg-black/70',
    glass: 'bg-gradient-to-br from-black/40 via-black/50 to-emerald-900/30 backdrop-blur-sm',
    vietnamese: 'bg-gradient-to-br from-emerald-900/40 via-black/50 to-vietnam-mint/20 dark:from-emerald-950/60 dark:via-black/70 dark:to-vietnam-mint/10 backdrop-blur-md',
    danger: 'bg-gradient-to-br from-red-900/30 via-black/50 to-red-800/20 dark:from-red-950/50 dark:via-black/70 dark:to-red-900/30 backdrop-blur-sm'
  };

  // Portal을 사용하여 document.body에 직접 렌더링 (부모 CSS 상속 방지)
  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-modal="true"
      role="dialog"
    >
      {/* 향상된 백드롭 - variant에 따른 테마 배경 */}
      <div
        className={`absolute inset-0 transition-all duration-300 ${backdropStyles[variant] || backdropStyles.default}`}
        style={{
          animation: isOpen ? 'backdropFadeIn 0.3s ease-out' : 'backdropFadeOut 0.2s ease-in'
        }}
      />
      
      {/* 모달 컨테이너 */}
      <div
        ref={modalRef}
        className={`
          relative rounded-2xl shadow-2xl overflow-hidden flex flex-col
          transform transition-all duration-300 ease-out
          ${sizeStyles[size]}
          max-h-[calc(100vh-2rem)]
          ${variantStyles[variant]}
          ${className}
        `}
        style={{
          animation: isOpen ? 'modalFadeIn 0.3s ease-out' : 'modalFadeOut 0.2s ease-in'
        }}
      >
        {/* 헤더 */}
        {(title || showCloseButton) && (
          <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50">
            {title && (
              <h2 
                id="modal-title"
                className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3"
              >
                <span className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full"></span>
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="
                  p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 
                  rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 
                  transition-all duration-200 hover:scale-105
                "
                aria-label="모달 닫기"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* 컨텐츠 - 스크롤 영역 */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{
            // footer가 있으면 그만큼 공간 확보, 없으면 기존대로
            height: footer
              ? (size === 'xxl' ? 'calc(100vh - 280px)' : size === 'xl' ? 'calc(100vh - 260px)' : 'calc(100vh - 240px)')
              : (size === 'xxl' ? 'calc(100vh - 200px)' : size === 'xl' ? 'calc(100vh - 180px)' : 'calc(100vh - 160px)'),
            maxHeight: footer
              ? (size === 'xxl' ? 'calc(100vh - 280px)' : size === 'xl' ? 'calc(100vh - 260px)' : 'calc(100vh - 240px)')
              : (size === 'xxl' ? 'calc(100vh - 200px)' : size === 'xl' ? 'calc(100vh - 180px)' : 'calc(100vh - 160px)'),
            scrollbarWidth: 'thin',
            scrollbarColor: '#2AC1BC rgba(0,0,0,0.1)'
          }}
        >
          <div className="p-6">
            {children}
          </div>
        </div>

        {/* 푸터 - 헤더처럼 고정 */}
        {footer && (
          <div className="flex-shrink-0 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 p-6">
            {footer}
          </div>
        )}
      </div>

      {/* CSS 애니메이션 및 스크롤바 스타일 정의 */}
      <style jsx>{`
        @keyframes backdropFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes backdropFadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

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

        @keyframes modalFadeOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
        }

        /* Local 테마 스크롤바 스타일 */
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(156, 163, 175, 0.1);
          border-radius: 4px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #2AC1BC, #00B14F);
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #26A69A, #00A843);
        }
        
        .overflow-y-auto::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>
    </div>
  );

  // Portal을 통해 document.body에 렌더링하여 부모 CSS(space-y-6 등) 상속 방지
  return createPortal(modalContent, document.body);
}