/**
 * useLocalStorage.js - 로컬스토리지 동기화 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 로컬스토리지와 React 상태 동기화
 * - JSON 직렬화/역직렬화 자동 처리
 * - SSR 환경 안전성 보장
 * - 에러 처리 및 폴백 지원
 * - 스토리지 이벤트 감지 (탭간 동기화)
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// 기본 옵션
const DEFAULT_OPTIONS = {
  serialize: JSON.stringify,
  deserialize: JSON.parse,
  syncAcrossTabs: true,
  removeOnError: false
};

export const useLocalStorage = (key, initialValue, options = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { serialize, deserialize, syncAcrossTabs, removeOnError } = opts;
  
  const [storedValue, setStoredValue] = useState(() => {
    // SSR 환경에서는 초기값 반환
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        // 키가 존재하지 않으면 초기값을 저장하고 반환
        if (initialValue !== undefined) {
          window.localStorage.setItem(key, serialize(initialValue));
        }
        return initialValue;
      }
      return deserialize(item);
    } catch (error) {
      console.warn(`로컬스토리지에서 ${key} 읽기 실패:`, error);
      
      if (removeOnError) {
        try {
          window.localStorage.removeItem(key);
        } catch (removeError) {
          console.warn(`로컬스토리지에서 ${key} 제거 실패:`, removeError);
        }
      }
      
      return initialValue;
    }
  });

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const isFirstRender = useRef(true);

  // 값 설정 함수
  const setValue = useCallback((value) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 함수형 업데이트 지원
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        if (valueToStore === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, serialize(valueToStore));
        }
      }
    } catch (error) {
      console.error(`로컬스토리지에 ${key} 저장 실패:`, error);
      setError(error);
      
      if (removeOnError) {
        try {
          window.localStorage.removeItem(key);
        } catch (removeError) {
          console.warn(`로컬스토리지에서 ${key} 제거 실패:`, removeError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [key, serialize, storedValue, removeOnError]);

  // 값 제거 함수
  const removeValue = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);
      
      setStoredValue(undefined);
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`로컬스토리지에서 ${key} 제거 실패:`, error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  // 탭간 동기화를 위한 storage 이벤트 리스너
  useEffect(() => {
    if (!syncAcrossTabs || typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e) => {
      if (e.key === key && e.storageArea === localStorage) {
        try {
          const newValue = e.newValue === null ? undefined : deserialize(e.newValue);
          setStoredValue(newValue);
          setError(null);
        } catch (error) {
          console.warn(`스토리지 동기화 중 ${key} 파싱 실패:`, error);
          setError(error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, deserialize, syncAcrossTabs]);

  // 초기 로딩 완료 추적
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setIsLoading(false);
    }
  }, []);

  return [storedValue, setValue, removeValue, { error, isLoading }];
};

// 객체 전용 로컬스토리지 훅
export const useLocalStorageObject = (key, initialValue = {}, options = {}) => {
  return useLocalStorage(key, initialValue, {
    serialize: (obj) => JSON.stringify(obj),
    deserialize: (str) => JSON.parse(str),
    ...options
  });
};

// 배열 전용 로컬스토리지 훅
export const useLocalStorageArray = (key, initialValue = [], options = {}) => {
  const [array, setArray, removeArray, meta] = useLocalStorage(key, initialValue, options);

  // 배열에 아이템 추가
  const addItem = useCallback((item) => {
    setArray(prev => [...(prev || []), item]);
  }, [setArray]);

  // 배열에서 아이템 제거 (인덱스 기준)
  const removeItem = useCallback((index) => {
    setArray(prev => (prev || []).filter((_, i) => i !== index));
  }, [setArray]);

  // 배열에서 아이템 제거 (값 기준)
  const removeItemByValue = useCallback((value) => {
    setArray(prev => (prev || []).filter(item => item !== value));
  }, [setArray]);

  // 배열 아이템 업데이트
  const updateItem = useCallback((index, newItem) => {
    setArray(prev => {
      const newArray = [...(prev || [])];
      newArray[index] = newItem;
      return newArray;
    });
  }, [setArray]);

  // 배열 클리어
  const clearArray = useCallback(() => {
    setArray([]);
  }, [setArray]);

  return {
    array: array || [],
    setArray,
    removeArray,
    addItem,
    removeItem,
    removeItemByValue,
    updateItem,
    clearArray,
    length: (array || []).length,
    isEmpty: (array || []).length === 0,
    ...meta
  };
};

// 설정값 전용 로컬스토리지 훅
export const useLocalStorageSettings = (key, defaultSettings = {}) => {
  const [settings, setSettings, removeSettings, meta] = useLocalStorageObject(key, defaultSettings);

  // 개별 설정 업데이트
  const updateSetting = useCallback((settingKey, value) => {
    setSettings(prev => ({
      ...prev,
      [settingKey]: value
    }));
  }, [setSettings]);

  // 여러 설정 동시 업데이트
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, [setSettings]);

  // 설정값 조회
  const getSetting = useCallback((settingKey, fallback = null) => {
    return settings?.[settingKey] ?? defaultSettings[settingKey] ?? fallback;
  }, [settings, defaultSettings]);

  // 설정 초기화
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, [setSettings, defaultSettings]);

  return {
    settings: settings || defaultSettings,
    setSettings,
    removeSettings,
    updateSetting,
    updateSettings,
    getSetting,
    resetSettings,
    ...meta
  };
};

export default useLocalStorage;