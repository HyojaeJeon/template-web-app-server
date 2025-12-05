/**
 * 개발 도구 컴포넌트 (점주용)
 * 디버깅, 성능 모니터링, WCAG 2.1 준수, Local 테마 적용
 */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

const DevTools = ({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  hotkey = 'ctrl+shift+d',
  showPerformance = true,
  showConsole = true,
  showNetwork = true,
  showStorage = true,
  showAccessibility = true,
  className = '',
  onToggle,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('performance');
  const [performanceData, setPerformanceData] = useState({});
  const [consoleMessages, setConsoleMessages] = useState([]);
  const [networkRequests, setNetworkRequests] = useState([]);
  const [storageData, setStorageData] = useState({});
  const [accessibilityIssues, setAccessibilityIssues] = useState([]);
  
  const performanceObserver = useRef(null);
  const intervalRef = useRef(null);
  const originalConsole = useRef({});

  // 개발 모드가 아니면 렌더링하지 않음
  if (!enabled) return null;

  // 핫키 처리
  useEffect(() => {
    const handleKeyDown = (event) => {
      const keys = hotkey.toLowerCase().split('+');
      const pressedKeys = [];
      
      if (event.ctrlKey) pressedKeys.push('ctrl');
      if (event.shiftKey) pressedKeys.push('shift');
      if (event.altKey) pressedKeys.push('alt');
      if (event.metaKey) pressedKeys.push('meta');
      pressedKeys.push(event.key.toLowerCase());

      if (keys.every(key => pressedKeys.includes(key))) {
        event.preventDefault();
        toggleDevTools();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hotkey]);

  // 개발 도구 토글
  const toggleDevTools = useCallback(() => {
    setIsOpen(prev => {
      const newState = !prev;
      if (onToggle) {
        onToggle(newState);
      }
      return newState;
    });
  }, [onToggle]);

  // 성능 모니터링
  useEffect(() => {
    if (!isOpen || !showPerformance) return;

    const updatePerformanceData = () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const memory = performance.memory;
      
      setPerformanceData({
        // 페이지 로드 성능
        pageLoad: {
          domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.navigationStart,
          loadComplete: navigation?.loadEventEnd - navigation?.navigationStart,
          firstContentfulPaint: 0, // 실제로는 PerformanceObserver로 측정
          largestContentfulPaint: 0,
        },
        // 메모리 사용량 (Chrome에서만 지원)
        memory: memory ? {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        } : null,
        // 현재 페이지 성능
        currentPage: {
          fps: 0, // 실제로는 requestAnimationFrame으로 계산
          timestamp: Date.now()
        }
      });
    };

    // Performance Observer 설정
    if ('PerformanceObserver' in window) {
      performanceObserver.current = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'paint') {
            setPerformanceData(prev => ({
              ...prev,
              pageLoad: {
                ...prev.pageLoad,
                [entry.name]: entry.startTime
              }
            }));
          }
        });
      });

      performanceObserver.current.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
    }

    updatePerformanceData();
    intervalRef.current = setInterval(updatePerformanceData, 1000);

    return () => {
      if (performanceObserver.current) {
        performanceObserver.current.disconnect();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, showPerformance]);

  // 콘솔 메시지 가로채기
  useEffect(() => {
    if (!isOpen || !showConsole) return;

    // 원본 콘솔 메서드 저장
    originalConsole.current = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };

    const addMessage = (type, args) => {
      setConsoleMessages(prev => [...prev.slice(-99), {
        id: Date.now() + Math.random(),
        type,
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '),
        timestamp: new Date().toLocaleTimeString()
      }]);
    };

    // 콘솔 메서드 오버라이드
    console.log = (...args) => {
      originalConsole.current.log(...args);
      addMessage('log', args);
    };

    console.warn = (...args) => {
      originalConsole.current.warn(...args);
      addMessage('warn', args);
    };

    console.error = (...args) => {
      originalConsole.current.error(...args);
      addMessage('error', args);
    };

    console.info = (...args) => {
      originalConsole.current.info(...args);
      addMessage('info', args);
    };

    return () => {
      // 원본 콘솔 복원
      Object.assign(console, originalConsole.current);
    };
  }, [isOpen, showConsole]);

  // 네트워크 모니터링 (제한적)
  useEffect(() => {
    if (!isOpen || !showNetwork) return;

    // Fetch API 모니터링
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const start = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - start;
        
        setNetworkRequests(prev => [...prev.slice(-49), {
          id: Date.now() + Math.random(),
          method: args[1]?.method || 'GET',
          url,
          status: response.status,
          statusText: response.statusText,
          duration,
          timestamp: new Date().toLocaleTimeString(),
          type: 'fetch'
        }]);
        
        return response;
      } catch (error) {
        const duration = Date.now() - start;
        
        setNetworkRequests(prev => [...prev.slice(-49), {
          id: Date.now() + Math.random(),
          method: args[1]?.method || 'GET',
          url,
          status: 0,
          statusText: 'Failed',
          duration,
          timestamp: new Date().toLocaleTimeString(),
          type: 'fetch',
          error: error.message
        }]);
        
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [isOpen, showNetwork]);

  // 로컬 스토리지 모니터링
  useEffect(() => {
    if (!isOpen || !showStorage) return;

    const updateStorageData = () => {
      setStorageData({
        localStorage: Object.keys(localStorage).reduce((acc, key) => {
          acc[key] = localStorage.getItem(key);
          return acc;
        }, {}),
        sessionStorage: Object.keys(sessionStorage).reduce((acc, key) => {
          acc[key] = sessionStorage.getItem(key);
          return acc;
        }, {}),
        cookies: document.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          if (key) acc[key] = value;
          return acc;
        }, {})
      });
    };

    updateStorageData();
    const interval = setInterval(updateStorageData, 2000);

    return () => clearInterval(interval);
  }, [isOpen, showStorage]);

  // 접근성 검사 (기본적인 검사만)
  useEffect(() => {
    if (!isOpen || !showAccessibility) return;

    const checkAccessibility = () => {
      const issues = [];
      
      // 이미지 alt 속성 검사
      document.querySelectorAll('img').forEach((img, index) => {
        if (!img.alt) {
          issues.push({
            id: `img-alt-${index}`,
            type: 'error',
            rule: 'Images must have alt text',
            element: img.tagName.toLowerCase(),
            message: 'Image missing alt attribute'
          });
        }
      });

      // 폼 레이블 검사
      document.querySelectorAll('input, textarea, select').forEach((input, index) => {
        const hasLabel = input.id && document.querySelector(`label[for="${input.id}"]`);
        const hasAriaLabel = input.getAttribute('aria-label');
        
        if (!hasLabel && !hasAriaLabel) {
          issues.push({
            id: `form-label-${index}`,
            type: 'error',
            rule: 'Form elements must have labels',
            element: input.tagName.toLowerCase(),
            message: 'Form element missing label or aria-label'
          });
        }
      });

      // 제목 구조 검사
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let prevLevel = 0;
      
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName[1]);
        if (index === 0 && level !== 1) {
          issues.push({
            id: `heading-start-${index}`,
            type: 'warning',
            rule: 'Page should start with h1',
            element: heading.tagName.toLowerCase(),
            message: 'First heading should be h1'
          });
        } else if (level > prevLevel + 1) {
          issues.push({
            id: `heading-skip-${index}`,
            type: 'warning',
            rule: 'Heading levels should not be skipped',
            element: heading.tagName.toLowerCase(),
            message: `Heading level ${level} follows ${prevLevel}`
          });
        }
        prevLevel = level;
      });

      setAccessibilityIssues(issues);
    };

    checkAccessibility();
    const interval = setInterval(checkAccessibility, 5000);

    return () => clearInterval(interval);
  }, [isOpen, showAccessibility]);

  // 위치별 스타일
  const getPositionStyles = () => {
    const positions = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4',
    };
    return positions[position] || positions['bottom-right'];
  };

  // 탭 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'performance':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">페이지 로드</h3>
              <div className="text-xs space-y-1">
                <div>DOM Ready: {performanceData.pageLoad?.domContentLoaded}ms</div>
                <div>Load Complete: {performanceData.pageLoad?.loadComplete}ms</div>
                <div>FCP: {performanceData.pageLoad?.firstContentfulPaint}ms</div>
              </div>
            </div>
            
            {performanceData.memory && (
              <div>
                <h3 className="text-sm font-semibold mb-2">메모리 사용량</h3>
                <div className="text-xs space-y-1">
                  <div>Used: {performanceData.memory.used}MB</div>
                  <div>Total: {performanceData.memory.total}MB</div>
                  <div>Limit: {performanceData.memory.limit}MB</div>
                </div>
              </div>
            )}
          </div>
        );

      case 'console':
        return (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {consoleMessages.slice(-50).map((msg) => (
              <div key={msg.id} className={`text-xs p-2 rounded ${
                msg.type === 'error' ? 'bg-red-100 text-red-800' :
                msg.type === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                msg.type === 'info' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                <div className="flex justify-between items-start">
                  <span className="font-mono">{msg.message}</span>
                  <span className="text-xs opacity-75 ml-2">{msg.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'network':
        return (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {networkRequests.slice(-20).map((req) => (
              <div key={req.id} className="text-xs p-2 bg-gray-100 rounded">
                <div className="flex justify-between items-center">
                  <span className={`font-semibold ${
                    req.status >= 400 ? 'text-red-600' :
                    req.status >= 300 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {req.method} {req.status}
                  </span>
                  <span>{req.duration}ms</span>
                </div>
                <div className="truncate opacity-75">{req.url}</div>
                <div className="opacity-50">{req.timestamp}</div>
              </div>
            ))}
          </div>
        );

      case 'storage':
        return (
          <div className="space-y-4 max-h-64 overflow-y-auto">
            <div>
              <h3 className="text-sm font-semibold mb-2">Local Storage</h3>
              {Object.entries(storageData.localStorage || {}).map(([key, value]) => (
                <div key={key} className="text-xs p-2 bg-gray-100 rounded mb-1">
                  <div className="font-semibold">{key}</div>
                  <div className="truncate opacity-75">{value}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'accessibility':
        return (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {accessibilityIssues.map((issue) => (
              <div key={issue.id} className={`text-xs p-2 rounded ${
                issue.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                <div className="font-semibold">{issue.rule}</div>
                <div className="opacity-75">{issue.message}</div>
                <div className="opacity-50">&lt;{issue.element}&gt;</div>
              </div>
            ))}
            {accessibilityIssues.length === 0 && (
              <div className="text-xs text-green-600 p-2">접근성 이슈가 발견되지 않았습니다</div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`fixed ${getPositionStyles()} z-50 ${className}`}
      {...props}
    >
      {!isOpen ? (
        <button
          onClick={toggleDevTools}
          className="w-12 h-12 bg-vietnam-mint text-white rounded-full shadow-lg hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-2 transition-colors"
          title={`개발 도구 열기 (${hotkey})`}
          aria-label="개발 도구 열기"
        >
          <svg className="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-96 max-h-96">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              개발 도구
            </h2>
            <button
              onClick={toggleDevTools}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
              aria-label="개발 도구 닫기"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'performance', label: '성능', show: showPerformance },
              { id: 'console', label: '콘솔', show: showConsole },
              { id: 'network', label: '네트워크', show: showNetwork },
              { id: 'storage', label: '저장소', show: showStorage },
              { id: 'accessibility', label: '접근성', show: showAccessibility },
            ].filter(tab => tab.show).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-vietnam-mint text-vietnam-mint'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 탭 컨텐츠 */}
          <div className="p-4">
            {renderTabContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DevTools;