/**
 * DataLoader 시스템
 * @description GraphQL N+1 쿼리 문제 해결을 위한 배치 로딩
 */

import DataLoader from 'dataloader';
import { createUserDataLoaders } from './userDataLoader.js';
import { createAuthDataLoaders } from './authDataLoader.js';

/**
 * 모든 DataLoader를 생성하는 팩토리 함수
 * @description 요청별 독립적인 DataLoader 인스턴스 생성
 * @returns {Object} DataLoader 인스턴스 컬렉션
 */
export const createDataLoaders = () => {
  return {
    ...createUserDataLoaders(),
    ...createAuthDataLoaders()
  };
};

/**
 * GraphQL Context용 DataLoader 컨텍스트 생성
 * @returns {Promise<Object>} DataLoader 컨텍스트
 */
export const createDataLoaderContext = async () => {
  const loaders = createDataLoaders();

  return {
    loaders,
    cache: new Map()
  };
};

export default {
  createDataLoaders,
  createDataLoaderContext
};
