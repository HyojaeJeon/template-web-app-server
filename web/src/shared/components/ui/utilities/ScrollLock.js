/**
 * ScrollLock - 스크롤 잠금 컴포넌트
 * 
 * 모달이나 오버레이가 활성화될 때 배경 스크롤을 방지
 * 
 * 접근성 특징:
 * - WCAG 2.1 AA 준수
 * - 포커스 컨테이너 내 스크롤 유지
 * - iOS Safari 및 모바일 최적화
 * - 스크롤바 너비 보정
 */

import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

let lockCount = 0;
let originalStyles = {};
let hasPassiveEvents = false;

// Passive 이벤트 지원 확인
if (typeof window !== 'undefined') {
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get() {
        hasPassiveEvents = true;
        return false;
      },
    });
    window.addEventListener('test', null, opts);
    window.removeEventListener('test', null, opts);
  } catch (e) {
    // Passive events not supported
  }
}

// 스크롤바 너비 계산
const getScrollBarWidth = () => {
  if (typeof window === 'undefined') return 0;
  
  const scrollDiv = document.createElement('div');
  scrollDiv.style.cssText = `
    width: 100px;
    height: 100px;
    overflow: scroll;
    position: absolute;
    top: -9999px;
  `;
  document.body.appendChild(scrollDiv);
  const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
  document.body.removeChild(scrollDiv);
  return scrollbarWidth;
};

// iOS 감지
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Touch 이벤트가 스크롤 가능한 요소 내에서 발생했는지 확인
const isScrollableElement = (element) => {
  if (!element || element === document.body) return false;
  
  const { overflowY, height } = window.getComputedStyle(element);
  const hasScroll = overflowY !== 'visible' && overflowY !== 'hidden';
  const hasScrollableContent = element.scrollHeight > element.clientHeight;
  
  return hasScroll && hasScrollableContent;
};

// 터치 이벤트 처리 함수
const handleTouchStart = (e) => {
  // 스크롤 가능한 컨테이너 내부에서는 허용
  if (e.target.closest('[data-scroll-lock-scrollable="true"]')) {
    return;
  }
  
  // 첫 번째 터치만 기록
  if (e.touches.length === 1) {
    // 터치 시작 위치 기록
    e.target._initialTouchY = e.touches[0].clientY;
  }
};

const handleTouchMove = (e) => {
  // 스크롤 가능한 컨테이너 내부에서는 허용
  const scrollableContainer = e.target.closest('[data-scroll-lock-scrollable="true"]');
  if (scrollableContainer) {
    const element = scrollableContainer;
    const { scrollTop, scrollHeight, clientHeight } = element;
    const touchY = e.touches[0].clientY;
    const initialTouchY = e.target._initialTouchY;
    
    if (initialTouchY) {
      const isScrollingUp = touchY > initialTouchY;
      const isScrollingDown = touchY < initialTouchY;
      
      // 상단에서 위로 스크롤하거나 하단에서 아래로 스크롤하는 경우만 차단
      if ((isScrollingUp && scrollTop === 0) || 
          (isScrollingDown && scrollTop >= scrollHeight - clientHeight)) {
        e.preventDefault();
      }
    }
    return;
  }
  
  // 기본 동작 차단
  e.preventDefault();
};

const handleTouchEnd = (e) => {
  // 터치 종료 시 초기 위치 제거
  if (e.target._initialTouchY) {
    delete e.target._initialTouchY;
  }
};

// 휠 이벤트 처리
const handleWheel = (e) => {
  // 스크롤 가능한 컨테이너 내부에서는 허용
  if (e.target.closest('[data-scroll-lock-scrollable="true"]')) {
    return;
  }
  
  e.preventDefault();
};

// 키보드 이벤트 처리 (스페이스, 페이지 업/다운 등)
const handleKeyDown = (e) => {
  // 스크롤 가능한 컨테이너 내부에서는 허용
  if (e.target.closest('[data-scroll-lock-scrollable="true"]')) {
    return;
  }
  
  // 스크롤을 유발하는 키들
  const scrollKeys = [32, 33, 34, 35, 36, 37, 38, 39, 40];
  if (scrollKeys.includes(e.keyCode)) {
    e.preventDefault();
  }
};

