/**
 * Socket Manager
 * ==============
 * Socket.IO 클라이언트의 저수준 관리를 담당하는 싱글톤 클래스
 *
 * 주요 역할:
 * 1. Socket.IO 연결 생명주기 관리
 * 2. 토큰 기반 인증 처리
 * 3. 자동 재연결 및 백오프 전략
 * 4. 룸(Room) 관리 및 복원
 * 5. 이벤트 리스너 관리
 *
 * 아키텍처 위치:
 * - 최하위 레벨: 직접 Socket.IO와 통신
 * - Apollo tokenManager와 통합
 * - UnifiedSocketProvider에 의해 사용됨
 *
 * 특징:
 * - 싱글톤 패턴으로 앱 전체에서 단일 인스턴스 사용
 * - React 18+ useSyncExternalStore 패턴 지원
 * - 플랫폼별 (iOS/Android) 엔드포인트 자동 설정
 */

import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import Config from 'react-native-config';
import {
  getValidToken,
  subscribeToTokenChanges
} from '@services/apollo/tokenManager';
import logger from '@shared/utils/system/logger';

/**
 * 개발 환경 설정
 * httpLink.js와 동일한 설정 사용
 */
const USE_REAL_DEVICE = false; // ⚠️ 실제 기기 테스트 시: true, 시뮬레이터 테스트 시: false
const MAC_LOCAL_IP = '192.168.1.64'; // Mac의 로컬 IP 주소

/**
 * Socket.IO 엔드포인트 URL 결정
 *
 * 환경과 플랫폼에 따라 적절한 WebSocket 엔드포인트 반환:
 * - Production: wss://api.deliveryvn.com (보안 WebSocket)
 * - Development (실제 기기): ws://[Mac IP]:4000
 * - Development (시뮬레이터/에뮬레이터): ws://localhost:4000 또는 ws://10.0.2.2:4000
 */
const getSocketEndpoint = () => {
  if (!__DEV__) {
    // 프로덕션 환경: 보안 WebSocket 사용
    return 'wss://api.deliveryvn.com';
  }

  // 개발 환경
  let url;

  if (Platform.OS === 'ios') {
    // iOS: 실제 기기 vs 시뮬레이터
    if (USE_REAL_DEVICE) {
      url = `ws://${MAC_LOCAL_IP}:4000`;
      logger.info('📱 iOS Real Device - Socket.IO endpoint:', url);
    } else {
      url = 'ws://localhost:4000';
      logger.info('🖥️ iOS Simulator - Socket.IO endpoint:', url);
    }
  } else {
    // Android: 실제 기기 vs 에뮬레이터
    if (USE_REAL_DEVICE) {
      url = `ws://${MAC_LOCAL_IP}:4000`;
      logger.info('📱 Android Real Device - Socket.IO endpoint:', url);
    } else {
      url = 'ws://10.0.2.2:4000';
      logger.info('🤖 Android Emulator - Socket.IO endpoint:', url);
    }
  }

  return url;
};

/**
 * SocketManager 클래스
 * --------------------
 * Socket.IO 연결을 관리하는 핵심 클래스
 * 싱글톤 패턴으로 구현되어 앱 전체에서 하나의 인스턴스만 사용
 */
class SocketManager {
  constructor() {
    // ============================================
    // 인스턴스 변수 초기화
    // ============================================
    this.socket = null;                                    // Socket.IO 인스턴스
    this.state = { status: 'DISCONNECTED', error: null };  // 연결 상태
    this.listeners = new Set();                            // 상태 구독자들 (React 컴포넌트)
    this.tokenSubscription = null;                         // 토큰 변경 구독
    this.eventHandlers = new Map();                        // 이벤트 핸들러 저장소
    this.rooms = new Set();                                // 참가한 룸 목록 ('type:id' 형태)
    this.tokenRefreshAttempts = 0;                         // 토큰 갱신 시도 횟수
    this.maxTokenRefreshAttempts = 3;                      // 최대 토큰 갱신 시도 횟수
  }

