'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon,
  ClockIcon,
  BellIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function CountdownTimer({
  initialTime = 300, // 초 단위 (기본 5분)
  autoStart = false, // 자동 시작
  showControls = true, // 컨트롤 버튼 표시
  showProgress = true, // 진행률 표시
  variant = 'circle', // circle, linear, digital, minimal
  size = 'md', // sm, md, lg, xl
  onComplete, // 완료 콜백
  onTick, // 매 초 콜백
  onStart, // 시작 콜백
  onPause, // 일시정지 콜백
  onStop, // 중지 콜백
  warningTime = 30, // 경고 시간 (초)
  dangerTime = 10, // 위험 시간 (초)
  allowReset = true, // 리셋 허용
  allowExtend = false, // 시간 연장 허용
  extendAmount = 60, // 연장 시간 (초)
  playSound = false, // 완료 시 소리
  showNotification = false, // 완료 시 알림
  className = '',
  format = 'mm:ss', // 시간 형식 mm:ss, hh:mm:ss, ss
  label, // 타이머 라벨
  description // 타이머 설명
}) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // 크기별 스타일
  const sizeStyles = {
    sm: {
      circle: 'w-24 h-24',
      text: 'text-sm',
      controls: 'gap-2 text-sm',
      button: 'p-1'
    },
    md: {
      circle: 'w-32 h-32',
      text: 'text-lg',
      controls: 'gap-3 text-base',
      button: 'p-2'
    },
    lg: {
      circle: 'w-48 h-48',
      text: 'text-2xl',
      controls: 'gap-4 text-lg',
      button: 'p-3'
    },
    xl: {
      circle: 'w-64 h-64',
      text: 'text-4xl',
      controls: 'gap-6 text-xl',
      button: 'p-4'
    }
  };

  const currentSize = sizeStyles[size];

  // 시간 포맷팅
  const formatTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    switch (format) {
      case 'hh:mm:ss':
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      case 'mm:ss':
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      case 'ss':
        return `${seconds}초`;
      default:
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }, [format]);

  // 진행률 계산
  const progress = ((initialTime - timeLeft) / initialTime) * 100;
  const circumference = 2 * Math.PI * 45; // 반지름 45 기준

  // 색상 상태 결정
  const getColorClass = () => {
    if (isCompleted) return 'text-gray-500 dark:text-gray-400';
    if (timeLeft <= dangerTime) return 'text-red-600 dark:text-red-400';
    if (timeLeft <= warningTime) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const getProgressColor = () => {
    if (isCompleted) return '#6b7280';
    if (timeLeft <= dangerTime) return '#dc2626';
    if (timeLeft <= warningTime) return '#d97706';
    return '#059669';
  };

  // 타이머 시작
  const startTimer = useCallback(() => {
    if (timeLeft > 0 && !isCompleted) {
      setIsRunning(true);
      if (onStart) onStart();
    }
  }, [timeLeft, isCompleted, onStart]);

  // 타이머 일시정지
  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    if (onPause) onPause();
  }, [onPause]);

  // 타이머 중지 및 리셋
  const stopTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(initialTime);
    setIsCompleted(false);
    if (onStop) onStop();
  }, [initialTime, onStop]);

  // 시간 연장
  const extendTimer = useCallback(() => {
    if (allowExtend) {
      setTimeLeft(prev => prev + extendAmount);
      setIsCompleted(false);
    }
  }, [allowExtend, extendAmount]);

  // 타이머 메인 로직
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          if (onTick) onTick(newTime);
          
          if (newTime === 0) {
            setIsRunning(false);
            setIsCompleted(true);
            
            // 완료 콜백
            if (onComplete) onComplete();
            
            // 소리 재생
            if (playSound && audioRef.current) {
              audioRef.current.play().catch(console.error);
            }
            
            // 브라우저 알림
            if (showNotification && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('타이머 완료!', {
                body: `${label || '타이머'}가 완료되었습니다.`,
                icon: '/favicon.ico'
              });
            }
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft, onTick, onComplete, playSound, showNotification, label]);

  // 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 원형 타이머 렌더링
  const renderCircleTimer = () => (
    <div className="relative flex flex-col items-center">
      <div className={`relative ${currentSize.circle}`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* 배경 원 */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-200 dark:text-gray-700"
          />
          
          {/* 진행률 원 */}
          {showProgress && (
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={getProgressColor()}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (progress / 100) * circumference}
              className="transition-all duration-1000"
            />
          )}
        </svg>
        
        {/* 중앙 시간 표시 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`font-mono font-bold ${currentSize.text} ${getColorClass()}`}>
            {formatTime(timeLeft)}
          </div>
          {label && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {label}
            </div>
          )}
        </div>
        
        {/* 완료 오버레이 */}
        {isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
            <BellIcon className="w-8 h-8 text-gray-600 dark:text-gray-400 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );

  // 선형 타이머 렌더링
  const renderLinearTimer = () => (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <div className={`font-mono font-bold ${currentSize.text} ${getColorClass()}`}>
          {formatTime(timeLeft)}
        </div>
        {label && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {label}
          </div>
        )}
      </div>
      
      {showProgress && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-full transition-all duration-1000 rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: getProgressColor()
            }}
          />
        </div>
      )}
    </div>
  );

  // 디지털 타이머 렌더링
  const renderDigitalTimer = () => (
    <div className="bg-black text-green-400 p-6 rounded-lg font-mono text-center border-2 border-gray-800">
      <div className={`${currentSize.text} font-bold tabular-nums`}>
        {formatTime(timeLeft)}
      </div>
      {label && (
        <div className="text-xs text-green-600 mt-2">
          {label}
        </div>
      )}
      {showProgress && (
        <div className="w-full bg-gray-800 rounded h-1 mt-3 overflow-hidden">
          <div
            className="h-full bg-green-400 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );

  // 미니멀 타이머 렌더링
  const renderMinimalTimer = () => (
    <div className="text-center">
      <div className={`font-mono font-bold ${currentSize.text} ${getColorClass()}`}>
        {formatTime(timeLeft)}
      </div>
      {label && (
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {label}
        </div>
      )}
    </div>
  );

  // 타이머 렌더링
  const renderTimer = () => {
    switch (variant) {
      case 'circle':
        return renderCircleTimer();
      case 'linear':
        return renderLinearTimer();
      case 'digital':
        return renderDigitalTimer();
      case 'minimal':
        return renderMinimalTimer();
      default:
        return renderCircleTimer();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {renderTimer()}
      
      {/* 컨트롤 버튼들 */}
      {showControls && (
        <div className={`flex items-center justify-center mt-4 ${currentSize.controls}`}>
          {!isRunning && !isCompleted && (
            <button
              onClick={startTimer}
              className={`${currentSize.button} bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors`}
              aria-label="시작"
            >
              <PlayIcon className="w-5 h-5" />
            </button>
          )}
          
          {isRunning && (
            <button
              onClick={pauseTimer}
              className={`${currentSize.button} bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors`}
              aria-label="일시정지"
            >
              <PauseIcon className="w-5 h-5" />
            </button>
          )}
          
          {allowReset && (timeLeft !== initialTime || isCompleted) && (
            <button
              onClick={stopTimer}
              className={`${currentSize.button} bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors`}
              aria-label="리셋"
            >
              <StopIcon className="w-5 h-5" />
            </button>
          )}
          
          {allowExtend && (
            <button
              onClick={extendTimer}
              className={`${currentSize.button} bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors`}
              aria-label={`${extendAmount}초 연장`}
              title={`${extendAmount}초 연장`}
            >
              +{extendAmount}
            </button>
          )}
        </div>
      )}

      {/* 설명 텍스트 */}
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
          {description}
        </p>
      )}

      {/* 오디오 엘리먼트 (소리 재생용) */}
      {playSound && (
        <audio ref={audioRef} preload="auto">
          <source src="/sounds/timer-complete.mp3" type="audio/mpeg" />
          <source src="/sounds/timer-complete.wav" type="audio/wav" />
        </audio>
      )}
    </div>
  );
}

// 프리셋 타이머들
export function PomodoroTimer({ onComplete, ...props }) {
  return (
    <CountdownTimer
      initialTime={1500} // 25분
      label="뽀모도로"
      description="집중 시간"
      variant="circle"
      size="lg"
      warningTime={300}
      dangerTime={60}
      playSound={true}
      showNotification={true}
      onComplete={onComplete}
      {...props}
    />
  );
}

export function BreakTimer({ onComplete, ...props }) {
  return (
    <CountdownTimer
      initialTime={300} // 5분
      label="휴식"
      description="잠시 휴식하세요"
      variant="circle"
      size="md"
      warningTime={60}
      dangerTime={10}
      playSound={true}
      showNotification={true}
      onComplete={onComplete}
      {...props}
    />
  );
}

export function CookingTimer({ minutes = 10, label = "요리", onComplete, ...props }) {
  return (
    <CountdownTimer
      initialTime={minutes * 60}
      label={label}
      description="요리 시간"
      variant="digital"
      size="lg"
      warningTime={120}
      dangerTime={30}
      allowExtend={true}
      extendAmount={60}
      playSound={true}
      showNotification={true}
      onComplete={onComplete}
      {...props}
    />
  );
}

export function WorkoutTimer({ seconds = 30, label = "운동", onComplete, ...props }) {
  return (
    <CountdownTimer
      initialTime={seconds}
      label={label}
      description="운동 시간"
      variant="linear"
      size="lg"
      format="ss"
      warningTime={10}
      dangerTime={3}
      playSound={true}
      onComplete={onComplete}
      {...props}
    />
  );
}