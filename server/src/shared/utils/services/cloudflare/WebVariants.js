/**
 * Store 앱용 Cloudflare Images Variants 관리 시스템                                                    // 점주 앱 전용 이미지 변형 관리
 * 점주 관리 시스템에 필요한 모든 이미지 변형을 미리 정의하고 관리                                         // 다양한 크기와 용도별 이미지 변형
 * 
 * @module StoreVariants
 * @version 1.0.0
 * 
 * ===== 주요 기능 =====                                                                             // 핵심 기능 목록
 * - Store 앱 전용 Variants 정의 및 생성                                                              // 점주 앱 맞춤 이미지 변형
 * - 자동 Variant 생성/업데이트 시스템                                                               // 배치 처리를 통한 관리
 * - 반응형 이미지 지원 (모바일, 태블릿, 데스크톱)                                                    // 디바이스별 최적화
 * - 최신 포맷 지원 (WebP, AVIF)                                                                     // 성능 최적화 포맷
 * - Lazy Loading 및 블러 프리뷰 지원                                                                // 사용자 경험 향상
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// API 설정                                                                                          // 클라우드플레어 API 인증 정보
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_KEY = process.env.CLOUDFLARE_API_KEY;
const EMAIL = process.env.CLOUDFLARE_EMAIL;

// API 클라이언트                                                                                    // HTTP 클라이언트 설정
const apiClient = axios.create({
  baseURL: `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}`,
  headers: {
    'X-Auth-Email': EMAIL,
    'X-Auth-Key': API_KEY,
    'Content-Type': 'application/json'
  }
});

// 콘솔 출력 색상                                                                                     // 터미널 컬러 출력용
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

/**
 * Store 앱용 권장 Variants 정의                                                                      // 점주 앱에 최적화된 이미지 변형들
 * 다양한 용도와 디바이스에 맞는 이미지 변형을 사전 정의                                               // 용도별 최적화된 크기와 설정
 */
export const STORE_VARIANTS = {
  // 썸네일 (목록용)                                                                                 // 리스트 화면용 작은 이미지
  'store-thumb': {
    width: 150,
    height: 150,
    fit: 'cover',
    quality: 85,
    metadata: 'none',
    description: '상점 목록 썸네일'
  },
  
  // 카드 이미지 (메뉴 카드용)                                                                       // 메뉴 그리드용 중간 크기
  'store-card': {
    width: 300,
    height: 200,
    fit: 'cover',
    quality: 90,
    metadata: 'none',
    description: '메뉴 카드 이미지'
  },
  
  // 상세 이미지 (상품 상세 페이지)                                                                  // 상품 상세 페이지용 큰 이미지
  'store-detail': {
    width: 600,
    height: 400,
    fit: 'contain',
    quality: 95,
    metadata: 'copyright',
    description: '상품 상세 이미지'
  },
  
  // 배너/히어로 이미지                                                                             // 헤더 배너용 와이드 이미지
  'store-banner': {
    width: 1200,
    height: 400,
    fit: 'cover',
    quality: 90,
    metadata: 'none',
    description: '상점 배너 이미지'
  },
  
  // 정사각형 (아이콘/로고)                                                                         // 로고나 아이콘용 정사각형
  'store-square': {
    width: 500,
    height: 500,
    fit: 'cover',
    quality: 90,
    metadata: 'none',
    description: '정사각형 이미지'
  },
  
  // 모바일 최적화                                                                                  // 모바일 디바이스용 최적화
  'store-mobile': {
    width: 400,
    height: 300,
    fit: 'cover',
    quality: 85,
    metadata: 'none',
    description: '모바일 디바이스용'
  },
  
  // 고품질 원본 (편집용)                                                                           // 편집이나 출력용 고화질
  'store-original': {
    width: 2000,
    height: 2000,
    fit: 'scale-down',
    quality: 100,
    metadata: 'keep',
    description: '원본 품질 유지'
  },
  
  // WebP 형식 (성능 최적화)                                                                        // 빠른 로딩을 위한 WebP 포맷
  'store-webp': {
    width: 600,
    height: 400,
    fit: 'cover',
    quality: 85,
    format: 'webp',
    metadata: 'none',
    description: 'WebP 포맷 (빠른 로딩)'
  },
  
  // AVIF 형식 (최신 브라우저)                                                                      // 최고 압축률의 AVIF 포맷
  'store-avif': {
    width: 600,
    height: 400,
    fit: 'cover',
    quality: 80,
    format: 'avif',
    metadata: 'none',
    description: 'AVIF 포맷 (최고 압축)'
  },
  
  // 블러 프리뷰 (lazy loading용)                                                                   // 레이지 로딩용 블러 처리
  'store-blur': {
    width: 50,
    height: 50,
    fit: 'cover',
    quality: 30,
    blur: 40,
    metadata: 'none',
    description: '블러 처리된 프리뷰'
  }
};