  /**
   * 상태 구독 메서드 (useSyncExternalStore 패턴)
   * ---------------------------------------------
   * React 18의 useSyncExternalStore 훅과 호환되는 구독 메서드
   *
   * @param {Function} listener - 상태 변경 시 호출될 콜백
   * @returns {Function} 구독 해제 함수
   *
   * 사용 예시:
   * ```javascript
   * const unsubscribe = socketManager.subscribe((state) => {
   *   console.log('Socket state changed:', state);
   * });
   * ```
   */
  subscribe(listener) {
    this.listeners.add(listener);
    // 구독 해제 함수 반환 (cleanup용)
    return () => this.listeners.delete(listener);
  }

  /**
   * 상태 변경 알림 (내부 메서드)
   * ---------------------------
   * 상태가 변경될 때 모든 구독자에게 알림
   * React 컴포넌트의 리렌더링을 트리거
   */
  _emit() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  /**
   * 현재 상태 스냅샷 반환 (useSyncExternalStore 패턴)
   * ------------------------------------------------
   * React가 현재 상태를 읽을 때 사용
   *
   * @returns {Object} 현재 상태 객체 { status, error }
   */
  getSnapshot() {
    return this.state;
  }

  /**
   * Socket 연결 초기화
   * ------------------
   * 새로운 Socket.IO 연결을 생성하고 초기화
   *
   * @param {string} token - JWT 액세스 토큰 (선택적)
   * @param {Object} opts - 연결 옵션
   * @param {number} opts.reconnectionAttempts - 최대 재연결 시도 횟수
   * @param {number} opts.reconnectionDelay - 초기 재연결 지연 시간
   * @param {number} opts.reconnectionDelayMax - 최대 재연결 지연 시간
   * @returns {Promise<Socket>} Socket.IO 인스턴스
   *
   * 워크플로우:
   * 1. 기존 연결 정리
   * 2. 토큰 확인/가져오기
   * 3. Socket.IO 인스턴스 생성
   * 4. 이벤트 리스너 설정
   * 5. 토큰 구독 설정
   * 6. 연결 시작
   */
  async connect(token = null, opts = {}) {
    // 기존 소켓이 있으면 정리 (중복 연결 방지)
    this.disconnect();

    try {
      // ============================================
      // 1. 토큰 준비
      // ============================================
      if (!token) {
        // 토큰이 제공되지 않으면 tokenManager에서 가져오기
        token = await getValidToken();
      }

      const endpoint = getSocketEndpoint();
      logger.info('[SocketManager] Connecting to:', endpoint);

      // ============================================
      // 2. Socket.IO 연결 옵션 설정
      // ============================================
      const options = {
        // 전송 방식: WebSocket만 사용 (폴링 비활성화)
        transports: ['websocket'],

        // 자동 연결 비활성화 (수동으로 connect() 호출)
        autoConnect: false,

        // ✅ Socket.IO 내장 재연결 기능 활성화
        reconnection: true,
        reconnectionAttempts: opts.reconnectionAttempts ?? 3,      // 기본 3회 시도
        reconnectionDelay: opts.reconnectionDelay ?? 1000,         // 첫 재시도 1초 후
        reconnectionDelayMax: opts.reconnectionDelayMax ?? 5000,   // 최대 5초 간격

        // 연결 타임아웃 (10초)
        timeout: 10000,

        // HTTP 폴링으로 업그레이드 비활성화
        upgrade: false,

        // ✅ 인증 정보 전달 (서버의 단일 소켓 구조에 맞춤)
        auth: token ? {
          token: token,           // JWT 토큰 (Bearer prefix 없이)
          clientType: 'mobile',   // 필수: 클라이언트 타입 (mobile/store 구분)
          platform: Platform.OS   // 추가 정보: ios/android
        } : undefined
      };

      // ============================================
      // 3. Socket 인스턴스 생성
      // ============================================
      // 단일 소켓 구조 (네임스페이스 없음)
      this.socket = io(endpoint, options);

      // ============================================
      // 4. 상태 업데이트
      // ============================================
      this.state = { status: 'CONNECTING', error: null };
      this._emit();

      // ============================================
      // 5. 이벤트 리스너 및 구독 설정
      // ============================================
      this.setupDefaultListeners();  // 기본 이벤트 리스너
      this.setupTokenSubscription();  // 토큰 변경 감지

      // ============================================
      // 6. 연결 시작
      // ============================================
      this.socket.connect();

      return this.socket;
    } catch (error) {
      logger.error('[SocketManager] Connection failed:', error);
      this.state = { status: 'ERROR', error: error.message };
      this._emit();
      throw error;
    }
  }


