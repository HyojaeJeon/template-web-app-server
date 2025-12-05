/**
 * Keyboard Shortcuts Hook
 * 점주용 웹 인터페이스의 키보드 단축키 지원
 * 업무 효율성을 위한 키보드 네비게이션
 */
import { useEffect, useCallback } from 'react';

const useKeyboardShortcuts = (shortcuts = {}) => {
  // 키 조합을 정규화하는 함수
  const normalizeKey = useCallback((e) => {
    const keys = [];
    
    if (e.ctrlKey || e.metaKey) keys.push('cmd');
    if (e.shiftKey) keys.push('shift');
    if (e.altKey) keys.push('alt');
    
    // 특수 키 처리
    const specialKeys = {
      'Escape': 'esc',
      'Enter': 'enter',
      'Space': 'space',
      'Tab': 'tab',
      'Backspace': 'backspace',
      'Delete': 'delete',
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      '/': 'slash'
    };
    
    const key = specialKeys[e.key] || e.key.toLowerCase();
    
    // F1-F12 키 처리
    if (e.key.startsWith('F') && e.key.length <= 3) {
      keys.push(e.key.toLowerCase());
    } else {
      keys.push(key);
    }
    
    return keys.join('+');
  }, []);

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback((e) => {
    const keyCombo = normalizeKey(e);
    
    // 입력 필드에서는 일부 단축키 무시
    const isInputElement = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) ||
                          e.target.contentEditable === 'true';
    
    // 입력 필드에서 허용되는 단축키만 처리
    const allowedInInputs = ['cmd+a', 'cmd+c', 'cmd+v', 'cmd+x', 'cmd+z', 'esc'];
    
    if (isInputElement && !allowedInInputs.includes(keyCombo)) {
      return;
    }
    
    // 등록된 단축키 실행
    if (shortcuts[keyCombo]) {
      e.preventDefault();
      e.stopPropagation();
      shortcuts[keyCombo](e);
    }
  }, [shortcuts, normalizeKey]);

  // 이벤트 리스너 등록/해제
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.addEventListener('keydown', handleKeyDown, { capture: true });
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown, { capture: true });
      };
    }
  }, [handleKeyDown]);

  // 단축키 등록 함수 반환
  return {
    registerShortcut: useCallback((keyCombo, handler) => {
      shortcuts[keyCombo] = handler;
    }, [shortcuts]),
    
    unregisterShortcut: useCallback((keyCombo) => {
      delete shortcuts[keyCombo];
    }, [shortcuts])
  };
};

export default useKeyboardShortcuts;