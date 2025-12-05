/**
 * 환경변수 검증 시스템
 * 애플리케이션 시작 시 필수 환경변수 존재 여부를 확인합니다.
 * _DEV, _PROD 패턴 지원
 */

/**
 * 환경별 접미사 결정
 */
const getEnvSuffix = () => {
  return process.env.NODE_ENV === 'production' ? '_PROD' : '_DEV';
};

/**
 * 환경별 환경변수 체크
 * @param {string} baseName - 기본 환경변수명 (접미사 제외)
 */
const hasEnvVar = (baseName) => {
  const suffix = getEnvSuffix();
  return !!process.env[`${baseName}${suffix}`];
};

/**
 * 필수 환경변수 목록 (접미사 없음 - 고정값)
 */
const requiredEnvVarsFixed = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

/**
 * 필수 환경변수 목록 (환경별 - _DEV/_PROD 접미사 사용)
 */
const requiredEnvVarsEnvBased = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'REDIS_HOST',
];

/**
 * 선택적 환경변수 (기본값 제공)
 */
const optionalEnvVars = {
  NODE_ENV: 'development',
  PORT: '6000',
  JWT_EXPIRES_IN: '24h',
  BCRYPT_ROUNDS: '12',
};

/**
 * 환경변수 검증 및 설정
 */
export function validateEnvironment() {
  const missingVars = [];
  const warnings = [];
  const suffix = getEnvSuffix();

  // 필수 환경변수 검증 (고정 키)
  for (const varName of requiredEnvVarsFixed) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  // 필수 환경변수 검증 (환경별 키)
  for (const baseName of requiredEnvVarsEnvBased) {
    const envVarName = `${baseName}${suffix}`;
    if (!process.env[envVarName]) {
      missingVars.push(envVarName);
    }
  }

  // 필수 환경변수가 누락된 경우 애플리케이션 종료
  if (missingVars.length > 0) {
    console.error('🚨 필수 환경변수가 누락되었습니다:');
    missingVars.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    console.error(`\n📋 현재 환경: ${process.env.NODE_ENV || 'development'} (접미사: ${suffix})`);
    console.error('📋 .env 파일에 위 환경변수들을 설정해주세요.');
    process.exit(1);
  }

  // 선택적 환경변수 기본값 설정
  for (const [varName, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      warnings.push(`${varName} = ${defaultValue} (기본값 사용)`);
    }
  }

  // JWT 시크릿 강도 검증
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET이 너무 짧습니다. 32자 이상 권장합니다.');
  }

  // 프로덕션 환경 추가 검증
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'your-jwt-secret-key') {
      console.error('🚨 프로덕션에서 기본 JWT_SECRET 사용 금지');
      process.exit(1);
    }
  }

  // 검증 완료 로그
  console.log('✅ 환경변수 검증 완료');
  console.log(`📌 현재 환경: ${process.env.NODE_ENV || 'development'}`);
  if (warnings.length > 0) {
    console.log('⚠️  경고사항:');
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  return {
    isValid: true,
    missingVars: [],
    warnings,
  };
}

/**
 * 특정 환경변수 존재 여부 확인
 *
 * @param varName
 */
export function requireEnv(varName) {
  const value = process.env[varName];
  if (!value) {
    throw new Error(`환경변수 ${varName}이 설정되지 않았습니다.`);
  }
  return value;
}

/**
 * 환경변수 안전하게 가져오기 (기본값 제공)
 *
 * @param varName
 * @param defaultValue
 */
export function getEnv(varName, defaultValue = null) {
  return process.env[varName] || defaultValue;
}

/**
 * 환경별 환경변수 안전하게 가져오기
 * @param {string} baseName - 기본 환경변수명 (접미사 제외)
 * @param {string} defaultValue - 기본값
 */
export function getEnvByEnvironment(baseName, defaultValue = null) {
  const suffix = getEnvSuffix();
  return process.env[`${baseName}${suffix}`] || defaultValue;
}
