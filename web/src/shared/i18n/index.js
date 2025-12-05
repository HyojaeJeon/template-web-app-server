/**
 * i18n/index.js - 다국어 지원 시스템
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - Next.js 14 App Router 최적화
 * - Local어/한국어/영어 지원
 * - SSR/SSG 호환 번역 시스템
 * - WCAG 2.1 접근성 준수 (다국어 스크린리더)
 * - Local 현지화 특화 (화폐, 시간, 주소)
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { integrateMissingKeyHandler, collectObjectReturnError } from '../utils/translationErrorLogger';

// 지원 언어 목록
export const SUPPORTED_LANGUAGES = {
  vi: {
    code: 'vi',
    name: 'Tiếng Việt',
    flag: '🇻🇳',
    dir: 'ltr',
    primary: true // 기본 언어
  },
  ko: {
    code: 'ko',
    name: '한국어',
    flag: '🇰🇷',
    dir: 'ltr',
    primary: false
  },
  en: {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    dir: 'ltr',
    primary: false
  }
};

// 기본 언어
export const DEFAULT_LANGUAGE = 'ko';

// 번역 컨텍스트
const I18nContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key) => key,
  languages: SUPPORTED_LANGUAGES,
  isLoading: false
});

// 번역 데이터 저장소
let translations = {};
let loadingPromises = {};

// 번역 오류 핸들러 (개발 환경에서만 활성화)
let missingKeyHandler = null;
let missingKeys = new Set();
let reportTimer = null;

// 번역 파일 로더
const loadTranslations = async (language) => {
  // 개발 환경에서는 캐시 무시하고 항상 새로 로드
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment && translations[language]) {
    return translations[language];
  }

  if (loadingPromises[language]) {
    return loadingPromises[language];
  }

  loadingPromises[language] = loadTranslationsFromFiles(language);

  try {
    translations[language] = await loadingPromises[language];
    return translations[language];
  } catch (error) {
    console.error(`Failed to load translations for ${language}:`, error);
    // 폴백: 기본 언어 로드 시도
    if (language !== DEFAULT_LANGUAGE && translations[DEFAULT_LANGUAGE]) {
      return translations[DEFAULT_LANGUAGE];
    }
    return {};
  } finally {
    delete loadingPromises[language];
  }
};

// 번역 파일들을 동적으로 로드
const loadTranslationsFromFiles = async (language) => {
  const translationModules = {};
  
  try {
    // 병렬로 모든 번역 파일 로드
    const [
      common,
      auth,
      dashboard,
      orders,
      order,  // ✅ order 네임스페이스 추가
      menu,
      analytics,
      errors,
      emptyStates,  // ✅ emptyStates 네임스페이스 추가
      chat,
      payments,
      delivery,
      pos,
      settings,
      staff,
      promotions,
      customers,
      segments,  // ✅ segments 네임스페이스 추가
      reports,
      header,
      notifications,
      user,
      recentOrders,
      websocket,
      stats,
      loading,
      rooms,  // ✅ rooms 네임스페이스 추가
      validation,  // ✅ validation 네임스페이스 추가 (이메일, 웹사이트, 사업자등록번호, 세금번호 유효성 검사)
      navigation  // ✅ navigation 네임스페이스 추가
    ] = await Promise.all([
      import(`./locales/${language}/common.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/auth.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/dashboard.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/orders.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/order.json`).catch(() => ({ default: {} })),  // ✅ order 네임스페이스 추가
      import(`./locales/${language}/menu.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/analytics.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/errors.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/emptyStates.json`).catch(() => ({ default: {} })),  // ✅ emptyStates 네임스페이스 추가
      import(`./locales/${language}/chat.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/payments.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/delivery.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/pos.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/settings.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/staff.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/promotions.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/customers.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/segments.json`).catch(() => ({ default: {} })),  // ✅ segments 네임스페이스 추가
      import(`./locales/${language}/reports.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/header.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/notification.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/user.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/recentOrders.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/websocket.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/stats.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/loading.json`).catch(() => ({ default: {} })),
      import(`./locales/${language}/rooms.json`).catch(() => ({ default: {} })),  // ✅ rooms 네임스페이스 추가
      import(`./locales/${language}/validation.json`).catch(() => ({ default: {} })),  // ✅ validation 네임스페이스 추가
      import(`./locales/${language}/navigation.json`).catch(() => ({ default: {} }))  // ✅ navigation 네임스페이스 추가
    ]);

    // 네임스페이스별로 번역 데이터 구성
    return {
      common: common.default || {},
      auth: auth.default || {},
      dashboard: dashboard.default || {},
      orders: orders.default || {},
      order: order.default || {},  // ✅ order 네임스페이스 추가
      menu: menu.default || {},
      analytics: analytics.default || {},
      errors: errors.default || {},
      emptyStates: emptyStates.default || {},  // ✅ emptyStates 네임스페이스 추가
      chat: chat.default || {},
      payments: payments.default || {},
      delivery: delivery.default || {},
      pos: pos.default || {},
      settings: settings.default || {},
      staff: staff.default || {},
      promotions: promotions.default || {},
      customers: customers.default || {},
      segments: segments.default || {},  // ✅ segments 네임스페이스 추가
      reports: reports.default || {},
      header: header.default || {},
      notification: notifications.default || {},
      user: user.default || {},
      recentOrders: recentOrders.default || {},
      websocket: websocket.default || {},
      stats: stats.default || {},
      loading: loading.default || {},
      rooms: rooms.default || {},  // ✅ rooms 네임스페이스 추가
      validation: validation.default || {},  // ✅ validation 네임스페이스 추가 (이메일, 웹사이트, 사업자등록번호, 세금번호 유효성 검사)
      navigation: navigation.default || {}  // ✅ navigation 네임스페이스 추가
    };
  } catch (error) {
    console.warn(`Some translation files missing for ${language}:`, error);
    return translationModules;
  }
};

// 브라우저 언어 감지
const getBrowserLanguage = () => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  const browserLang = navigator.language || navigator.userLanguage || '';
  const langCode = browserLang.split('-')[0].toLowerCase();
  
  return SUPPORTED_LANGUAGES[langCode] ? langCode : DEFAULT_LANGUAGE;
};

// 로컬 스토리지에서 언어 설정 로드
const getStoredLanguage = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('store-language');
    return stored && SUPPORTED_LANGUAGES[stored] ? stored : null;
  } catch (error) {
    console.warn('Failed to read language from localStorage:', error);
    return null;
  }
};

// 누락된 번역 키 리포트 함수
const reportMissingKeys = () => {
  if (missingKeys.size === 0) return;

  const keysByNamespace = {};
  missingKeys.forEach(key => {
    const [namespace, ...rest] = key.split('.');
    if (!keysByNamespace[namespace]) {
      keysByNamespace[namespace] = [];
    }
    keysByNamespace[namespace].push(rest.join('.'));
  });

  // 단일 콘솔 로그로 통합된 리포트 생성
  let report = '\n\n🌐 ═══════════════════════════════════════════════════════════\n';
  report += `   누락된 번역 키 리포트 (총 ${missingKeys.size}개)\n`;
  report += '═══════════════════════════════════════════════════════════\n\n';

  Object.entries(keysByNamespace).forEach(([namespace, keys]) => {
    report += `📁 ${namespace} 네임스페이스 (${keys.length}개 누락)\n`;
    report += `   위치: src/shared/i18n/locales/{언어}/${namespace}.json\n\n`;
    report += '   누락된 키 목록:\n';
    keys.forEach(key => {
      report += `     • ${key}\n`;
    });
    report += '\n   ─────────────────────────────────────────────────────────\n\n';
  });

  report += '📝 해결 방법:\n';
  report += '   1. 위에 표시된 각 네임스페이스 파일을 엽니다\n';
  report += '   2. 누락된 키를 JSON 구조에 맞게 추가합니다\n';
  report += '   3. ko, vi, en 세 언어 모두 동일하게 추가해야 합니다\n\n';
  report += '💡 빠른 팁:\n';
  report += '   • common: 공통 UI 요소 (버튼, 액션, 에러 메시지 등)\n';
  report += '   • menu: 메뉴 및 카테고리 관련 텍스트\n';
  report += '   • 기존 번역 파일의 JSON 구조를 참고하세요\n';
  report += '═══════════════════════════════════════════════════════════\n';

  console.log(report);

  // 리포트 후 초기화
  missingKeys.clear();
};

// 번역 함수 - 점 표기법 지원 (예: "common.actions.save" 또는 "common:actions.save")
const translateWithNamespace = (translations, key, params = {}, i18nInstance = null) => {
  if (!key || typeof key !== 'string') return key;

  // ✅ 콜론(:)을 점(.)으로 모두 변환하여 i18next 호환성 강화
  // 예: "chat:notifications.newMessage" → "chat.notifications.newMessage"
  const normalizedKey = key.replace(/:/g, '.');

  const [namespace, ...keyParts] = normalizedKey.split('.');
  const translationKey = keyParts.join('.');


  const namespaceTranslations = translations[namespace] || {};
  let value = namespaceTranslations;

  // 중첩된 키 탐색
  for (const part of keyParts) {
    if (value && typeof value === 'object' && value.hasOwnProperty(part)) {
      value = value[part];
    } else {
      // 키를 찾지 못한 경우
      if (process.env.NODE_ENV === 'development') {
        const missingKey = `${namespace}.${keyParts.join('.')}`;
        missingKeys.add(missingKey);

        // 2초 후 모든 누락된 키를 한 번에 리포트
        if (reportTimer) clearTimeout(reportTimer);
        reportTimer = setTimeout(() => {
          reportMissingKeys();
        }, 2000);
      }
      return key;
    }
  }

  // ✅ returnObjects 옵션이 true면 배열이나 객체를 그대로 반환
  if (typeof value !== 'string') {
    if (params?.returnObjects === true) {
      return value; // 배열이나 객체 그대로 반환
    }

    // returnObjects 옵션이 없으면 에러 처리
    if (process.env.NODE_ENV === 'development') {
      console.error(`[i18n] Object return error: ${key}`, value);
      collectObjectReturnError(value, translationKey, namespace);
      return `[객체 반환 오류: ${key}]`;
    }
    return key;
  }

  // 매개변수 치환 (예: "Hello {{name}}" → "Hello John")
  // returnObjects 같은 옵션은 제외하고 실제 변수만 치환
  const translated = value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
    // returnObjects 같은 옵션 키는 변수 치환에서 제외
    if (paramKey === 'returnObjects') return match;
    return params[paramKey] !== undefined ? params[paramKey] : match;
  });

  return translated;
};

// I18n 프로바이더 컴포넌트
export const I18nProvider = ({ children, initialLanguage }) => {
  const [language, setLanguageState] = useState(
    initialLanguage || getStoredLanguage() || getBrowserLanguage()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [currentTranslations, setCurrentTranslations] = useState({});

  // 번역 로드 효과
  useEffect(() => {
    const loadCurrentTranslations = async () => {
      setIsLoading(true);
      try {
        const loadedTranslations = await loadTranslations(language);

        setCurrentTranslations(loadedTranslations);

        // 번역 오류 핸들러 초기화 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development' && !missingKeyHandler) {
          const i18nInstance = { language, translations: loadedTranslations };
          missingKeyHandler = integrateMissingKeyHandler(i18nInstance);
        }
      } catch (error) {
        console.error('Failed to load translations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentTranslations();
  }, [language]);

  // 언어 변경 함수
  const setLanguage = useCallback((newLanguage) => {
    if (!SUPPORTED_LANGUAGES[newLanguage]) {
      console.warn(`Unsupported language: ${newLanguage}`);
      return;
    }

    setLanguageState(newLanguage);
    
    // 로컬 스토리지에 저장
    try {
      localStorage.setItem('store-language', newLanguage);
    } catch (error) {
      console.warn('Failed to save language to localStorage:', error);
    }
    
    // HTML lang 속성 업데이트 (접근성)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLanguage;
      document.documentElement.dir = SUPPORTED_LANGUAGES[newLanguage].dir;
    }
  }, []);

  // 번역 함수
  const t = useCallback((key, params) => {
    // 번역 파일이 로딩 중이거나 비어있으면 키 반환
    if (!currentTranslations || Object.keys(currentTranslations).length === 0) {
      return key;
    }
    return translateWithNamespace(currentTranslations, key, params);
  }, [currentTranslations, isLoading]);

  // 컨텍스트 값 - i18n 객체 포함하여 호환성 제공
  const contextValue = {
    language,
    setLanguage,
    t,
    languages: SUPPORTED_LANGUAGES,
    isLoading,
    currentTranslations,
    // 기존 코드와의 호환성을 위한 i18n 객체
    i18n: {
      language,
      setLanguage,
      t
    }
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

// 번역 훅 - 네임스페이스 지원
export const useTranslation = (namespace) => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }

  // 네임스페이스가 제공된 경우, 자동으로 prefix 추가
  if (namespace) {
    const namespacedT = useCallback((key, params) => {
      // 명시적으로 다른 네임스페이스를 참조하는 경우 (콜론 포함)
      if (key.includes(':')) {
        return context.t(key, params);
      }
      // 제공된 네임스페이스를 항상 prefix로 추가
      return context.t(`${namespace}.${key}`, params);
    }, [context.t, namespace]);

    return {
      ...context,
      t: namespacedT
    };
  }

  return context;
};

// 언어별 숫자/화폐 포맷팅 유틸리티
export const formatCurrency = (amount, language = DEFAULT_LANGUAGE) => {
  const formatters = {
    vi: new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }),
    ko: new Intl.NumberFormat('ko-KR', {
      style: 'currency', 
      currency: 'KRW',
      minimumFractionDigits: 0
    }),
    en: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })
  };
  
  return formatters[language]?.format(amount) || String(amount);
};

// 언어별 날짜 포맷팅
export const formatDate = (date, language = DEFAULT_LANGUAGE, options = {}) => {
  const formatters = {
    vi: new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      ...options
    }),
    ko: new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      ...options
    }),
    en: new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      ...options
    })
  };
  
  return formatters[language]?.format(new Date(date)) || String(date);
};

// 다국어 메타데이터 생성 (Next.js metadata API)
export const generateI18nMetadata = (key, language = DEFAULT_LANGUAGE) => {
  const titles = {
    vi: {
      dashboard: 'Bảng Điều Khiển - Hệ Thống Quản Lý Nhà Hàng',
      orders: 'Quản Lý Đơn Hàng - Nhà Hàng',
      menu: 'Quản Lý Menu - Thực Đơn Nhà Hàng',
      analytics: 'Phân Tích Kinh Doanh - Báo Cáo'
    },
    ko: {
      dashboard: '대시보드 - 음식점 관리 시스템',
      orders: '주문 관리 - 음식점',
      menu: '메뉴 관리 - 음식점 메뉴',
      analytics: '비즈니스 분석 - 리포트'
    },
    en: {
      dashboard: 'Dashboard - Store Management System',
      orders: 'Order Management - Store',
      menu: 'Menu Management - Store Menu',
      analytics: 'Business Analytics - Reports'
    }
  };
  
  return {
    title: titles[language]?.[key] || key,
    lang: language
  };
};

export default I18nProvider;
