import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 번역 리소스 불러오기 (새로운 모듈 구조)
import { resources } from '@shared/i18n/locales';

const LANGUAGE_KEY = '@app_language';

// 누락된 번역키를 배치로 수집하는 핸들러
const createBatchedMissingKeyHandler = () => {
  let missingKeys = new Set();
  let batchTimer = null;

  const flushMissingKeys = () => {
    if (missingKeys.size > 0) {
      const keyArray = Array.from(missingKeys);
      console.warn(`[DEBUG] ${i18n.t('app:i18n.missingKeys', { count: keyArray.length })}:`, keyArray);
      missingKeys.clear();
    }
  };

  return (lng, ns, key) => {
    if (__DEV__) {
      const keyPath = `[${lng}] ${ns}:${key}`;
      missingKeys.add(keyPath);

      // 타이머가 없으면 새로 설정 (2초 대기 후 일괄 출력)
      if (!batchTimer) {
        batchTimer = setTimeout(() => {
          flushMissingKeys();
          batchTimer = null;
        }, 2000);
      }
    }
  };
};

// AsyncStorage에서 저장된 언어 가져오기
const getStoredLanguage = async () => {
  try {
    const language = await AsyncStorage.getItem(LANGUAGE_KEY);
    // 지원하는 언어만 허용
    const supportedLanguages = ['ko', 'vi', 'en'];
    if (language && supportedLanguages.includes(language)) {
      return language;
    }
    return 'ko'; // 기본값: 한국어
  } catch (error) {
    console.warn(i18n.t('app:i18n.languageLoadFailed') + ':', error);
    return 'ko';
  }
};

// AsyncStorage에서 저장된 언어 가져오기 함수 export
export { getStoredLanguage };

// 언어 변경 및 저장 함수 (Apollo Client 캐시 새로고침 포함)
export const changeLanguage = async (language) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    await i18n.changeLanguage(language);
    
    // Apollo Client 캐시 새로고침 (언어 변경 시 서버에서 새로운 언어 데이터를 받기 위해)
    try {
      const { getApolloClient } = await import('@services/apollo/apolloClient');
      const client = getApolloClient();
      if (client) {
        await client.refetchQueries({
          include: 'active', // 현재 활성화된 쿼리들만 다시 가져오기
        });
        console.log('✅ Apollo Client 캐시 새로고침 완료 (언어 변경)');
      }
    } catch (apolloError) {
      console.warn('⚠️ Apollo Client 캐시 새로고침 실패:', apolloError);
    }
    
    console.log(i18n.t('app:i18n.languageChanged', { language }));
  } catch (error) {
    console.error(i18n.t('app:i18n.languageChangeFailed') + ':', error);
  }
};

// i18n 초기화 함수
const initI18n = async () => {
  try {
    const storedLanguage = await getStoredLanguage();

    console.log('📚 i18n resources loaded:', {
      languages: Object.keys(resources),
      koExists: !!resources.ko,
      koCommonExists: !!resources.ko?.common,
      koHomeExists: !!resources.ko?.home,
      koNavigationExists: !!resources.ko?.common?.navigation,
      selectedLanguage: storedLanguage,
      sampleKeys: {
        koCommonNavigationOrders: resources.ko?.common?.navigation?.orders,
        koHomeHeaderCurrentLocation: resources.ko?.home?.header?.currentLocation,
        koHomeSearchHungerPlaceholder: resources.ko?.home?.search?.hungerPlaceholder}});

    // 모든 네임스페이스 로드하되 codes.forEach 오류만 방지
    await i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: storedLanguage,
        fallbackLng: 'ko',
        supportedLngs: ['ko', 'vi', 'en'], // 모든 언어 지원
        debug: __DEV__, // 개발 모드에서만 디버그 활성화
        defaultNS: 'common',
        compatibilityJSON: 'v3', // React Native Intl API 호환성 문제 해결
        ns: ['app', 'common', 'ui', 'auth', 'home', 'store', 'menu', 'cart', 'order', 'review', 'chat', 'payment', 'payment_empty', 'location', 'address', 'notification', 'storeList', 'tracking', 'coupon', 'profile', 'search', 'emptyStates', 'tabs', 'ux', 'advanced', 'modals', 'weather', 'errors', 'cuisine', 'settings', 'accessibility', 'messages', 'realtime', 'storeChat', 'network', 'menus', 'stores', 'inquiryCategory', 'eco', 'offline', 'point', 'favorite', 'favorites', 'filter', 'permission', 'productCards'], // 모든 도메인 모듈 로드
        partialBundledLanguages: true, // 부분 로딩 허용
        interpolation: {
          escapeValue: false},
        react: {
          useSuspense: false,
          bindI18n: 'languageChanged',
          bindI18nStore: '',
          transEmptyNodeValue: '',
          transSupportBasicHtmlNodes: false,
          transKeepBasicHtmlNodesFor: ['br', 'strong', 'i']
        },
        // codes.forEach 오류 방지를 위한 모든 처리 기능 비활성화
        saveMissing: false,
        missingKeyHandler: createBatchedMissingKeyHandler(),
        cleanCode: false,
        load: 'languageOnly',
        preload: false,
        checkForObjectOverlaps: false,
        ignoreJSONStructure: false,
        simplifyPluralSuffix: false,
        keySeparator: '.',
        nsSeparator: ':'});

    console.log('[SUCCESS] i18n initialized');
    console.log('🌍 Current language:', i18n.language);
    console.log('🔑 Available namespaces:', Object.keys(resources[storedLanguage] || {}));

    // 초기화 검증 - 핵심 번역 키 테스트
    const testKeys = [
      'home:header.currentLocation',
      'home:search.hungerPlaceholder',
      'common:actions.confirm'
    ];

    console.log('🧪 번역 키 테스트:');
    testKeys.forEach(key => {
      const translated = i18n.t(key);
      console.log(`  ${key} → "${translated}"`);
      if (translated === key) {
        console.warn(`⚠️  번역 실패: ${key}`);
      }
    });

    // 네임스페이스 로딩 상태 확인
    const loadedNamespaces = i18n.reportNamespaces?.getUsedNamespaces?.() || [];
    console.log('📦 로드된 네임스페이스:', loadedNamespaces);

  } catch (error) {
    console.error('[ERROR] i18n 초기화 실패:', error);
    // 기본 언어로 fallback 초기화 시도
    try {
      console.log('[FALLBACK] 기본 언어로 복구 시도...');
      await i18n
        .use(initReactI18next)
        .init({
          resources,
          lng: 'ko',
          fallbackLng: 'ko',
          debug: true,
          defaultNS: 'common',
          compatibilityJSON: 'v3', // React Native 호환성
          ns: ['common', 'home'],
          interpolation: {
            escapeValue: false},
          react: {
            useSuspense: false,
            bindI18n: 'languageChanged',
            bindI18nStore: '',
            transEmptyNodeValue: '',
            transSupportBasicHtmlNodes: false,
            transKeepBasicHtmlNodesFor: ['br', 'strong', 'i']
          }});
      console.log('[WARNING] 기본 언어로 복구 완료');
    } catch (fallbackError) {
      console.error('[ERROR] 복구 실패:', fallbackError);
      throw fallbackError;
    }
  }
};

// i18n 초기화 함수를 export해서 App.js에서 명시적으로 호출하도록 변경
export const initializeI18n = initI18n;

// 즉시 초기화는 제거하고 export만 하도록 변경

export default i18n;
