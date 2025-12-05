/**
 * 환경별 설정 유틸리티
 * =====================
 *
 * NODE_ENV에 따라 _DEV 또는 _PROD 접미사가 붙은 환경변수를 자동으로 선택
 *
 * 사용 예:
 * - development 환경: REDIS_HOST_DEV 사용
 * - production 환경: REDIS_HOST_PROD 사용
 */

/**
 * 현재 환경 확인
 * @returns {boolean} production 환경 여부
 */
export const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * 현재 환경 확인
 * @returns {boolean} development 환경 여부
 */
export const isDevelopment = () => process.env.NODE_ENV !== 'production';

/**
 * 환경별 접미사 반환
 * @returns {string} '_DEV' 또는 '_PROD'
 */
export const getEnvSuffix = () => isProduction() ? '_PROD' : '_DEV';

/**
 * 환경별 환경변수 값 가져오기
 * @param {string} baseName - 기본 환경변수명 (접미사 제외)
 * @param {string} defaultValue - 기본값
 * @returns {string} 환경변수 값
 */
export const getEnvVar = (baseName, defaultValue = '') => {
  const suffix = getEnvSuffix();
  const envValue = process.env[`${baseName}${suffix}`];
  return envValue !== undefined ? envValue : defaultValue;
};

/**
 * 환경별 환경변수 값 가져오기 (숫자 변환)
 * @param {string} baseName - 기본 환경변수명 (접미사 제외)
 * @param {number} defaultValue - 기본값
 * @returns {number} 환경변수 값
 */
export const getEnvVarInt = (baseName, defaultValue = 0) => {
  const value = getEnvVar(baseName);
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Database 설정
 */
export const dbConfig = {
  get host() { return getEnvVar('DB_HOST', 'localhost'); },
  get port() { return getEnvVarInt('DB_PORT', 3306); },
  get name() { return getEnvVar('DB_NAME', 'duri-db'); },
  get user() { return getEnvVar('DB_USER', 'root'); },
  get password() { return getEnvVar('DB_PASSWORD', ''); },
};

/**
 * Redis 설정
 */
export const redisConfig = {
  get host() { return getEnvVar('REDIS_HOST', 'localhost'); },
  get port() { return getEnvVarInt('REDIS_PORT', 6379); },
  get password() { return getEnvVar('REDIS_PASSWORD', ''); },
  get db() { return getEnvVarInt('REDIS_DB', 0); },
};

/**
 * Elasticsearch 설정
 */
export const elasticsearchConfig = {
  get node() { return getEnvVar('ELASTICSEARCH_NODE', 'http://localhost:9200'); },
  get username() { return getEnvVar('ELASTICSEARCH_USERNAME', ''); },
  get password() { return getEnvVar('ELASTICSEARCH_PASSWORD', ''); },
};

/**
 * Firebase 설정
 */
export const firebaseConfig = {
  get projectId() { return getEnvVar('FIREBASE_PROJECT_ID', ''); },
  get privateKey() { return getEnvVar('FIREBASE_PRIVATE_KEY', ''); },
  get clientEmail() { return getEnvVar('FIREBASE_CLIENT_EMAIL', ''); },
};

/**
 * CORS 설정
 */
export const corsConfig = {
  get origin() { return getEnvVar('CORS_ORIGIN', 'http://localhost:6001'); },
};

/**
 * 전체 환경 설정 객체
 */
export const envConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 6000,
  isProduction: isProduction(),
  isDevelopment: isDevelopment(),
  db: dbConfig,
  redis: redisConfig,
  elasticsearch: elasticsearchConfig,
  firebase: firebaseConfig,
  cors: corsConfig,
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  logLevel: process.env.LOG_LEVEL || 'debug',
};

export default envConfig;
