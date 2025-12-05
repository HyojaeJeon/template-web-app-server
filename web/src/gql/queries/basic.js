/**
 * Web Client Basic Queries
 * 기본 쿼리들 정의
 *
 * @author Template Project
 */

import { gql } from '@apollo/client';

// 서버 연결 테스트용
export const HEALTH_CHECK = gql`
  query HealthCheck {
    health
  }
`;

// 현재 시간 조회 (테스트용)
export const GET_SERVER_TIME = gql`
  query GetServerTime {
    serverTime
  }
`;
