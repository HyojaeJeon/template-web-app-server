
// 최적화된 스키마 로딩
import { readFileSync } from 'fs';
import { join } from 'path';

const ENUM_CACHE = new Map();
const SCHEMA_CACHE = new Map();

export function loadOptimizedEnums(domains = []) {
  const cacheKey = 'consolidated-enums';

  if (ENUM_CACHE.has(cacheKey)) {
    return ENUM_CACHE.get(cacheKey);
  }

  // 통합된 enums.graphql 파일에서 모든 ENUM 로드
  const enumContent = readFileSync(join(__dirname, 'types/enums.graphql'), 'utf8');

  ENUM_CACHE.set(cacheKey, enumContent);

  // 5분 후 캐시 만료
  setTimeout(() => ENUM_CACHE.delete(cacheKey), 300000);

  return enumContent;
}

export function preloadCriticalEnums() {
  // 중요한 도메인 미리 로딩
  const criticalDomains = ['auth', 'order', 'payment', 'user'];
  criticalDomains.forEach(domain => loadOptimizedEnums([domain]));
}
