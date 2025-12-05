/**
 * Store Auth Domain Test Suite
 * 점주/매니저 인증 시스템 테스트
 * Date: 2025-09-17 - 최종 구현상태 반영
 */

import { gql } from 'graphql-tag';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// GraphQL Queries & Mutations
const STORE_LOGIN_WITH_PHONE = gql`
  mutation StoreLoginWithPhone($phone: String!, $password: String!) {
    sLoginWithPhone(phone: $phone, password: $password) {
      success
      message
      accessStoreToken
      refreshStoreToken
      expiresIn
      storeAccount {
        id
        fullName
        phone
        email
        role
        isActive
      }
      store {
        id
        storeName
        storePhone
        address
        status
      }
    }
  }
`;

const STORE_REGISTER = gql`
  mutation StoreRegister($input: StoreRegisterInput!) {
    sRegisterStore(input: $input) {
      success
      message
      accessStoreToken
      refreshStoreToken
      expiresIn
      storeAccount {
        id
        fullName
        phone
        email
        role
      }
      store {
        id
        storeName
        storePhone
        address
      }
    }
  }
`;

const GET_STORE_PROFILE = gql`
  query GetStoreProfile {
    sGetProfile {
      id
      fullName
      phone
      email
      role
      isActive
      createdAt
      avatarUrl
      businessRegistrationNumber
    }
  }
`;

const GET_MY_STORE = gql`
  query GetMyStore {
    sGetMyStore {
      id
      storeName
      storePhone
      address
      status
      businessRegistrationNumber
      isActive
      createdAt
    }
  }
`;

const STORE_REFRESH_TOKEN = gql`
  mutation StoreRefreshToken($refreshStoreToken: String!) {
    sRefreshToken(refreshStoreToken: $refreshStoreToken) {
      success
      message
      accessStoreToken
      refreshStoreToken
      expiresIn
    }
  }
`;

const STORE_LOGOUT = gql`
  mutation StoreLogout {
    sLogout {
      success
      message
    }
  }
`;

const UPDATE_STORE_PROFILE = gql`
  mutation UpdateStoreProfile($input: StoreUpdateProfileInput!) {
    sUpdateProfile(input: $input) {
      success
      message
      storeAccount {
        id
        fullName
        email
        avatarUrl
        businessRegistrationNumber
      }
    }
  }
`;

const CHANGE_STORE_PASSWORD = gql`
  mutation ChangeStorePassword($input: StoreChangePasswordInput!) {
    sChangePassword(input: $input) {
      success
      message
    }
  }
`;

