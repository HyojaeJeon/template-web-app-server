import dotenv from 'dotenv';

// 환경에 따른 .env 파일 로드
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: envFile });

import { Sequelize } from 'sequelize';
import winston from 'winston';
import { dbConfig as envDbConfig } from './env.js';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/database.log' }),
  ],
});

// MySQL 전용 데이터베이스 설정 - 환경별 설정 사용
const getDbConfig = () => {
  return {
    dialect: 'mysql',
    host: envDbConfig.host,
    port: envDbConfig.port,
    database: envDbConfig.name,
    username: envDbConfig.user,
    password: envDbConfig.password,
    logging: false, // SQL 쿼리 로그 비활성화
    benchmark: false, // 벤치마크 로그 비활성화
    define: {
      timestamps: true,
      underscored: false,
      paranoid: true,
      freezeTableName: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    timezone: '+00:00', // UTC로 고정 - MySQL DATETIME 일관성 보장
  };
};

// Sequelize 인스턴스 생성
const dbConfig = getDbConfig();
const sequelize = new Sequelize(dbConfig);

// 연결 테스트 함수
export const testConnection = async () => {
  try {
    const config = getDbConfig();
    logger.info('DB Config Debug:', {
      dialect: config.dialect,
      storage: config.storage,
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password ? '[HIDDEN]' : 'EMPTY',
    });

    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    return false;
  }
};

// 데이터베이스 초기화 함수
export const initializeDatabase = async () => {
  try {
    // 연결 테스트 수행
    await sequelize.authenticate();
    const config = getDbConfig();
    logger.info('✅ MySQL 데이터베이스 연결 확인', {
      host: config.host,
      port: config.port,
      database: config.database
    });

    return true;
  } catch (error) {
    logger.error('❌ MySQL 데이터베이스 연결 실패:', error);
    throw error;
  }
};

export default sequelize;