  /**
   * 기본 이벤트 리스너 설정
   * ----------------------
   * Socket.IO의 시스템 이벤트를 처리하는 리스너들을 설정
   *
   * 처리하는 이벤트:
   * - connect: 연결 성공
   * - connect_error: 연결 에러 (인증 실패 포함)
   * - disconnect: 연결 끊김
   * - reconnect_attempt: 재연결 시도
   * - reconnect_failed: 재연결 실패
   */
  setupDefaultListeners() {
    if (!this.socket) return;

    // ============================================
    // 1. 연결 성공 이벤트
    // ============================================
    this.socket.on('connect', () => {
      logger.info('[SocketManager] Connected to single socket:', {
        socketId: this.socket.id,
        endpoint: getSocketEndpoint(),
        platform: Platform.OS
      });

      // 상태를 AUTHENTICATED로 변경
      this.state = { status: 'AUTHENTICATED', error: null };
      this._emit();

      // ✅ 룸 자동 복원
      // 재연결 시 이전에 참가했던 룸들을 자동으로 다시 참가
      if (this.rooms.size > 0) {
        logger.info('[SocketManager] Restoring rooms:', Array.from(this.rooms));
        for (const roomKey of this.rooms) {
          const [type, id] = roomKey.split(':');
          // 채팅 룸은 chat:join_room 이벤트 사용
          if (type === 'chat') {
            this.socket.emit('chat:join_room', { roomId: id });
          } else {
            // 서버가 기대하는 형식: { roomId: 'type:id' }
            this.socket.emit('joinRoom', { roomId: roomKey });
          }
        }
      }

      // ✅ 이벤트 핸들러 자동 복원
      // 재연결 시 이전에 등록했던 이벤트 리스너들을 자동으로 다시 등록
      if (this.eventHandlers.size > 0) {
        const totalHandlers = Array.from(this.eventHandlers.values()).reduce((sum, set) => sum + set.size, 0);
        logger.info('[SocketManager] 🔄 Restoring event handlers:', {
          events: Array.from(this.eventHandlers.keys()),
          totalHandlers,
          chatReceivedHandlers: this.eventHandlers.get('chat:received')?.size || 0,
          chatTypingHandlers: this.eventHandlers.get('chat:typing')?.size || 0
        });

        let restoredCount = 0;
        for (const [event, handlers] of this.eventHandlers.entries()) {
          for (const handler of handlers) {
            this.socket.on(event, handler);
            restoredCount++;
            logger.debug(`[SocketManager] ✅ Restored handler ${restoredCount} for '${event}'`);
          }
        }

        logger.info(`[SocketManager] 🎉 Successfully restored ${restoredCount} event handlers`);
      } else {
        logger.warn('[SocketManager] ⚠️ No event handlers to restore!');
      }

      // 연결 성공 이벤트를 로컬로 전파 (컴포넌트에서 활용)
      this.emitLocalEvent('socket:connected', { id: this.socket.id });
    });

    // ============================================
    // 2. 연결 에러 이벤트
    // ============================================
    this.socket.on('connect_error', async (error) => {
      const errorMessage = (error?.message || '').toLowerCase();

      // JWT 토큰 만료 감지
      const isTokenExpired = errorMessage.includes('expired') ||
                            errorMessage.includes('jwt expired') ||
                            errorMessage.includes('token expired');

      // 토큰 만료 에러는 정상적인 프로세스이므로 정보 레벨로 로깅
      if (!isTokenExpired) {
        // 토큰 만료가 아닌 다른 에러만 사용자에게 노출
        logger.error('[SocketManager] Connection error:', error.message);
      } else {
        // 토큰 만료는 정보성 로그로 표시 (정상적인 토큰 갱신 과정)
        logger.info('[SocketManager] 토큰 만료 감지 - 자동 갱신 중...');
      }

      if (isTokenExpired) {
        // 토큰 갱신 시도 횟수 체크
        if (this.tokenRefreshAttempts >= this.maxTokenRefreshAttempts) {
          logger.warn('[SocketManager] 토큰 갱신 최대 시도 횟수 초과 - 재연결 중단');
          this.disconnect();
          this.tokenRefreshAttempts = 0; // 카운터 리셋
          return;
        }

        this.tokenRefreshAttempts++;
        logger.info(`[SocketManager] 토큰 갱신 시도 중... (${this.tokenRefreshAttempts}/${this.maxTokenRefreshAttempts})`);

        try {
          // ============================================
          // 토큰 자동 갱신 시도
          // ============================================
          // 지수적 백오프 + 지터 적용 (tight loop 방지)
          const attempt = this.tokenRefreshAttempts;
          const jitter = Math.floor(Math.random() * 200); // 0~200ms
          const backoff = Math.min(500 * Math.pow(2, Math.max(0, attempt - 1)) + jitter, 5000);
          await new Promise(resolve => setTimeout(resolve, backoff));

          const { refreshToken } = await import('@services/apollo/tokenManager');
          const newToken = await refreshToken();

          if (newToken) {
            logger.info('[SocketManager] 토큰 갱신 성공 - 소켓 재연결 중...');
            this.tokenRefreshAttempts = 0; // 성공 시 카운터 리셋

            // 새 토큰으로 인증 정보 업데이트
            this.socket.auth = {
              token: newToken,
              clientType: 'mobile',
              platform: Platform.OS
            };
            // Socket.IO가 자동으로 재연결 시도
          } else {
            // 토큰 갱신 실패 - 재연결 중단
            logger.warn('[SocketManager] 토큰 갱신 실패 - 재연결 중단');
            this.socket.io.opts.reconnection = false;  // 자동 재연결 비활성화
            this.state = { status: 'ERROR', error: 'Authentication failed' };
            this._emit();
          }
        } catch (err) {
          logger.error(`[SocketManager] 토큰 갱신 중 오류 발생: ${err?.message || err}`);
          this.socket.io.opts.reconnection = false;
          this.state = { status: 'ERROR', error: 'Authentication failed' };
          this._emit();
        }
      }
      // 기타 인증 에러 감지 (401, unauthorized 등)
      else if (errorMessage.includes('401') ||
               errorMessage.includes('unauth') ||
               errorMessage.includes('invalid token') ||
               errorMessage.includes('authentication failed')) {

        logger.info('[SocketManager] Auth error detected, stopping reconnection');
        this.socket.io.opts.reconnection = false;  // 재연결 중단
        this.state = { status: 'ERROR', error: 'Authentication failed' };
        this._emit();
      }
      // 일반 연결 에러 (네트워크 문제 등)
      else {
        this.state = { status: 'ERROR', error: error?.message || String(error) };
        this._emit();
        // Socket.IO가 자동으로 재연결 시도
      }

      // 에러 이벤트 로컬 전파
      this.emitLocalEvent('socket:error', { error: error.message });
    });

    // ============================================
    // 3. 연결 끊김 이벤트
    // ============================================
    this.socket.on('disconnect', (reason) => {
      logger.warn('[SocketManager] Disconnected:', reason);

      // 연결 끊김 이유:
      // - 'io server disconnect': 서버가 연결을 끊음
      // - 'io client disconnect': 클라이언트가 연결을 끊음
      // - 'ping timeout': 핑 타임아웃
      // - 'transport close': 전송 계층 닫힘
      // - 'transport error': 전송 계층 에러

      this.state = { status: 'DISCONNECTED', error: null };
      this._emit();

      // 연결 끊김 이벤트 로컬 전파
      this.emitLocalEvent('socket:disconnected', { reason });
    });

    // ============================================
    // 4. 재연결 시도 이벤트 (Socket.IO 내장)
    // ============================================
    this.socket.io.on('reconnect_attempt', (attemptNumber) => {
      logger.info(`[SocketManager] Reconnect attempt ${attemptNumber}`);
      this.state = { status: 'CONNECTING', error: null };
      this._emit();
    });

    // ============================================
    // 5. 재연결 실패 이벤트
    // ============================================
    this.socket.io.on('reconnect_failed', () => {
      logger.error('[SocketManager] Reconnection failed');
      this.state = { status: 'ERROR', error: 'Maximum reconnection attempts reached' };
      this._emit();
    });
  }

