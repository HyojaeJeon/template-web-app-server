/**
 * TextToSpeech.js - 텍스트 음성 변환 컴포넌트
 * Local App MVP - 웹 관리자 시스템
 * 
 * @description
 * - Web Speech API의 SpeechSynthesis를 사용한 TTS 기능
 * - Local어, 한국어, 영어 등 다국어 지원
 * - 음성 속도, 음높이, 볼륨 제어 기능
 * - Local 테마 색상 적용 및 다크 모드 지원
 * - WCAG 2.1 접근성 준수
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export const TextToSpeech = ({
  text = '',
  language = 'vi-VN', // Local어 기본
  rate = 1,
  pitch = 1,
  volume = 1,
  onStart = () => {},
  onEnd = () => {},
  onError = () => {},
  showControls = true,
  showText = true,
  autoPlay = false,
  className = '',
  disabled = false,
  ...props
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [currentText, setCurrentText] = useState(text);
  const [settings, setSettings] = useState({
    rate,
    pitch,
    volume,
    language
  });

  const synthRef = useRef(null);
  const utteranceRef = useRef(null);

  // 브라우저 지원 확인 및 초기화
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      synthRef.current = window.speechSynthesis;
      loadVoices();

      // 음성 목록 로드 이벤트 리스너
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // 음성 목록 로드
  const loadVoices = useCallback(() => {
    if (!synthRef.current) return;

    const availableVoices = synthRef.current.getVoices();
    setVoices(availableVoices);

    // 언어에 맞는 기본 음성 선택
    const preferredVoice = availableVoices.find(voice => 
      voice.lang.startsWith(settings.language.split('-')[0])
    ) || availableVoices.find(voice => voice.default) || availableVoices[0];

    setSelectedVoice(preferredVoice);
  }, [settings.language]);

  // 텍스트 props 변경 감지
  useEffect(() => {
    setCurrentText(text);
  }, [text]);

  // 자동 재생
  useEffect(() => {
    if (autoPlay && currentText && isSupported && selectedVoice) {
      handleSpeak();
    }
  }, [autoPlay, currentText, isSupported, selectedVoice]);

  // 음성 재생
  const handleSpeak = useCallback(() => {
    if (!synthRef.current || !currentText.trim() || disabled) return;

    // 기존 음성 중단
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(currentText);
    utteranceRef.current = utterance;

    // 음성 설정
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    utterance.lang = settings.language;

    // 이벤트 핸들러
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      onStart();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      onEnd();
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      setIsPaused(false);
      onError(event.error);
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    try {
      synthRef.current.speak(utterance);
    } catch (error) {
      onError(error.message);
    }
  }, [currentText, selectedVoice, settings, disabled, onStart, onEnd, onError]);

  // 음성 일시정지
  const handlePause = () => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.pause();
    }
  };

  // 음성 재개
  const handleResume = () => {
    if (synthRef.current && isPaused) {
      synthRef.current.resume();
    }
  };

  // 음성 중단
  const handleStop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  // 설정 업데이트
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // 음성 변경
  const handleVoiceChange = (voiceIndex) => {
    setSelectedVoice(voices[voiceIndex]);
  };

  // 키보드 이벤트
  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isSpeaking) {
          if (isPaused) {
            handleResume();
          } else {
            handlePause();
          }
        } else {
          handleSpeak();
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleStop();
        break;
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
            이 브라우저는 텍스트 음성 변환을 지원하지 않습니다.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {/* 텍스트 입력/표시 영역 */}
      {showText && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            읽을 텍스트:
          </label>
          <textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            disabled={disabled}
            className={`
              w-full min-h-24 px-3 py-2 border border-gray-300 dark:border-gray-600
              rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              placeholder:text-gray-400 dark:placeholder:text-gray-500
            `}
            placeholder="읽을 텍스트를 입력하세요..."
            rows={3}
          />
        </div>
      )}

      {/* 컨트롤 패널 */}
      {showControls && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {/* 재생 컨트롤 */}
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={handleSpeak}
              onKeyDown={handleKeyDown}
              disabled={disabled || !currentText.trim() || isSpeaking}
              className={`
                flex items-center justify-center w-12 h-12 rounded-full
                bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300
                text-white transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                dark:focus:ring-offset-gray-800
                disabled:cursor-not-allowed
              `}
              aria-label="텍스트 읽기 시작"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </button>

            {isSpeaking && (
              <>
                <button
                  onClick={isPaused ? handleResume : handlePause}
                  disabled={disabled}
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    bg-secondary-500 hover:bg-secondary-600 disabled:bg-gray-300
                    text-white transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2
                    dark:focus:ring-offset-gray-800
                  `}
                  aria-label={isPaused ? '재개' : '일시정지'}
                >
                  {isPaused ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={handleStop}
                  disabled={disabled}
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    bg-red-500 hover:bg-red-600 disabled:bg-gray-300
                    text-white transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                    dark:focus:ring-offset-gray-800
                  `}
                  aria-label="중지"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* 상태 표시 */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <div className={`w-2 h-2 rounded-full ${
                isSpeaking 
                  ? (isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse')
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}></div>
              <span>
                {isSpeaking 
                  ? (isPaused ? '일시정지됨' : '재생 중') 
                  : '대기 중'
                }
              </span>
            </div>
          </div>

          {/* 음성 선택 */}
          {voices.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                음성 선택:
              </label>
              <select
                value={voices.indexOf(selectedVoice)}
                onChange={(e) => handleVoiceChange(parseInt(e.target.value))}
                disabled={disabled || isSpeaking}
                className={`
                  w-full px-3 py-2 border border-gray-300 dark:border-gray-600
                  rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  text-sm focus:outline-none focus:ring-2 focus:ring-primary-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {voices.map((voice, index) => (
                  <option key={index} value={index}>
                    {voice.name} ({voice.lang}) {voice.default ? '(기본)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 음성 설정 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 속도 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                속도: {settings.rate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={settings.rate}
                onChange={(e) => updateSetting('rate', parseFloat(e.target.value))}
                disabled={disabled || isSpeaking}
                className="w-full accent-primary-500"
              />
            </div>

            {/* 음높이 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                음높이: {settings.pitch.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.pitch}
                onChange={(e) => updateSetting('pitch', parseFloat(e.target.value))}
                disabled={disabled || isSpeaking}
                className="w-full accent-primary-500"
              />
            </div>

            {/* 볼륨 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                볼륨: {Math.round(settings.volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.volume}
                onChange={(e) => updateSetting('volume', parseFloat(e.target.value))}
                disabled={disabled || isSpeaking}
                className="w-full accent-primary-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for TTS functionality
export const useTextToSpeech = (options = {}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  const speak = useCallback((text, settings = {}) => {
    if (!isSupported || !text.trim()) return;

    const synth = window.speechSynthesis;
    synth.cancel(); // 기존 음성 중단

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 설정 적용
    Object.assign(utterance, {
      rate: 1,
      pitch: 1,
      volume: 1,
      lang: 'vi-VN',
      ...settings
    });

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onpause = () => setIsPaused(true);
    utterance.onresume = () => setIsPaused(false);

    synth.speak(utterance);
  }, [isSupported]);

  const pause = () => window.speechSynthesis.pause();
  const resume = () => window.speechSynthesis.resume();
  const cancel = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  return {
    speak,
    pause,
    resume,
    cancel,
    isSpeaking,
    isPaused,
    isSupported
  };
};

export default TextToSpeech;