/**
 * 현재 등록된 Variants 목록 조회                                                                     // 기존 변형 목록 확인
 * @returns {Promise<Array>} 등록된 Variant 이름 배열
 */
export async function listCurrentVariants() {
  try {
    console.log(`${colors.cyan}📋 현재 Variants 목록 조회 중...${colors.reset}\n`);
    
    const response = await apiClient.get('/images/v1/variants');
    const variants = response.data.result.variants || {};
    
    console.log(`${colors.bold}현재 등록된 Variants:${colors.reset}`);
    Object.entries(variants).forEach(([name, config]) => {
      console.log(`\n${colors.green}• ${name}${colors.reset}`);
      console.log(`  크기: ${config.options.width || 'auto'} x ${config.options.height || 'auto'}`);
      console.log(`  품질: ${config.options.quality || 85}`);
      console.log(`  맞춤: ${config.options.fit || 'scale-down'}`);
      if (config.options.format) console.log(`  포맷: ${config.options.format}`);
    });
    
    return Object.keys(variants);
  } catch (error) {
    console.error(`${colors.red}❌ Variants 조회 실패:${colors.reset}`, error.response?.data || error.message);
    return [];
  }
}

/**
 * 개별 Variant 생성/업데이트                                                                         // 단일 변형 생성 함수
 * @param {string} name - Variant 이름
 * @param {Object} options - Variant 설정 옵션
 * @returns {Promise<boolean>} 생성 성공 여부
 */
