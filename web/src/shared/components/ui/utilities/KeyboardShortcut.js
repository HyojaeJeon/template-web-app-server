/**
 * KeyboardShortcut - 키보드 단축키 처리 컴포넌트
 * 
 * 접근성 특징:
 * - WCAG 2.1 AA 준수 
 * - 키보드 네비게이션 지원
 * - 스크린 리더 단축키 설명 제공
 * - 단축키 충돌 방지
 * - 비활성화 상태 지원
 */

import React, { useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

// 키 매핑 상수
const KEY_MAPPINGS = {
  // 특수 키
  ctrl: 'Control',
  cmd: 'Meta',
  shift: 'Shift',
  alt: 'Alt',
  option: 'Alt',
  
  // 방향키
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  
  // 기능키
  enter: 'Enter',
  return: 'Enter',
  esc: 'Escape',
  escape: 'Escape',
  space: ' ',
  spacebar: ' ',
  tab: 'Tab',
  backspace: 'Backspace',
  delete: 'Delete',
  home: 'Home',
  end: 'End',
  pageup: 'PageUp',
  pagedown: 'PageDown',
  
  // 숫자
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
  '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  
  // 알파벳 (소문자로 정규화)
  a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f',
  g: 'g', h: 'h', i: 'i', j: 'j', k: 'k', l: 'l',
  m: 'm', n: 'n', o: 'o', p: 'p', q: 'q', r: 'r',
  s: 's', t: 't', u: 'u', v: 'v', w: 'w', x: 'x',
  y: 'y', z: 'z',
  
  // 특수 문자
  ',': ',',
  '.': '.',
  '/': '/',
  ';': ';',
  "'": "'",
  '[': '[',
  ']': ']',
  '\\': '\\',
  '-': '-',
  '=': '=',
  '`': '`'
};

// 플랫폼 감지
const isMac = typeof navigator !== 'undefined' && 
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

// 키 조합 파싱
const parseKeyCombo = (keyCombo) => {
  const keys = keyCombo.toLowerCase().split('+').map(key => key.trim());
  const modifiers = {
    ctrl: false,
    cmd: false,
    shift: false,
    alt: false
  };
  
  let mainKey = '';
  
  keys.forEach(key => {
    if (key === 'ctrl' || key === 'control') {
      modifiers.ctrl = true;
    } else if (key === 'cmd' || key === 'meta') {
      modifiers.cmd = true;
    } else if (key === 'shift') {
      modifiers.shift = true;
    } else if (key === 'alt' || key === 'option') {
      modifiers.alt = true;
    } else {
      mainKey = KEY_MAPPINGS[key] || key.toUpperCase();
    }
  });
  
  return { modifiers, mainKey };
};

// 이벤트와 키 조합 매칭
const matchesKeyCombo = (event, keyCombo) => {
  const { modifiers, mainKey } = parseKeyCombo(keyCombo);
  
  // 메인 키 확인
  const eventKey = event.key === ' ' ? ' ' : event.key.toLowerCase();
  const normalizedMainKey = mainKey === ' ' ? ' ' : mainKey.toLowerCase();
  
  if (eventKey !== normalizedMainKey) {
    return false;
  }
  
  // 수식자 키 확인
  return (
    event.ctrlKey === modifiers.ctrl &&
    event.metaKey === modifiers.cmd &&
    event.shiftKey === modifiers.shift &&
    event.altKey === modifiers.alt
  );
};

// 단축키 표시 형식화
const formatShortcut = (keyCombo) => {
  const { modifiers, mainKey } = parseKeyCombo(keyCombo);
  const parts = [];
  
  if (isMac) {
    if (modifiers.cmd) parts.push('⌘');
    if (modifiers.shift) parts.push('⇧');
    if (modifiers.alt) parts.push('⌥');
    if (modifiers.ctrl) parts.push('⌃');
  } else {
    if (modifiers.ctrl) parts.push('Ctrl');
    if (modifiers.shift) parts.push('Shift');
    if (modifiers.alt) parts.push('Alt');
    if (modifiers.cmd) parts.push('Win');
  }
  
  // 메인 키 포맷팅
  let formattedKey = mainKey;
  const keyDisplayMap = {
    ' ': 'Space',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Enter': '↵',
    'Escape': 'Esc',
    'Backspace': '⌫',
    'Delete': 'Del',
    'PageUp': 'PgUp',
    'PageDown': 'PgDn'
  };
  
  if (keyDisplayMap[mainKey]) {
    formattedKey = keyDisplayMap[mainKey];
  }
  
  parts.push(formattedKey);
  return parts.join(isMac ? '' : '+');
};

const KeyboardShortcut = ({
  keyCombo,
  onShortcut,
  disabled = false,
  preventDefault = true,
  stopPropagation = true,
  allowInInputs = false,
  description = '',
  global = true,
  target = null,
  children,
  className = ''
}) => {
  const callbackRef = useRef(onShortcut);
  const enabledRef = useRef(!disabled);

  // 콜백과 활성화 상태를 ref로 관리하여 리렌더링 방지
  useEffect(() => {
    callbackRef.current = onShortcut;
    enabledRef.current = !disabled;
  }, [onShortcut, disabled]);

  const handleKeyDown = useCallback((event) => {
    // 비활성화된 경우 무시
    if (!enabledRef.current) return;
    
    // 입력 요소에서의 처리 여부 확인
    if (!allowInInputs) {
      const activeElement = document.activeElement;
      const inputTypes = ['INPUT', 'TEXTAREA', 'SELECT'];
      const isContentEditable = activeElement?.contentEditable === 'true';
      
      if (inputTypes.includes(activeElement?.tagName) || isContentEditable) {
        return;
      }
    }
    
    // 키 조합 매칭
    if (matchesKeyCombo(event, keyCombo)) {
      if (preventDefault) {
        event.preventDefault();
      }
      
      if (stopPropagation) {
        event.stopPropagation();
      }
      
      callbackRef.current(event, {
        keyCombo,
        formattedShortcut: formatShortcut(keyCombo),
        description
      });
    }
  }, [keyCombo, preventDefault, stopPropagation, allowInInputs, description]);

  useEffect(() => {
    const targetElement = target || (global ? document : null);
    
    if (!targetElement) return;

    targetElement.addEventListener('keydown', handleKeyDown, { passive: false });

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, target, global]);

  // 단축키 힌트 컴포넌트
  const ShortcutHint = ({ visible = false }) => {
    if (!visible || !description) return null;
    
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded border text-gray-600 dark:text-gray-300"
        aria-label={`키보드 단축키: ${formatShortcut(keyCombo)}. ${description}`}
      >
        <span className="font-mono">{formatShortcut(keyCombo)}</span>
        {description && (
          <span className="text-gray-500 dark:text-gray-400">
            {description}
          </span>
        )}
      </span>
    );
  };

  if (children) {
    return (
      <div className={className} data-keyboard-shortcut={keyCombo}>
        {typeof children === 'function' 
          ? children({
              shortcut: formatShortcut(keyCombo),
              description,
              disabled,
              ShortcutHint
            })
          : children
        }
        
        {/* 스크린 리더용 단축키 정보 */}
        {description && (
          <span className="sr-only">
            키보드 단축키 {formatShortcut(keyCombo)}으로 {description}
          </span>
        )}
      </div>
    );
  }

  return null;
};