  /**
   * 토큰 변경 구독 설정
   * ------------------
   * Apollo tokenManager의 토큰 변경을 감지하여 Socket 재연결 처리
   *
   * 시나리오:
   * 1. 로그인: 새 토큰으로 연결
   * 2. 로그아웃: 연결 해제
   * 3. 토큰 갱신: 새 토큰으로 재연결
   */
  setupTokenSubscription() {
    // 이전 구독이 있으면 정리
    if (this.tokenSubscription) {
      this.tokenSubscription();
    }

    // 현재 토큰 저장 (변경 감지용)
    let previousToken = null;

    // tokenManager의 토큰 변경 이벤트 구독
    this.tokenSubscription = subscribeToTokenChanges(
      async ({ accessToken, isAuthenticated }) => {
        // 토큰이 실제로 변경되었는지 확인 (중복 재연결 방지)
        if (previousToken === accessToken) {
          return;
        }
        previousToken = accessToken;

        if (!this.socket) return;

        // 인증 상태에 따른 처리
        if (isAuthenticated && accessToken) {
          // 소켓이 이미 연결되어 있고 정상 상태라면 auth만 업데이트
          if (this.socket.connected) {
            logger.info('[SocketManager] 토큰 변경 감지 - auth 정보만 업데이트 (재연결 생략)');
            this.socket.auth = {
              token: accessToken,
              clientType: 'mobile',
              platform: Platform.OS
            };
          } else {
            // 연결되지 않은 경우에만 재연결
            logger.info('[SocketManager] 토큰 변경 감지 - 재연결 시도');
            await this.updateAuthToken(accessToken);
          }
        } else if (!isAuthenticated) {
          // 미인증: 연결 종료
          logger.info('[SocketManager] 인증 해제 감지 - 연결 종료');
          this.disconnect();
        }
      }
    );
  }

