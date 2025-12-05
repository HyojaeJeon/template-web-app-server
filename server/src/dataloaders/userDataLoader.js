/**
 * User DataLoaders
 * @description 사용자 관련 배치 로딩
 */

import DataLoader from 'dataloader';
import db from '../models/index.js';

/**
 * 사용자 ID로 배치 로딩
 */
const createUserByIdLoader = () => {
  return new DataLoader(async (ids) => {
    const users = await db.User.findAll({
      where: { id: ids },
      attributes: { exclude: ['passwordHash', 'refreshToken'] }
    });

    const userMap = new Map(users.map(user => [user.id, user]));
    return ids.map(id => userMap.get(id) || null);
  });
};

/**
 * 전화번호로 사용자 배치 로딩
 */
const createUserByPhoneLoader = () => {
  return new DataLoader(async (phones) => {
    const users = await db.User.findAll({
      where: { phone: phones },
      attributes: { exclude: ['passwordHash', 'refreshToken'] }
    });

    const userMap = new Map(users.map(user => [user.phone, user]));
    return phones.map(phone => userMap.get(phone) || null);
  });
};

/**
 * 이메일로 사용자 배치 로딩
 */
const createUserByEmailLoader = () => {
  return new DataLoader(async (emails) => {
    const users = await db.User.findAll({
      where: { email: emails },
      attributes: { exclude: ['passwordHash', 'refreshToken'] }
    });

    const userMap = new Map(users.map(user => [user.email, user]));
    return emails.map(email => userMap.get(email) || null);
  });
};

/**
 * User DataLoaders 생성
 */
export const createUserDataLoaders = () => {
  return {
    userById: createUserByIdLoader(),
    userByPhone: createUserByPhoneLoader(),
    userByEmail: createUserByEmailLoader()
  };
};

export default { createUserDataLoaders };