describe('Store Auth Domain - Integration Tests', () => {
  let server;
  let mutate;
  let query;
  let testStoreAccount;
  let testStore;
  let validAccessToken;
  let validRefreshToken;

  // 테스트 데이터
  const testPhone = '+84901234567';
  const testPassword = 'testpassword123';
  const testEmail = 'test@store.com';

  beforeAll(async () => {
    // Apollo Server 테스트 클라이언트 설정
    const testClient = createTestClient(server);
    query = testClient.query;
    mutate = testClient.mutate;

    // 테스트용 점주 계정 생성
    const hashedPassword = await bcrypt.hash(testPassword, 12);

    // 실제 DB에 테스트 데이터 삽입 (또는 모킹)
    testStoreAccount = {
      id: 'test-store-account-1',
      fullName: '테스트 점주',
      phone: testPhone,
      email: testEmail,
      password: hashedPassword,
      role: 'OWNER',
      isActive: true
    };

    testStore = {
      id: 'test-store-1',
      storeName: '테스트 레스토랑',
      storePhone: testPhone,
      address: 'Local 호치민시 테스트 주소',
      status: 'ACTIVE',
      ownerId: testStoreAccount.id
    };
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    // await cleanupTestData();
  });

  beforeEach(() => {
    // 각 테스트 전 상태 초기화
    validAccessToken = null;
    validRefreshToken = null;
  });

  describe('Store Registration (점주 회원가입)', () => {
    it('should register new store account successfully', async () => {
      const registerInput = {
        phone: '+84987654321',
        email: 'newstore@test.com',
        password: 'newpassword123',
        fullName: '신규 점주',
        storeName: '신규 레스토랑',
        storePhone: '+84987654321',
        address: 'Local 호치민시 신규 주소',
        businessRegistrationNumber: '1234567890',
        termsAccepted: true,
        privacyAccepted: true,
        marketingAccepted: false
      };

      const result = await mutate({
        mutation: STORE_REGISTER,
        variables: { input: registerInput }
      });

      expect(result.errors).toBeUndefined();
      expect(result.data.sRegisterStore.success).toBe(true);
      expect(result.data.sRegisterStore.accessStoreToken).toBeDefined();
      expect(result.data.sRegisterStore.refreshStoreToken).toBeDefined();
      expect(result.data.sRegisterStore.storeAccount.phone).toBe(registerInput.phone);
      expect(result.data.sRegisterStore.store.storeName).toBe(registerInput.storeName);
    });

    it('should fail registration with duplicate phone', async () => {
      const registerInput = {
        phone: testPhone, // 이미 존재하는 전화번호
        email: 'duplicate@test.com',
        password: 'password123',
        fullName: '중복 점주',
        storeName: '중복 레스토랑',
        storePhone: testPhone,
        address: '중복 주소',
        termsAccepted: true,
        privacyAccepted: true
      };

      const result = await mutate({
        mutation: STORE_REGISTER,
        variables: { input: registerInput }
      });

      expect(result.errors).toBeDefined();
      // S2xxx 에러 코드 확인 (인증/인가 에러)
      expect(result.errors[0].extensions.code).toMatch(/^S2/);
    });

    it('should fail registration without required terms acceptance', async () => {
      const registerInput = {
        phone: '+84999888777',
        password: 'password123',
        fullName: '약관 미동의 점주',
        storeName: '약관 미동의 레스토랑',
        storePhone: '+84999888777',
        address: '약관 미동의 주소',
        termsAccepted: false, // 약관 미동의
        privacyAccepted: true
      };

      const result = await mutate({
        mutation: STORE_REGISTER,
        variables: { input: registerInput }
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('S2003'); // TERMS_NOT_ACCEPTED
    });
  });

  describe('Store Login (점주 로그인)', () => {
    it('should login with valid phone and password', async () => {
      const result = await mutate({
        mutation: STORE_LOGIN_WITH_PHONE,
        variables: {
          phone: testPhone,
          password: testPassword
        }
      });

      expect(result.errors).toBeUndefined();
      expect(result.data.sLoginWithPhone.success).toBe(true);
      expect(result.data.sLoginWithPhone.accessStoreToken).toBeDefined();
      expect(result.data.sLoginWithPhone.refreshStoreToken).toBeDefined();
      expect(result.data.sLoginWithPhone.expiresIn).toBeGreaterThan(0);
      expect(result.data.sLoginWithPhone.storeAccount.phone).toBe(testPhone);

      // 토큰 저장 (후속 테스트용)
      validAccessToken = result.data.sLoginWithPhone.accessStoreToken;
      validRefreshToken = result.data.sLoginWithPhone.refreshStoreToken;

      // JWT 토큰 검증
      const decoded = jwt.decode(validAccessToken);
      expect(decoded).toBeDefined();
      expect(decoded.type).toBe('store');
      expect(decoded.storeAccountId).toBeDefined();
    });

    it('should fail login with invalid phone', async () => {
      const result = await mutate({
        mutation: STORE_LOGIN_WITH_PHONE,
        variables: {
          phone: '+84999999999', // 존재하지 않는 번호
          password: testPassword
        }
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('S2001'); // INVALID_CREDENTIALS
    });

    it('should fail login with wrong password', async () => {
      const result = await mutate({
        mutation: STORE_LOGIN_WITH_PHONE,
        variables: {
          phone: testPhone,
          password: 'wrongpassword'
        }
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('S2001'); // INVALID_CREDENTIALS
    });
  });

  describe('Store Profile Queries (점주 프로필 조회)', () => {
    beforeEach(async () => {
      // 로그인하여 유효한 토큰 얻기
      const loginResult = await mutate({
        mutation: STORE_LOGIN_WITH_PHONE,
        variables: { phone: testPhone, password: testPassword }
      });
      validAccessToken = loginResult.data.sLoginWithPhone.accessStoreToken;
    });

    it('should get current store profile with valid token', async () => {
      const result = await query({
        query: GET_STORE_PROFILE,
        context: {
          headers: {
            authorization: `Bearer ${validAccessToken}`
          }
        }
      });

      expect(result.errors).toBeUndefined();
      expect(result.data.sGetProfile).toBeDefined();
      expect(result.data.sGetProfile.phone).toBe(testPhone);
      expect(result.data.sGetProfile.role).toBe('OWNER');
      expect(result.data.sGetProfile.isActive).toBe(true);
    });

    it('should get my store information', async () => {
      const result = await query({
        query: GET_MY_STORE,
        context: {
          headers: {
            authorization: `Bearer ${validAccessToken}`
          }
        }
      });

      expect(result.errors).toBeUndefined();
      expect(result.data.sGetMyStore).toBeDefined();
      expect(result.data.sGetMyStore.storeName).toBeDefined();
      expect(result.data.sGetMyStore.status).toBe('ACTIVE');
    });

    it('should fail to get profile without token', async () => {
      const result = await query({
        query: GET_STORE_PROFILE
        // context에 authorization 헤더 없음
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('S2002'); // AUTHENTICATION_REQUIRED
    });

    it('should fail to get profile with invalid token', async () => {
      const result = await query({
        query: GET_STORE_PROFILE,
        context: {
          headers: {
            authorization: 'Bearer invalid-token'
          }
        }
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('S2004'); // INVALID_TOKEN
    });
  });

  describe('Token Management (토큰 관리)', () => {
    beforeEach(async () => {
      // 로그인하여 유효한 토큰 얻기
      const loginResult = await mutate({
        mutation: STORE_LOGIN_WITH_PHONE,
        variables: { phone: testPhone, password: testPassword }
      });
      validAccessToken = loginResult.data.sLoginWithPhone.accessStoreToken;
      validRefreshToken = loginResult.data.sLoginWithPhone.refreshStoreToken;
    });

    it('should refresh token successfully', async () => {
      const result = await mutate({
        mutation: STORE_REFRESH_TOKEN,
        variables: {
          refreshStoreToken: validRefreshToken
        }
      });

      expect(result.errors).toBeUndefined();
      expect(result.data.sRefreshToken.success).toBe(true);
      expect(result.data.sRefreshToken.accessStoreToken).toBeDefined();
      expect(result.data.sRefreshToken.refreshStoreToken).toBeDefined();
      expect(result.data.sRefreshToken.expiresIn).toBeGreaterThan(0);

      // 새 토큰이 이전 토큰과 다른지 확인
      expect(result.data.sRefreshToken.accessStoreToken).not.toBe(validAccessToken);
    });

    it('should fail to refresh with invalid refresh token', async () => {
      const result = await mutate({
        mutation: STORE_REFRESH_TOKEN,
        variables: {
          refreshStoreToken: 'invalid-refresh-token'
        }
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('S2005'); // INVALID_REFRESH_TOKEN
    });

    it('should logout successfully', async () => {
      const result = await mutate({
        mutation: STORE_LOGOUT,
        context: {
          headers: {
            authorization: `Bearer ${validAccessToken}`
          }
        }
      });

      expect(result.errors).toBeUndefined();
      expect(result.data.sLogout.success).toBe(true);

      // 로그아웃 후 토큰으로 프로필 조회 시 실패해야 함
      const profileResult = await query({
        query: GET_STORE_PROFILE,
        context: {
          headers: {
            authorization: `Bearer ${validAccessToken}`
          }
        }
      });

      expect(profileResult.errors).toBeDefined();
      expect(profileResult.errors[0].extensions.code).toBe('S2006'); // TOKEN_REVOKED
    });
  });

  describe('Store Profile Updates (점주 프로필 수정)', () => {
    beforeEach(async () => {
      const loginResult = await mutate({
        mutation: STORE_LOGIN_WITH_PHONE,
        variables: { phone: testPhone, password: testPassword }
      });
      validAccessToken = loginResult.data.sLoginWithPhone.accessStoreToken;
    });

    it('should update profile successfully', async () => {
      const updateInput = {
        fullName: '업데이트된 점주명',
        email: 'updated@store.com',
        businessRegistrationNumber: '9876543210',
        taxEmail: 'tax@store.com'
      };

      const result = await mutate({
        mutation: UPDATE_STORE_PROFILE,
        variables: { input: updateInput },
        context: {
          headers: {
            authorization: `Bearer ${validAccessToken}`
          }
        }
      });

      expect(result.errors).toBeUndefined();
      expect(result.data.sUpdateProfile.success).toBe(true);
      expect(result.data.sUpdateProfile.storeAccount.fullName).toBe(updateInput.fullName);
      expect(result.data.sUpdateProfile.storeAccount.email).toBe(updateInput.email);
    });

    it('should change password successfully', async () => {
      const changePasswordInput = {
        currentPassword: testPassword,
        newPassword: 'newpassword123'
      };

      const result = await mutate({
        mutation: CHANGE_STORE_PASSWORD,
        variables: { input: changePasswordInput },
        context: {
          headers: {
            authorization: `Bearer ${validAccessToken}`
          }
        }
      });

      expect(result.errors).toBeUndefined();
      expect(result.data.sChangePassword.success).toBe(true);

      // 새 비밀번호로 로그인 테스트
      const loginResult = await mutate({
        mutation: STORE_LOGIN_WITH_PHONE,
        variables: {
          phone: testPhone,
          password: 'newpassword123'
        }
      });

      expect(loginResult.errors).toBeUndefined();
      expect(loginResult.data.sLoginWithPhone.success).toBe(true);
    });

    it('should fail to change password with wrong current password', async () => {
      const changePasswordInput = {
        currentPassword: 'wrongcurrent',
        newPassword: 'newpassword123'
      };

      const result = await mutate({
        mutation: CHANGE_STORE_PASSWORD,
        variables: { input: changePasswordInput },
        context: {
          headers: {
            authorization: `Bearer ${validAccessToken}`
          }
        }
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('S2001'); // INVALID_CREDENTIALS
    });
  });

  describe('Store Auth Security Tests (보안 테스트)', () => {
    it('should handle SQL injection attempts', async () => {
      const maliciousPhone = "'+84901234567'; DROP TABLE storeAccounts; --";

      const result = await mutate({
        mutation: STORE_LOGIN_WITH_PHONE,
        variables: {
          phone: maliciousPhone,
          password: testPassword
        }
      });

      expect(result.errors).toBeDefined();
      // DB가 안전하게 보호되어야 함
    });

    it('should rate limit login attempts', async () => {
      // 연속 로그인 실패 시도
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          mutate({
            mutation: STORE_LOGIN_WITH_PHONE,
            variables: {
              phone: testPhone,
              password: 'wrongpassword'
            }
          })
        );
      }

      const results = await Promise.all(promises);

      // 마지막 몇 개 요청은 rate limit 에러가 발생해야 함
      const lastResult = results[results.length - 1];
      expect(lastResult.errors).toBeDefined();
      expect(lastResult.errors[0].extensions.code).toBe('S1003'); // RATE_LIMIT_EXCEEDED
    });

    it('should validate JWT token expiration', async () => {
      // 만료된 토큰 시뮬레이션 (실제로는 짧은 만료 시간으로 토큰 생성)
      const expiredToken = jwt.sign(
        {
          storeAccountId: testStoreAccount.id,
          type: 'store',
          exp: Math.floor(Date.now() / 1000) - 3600 // 1시간 전 만료
        },
        process.env.JWT_SECRET || 'test-secret'
      );

      const result = await query({
        query: GET_STORE_PROFILE,
        context: {
          headers: {
            authorization: `Bearer ${expiredToken}`
          }
        }
      });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('S2007'); // TOKEN_EXPIRED
    });
  });

  describe('Store Auth Integration Tests (통합 테스트)', () => {
    it('should complete full authentication flow', async () => {
      // 1. 회원가입
      const registerInput = {
        phone: '+84123456789',
        email: 'integration@test.com',
        password: 'testpass123',
        fullName: '통합테스트 점주',
        storeName: '통합테스트 레스토랑',
        storePhone: '+84123456789',
        address: '통합테스트 주소',
        termsAccepted: true,
        privacyAccepted: true
      };

      const registerResult = await mutate({
        mutation: STORE_REGISTER,
        variables: { input: registerInput }
      });

      expect(registerResult.errors).toBeUndefined();
      const { accessStoreToken, refreshStoreToken } = registerResult.data.sRegisterStore;

      // 2. 프로필 조회
      const profileResult = await query({
        query: GET_STORE_PROFILE,
        context: {
          headers: {
            authorization: `Bearer ${accessStoreToken}`
          }
        }
      });

      expect(profileResult.errors).toBeUndefined();
      expect(profileResult.data.sGetProfile.phone).toBe(registerInput.phone);

      // 3. 토큰 갱신
      const refreshResult = await mutate({
        mutation: STORE_REFRESH_TOKEN,
        variables: { refreshStoreToken }
      });

      expect(refreshResult.errors).toBeUndefined();
      const newAccessToken = refreshResult.data.sRefreshToken.accessStoreToken;

      // 4. 새 토큰으로 프로필 업데이트
      const updateResult = await mutate({
        mutation: UPDATE_STORE_PROFILE,
        variables: {
          input: {
            fullName: '업데이트된 이름'
          }
        },
        context: {
          headers: {
            authorization: `Bearer ${newAccessToken}`
          }
        }
      });

      expect(updateResult.errors).toBeUndefined();
      expect(updateResult.data.sUpdateProfile.storeAccount.fullName).toBe('업데이트된 이름');

      // 5. 로그아웃
      const logoutResult = await mutate({
        mutation: STORE_LOGOUT,
        context: {
          headers: {
            authorization: `Bearer ${newAccessToken}`
          }
        }
      });

      expect(logoutResult.errors).toBeUndefined();
      expect(logoutResult.data.sLogout.success).toBe(true);
    });
  });
});