  /**
   * 인증 토큰 업데이트
   * -----------------
   * 새로운 토큰으로 Socket 재연결
   *
   * @param {string} token - 새로운 JWT 토큰
   *
   * 워크플로우:
   * 1. 현재 연결 종료
   * 2. 새 토큰으로 auth 업데이트
   * 3. 재연결
   */
  async updateAuthToken(token) {
    if (!this.socket) return;

    logger.info('[SocketManager] 새 토큰으로 인증 정보 업데이트 중...');

    // 1. 현재 연결 종료
    this.socket.disconnect();

    // 2. 새 토큰으로 auth 업데이트
    this.socket.auth = {
      token: token,           // JWT 토큰
      clientType: 'mobile',   // 클라이언트 타입
      platform: Platform.OS   // 플랫폼 정보
    };

    // 3. 재연결
    this.socket.connect();
  }

  /**
   * 토큰 설정 (다음 연결에 사용)
   * --------------------------
   * Socket이 이미 생성된 경우 auth 정보 업데이트
   *
   * @param {string} token - JWT 토큰
   */
  setToken(token) {
    if (this.socket) {
      this.socket.auth = {
        token: token,
        clientType: 'mobile',
        platform: Platform.OS
      };
    }
  }

  /**
   * 룸 참가
   * -------
   * Socket.IO 룸에 참가하여 특정 그룹의 이벤트를 수신
   *
   * @param {string} roomType - 룸 타입 (chat, user 등)
   * @param {string} roomId - 룸 ID
   *
   * 사용 예시:
   * ```javascript
   * socketManager.joinRoom('chat', 'chat-123');
   * socketManager.joinRoom('user', 'user-456');
   * ```
   */
  joinRoom(roomType, roomId) {
    const room = `${roomType}:${roomId}`;

    if (this.socket && this.isConnected) {
      // 연결된 상태: 즉시 룸 참가
      // 🔥 채팅 룸은 chat:join_room 이벤트 사용 (서버와 통일)
      if (roomType === 'chat') {
        this.socket.emit('chat:join_room', { roomId });
      } else {
        // 서버가 기대하는 형식: { roomId: 'type:id' }
        this.socket.emit('joinRoom', { roomId: room });
      }
      this.rooms.add(room);
      logger.info(`[SocketManager] Joined room: ${room}`);
    } else {
      // 연결되지 않은 상태: 룸 정보만 저장 (재연결 시 복원)
      this.rooms.add(room);
    }
  }

