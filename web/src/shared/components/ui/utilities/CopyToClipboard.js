/**
 * CopyToClipboard.js - 클립보드 복사 컴포넌트 (점주용)
 * WCAG 2.1 준수, 다크모드 지원, Local 테마 적용
 */
'use client';

import React, { useState, useRef, useCallback } from 'react';

const CopyToClipboard = ({
  text,
  onCopy,
  onError,
  children,
  className = '',
  disabled = false,
  resetTimeout = 2000,
  successMessage = '복사되었습니다!',
  errorMessage = '복사에 실패했습니다',
  ariaLabel,
  variant = 'button',
  size = 'md',
  showIcon = true,
  showFeedback = true,
  trigger = 'click',
  ...props
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isError, setIsError] = useState(false);
  const timeoutRef = useRef(null);
  const fallbackTextArea = useRef(null);

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg'
  };

  // 클립보드 API 지원 여부 확인
  const isClipboardSupported = () => {
    return navigator.clipboard && window.isSecureContext;
  };

  // 폴백 복사 방법 (구형 브라우저용)
  const fallbackCopy = useCallback((textToCopy) => {
    try {
      // 임시 textarea 생성
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', 'readonly');
      textArea.setAttribute('aria-hidden', 'true');
      
      document.body.appendChild(textArea);
      
      // 텍스트 선택 및 복사
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return success;
    } catch (error) {
      console.error('폴백 복사 실패:', error);
      return false;
    }
  }, []);

  // 복사 실행
  const handleCopy = useCallback(async () => {
    if (disabled || !text) return;

    // 이전 타이머 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsError(false);
    
    try {
      let success = false;
      
      // 클립보드 API 사용 시도
      if (isClipboardSupported()) {
        await navigator.clipboard.writeText(text);
        success = true;
      } else {
        // 폴백 방법 사용
        success = fallbackCopy(text);
      }

      if (success) {
        setIsCopied(true);
        
        // 성공 콜백 호출
        if (onCopy) {
          onCopy(text);
        }
        
        // 스크린 리더를 위한 알림
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = `${successMessage} ${text}`;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
          document.body.removeChild(announcement);
        }, 1000);
        
        // 상태 리셋
        timeoutRef.current = setTimeout(() => {
          setIsCopied(false);
        }, resetTimeout);
        
      } else {
        throw new Error('복사 실패');
      }
    } catch (error) {
      console.error('복사 오류:', error);
      setIsError(true);
      
      if (onError) {
        onError(error);
      }
      
      // 에러 상태 리셋
      timeoutRef.current = setTimeout(() => {
        setIsError(false);
      }, resetTimeout);
    }
  }, [text, disabled, onCopy, onError, successMessage, resetTimeout, fallbackCopy]);

  // 키보드 이벤트 처리
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCopy();
    }
  }, [handleCopy]);

  // 컴포넌트 언마운트 시 타이머 정리
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 버튼 스타일
  const getButtonClasses = () => {
    const baseClasses = `
      inline-flex items-center justify-center gap-2 rounded-lg font-medium 
      transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 
      disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden
    `;
    
    if (isError) {
      return `${baseClasses} bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-600 hover:bg-red-200 dark:hover:bg-red-900/30 focus:ring-red-500`;
    }
    
    if (isCopied) {
      return `${baseClasses} bg-[#00B14F] text-white border border-[#00B14F] hover:bg-[#008f3f] focus:ring-[#00B14F]`;
    }
    
    return `${baseClasses} bg-[#2AC1BC] text-white border border-[#2AC1BC] hover:bg-[#25A0A0] focus:ring-[#2AC1BC]`;
  };

  // 아이콘 렌더링
  const renderIcon = () => {
    if (!showIcon) return null;

    if (isError) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }

    if (isCopied) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    );
  };

  // 피드백 메시지 렌더링
  const renderFeedbackMessage = () => {
    if (!showFeedback) return null;

    if (isError) return errorMessage;
    if (isCopied) return successMessage;
    return '복사하기';
  };

  // 버튼 변형
  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={trigger === 'click' ? handleCopy : undefined}
        onDoubleClick={trigger === 'doubleClick' ? handleCopy : undefined}
        onKeyDown={handleKeyDown}
        disabled={disabled || !text}
        className={`${getButtonClasses()} ${sizeClasses[size]} ${className}`}
        aria-label={ariaLabel || `${text} 복사하기`}
        title={renderFeedbackMessage()}
        {...props}
      >
        {renderIcon()}
        {children || renderFeedbackMessage()}
        
        {/* 로딩 애니메이션 (복사 중일 때) */}
        {isCopied && (
          <div className="absolute inset-0 bg-[#00B14F] flex items-center justify-center">
            <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </button>
    );
  }

  // 인라인 변형 (텍스트와 함께)
  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm border">
          {text}
        </span>
        <button
          type="button"
          onClick={trigger === 'click' ? handleCopy : undefined}
          onDoubleClick={trigger === 'doubleClick' ? handleCopy : undefined}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`
            p-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-[#2AC1BC] dark:hover:text-[#2AC1BC] 
            hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isCopied ? 'text-[#00B14F]' : ''}
            ${isError ? 'text-red-500' : ''}
          `}
          aria-label={ariaLabel || `${text} 복사하기`}
          title={renderFeedbackMessage()}
          {...props}
        >
          {renderIcon()}
        </button>
        
        {showFeedback && (isCopied || isError) && (
          <span className={`text-xs font-medium ${
            isError 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-[#00B14F]'
          }`}>
            {renderFeedbackMessage()}
          </span>
        )}
      </span>
    );
  }

  // 아이콘만 변형
  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={trigger === 'click' ? handleCopy : undefined}
        onDoubleClick={trigger === 'doubleClick' ? handleCopy : undefined}
        onKeyDown={handleKeyDown}
        disabled={disabled || !text}
        className={`
          p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-[#2AC1BC] dark:hover:text-[#2AC1BC]
          hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed relative
          ${isCopied ? 'text-[#00B14F] bg-green-100 dark:bg-green-900/20' : ''}
          ${isError ? 'text-red-500 bg-red-100 dark:bg-red-900/20' : ''}
          ${className}
        `}
        aria-label={ariaLabel || `${text} 복사하기`}
        title={renderFeedbackMessage()}
        {...props}
      >
        {renderIcon()}
        
        {/* 툴팁 형태 피드백 */}
        {showFeedback && (isCopied || isError) && (
          <div className={`
            absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs font-medium
            rounded-md shadow-lg z-10 whitespace-nowrap
            ${isError 
              ? 'bg-red-600 text-white' 
              : 'bg-[#00B14F] text-white'
            }
          `}>
            {renderFeedbackMessage()}
            <div className={`
              absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent
              ${isError ? 'border-t-red-600' : 'border-t-[#00B14F]'}
            `}></div>
          </div>
        )}
      </button>
    );
  }

  // 래퍼 변형 (children을 감싸기)
  return (
    <div 
      className={`relative group ${className}`}
      onClick={trigger === 'click' ? handleCopy : undefined}
      onDoubleClick={trigger === 'doubleClick' ? handleCopy : undefined}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel || `${text} 복사하기`}
      {...props}
    >
      {children}
      
      {/* 호버 시 표시되는 복사 버튼 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleCopy();
        }}
        disabled={disabled}
        className={`
          absolute top-1 right-1 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200
          bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-600
          text-gray-500 dark:text-gray-400 hover:text-[#2AC1BC] dark:hover:text-[#2AC1BC]
          focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] focus:ring-offset-2 focus:opacity-100
          ${isCopied ? 'text-[#00B14F] opacity-100' : ''}
          ${isError ? 'text-red-500 opacity-100' : ''}
        `}
        aria-label="복사하기"
      >
        {renderIcon()}
      </button>
      
      {/* 피드백 메시지 */}
      {showFeedback && (isCopied || isError) && (
        <div className={`
          absolute -top-8 right-1 px-2 py-1 text-xs font-medium rounded-md shadow-lg z-10 whitespace-nowrap
          ${isError 
            ? 'bg-red-600 text-white' 
            : 'bg-[#00B14F] text-white'
          }
        `}>
          {renderFeedbackMessage()}
        </div>
      )}
    </div>
  );
};

export default CopyToClipboard;