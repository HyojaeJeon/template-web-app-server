/**
 * SpeechToText.js - 음성 인식 입력 컴포넌트
 * Local App MVP - 웹 관리자 시스템
 * 
 * @description
 * - Web Speech API를 사용한 음성 인식 기능
 * - Local어, 한국어, 영어 지원
 * - 실시간 음성 인식 및 텍스트 변환
 * - Local 테마 색상 적용 및 다크 모드 지원
 * - WCAG 2.1 접근성 준수
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export const SpeechToText = ({
  onResult = () => {},
  onError = () => {},
  language = 'vi-VN', // Local어 기본
  continuous = true,
  interimResults = true,
  maxAlternatives = 1,
  className = '',
  placeholder = '마이크를 클릭하여 음성 인식을 시작하세요',
  showTranscript = true,
  showLanguageSelector = true,
  disabled = false,
  ...props
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  // 지원 언어 목록
  const languages = [
    { code: 'vi-VN', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' }
  ];

  // 브라우저 지원 확인
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      setupRecognition();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 음성 인식 설정
  const setupRecognition = useCallback(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;
    
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;
    recognition.lang = currentLanguage;

    // 결과 처리
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
        onResult(transcript + finalTranscript, 'final');
      }

      if (interimResults) {
        setInterimTranscript(interimTranscript);
        onResult(interimTranscript, 'interim');
      }
    };

    // 에러 처리
    recognition.onerror = (event) => {
      const errorMessage = getErrorMessage(event.error);
      setError(errorMessage);
      setIsListening(false);
      onError(event.error, errorMessage);
    };

    // 인식 시작
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    // 인식 종료
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    // 소리 감지
    recognition.onsoundstart = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    // 소리 종료 (자동 종료 방지)
    recognition.onsoundend = () => {
      if (continuous) {
        timeoutRef.current = setTimeout(() => {
          if (isListening) {
            recognition.stop();
          }
        }, 3000);
      }
    };
  }, [continuous, interimResults, maxAlternatives, currentLanguage, onResult, onError]);

  // 언어 변경 시 재설정
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = currentLanguage;
    }
  }, [currentLanguage]);

  // 에러 메시지 매핑
  const getErrorMessage = (error) => {
    const errorMessages = {
      'no-speech': '음성이 감지되지 않았습니다.',
      'audio-capture': '오디오 캡처에 실패했습니다.',
      'not-allowed': '마이크 권한이 거부되었습니다.',
      'network': '네트워크 오류가 발생했습니다.',
      'service-not-allowed': '음성 인식 서비스를 사용할 수 없습니다.',
      'bad-grammar': '인식 문법에 오류가 있습니다.',
      'language-not-supported': '지원되지 않는 언어입니다.'
    };
    return errorMessages[error] || '알 수 없는 오류가 발생했습니다.';
  };

  // 음성 인식 시작/중지
  const toggleListening = () => {
    if (!recognitionRef.current || disabled) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setError(null);
      setInterimTranscript('');
      try {
        recognitionRef.current.start();
      } catch (err) {
        setError('음성 인식을 시작할 수 없습니다.');
        onError('start-error', '음성 인식을 시작할 수 없습니다.');
      }
    }
  };

  // 텍스트 초기화
  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  // 언어 변경
  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    if (isListening) {
      recognitionRef.current?.stop();
    }
  };

  // 키보드 이벤트
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleListening();
    } else if (e.key === 'Escape' && isListening) {
      recognitionRef.current?.stop();
    }
  };

  if (!isSupported) {
    return (
      <div className={`p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-yellow-800 dark:text-yellow-200">
            이 브라우저는 음성 인식을 지원하지 않습니다.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {/* 컨트롤 패널 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        {/* 언어 선택 */}
        {showLanguageSelector && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              언어:
            </label>
            <select
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isListening}
              className={`
                px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md
                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                text-sm focus:outline-none focus:ring-2 focus:ring-primary-500
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 컨트롤 버튼들 */}
        <div className="flex items-center space-x-2">
          {transcript && (
            <button
              onClick={clearTranscript}
              className={`
                px-3 py-1 text-sm text-gray-600 hover:text-gray-900
                dark:text-gray-400 dark:hover:text-gray-100
                hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md
                focus:outline-none focus:ring-2 focus:ring-gray-500
              `}
            >
              초기화
            </button>
          )}

          {/* 마이크 버튼 */}
          <button
            onClick={toggleListening}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={`
              relative flex items-center justify-center w-12 h-12 rounded-full
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 animate-pulse' 
                : 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500'
              }
              disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none
            `}
            aria-label={isListening ? '음성 인식 중지' : '음성 인식 시작'}
          >
            {isListening ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}

      {/* 음성 인식 결과 */}
      {showTranscript && (
        <div className="space-y-2">
          {/* 최종 텍스트 */}
          <div className={`
            min-h-24 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            ${isListening ? 'border-primary-400 dark:border-primary-500' : ''}
          `}>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              인식된 텍스트:
            </div>
            {transcript || interimTranscript ? (
              <div className="whitespace-pre-wrap">
                <span className="text-gray-900 dark:text-gray-100">{transcript}</span>
                <span className="text-gray-400 dark:text-gray-500 italic">{interimTranscript}</span>
                {isListening && (
                  <span className="inline-block w-2 h-4 bg-primary-500 animate-pulse ml-1"></span>
                )}
              </div>
            ) : (
              <div className="text-gray-400 dark:text-gray-500 italic">
                {isListening ? '듣는 중...' : placeholder}
              </div>
            )}
          </div>

          {/* 상태 표시 */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'
              }`}></div>
              <span>
                {isListening ? '음성 인식 활성' : '음성 인식 비활성'}
              </span>
            </div>
            <div>
              문자 수: {transcript.length + interimTranscript.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for speech recognition
export const useSpeechToText = (options = {}) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);

  const handleResult = (text, type) => {
    if (type === 'final') {
      setTranscript(prev => prev + text);
    }
  };

  const handleError = (errorCode, errorMessage) => {
    setError(errorMessage);
  };

  const clearTranscript = () => {
    setTranscript('');
    setError(null);
  };

  return {
    transcript,
    isListening,
    error,
    handleResult,
    handleError,
    clearTranscript
  };
};

export default SpeechToText;