// 다중 단축키 처리 컴포넌트
export const KeyboardShortcuts = ({ shortcuts = [], children, ...props }) => {
  return (
    <div {...props}>
      {shortcuts.map((shortcut, index) => (
        <KeyboardShortcut
          key={`${shortcut.keyCombo}-${index}`}
          {...shortcut}
        />
      ))}
      {children}
    </div>
  );
};

// 단축키 도움말 모달 컴포넌트
export const ShortcutHelp = ({ 
  shortcuts = [], 
  visible = false, 
  onClose = () => {},
  title = "키보드 단축키",
  className = ''
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && visible) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcut-help-title"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 id="shortcut-help-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="닫기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {shortcut.description}
                </span>
                <code className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded font-mono">
                  {formatShortcut(shortcut.keyCombo)}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

KeyboardShortcut.propTypes = {
  /** 키 조합 (예: 'ctrl+s', 'cmd+enter') */
  keyCombo: PropTypes.string.isRequired,
  
  /** 단축키 실행 시 호출되는 함수 */
  onShortcut: PropTypes.func.isRequired,
  
  /** 비활성화 여부 */
  disabled: PropTypes.bool,
  
  /** 기본 동작 방지 여부 */
  preventDefault: PropTypes.bool,
  
  /** 이벤트 전파 중단 여부 */
  stopPropagation: PropTypes.bool,
  
  /** 입력 요소에서도 동작할지 여부 */
  allowInInputs: PropTypes.bool,
  
  /** 단축키 설명 */
  description: PropTypes.string,
  
  /** 전역 단축키 여부 */
  global: PropTypes.bool,
  
  /** 이벤트를 바인딩할 타겟 요소 */
  target: PropTypes.object,
  
  /** 자식 요소 */
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  
  /** CSS 클래스 */
  className: PropTypes.string
};

KeyboardShortcuts.propTypes = {
  /** 단축키 배열 */
  shortcuts: PropTypes.arrayOf(PropTypes.shape({
    keyCombo: PropTypes.string.isRequired,
    onShortcut: PropTypes.func.isRequired,
    description: PropTypes.string,
    disabled: PropTypes.bool
  })),
  
  /** 자식 요소 */
  children: PropTypes.node
};

ShortcutHelp.propTypes = {
  /** 표시할 단축키 목록 */
  shortcuts: PropTypes.arrayOf(PropTypes.shape({
    keyCombo: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired
  })),
  
  /** 표시 여부 */
  visible: PropTypes.bool,
  
  /** 닫기 콜백 */
  onClose: PropTypes.func,
  
  /** 모달 제목 */
  title: PropTypes.string,
  
  /** CSS 클래스 */
  className: PropTypes.string
};

export default KeyboardShortcut;