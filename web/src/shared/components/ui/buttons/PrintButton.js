/**
 * PrintButton.js - 인쇄 버튼 컴포넌트 (점주용)
 * WCAG 2.1 준수, 다크모드 지원, Local 테마 적용
 */
'use client';

import React, { useState, useRef, useCallback } from 'react';

const PrintButton = ({
  target,
  selector,
  content,
  title = '인쇄',
  printStyles = '',
  hideElements = [],
  showOnly = [],
  onBeforePrint,
  onAfterPrint,
  onError,
  children,
  className = '',
  disabled = false,
  variant = 'button',
  size = 'md',
  showIcon = true,
  openNewWindow = false,
  windowFeatures = 'width=800,height=600,scrollbars=yes',
  ariaLabel,
  ...props
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const printWindowRef = useRef(null);

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg'
  };

  // 인쇄용 CSS 스타일 생성
  const generatePrintStyles = useCallback(() => {
    const defaultStyles = `
      @media print {
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        .no-print { display: none !important; }
        .print-only { display: block !important; }
        .print-break-before { page-break-before: always; }
        .print-break-after { page-break-after: always; }
        .print-avoid-break { page-break-inside: avoid; }
        
        /* 기본 레이아웃 */
        table { border-collapse: collapse; width: 100%; }
        table, th, td { border: 1px solid #000; }
        th, td { padding: 8px; text-align: left; }
        
        /* 텍스트 최적화 */
        h1, h2, h3, h4, h5, h6 { color: #000; margin-bottom: 10px; }
        p { margin-bottom: 5px; line-height: 1.4; }
        
        /* 링크 URL 표시 */
        a[href]:after { content: " (" attr(href) ")"; }
        
        /* 이미지 최적화 */
        img { max-width: 100%; height: auto; }
        
        /* 숨길 요소 */
        ${hideElements.map(selector => `${selector} { display: none !important; }`).join('\n')}
        
        /* 표시할 요소만 (showOnly가 있는 경우) */
        ${showOnly.length > 0 ? `
          body * { display: none !important; }
          ${showOnly.map(selector => `${selector}, ${selector} * { display: block !important; }`).join('\n')}
        ` : ''}
      }
      
      ${printStyles}
    `;

    return defaultStyles;
  }, [printStyles, hideElements, showOnly]);

  // 인쇄할 내용 준비
  const preparePrintContent = useCallback(() => {
    let printContent = '';

    if (content) {
      // 직접 제공된 내용
      printContent = content;
    } else if (selector) {
      // CSS 셀렉터로 요소 선택
      const element = document.querySelector(selector);
      if (element) {
        printContent = element.outerHTML;
      } else {
        throw new Error(`선택자 "${selector}"에 해당하는 요소를 찾을 수 없습니다`);
      }
    } else if (target) {
      // target 요소 또는 셀렉터
      if (typeof target === 'string') {
        const element = document.querySelector(target);
        if (element) {
          printContent = element.outerHTML;
        } else {
          throw new Error(`선택자 "${target}"에 해당하는 요소를 찾을 수 없습니다`);
        }
      } else if (target instanceof HTMLElement) {
        printContent = target.outerHTML;
      } else {
        throw new Error('잘못된 target 타입입니다');
      }
    } else {
      // 전체 페이지 인쇄
      printContent = document.documentElement.outerHTML;
    }

    return printContent;
  }, [content, selector, target]);

  // 인쇄용 HTML 문서 생성
  const createPrintDocument = useCallback((content) => {
    const printStyles = generatePrintStyles();
    
    return `
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>${printStyles}</style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  }, [title, generatePrintStyles]);

  // 새 창에서 인쇄
  const printInNewWindow = useCallback((content) => {
    return new Promise((resolve, reject) => {
      try {
        const printWindow = window.open('', '_blank', windowFeatures);
        if (!printWindow) {
          throw new Error('팝업 창이 차단되었습니다');
        }

        printWindowRef.current = printWindow;
        
        const printDocument = createPrintDocument(content);
        printWindow.document.write(printDocument);
        printWindow.document.close();

        // 이미지 로딩 대기
        const images = printWindow.document.images;
        let loadedImages = 0;
        const totalImages = images.length;

        const checkImagesLoaded = () => {
          if (totalImages === 0 || loadedImages === totalImages) {
            setTimeout(() => {
              printWindow.focus();
              printWindow.print();
              
              // 인쇄 후 창 닫기 처리
              const checkClosed = setInterval(() => {
                if (printWindow.closed) {
                  clearInterval(checkClosed);
                  printWindowRef.current = null;
                  resolve();
                }
              }, 100);
              
              // 30초 후 자동으로 창 닫기
              setTimeout(() => {
                if (!printWindow.closed) {
                  printWindow.close();
                  clearInterval(checkClosed);
                  printWindowRef.current = null;
                  resolve();
                }
              }, 30000);
            }, 100);
          }
        };

        if (totalImages > 0) {
          Array.from(images).forEach(img => {
            if (img.complete) {
              loadedImages++;
            } else {
              img.onload = img.onerror = () => {
                loadedImages++;
                checkImagesLoaded();
              };
            }
          });
          checkImagesLoaded();
        } else {
          checkImagesLoaded();
        }

      } catch (error) {
        reject(error);
      }
    });
  }, [windowFeatures, createPrintDocument]);

  // 현재 창에서 인쇄
  const printInCurrentWindow = useCallback((content) => {
    return new Promise((resolve, reject) => {
      try {
        // 기존 내용 백업
        const originalContent = document.body.innerHTML;
        const originalTitle = document.title;

        // 인쇄 스타일 추가
        const styleElement = document.createElement('style');
        styleElement.innerHTML = generatePrintStyles();
        document.head.appendChild(styleElement);

        // 내용 교체
        document.body.innerHTML = content;
        document.title = title;

        // 인쇄 실행
        const beforePrint = () => {
          if (onBeforePrint) onBeforePrint();
        };

        const afterPrint = () => {
          // 원본 내용 복원
          document.body.innerHTML = originalContent;
          document.title = originalTitle;
          document.head.removeChild(styleElement);
          
          window.removeEventListener('beforeprint', beforePrint);
          window.removeEventListener('afterprint', afterPrint);
          
          if (onAfterPrint) onAfterPrint();
          resolve();
        };

        window.addEventListener('beforeprint', beforePrint);
        window.addEventListener('afterprint', afterPrint);

        // 짧은 지연 후 인쇄 실행
        setTimeout(() => {
          window.print();
        }, 100);

      } catch (error) {
        reject(error);
      }
    });
  }, [title, generatePrintStyles, onBeforePrint, onAfterPrint]);

  // 인쇄 실행
  const handlePrint = useCallback(async () => {
    if (disabled || isPrinting) return;

    setIsPrinting(true);

    try {
      // 인쇄 전 콜백
      if (onBeforePrint) {
        onBeforePrint();
      }

      // 인쇄할 내용 준비
      const printContent = preparePrintContent();

      // 인쇄 실행
      if (openNewWindow) {
        await printInNewWindow(printContent);
      } else {
        await printInCurrentWindow(printContent);
      }

      // 스크린 리더를 위한 알림
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = '인쇄가 시작되었습니다';
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);

    } catch (error) {
      console.error('인쇄 실패:', error);
      
      if (onError) {
        onError(error);
      }
      
      // 에러 알림
      const errorAnnouncement = document.createElement('div');
      errorAnnouncement.setAttribute('aria-live', 'assertive');
      errorAnnouncement.setAttribute('aria-atomic', 'true');
      errorAnnouncement.className = 'sr-only';
      errorAnnouncement.textContent = '인쇄 중 오류가 발생했습니다';
      document.body.appendChild(errorAnnouncement);
      
      setTimeout(() => {
        if (document.body.contains(errorAnnouncement)) {
          document.body.removeChild(errorAnnouncement);
        }
      }, 1000);
      
    } finally {
      setIsPrinting(false);
      
      // 인쇄 후 콜백 (새 창이 아닌 경우에만)
      if (!openNewWindow && onAfterPrint) {
        onAfterPrint();
      }
    }
  }, [
    disabled, 
    isPrinting, 
    onBeforePrint, 
    preparePrintContent, 
    openNewWindow, 
    printInNewWindow, 
    printInCurrentWindow, 
    onError, 
    onAfterPrint
  ]);

  // 키보드 이벤트 처리
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlePrint();
    }
  }, [handlePrint]);

  // 컴포넌트 언마운트 시 인쇄 창 정리
  React.useEffect(() => {
    return () => {
      if (printWindowRef.current && !printWindowRef.current.closed) {
        printWindowRef.current.close();
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
    
    return `${baseClasses} bg-[#2AC1BC] text-white border border-[#2AC1BC] hover:bg-[#25A0A0] focus:ring-[#2AC1BC]`;
  };

  // 인쇄 아이콘 렌더링
  const renderPrintIcon = () => {
    if (!showIcon) return null;

    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
    );
  };

  // 아이콘만 변형
  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handlePrint}
        onKeyDown={handleKeyDown}
        disabled={disabled || isPrinting}
        className={`
          p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-[#2AC1BC] dark:hover:text-[#2AC1BC]
          hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed relative
          ${className}
        `}
        aria-label={ariaLabel || '인쇄하기'}
        title="인쇄하기"
        {...props}
      >
        {renderPrintIcon()}
        
        {/* 로딩 표시 */}
        {isPrinting && (
          <div className="absolute inset-0 bg-[#2AC1BC] bg-opacity-90 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </button>
    );
  }

  // 기본 버튼 변형
  return (
    <button
      type="button"
      onClick={handlePrint}
      onKeyDown={handleKeyDown}
      disabled={disabled || isPrinting}
      className={`${getButtonClasses()} ${sizeClasses[size]} ${className}`}
      aria-label={ariaLabel || '인쇄하기'}
      {...props}
    >
      {renderPrintIcon()}
      {children || '인쇄하기'}
      
      {/* 로딩 애니메이션 */}
      {isPrinting && (
        <div className="absolute inset-0 bg-[#2AC1BC] flex items-center justify-center">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}
    </button>
  );
};

export default PrintButton;