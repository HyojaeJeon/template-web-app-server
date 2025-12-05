/**
 * ===============================================
 * Template Project - 모델 인덱스
 * ===============================================
 * 기본 인증/사용자 관련 모델만 포함
 *
 * 📂 모델 구성:
 * - customer/User.js     - 고객 사용자
 * - web/WebAccount.js    - Web 클라이언트 계정
 * - admin/AdminAccount.js - 관리자 계정
 * - core/Tag.js          - 태그 (선택적)
 * ===============================================
 */

import sequelize from '../config/database.js';
import { Sequelize, Op } from 'sequelize';

// ===============================================
// 📂 고객 관련 (Customer Domain)
// ===============================================
import User, { initUser } from './customer/User.js';

// ===============================================
// 📂 Web 클라이언트 관련 (Web Domain)
// ===============================================
import WebAccount, { initWebAccount } from './web/WebAccount.js';

// ===============================================
// 📂 관리자 관련 (Admin Domain)
// ===============================================
import AdminAccount, { initAdminAccount } from './admin/AdminAccount.js';

// ===============================================
// 📂 코어 (Core Domain)
// ===============================================
import Tag from './core/Tag.js';

// ===============================================
// 모델 초기화
// ===============================================
const initializeModels = () => {
  // 초기화 함수가 있는 모델들
  initUser(sequelize);
  initWebAccount(sequelize);
  initAdminAccount(sequelize);
  // Tag는 이미 sequelize.define으로 초기화됨
};

// 모델 초기화 실행
initializeModels();

// ===============================================
// 모델 관계 설정 (필요시 추가)
// ===============================================
const setupAssociations = () => {
  // 관계 설정이 필요한 경우 여기에 추가
  // 예: User.hasMany(Order);
};

// 관계 설정 실행
setupAssociations();

// ===============================================
// 모델 통합 객체
// ===============================================
const db = {
  sequelize,
  Sequelize,
  Op,

  // Customer Domain
  User,

  // Web Domain
  WebAccount,

  // Admin Domain
  AdminAccount,

  // Core Domain
  Tag,

  // 초기화 함수들 (server.js에서 호출)
  initializeModels: async () => {
    // 이미 import 시점에 초기화됨 - 여기서는 동기화만 수행
    await sequelize.sync({ alter: false });
    console.log('✅ Models synchronized with database');
  },
};

// ===============================================
// 데이터베이스 연결 및 동기화
// ===============================================

/**
 * 데이터베이스 동기화
 * @param {Object} options - Sequelize sync 옵션
 * @returns {Promise<void>}
 */
export const syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    throw error;
  }
};

/**
 * 데이터베이스 연결 테스트
 * @returns {Promise<boolean>}
 */
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

/**
 * 데이터베이스 연결 종료
 * @returns {Promise<void>}
 */
export const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
};

// ===============================================
// Named Exports
// ===============================================
export {
  sequelize,
  Sequelize,
  Op,

  // Customer Domain
  User,

  // Web Domain
  WebAccount,

  // Admin Domain
  AdminAccount,

  // Core Domain
  Tag,
};

// ===============================================
// Default Export
// ===============================================
export default db;