  /**
   * 룸 나가기
   * --------
   * Socket.IO 룸에서 나가기
   *
   * @param {string} roomType - 룸 타입
   * @param {string} roomId - 룸 ID
   */
  leaveRoom(roomType, roomId) {
    const room = `${roomType}:${roomId}`;

    if (this.socket && this.isConnected) {
      // 채팅 룸은 chat:leave_room 이벤트 사용
      if (roomType === 'chat') {
        this.socket.emit('chat:leave_room', { roomId });
      } else {
        // 서버가 기대하는 형식: { roomId: 'type:id' }
        this.socket.emit('leaveRoom', { roomId: room });
      }
    }

    this.rooms.delete(room);
    logger.info(`[SocketManager] Left room: ${room}`);
  }


  /**
   * 이벤트 발송
   * ----------
   * 서버로 Socket.IO 이벤트 전송
   *
   * @param {string} event - 이벤트 이름
   * @param {any} data - 전송할 데이터
   * @returns {boolean} 전송 성공 여부
   *
   * 사용 예시:
   * ```javascript
   * socketManager.emit('message:send', { text: 'Hello' });
   * socketManager.emit('chat:typing_start', { roomId: '123' });
   * ```
   */
  emit(event, data) {
    if (!this.socket?.connected) {
      logger.warn(`[SocketManager] Cannot emit '${event}' - Not connected`);
      return false;
    }

    this.socket.emit(event, data);
    logger.debug(`[SocketManager] Emitted '${event}'`, data);
    return true;
  }

  /**
   * 이벤트 리스너 등록
   * -----------------
   * Socket.IO 이벤트 리스너를 등록하고 해제 함수 반환
   *
   * @param {string} event - 이벤트 이름
   * @param {Function} handler - 이벤트 핸들러
   * @returns {Function} 리스너 해제 함수
   *
   * 사용 예시:
   * ```javascript
   * const unsubscribe = socketManager.on('message:received', (data) => {
   *   console.log('New message:', data);
   * });
   *
   * // 나중에 리스너 해제
   * unsubscribe();
   * ```
   */
  on(event, handler) {
    if (!this.socket) {
      logger.warn(`[SocketManager] Cannot add listener for '${event}' - Socket not initialized`);
      return () => {}; // 빈 해제 함수 반환
    }

    // 핸들러를 내부 저장소에 저장 (재연결 시 복원용)
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);

    // Socket.IO에 리스너 등록
    this.socket.on(event, handler);
    logger.debug(`[SocketManager] Added listener for '${event}'`);