export async function createVariant(name, options) {
  try {
    // Variant 생성 또는 업데이트                                                                     // API 호출로 변형 생성
    const response = await apiClient.patch('/images/v1/variants', {
      [name]: {
        options: {
          fit: options.fit || 'scale-down',
          width: options.width,
          height: options.height,
          quality: options.quality || 85,
          format: options.format,
          blur: options.blur,
          metadata: options.metadata || 'none'
        }
      }
    });
    
    if (response.data.success) {
      console.log(`${colors.green}✅ ${name} 생성/업데이트 완료${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}❌ ${name} 생성 실패${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}❌ ${name} 오류:${colors.reset}`, error.response?.data?.errors?.[0]?.message || error.message);
    return false;
  }
}

/**
 * 모든 Store Variants 일괄 생성                                                                      // 전체 변형 배치 생성
 * @returns {Promise<Object>} 생성 결과 통계
 */
export async function createAllStoreVariants() {
  console.log(`${colors.cyan}${colors.bold}╔══════════════════════════════════════════════╗`);
  console.log(`║     🖼️  Store 앱 Variants 생성 도구 🖼️      ║`);
  console.log(`╚══════════════════════════════════════════════╝${colors.reset}\n`);
  
  // 1. 현재 Variants 확인                                                                          // 기존 변형 상태 확인
  const existingVariants = await listCurrentVariants();
  
  console.log(`\n${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  // 2. Store Variants 생성                                                                        // 새로운 변형 생성 시작
  console.log(`${colors.cyan}🚀 Store 전용 Variants 생성 시작...${colors.reset}\n`);
  
  let created = 0;
  let failed = 0;
  const results = [];
  
  for (const [name, config] of Object.entries(STORE_VARIANTS)) {
    console.log(`\n${colors.cyan}처리 중: ${name}${colors.reset}`);
    console.log(`  설명: ${config.description}`);
    console.log(`  설정: ${config.width}x${config.height}, ${config.fit}, 품질 ${config.quality}`);
    
    const success = await createVariant(name, config);
    if (success) {
      created++;
      results.push({ name, status: 'success', config });
    } else {
      failed++;
      results.push({ name, status: 'failed', config });
    }
    
    // API 부하 방지                                                                               // 요청 간 대기 시간
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 3. 결과 출력                                                                                  // 작업 결과 요약
  console.log(`\n${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  console.log(`${colors.cyan}📊 작업 완료${colors.reset}`);
  console.log(`${colors.green}✅ 성공: ${created}개${colors.reset}`);
  if (failed > 0) console.log(`${colors.red}❌ 실패: ${failed}개${colors.reset}`);
  
  // 4. 사용 예시 출력                                                                             // 실제 사용법 안내
  console.log(`\n${colors.cyan}📝 사용 예시:${colors.reset}`);
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`
// Next.js Store 앱에서 사용
const imageUrl = \`https://imagedelivery.net/\${ACCOUNT_HASH}/\${imageId}/store-card\`;

// 반응형 이미지
<img 
  src={getImageUrl(imageId, 'store-mobile')}
  srcSet={\`
    \${getImageUrl(imageId, 'store-thumb')} 150w,
    \${getImageUrl(imageId, 'store-card')} 300w,
    \${getImageUrl(imageId, 'store-detail')} 600w
  \`}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="메뉴 이미지"
/>

// 최적 포맷 선택 (브라우저가 자동 선택)
<picture>
  <source srcSet={getImageUrl(imageId, 'store-avif')} type="image/avif" />
  <source srcSet={getImageUrl(imageId, 'store-webp')} type="image/webp" />
  <img src={getImageUrl(imageId, 'store-detail')} alt="메뉴" />
</picture>

// Lazy loading with blur
<img
  src={getImageUrl(imageId, 'store-blur')}
  data-src={getImageUrl(imageId, 'store-detail')}
  loading="lazy"
  alt="메뉴"
/>
`);
  
  console.log(`${colors.green}\n✨ 모든 Store Variants가 준비되었습니다!${colors.reset}`);
  
  return {
    total: Object.keys(STORE_VARIANTS).length,
    created,
    failed,
    results
  };
}

/**
 * 특정 Variant 삭제                                                                                // 개별 변형 제거
 * @param {string} variantName - 삭제할 Variant 이름
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
export async function deleteVariant(variantName) {
  try {
    console.log(`${colors.yellow}🗑️  ${variantName} 삭제 중...${colors.reset}`);
    
    const response = await apiClient.delete(`/images/v1/variants/${variantName}`);
    
    if (response.data.success) {
      console.log(`${colors.green}✅ ${variantName} 삭제 완료${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}❌ ${variantName} 삭제 실패${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}❌ ${variantName} 삭제 오류:${colors.reset}`, error.response?.data || error.message);
    return false;
  }
}

/**
 * Variant 설정 조회                                                                                 // 개별 변형 설정 확인
 * @param {string} variantName - 조회할 Variant 이름
 * @returns {Promise<Object|null>} Variant 설정 객체
 */
export async function getVariantConfig(variantName) {
  try {
    const response = await apiClient.get('/images/v1/variants');
    const variants = response.data.result.variants || {};
    
    return variants[variantName] || null;
  } catch (error) {
    console.error(`${colors.red}❌ Variant 조회 오류:${colors.reset}`, error.response?.data || error.message);
    return null;
  }
}

/**
 * Store Variants 유효성 검증                                                                        // 변형 설정 검증
 * @returns {Promise<Object>} 검증 결과
 */
export async function validateStoreVariants() {
  const results = {
    valid: [],
    invalid: [],
    missing: []
  };
  
  try {
    const existingVariants = await listCurrentVariants();
    
    for (const [name, config] of Object.entries(STORE_VARIANTS)) {
      if (existingVariants.includes(name)) {
        const currentConfig = await getVariantConfig(name);
        // 설정 비교 로직 (간단한 예시)                                                              // 현재 설정과 기대 설정 비교
        if (currentConfig && 
            currentConfig.options.width === config.width &&
            currentConfig.options.height === config.height) {
          results.valid.push(name);
        } else {
          results.invalid.push({ name, expected: config, current: currentConfig });
        }
      } else {
        results.missing.push(name);
      }
    }
  } catch (error) {
    console.error(`${colors.red}❌ 검증 중 오류:${colors.reset}`, error.message);
  }
  
  return results;
}

/**
 * 레거시 Variant 정리                                                                               // 사용하지 않는 변형 정리
 * @param {Array} keepVariants - 유지할 Variant 목록
 * @returns {Promise<Object>} 정리 결과
 */
export async function cleanupLegacyVariants(keepVariants = Object.keys(STORE_VARIANTS)) {
  try {
    const existingVariants = await listCurrentVariants();
    const toDelete = existingVariants.filter(name => 
      !keepVariants.includes(name) && name.startsWith('store-')
    );
    
    const results = {
      deleted: [],
      failed: []
    };
    
    for (const variantName of toDelete) {
      const success = await deleteVariant(variantName);
      if (success) {
        results.deleted.push(variantName);
      } else {
        results.failed.push(variantName);
      }
      
      // API 부하 방지                                                                             // 삭제 간 대기
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  } catch (error) {
    console.error(`${colors.red}❌ 정리 중 오류:${colors.reset}`, error.message);
    return { deleted: [], failed: [] };
  }
}

// 기본 내보내기                                                                                     // 모듈 주요 함수들
export default {
  STORE_VARIANTS,
  listCurrentVariants,
  createVariant,
  createAllStoreVariants,
  deleteVariant,
  getVariantConfig,
  validateStoreVariants,
  cleanupLegacyVariants
};