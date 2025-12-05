/**
 * ShareButton.js - 공유하기 컴포넌트 (점주용)
 * WCAG 2.1 준수, 다크모드 지원, Local 테마 적용
 */
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

const ShareButton = ({
  url = window?.location?.href || '',
  title = '',
  text = '',
  platforms = ['native', 'link', 'facebook', 'twitter', 'telegram', 'whatsapp', 'email'],
  onShare,
  onError,
  children,
  className = '',
  disabled = false,
  variant = 'button',
  size = 'md',
  showIcon = true,
  showPlatforms = true,
  trigger = 'click',
  position = 'bottom',
  ariaLabel,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg'
  };

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  };

  // Web Share API 지원 여부 확인
  const isNativeShareSupported = () => {
    return navigator.share && window.isSecureContext;
  };

  // 플랫폼별 공유 URL 생성
  const getShareUrl = useCallback((platform) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedText = encodeURIComponent(text || title);

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
      sms: `sms:?body=${encodedText}%20${encodedUrl}`
    };

    return shareUrls[platform];
  }, [url, title, text]);

  // 네이티브 공유 실행
  const handleNativeShare = useCallback(async () => {
    if (!isNativeShareSupported()) {
      throw new Error('네이티브 공유가 지원되지 않습니다');
    }

    const shareData = {
      title,
      text,
      url
    };

    // 빈 값 제거
    Object.keys(shareData).forEach(key => {
      if (!shareData[key]) delete shareData[key];
    });

    await navigator.share(shareData);
  }, [title, text, url]);

  // 클립보드에 링크 복사
  const handleCopyLink = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // 폴백 방법
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        textArea.setAttribute('readonly', 'readonly');
        textArea.setAttribute('aria-hidden', 'true');
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        textArea.setSelectionRange(0, textArea.value.length);
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!success) {
          throw new Error('클립보드 복사 실패');
        }
      }

      // 스크린 리더를 위한 알림
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = '링크가 클립보드에 복사되었습니다';
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);

    } catch (error) {
      console.error('링크 복사 실패:', error);
      throw error;
    }
  }, [url]);

  // 플랫폼별 공유 실행
  const handlePlatformShare = useCallback(async (platform) => {
    setIsSharing(true);
    
    try {
      if (platform === 'native') {
        await handleNativeShare();
      } else if (platform === 'link') {
        await handleCopyLink();
      } else {
        const shareUrl = getShareUrl(platform);
        if (shareUrl) {
          // 새 창에서 공유 페이지 열기
          const popup = window.open(
            shareUrl,
            `share-${platform}`,
            'width=600,height=400,scrollbars=yes,resizable=yes'
          );
          
          if (!popup) {
            throw new Error('팝업이 차단되었습니다');
          }
        }
      }

      // 성공 콜백 호출
      if (onShare) {
        onShare(platform, { url, title, text });
      }

      setIsOpen(false);
      
    } catch (error) {
      console.error(`${platform} 공유 실패:`, error);
      
      if (onError) {
        onError(error, platform);
      }
    } finally {
      setIsSharing(false);
    }
  }, [url, title, text, handleNativeShare, handleCopyLink, getShareUrl, onShare, onError]);

  // 드롭다운 열기/닫기
  const toggleDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(prev => !prev);
  }, [disabled]);

  // 키보드 이벤트 처리
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (event.target === buttonRef.current) {
        toggleDropdown();
      }
    }
  }, [toggleDropdown]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('focusin', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('focusin', handleClickOutside);
    };
  }, [isOpen]);

  // 플랫폼 아이콘 렌더링
  const renderPlatformIcon = useCallback((platform) => {
    const iconClasses = "w-5 h-5";
    
    switch (platform) {
      case 'native':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        );
      case 'link':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      case 'facebook':
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'twitter':
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
        );
      case 'telegram':
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        );
      case 'whatsapp':
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>
        );
      case 'email':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        );
    }
  }, []);

  // 플랫폼명 반환
  const getPlatformName = useCallback((platform) => {
    const names = {
      native: '공유하기',
      link: '링크 복사',
      facebook: 'Facebook',
      twitter: 'Twitter',
      telegram: 'Telegram',
      whatsapp: 'WhatsApp',
      linkedin: 'LinkedIn',
      reddit: 'Reddit',
      email: '이메일',
      sms: 'SMS'
    };
    return names[platform] || platform;
  }, []);

  // 사용 가능한 플랫폼 필터링
  const availablePlatforms = platforms.filter(platform => {
    if (platform === 'native') {
      return isNativeShareSupported();
    }
    return true;
  });

  // 메인 버튼 클래스
  const getButtonClasses = () => {
    const baseClasses = `
      inline-flex items-center justify-center gap-2 rounded-lg font-medium 
      transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 
      disabled:opacity-50 disabled:cursor-not-allowed relative
    `;
    
    return `${baseClasses} bg-[#2AC1BC] text-white border border-[#2AC1BC] hover:bg-[#25A0A0] focus:ring-[#2AC1BC]`;
  };

  // 공유 아이콘
  const renderShareIcon = () => {
    if (!showIcon) return null;

    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
      </svg>
    );
  };

  // 드롭다운 렌더링
  const renderDropdown = () => {
    if (!isOpen || !showPlatforms || availablePlatforms.length === 0) return null;

    return (
      <div
        ref={dropdownRef}
        className={`
          absolute z-50 min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-lg 
          border border-gray-200 dark:border-gray-600 py-2 ${positionClasses[position]}
        `}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="share-menu-button"
      >
        {availablePlatforms.map((platform) => (
          <button
            key={platform}
            type="button"
            onClick={() => handlePlatformShare(platform)}
            disabled={isSharing}
            className={`
              w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700
              focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            `}
            role="menuitem"
          >
            {renderPlatformIcon(platform)}
            {getPlatformName(platform)}
            {isSharing && (
              <div className="ml-auto">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    );
  };

  // 단일 플랫폼 버튼 (드롭다운 없음)
  if (availablePlatforms.length === 1 && !showPlatforms) {
    const platform = availablePlatforms[0];
    
    return (
      <button
        ref={buttonRef}
        type="button"
        onClick={() => handlePlatformShare(platform)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isSharing}
        className={`${getButtonClasses()} ${sizeClasses[size]} ${className}`}
        aria-label={ariaLabel || `${getPlatformName(platform)}로 공유하기`}
        {...props}
      >
        {renderPlatformIcon(platform)}
        {children || getPlatformName(platform)}
        
        {isSharing && (
          <div className="absolute inset-0 bg-[#2AC1BC] flex items-center justify-center rounded-lg">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </button>
    );
  }

  // 아이콘만 변형
  if (variant === 'icon') {
    return (
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={trigger === 'click' ? toggleDropdown : undefined}
          onDoubleClick={trigger === 'doubleClick' ? toggleDropdown : undefined}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`
            p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-[#2AC1BC] dark:hover:text-[#2AC1BC]
            hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label={ariaLabel || '공유하기'}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          id="share-menu-button"
        >
          {renderShareIcon()}
        </button>
        {renderDropdown()}
      </div>
    );
  }

  // 기본 버튼 변형
  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={trigger === 'click' ? toggleDropdown : undefined}
        onDoubleClick={trigger === 'doubleClick' ? toggleDropdown : undefined}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`${getButtonClasses()} ${sizeClasses[size]}`}
        aria-label={ariaLabel || '공유하기'}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        id="share-menu-button"
        {...props}
      >
        {renderShareIcon()}
        {children || '공유하기'}
        
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        
        {isSharing && (
          <div className="absolute inset-0 bg-[#2AC1BC] flex items-center justify-center rounded-lg">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </button>
      {renderDropdown()}
    </div>
  );
};

export default ShareButton;