const ScrollLock = ({ 
  isLocked = true,
  accountForScrollbars = true,
  widthRecompensation = true,
  children,
  className = ''
}) => {
  const previousLockRef = useRef(false);
  
  const lock = useCallback(() => {
    if (typeof window === 'undefined' || lockCount > 0) {
      lockCount++;
      return;
    }

    const { body } = document;
    const scrollBarWidth = accountForScrollbars ? getScrollBarWidth() : 0;
    
    // 현재 스타일 저장
    originalStyles = {
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      height: body.style.height
    };

    // iOS에서는 position: fixed 사용
    if (isIOS()) {
      const scrollY = window.scrollY;
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.width = '100%';
      body.style.height = '100%';
      body.style.overflow = 'hidden';
    } else {
      // 데스크톱에서는 overflow: hidden 사용
      body.style.overflow = 'hidden';
      
      // 스크롤바 너비 보정
      if (widthRecompensation && scrollBarWidth > 0) {
        const currentPadding = parseInt(
          window.getComputedStyle(body).getPropertyValue('padding-right'),
          10
        );
        body.style.paddingRight = `${currentPadding + scrollBarWidth}px`;
      }
    }

    // 이벤트 리스너 추가
    const eventOptions = hasPassiveEvents ? { passive: false } : false;
    
    document.addEventListener('touchstart', handleTouchStart, eventOptions);
    document.addEventListener('touchmove', handleTouchMove, eventOptions);
    document.addEventListener('touchend', handleTouchEnd, eventOptions);
    document.addEventListener('wheel', handleWheel, eventOptions);
    document.addEventListener('keydown', handleKeyDown, eventOptions);

    lockCount++;
  }, [accountForScrollbars, widthRecompensation]);

  const unlock = useCallback(() => {
    if (typeof window === 'undefined' || lockCount === 0) {
      return;
    }

    lockCount--;
    
    if (lockCount > 0) {
      return;
    }

    const { body } = document;

    // iOS 스타일 복원
    if (isIOS() && body.style.position === 'fixed') {
      const scrollY = parseInt(body.style.top || '0', 10);
      body.style.position = originalStyles.position;
      body.style.top = originalStyles.top;
      body.style.width = originalStyles.width;
      body.style.height = originalStyles.height;
      window.scrollTo(0, Math.abs(scrollY));
    }

    // 원래 스타일 복원
    body.style.overflow = originalStyles.overflow;
    body.style.paddingRight = originalStyles.paddingRight;

    // 이벤트 리스너 제거
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('wheel', handleWheel);
    document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isLocked && !previousLockRef.current) {
      lock();
      previousLockRef.current = true;
    } else if (!isLocked && previousLockRef.current) {
      unlock();
      previousLockRef.current = false;
    }

    return () => {
      if (previousLockRef.current) {
        unlock();
        previousLockRef.current = false;
      }
    };
  }, [isLocked, lock, unlock]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (previousLockRef.current) {
        unlock();
      }
    };
  }, [unlock]);

  if (children) {
    return (
      <div 
        className={className}
        data-scroll-lock-container="true"
      >
        {children}
      </div>
    );
  }

  return null;
};

// 스크롤 가능한 요소를 표시하는 래퍼 컴포넌트
export const ScrollableContainer = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`overflow-auto ${className}`}
      data-scroll-lock-scrollable="true"
      {...props}
    >
      {children}
    </div>
  );
};

ScrollLock.propTypes = {
  /** 스크롤 잠금 활성화 여부 */
  isLocked: PropTypes.bool,
  
  /** 스크롤바 너비 고려 여부 */
  accountForScrollbars: PropTypes.bool,
  
  /** 너비 보정 여부 */
  widthRecompensation: PropTypes.bool,
  
  /** 자식 요소 */
  children: PropTypes.node,
  
  /** CSS 클래스 */
  className: PropTypes.string
};

ScrollableContainer.propTypes = {
  /** 자식 요소 */
  children: PropTypes.node.isRequired,
  
  /** CSS 클래스 */
  className: PropTypes.string
};

export default ScrollLock;