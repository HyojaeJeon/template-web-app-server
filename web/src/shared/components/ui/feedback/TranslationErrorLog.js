'use client';

/**
 * TranslationErrorLog.js - 번역 오류 로깅 UI 컴포넌트
 * Local App MVP - 점주용 웹 시스템
 * 
 * @description
 * - 번역 키 누락 및 객체 반환 오류 시각화
 * - 다크 테마 지원
 * - Claude Code 친화적 프롬프트 복사 기능
 * - Tailwind CSS 기반 스타일링
 * - WCAG 2.1 접근성 준수
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import Card from '../display/Card';
import Toast from './Toast';

const TranslationErrorLog = ({ 
  missingKeys = [], 
  objectErrors = [], 
  onClose, 
  position = 'bottom-right',
  autoHide = false,
  hideDelay = 10000 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [prompt, setPrompt] = useState('');

  // Claude Code 프롬프트 생성
  const generateClaudePrompt = useCallback(() => {
    const timestamp = new Date().toISOString();
    const currentPage = typeof window !== 'undefined' ? window.location.pathname : 'unknown';
    
    const totalErrors = missingKeys.length + objectErrors.length;
    if (totalErrors === 0) return '';

    // 키를 모듈별로 그룹화
    const keysByModule = {};
    missingKeys.forEach(key => {
      const module = key.includes('.') ? key.split('.')[0] : 'global';
      if (!keysByModule[module]) {
        keysByModule[module] = [];
      }
      keysByModule[module].push(key);
    });

    return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 번역키 누락 해결 - 빠른 수정 가이드
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 ${timestamp}
📍 페이지: ${currentPage}
🌐 총 오류: ${totalErrors}개
${objectErrors.length > 0 ? `
🔶 객체 반환 오류 (${objectErrors.length}개):
${objectErrors.map(error => `  ❌ t("${error.fullKey}") → ✅ t("${error.suggestedKeys?.[0] || error.fullKey + '.key'}")`).join('\n')}

📝 하위 키까지 포함하여 정확한 경로 지정 필요
` : ''}${missingKeys.length > 0 ? `
🚨 누락 번역키 (${missingKeys.length}개) - 빠른 수정:

${Object.entries(keysByModule).map(([module, keys]) => `📁 ${module} 모듈 (${keys.length}개):
  📍 파일: /Users/hyojae/projects/template/store/src/shared/i18n/locales/[ko|en|vi]/${module}.json
${keys.map(key => `  • ${key} → 번역이 필요한 텍스트`).join('\n')}`).join('\n\n')}

⚡ 작업순서: 한국어 → 영어 → Local어
✅ 완료확인: 페이지 새로고침 후 오류 해결 여부 확인` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }, [missingKeys, objectErrors]);

  useEffect(() => {
    setPrompt(generateClaudePrompt());
  }, [generateClaudePrompt]);

  useEffect(() => {
    if (autoHide && hideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, hideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  if (!isVisible || (missingKeys.length === 0 && objectErrors.length === 0)) {
    return null;
  }

  // 위치 스타일
  const getPositionStyles = () => {
    const basePosition = 'fixed z-[100]';
    
    switch (position) {
      case 'top-left':
        return `${basePosition} top-4 left-4`;
      case 'top-right':
        return `${basePosition} top-4 right-4`;
      case 'bottom-left':
        return `${basePosition} bottom-4 left-4`;
      case 'bottom-right':
      default:
        return `${basePosition} bottom-4 right-4`;
      case 'center':
        return `${basePosition} top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`;
    }
  };

  const totalErrors = missingKeys.length + objectErrors.length;

  return (
    <>
      <div className={getPositionStyles()}>
        <Card
          variant="error"
          size="lg"
          shadow={true}
          bordered={true}
          className="w-96 max-w-[calc(100vw-2rem)] overflow-hidden bg-rose-50/98 dark:bg-rose-950/95 backdrop-blur-xl border-rose-300/70 dark:border-rose-700/70"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-rose-900 dark:text-rose-100">
                  번역 오류 발견
                </h3>
                <p className="text-sm text-rose-700 dark:text-rose-300">
                  {totalErrors}개의 오류가 감지되었습니다
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors duration-200"
              aria-label="오류 로그 닫기"
            >
              <XMarkIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </button>
          </div>

          {/* 요약 정보 */}
          <div className="space-y-3 mb-4">
            {missingKeys.length > 0 && (
              <div className="bg-rose-100/50 dark:bg-rose-900/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                  <span className="font-medium text-rose-800 dark:text-rose-200">
                    누락된 번역키: {missingKeys.length}개
                  </span>
                </div>
                <div className="text-sm text-rose-700 dark:text-rose-300 space-y-1">
                  {missingKeys.slice(0, 3).map((key, index) => (
                    <div key={index} className="font-mono bg-rose-200/50 dark:bg-rose-800/50 px-2 py-1 rounded text-xs">
                      {key}
                    </div>
                  ))}
                  {missingKeys.length > 3 && (
                    <div className="text-xs text-rose-600 dark:text-rose-400">
                      그 외 {missingKeys.length - 3}개 더...
                    </div>
                  )}
                </div>
              </div>
            )}

            {objectErrors.length > 0 && (
              <div className="bg-amber-100/50 dark:bg-amber-900/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="font-medium text-amber-800 dark:text-amber-200">
                    객체 반환 오류: {objectErrors.length}개
                  </span>
                </div>
                <div className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  {objectErrors.slice(0, 2).map((error, index) => (
                    <div key={index} className="font-mono bg-amber-200/50 dark:bg-amber-800/50 px-2 py-1 rounded text-xs">
                      {error.fullKey}
                    </div>
                  ))}
                  {objectErrors.length > 2 && (
                    <div className="text-xs text-amber-600 dark:text-amber-400">
                      그 외 {objectErrors.length - 2}개 더...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 액션 버튼들 */}
          <div className="space-y-2">
            <button
              onClick={handleCopyPrompt}
              disabled={!prompt}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-lg font-medium transition-all duration-200"
            >
              <DocumentDuplicateIcon className="w-5 h-5" />
              Claude Code 프롬프트 복사
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/50 dark:hover:bg-rose-800/50 text-rose-700 dark:text-rose-300 rounded-lg font-medium transition-all duration-200"
            >
              {isExpanded ? (
                <>
                  <ChevronUpIcon className="w-4 h-4" />
                  상세 정보 숨기기
                </>
              ) : (
                <>
                  <ChevronDownIcon className="w-4 h-4" />
                  상세 정보 보기
                </>
              )}
            </button>
          </div>

          {/* 확장 가능한 상세 정보 */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-rose-200 dark:border-rose-800">
              <div className="max-h-64 overflow-y-auto space-y-3">
                {missingKeys.length > 0 && (
                  <div>
                    <h4 className="font-medium text-rose-800 dark:text-rose-200 mb-2">
                      누락된 번역키 목록:
                    </h4>
                    <div className="space-y-1">
                      {missingKeys.map((key, index) => (
                        <div
                          key={index}
                          className="text-sm font-mono bg-rose-200/50 dark:bg-rose-800/50 px-2 py-1 rounded text-rose-700 dark:text-rose-300"
                        >
                          {key}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {objectErrors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                      객체 반환 오류 목록:
                    </h4>
                    <div className="space-y-2">
                      {objectErrors.map((error, index) => (
                        <div
                          key={index}
                          className="bg-amber-100/50 dark:bg-amber-900/30 rounded p-2"
                        >
                          <div className="text-sm font-mono text-amber-700 dark:text-amber-300 mb-1">
                            {error.fullKey}
                          </div>
                          <div className="text-xs text-amber-600 dark:text-amber-400">
                            제안: {error.suggestedKeys?.[0] || '하위 키 지정 필요'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 복사 완료 토스트 */}
      <Toast
        type="success"
        message="Claude Code 프롬프트가 클립보드에 복사되었습니다!"
        isVisible={copiedToast}
        duration={3000}
        position="top-center"
        onClose={() => setCopiedToast(false)}
      />
    </>
  );
};

// 전역 UI 로깅 시스템 설정
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  let currentLogComponent = null;
  
  window.showTranslationErrorLog = (missingKeys, objectErrors) => {
    // 기존 로그 컴포넌트 제거
    if (currentLogComponent) {
      document.body.removeChild(currentLogComponent);
    }

    // 새 로그 컴포넌트 생성
    const logContainer = document.createElement('div');
    document.body.appendChild(logContainer);
    currentLogComponent = logContainer;

    // React 컴포넌트 렌더링 (실제 구현에서는 ReactDOM.render 또는 포털 사용)
    // 여기서는 간단한 HTML로 구현
    logContainer.innerHTML = `
      <div class="fixed bottom-4 right-4 z-[100] w-96 max-w-[calc(100vw-2rem)]">
        <div class="bg-rose-50/98 dark:bg-rose-950/95 backdrop-blur-xl border border-rose-300/70 dark:border-rose-700/70 rounded-xl p-4 shadow-lg">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <svg class="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path>
              </svg>
              <div>
                <h3 class="font-semibold text-rose-900 dark:text-rose-100">번역 오류 발견</h3>
                <p class="text-sm text-rose-700 dark:text-rose-300">${missingKeys.length + objectErrors.length}개의 오류가 감지되었습니다</p>
              </div>
            </div>
            <button onclick="this.closest('.fixed').remove()" class="p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors">
              <svg class="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <button onclick="window.copyTranslationPrompt?.()" class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2h2z"></path>
            </svg>
            Claude Code 프롬프트 복사
          </button>
        </div>
      </div>
    `;

    // 5초 후 자동 숨김
    setTimeout(() => {
      if (currentLogComponent && currentLogComponent.parentNode) {
        document.body.removeChild(currentLogComponent);
        currentLogComponent = null;
      }
    }, 10000);
  };
}

export default TranslationErrorLog;