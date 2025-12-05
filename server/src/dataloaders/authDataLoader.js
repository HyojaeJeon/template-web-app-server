/**
 * Auth DataLoaders
 * @description 인증 관련 배치 로딩
 */

import DataLoader from 'dataloader';
import db from '../models/index.js';

/**
 * StoreAccount ID로 배치 로딩 (Web 클라이언트용)
 */
const createStoreAccountByIdLoader = () => {
  return new DataLoader(async (ids) => {
    const accounts = await db.StoreAccount.findAll({
      where: { id: ids },
      attributes: { exclude: ['passwordHash', 'refreshToken'] }
    });

    const accountMap = new Map(accounts.map(acc => [acc.id, acc]));
    return ids.map(id => accountMap.get(id) || null);
  });
};

/**
 * StoreAccount 이메일로 배치 로딩
 */
const createStoreAccountByEmailLoader = () => {
  return new DataLoader(async (emails) => {
    const accounts = await db.StoreAccount.findAll({
      where: { email: emails },
      attributes: { exclude: ['passwordHash', 'refreshToken'] }
    });

    const accountMap = new Map(accounts.map(acc => [acc.email, acc]));
    return emails.map(email => accountMap.get(email) || null);
  });
};

/**
 * 사용자 세션 배치 로딩
 */
const createUserSessionLoader = () => {
  return new DataLoader(async (userIds) => {
    // 세션 테이블이 있는 경우 구현
    // 현재는 빈 배열 반환
    return userIds.map(() => []);
  });
};

/**
 * Auth DataLoaders 생성
 */
export const createAuthDataLoaders = () => {
  return {
    storeAccountById: createStoreAccountByIdLoader(),
    storeAccountByEmail: createStoreAccountByEmailLoader(),
    userSessions: createUserSessionLoader()
  };
};

export default { createAuthDataLoaders };
