/**
 * 메인 네임스페이스 (기본 네임스페이스)
 * 범용 실시간 통신 및 기본적인 사용자 관리
 */
import { BaseNamespace } from './baseNamespace.js';
import { createNamespaceAuth } from '../middleware/namespaceAuth.js';

export class MainNamespace extends BaseNamespace {
  constructor(io, options = {}) {
    super(io, '/main', options);
  }

  /**
   * 메인 네임스페이스 초기화
   */
  async initialize() {
    // 인증 미들웨어 적용
    this.applyAuth(createNamespaceAuth('/main'));
    
    // 연결 핸들러 설정
    this.setupConnectionHandlers();
    
    this.logger.info('Main namespace initialized successfully');
  }

  /**
   * 연결 시 처리
   */
  onConnection(socket) {
    super.onConnection(socket);

    // 스토어 채널 조인
    if (socket.storeId) {
      this.joinRoom(socket, `store:${socket.storeId}`);
      this.logger.info('Store joined channel', { storeId: socket.storeId });
    }
    
    // 사용자별 개인 룸 참가
    if (socket.userId) {
      this.joinRoom(socket, `user:${socket.userId}`);
    }
  }

  /**
   * 커스텀 이벤트 핸들러 설정
   */
  setupCustomHandlers(socket) {
    // 스토어 조인 확인 이벤트
    socket.on('store:join', (data) => {
      this.handleStoreJoin(socket, data);
    });

    // 핑/퐁 하트비트
    socket.on('ping', (timestamp) => {
      this.handlePing(socket, timestamp);
    });

    // 범용 메시지 전송
    socket.on('send_message', (data) => {
      this.handleSendMessage(socket, data);
    });

    // 주문 이벤트 (메인에서도 처리)
    socket.on('order:update_status', (data) => {
      this.handleOrderStatusUpdate(socket, data);
    });
  }

  /**
   * 스토어 조인 처리
   */
  handleStoreJoin(socket, data) {
    try {
      const { storeId } = data;
      if (storeId && socket.storeId === storeId) {
        this.joinRoom(socket, `store:${storeId}`);
        socket.emit('store:joined', { storeId, timestamp: new Date() });
        this.logger.info('Store channel joined via event', { storeId });
      }
    } catch (error) {
      this.handleError(socket, error, { event: 'store:join', data });
    }
  }

  /**
   * 핑/퐁 하트비트 처리
   */
  handlePing(socket, timestamp) {
    socket.emit('pong', timestamp);
  }

  /**
   * 범용 메시지 전송 처리
   */
  handleSendMessage(socket, data) {
    try {
      const { target, event, payload } = data;
      if (target && event) {
        this.emitToRoom(target, event, payload);
      }
    } catch (error) {
      this.handleError(socket, error, { event: 'send_message', data });
    }
  }

  /**
   * 주문 상태 업데이트 처리
   */
  async handleOrderStatusUpdate(socket, data) {
    try {
      const { orderId, status, reason } = data;
      
      // 권한 확인
      if (!['STORE', 'MANAGER', 'STAFF'].includes(socket.userType)) {
        return socket.emit('error', { message: 'Permission denied' });
      }

      // 스토어 채널로 브로드캐스트
      if (socket.storeId) {
        this.emitToRoom(`store:${socket.storeId}`, 'order:status_updated', {
          orderId,
          status,
          reason,
          updatedBy: socket.userId,
          timestamp: new Date()
        });
      }
    } catch (error) {
      this.handleError(socket, error, { event: 'order:update_status', data });
    }
  }

  /**
   * 특정 스토어로 이벤트 전송
   */
  emitToStore(storeId, event, data) {
    this.emitToRoom(`store:${storeId}`, event, data);
  }

  /**
   * 특정 사용자로 이벤트 전송
   */
  emitToUser(userId, event, data) {
    this.emitToRoom(`user:${userId}`, event, data);
  }

  /**
   * 메인 네임스페이스 통계
   */
  getMainStats() {
    const baseStats = this.getStats();
    return {
      ...baseStats,
      storeChannels: this.getStoreChannelCount(),
      userChannels: this.getUserChannelCount()
    };
  }

  /**
   * 스토어 채널 수 조회
   */
  getStoreChannelCount() {
    let count = 0;
    for (const room of this.namespace.adapter.rooms.keys()) {
      if (room.startsWith('store:')) {
        count++;
      }
    }
    return count;
  }

  /**
   * 사용자 채널 수 조회
   */
  getUserChannelCount() {
    let count = 0;
    for (const room of this.namespace.adapter.rooms.keys()) {
      if (room.startsWith('user:')) {
        count++;
      }
    }
    return count;
  }
}

export default MainNamespace;