    // 해제 함수 반환 (메모리 누수 방지를 위해 중요)
    return () => this.off(event, handler);
  }

  /**
   * 이벤트 리스너 제거
   * -----------------
   * 등록된 이벤트 리스너 제거
   *
   * @param {string} event - 이벤트 이름
   * @param {Function} handler - 제거할 핸들러
   */
  off(event, handler) {
    if (!this.socket) return;

    // Socket.IO에서 리스너 제거
    this.socket.off(event, handler);

    // 내부 저장소에서도 제거
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
      // 해당 이벤트의 핸들러가 모두 제거되면 Map에서도 제거
      if (this.eventHandlers.get(event).size === 0) {
        this.eventHandlers.delete(event);
      }
    }

    logger.debug(`[SocketManager] Removed listener for '${event}'`);
  }

  /**
   * 로컬 이벤트 발송 (내부용)
   * -----------------------
   * Socket.IO와 관계없이 내부 상태 변경을 알리는 이벤트
   *
   * @param {string} event - 이벤트 이름
   * @param {any} data - 이벤트 데이터
   *
   * 내부 이벤트:
   * - socket:connected - 연결 성공
   * - socket:disconnected - 연결 끊김
   * - socket:error - 에러 발생
   */
  emitLocalEvent(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          logger.error(`[SocketManager] Local event handler error:`, error);
        }
      });
    }
  }

  /**
   * 연결 상태 확인
   * -------------
   * Socket이 연결되어 있는지 확인
   *
   * @returns {boolean} 연결 여부
   */
  isConnected() {
    return !!this.socket?.connected;
  }

  /**
   * 연결 상태 정보 조회
   * ------------------
   * 현재 연결 상태의 상세 정보 반환
   *
   * @returns {Object} 연결 상태 정보
   * @returns {boolean} .isConnected - 연결 여부
   * @returns {string} .socketId - Socket ID
   * @returns {string} .status - 연결 상태
   * @returns {string} .error - 에러 메시지
   * @returns {Array} .rooms - 참가한 룸 목록
   */
  getConnectionState() {
    return {
      isConnected: this.isConnected(),
      socketId: this.socket?.id || null,
      status: this.state.status,
      error: this.state.error,
      rooms: Array.from(this.rooms)
    };
  }

  /**
   * 연결 종료
   * --------
   * Socket 연결을 정상적으로 종료
   *
   * 정리 작업:
   * 1. 모든 리스너 제거
   * 2. Socket 연결 해제
   * 3. 토큰 구독 해제
   * 4. 상태 초기화
   *
   * 주의: 룸 정보와 이벤트 핸들러는 유지 (재연결 시 복원용)
   */
  disconnect() {
    if (this.socket) {
      logger.info('[SocketManager] Disconnecting');

      // 모든 Socket.IO 리스너 제거
      this.socket.removeAllListeners();

      // 연결 종료
      this.socket.disconnect();

      // 인스턴스 제거
      this.socket = null;
    }

    // 토큰 구독 정리
    if (this.tokenSubscription) {
      this.tokenSubscription();
      this.tokenSubscription = null;
    }

    // 상태 업데이트
    this.state = { status: 'DISCONNECTED', error: null };
    this._emit();

    // 룸 정보는 유지 (재연결 시 자동 복원)
    // 이벤트 핸들러도 유지 (재연결 시 자동 재등록)
  }

  /**
   * 완전 정리
   * --------
   * 앱 종료 시 모든 리소스 정리
   * disconnect()와 달리 모든 정보를 제거
   */
  cleanup() {
    this.disconnect();
    this.socket = null;
    this.rooms.clear();
    this.eventHandlers.clear();
    this.listeners.clear();
    logger.info('[SocketManager] Cleaned up');
  }
}

// ============================================
// 싱글톤 인스턴스 생성 및 내보내기
// ============================================
// 앱 전체에서 하나의 SocketManager 인스턴스만 사용
const socketManager = new SocketManager();

// ============================================
// 연결 상태 상수
// ============================================
// 연결 상태를 나타내는 상수들
export const CONNECTION_STATE = {
  DISCONNECTED: 'DISCONNECTED',    // 연결 안됨
  CONNECTING: 'CONNECTING',        // 연결 시도 중
  AUTHENTICATED: 'AUTHENTICATED',  // 인증 완료 (정상 연결)
  ERROR: 'ERROR'                   // 에러 상태
};

// 기본 내보내기: socketManager 인스턴스
export default socketManager;
