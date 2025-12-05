/**
 * 기본 네임스페이스 클래스
 * 모든 개별 네임스페이스가 상속할 베이스 클래스
 */
import { Logger } from '../../utils/utilities/Logger.js';

const logger = new Logger('BaseNamespace');

export class BaseNamespace {
  constructor(io, namespacePath, options = {}) {
    this.io = io;
    this.namespacePath = namespacePath;
    this.namespace = this.io.of(namespacePath);
    this.options = options;
    this.connections = new Map();
    
    // 로거 설정
    this.logger = logger;
  }

  /**
   * 네임스페이스 초기화
   * 각 네임스페이스에서 오버라이드해야 함
   */
  async initialize() {
    throw new Error('initialize() method must be implemented by subclass');
  }

  /**
   * 인증 미들웨어 적용
   */
  applyAuth(authMiddleware) {
    if (authMiddleware) {
      this.namespace.use(authMiddleware);
    }
  }

  /**
   * 연결 이벤트 처리
   */
  setupConnectionHandlers() {
    this.namespace.on('connection', (socket) => {
      this.onConnection(socket);
    });
  }

  /**
   * 연결 시 공통 처리
   */
  onConnection(socket) {
    this.logger.info(`Client connected to ${this.namespacePath}`, {
      userId: socket.userId,
      userType: socket.userType,
      socketId: socket.id
    });

    this.connections.set(socket.id, {
      socket,
      userId: socket.userId,
      userType: socket.userType,
      connectedAt: new Date()
    });

    // 연결 해제 처리
    socket.on('disconnect', () => {
      this.onDisconnect(socket);
    });

    // 각 네임스페이스별 커스텀 핸들러 설정
    this.setupCustomHandlers(socket);
  }

  /**
   * 연결 해제 시 공통 처리
   */
  onDisconnect(socket) {
    this.logger.info(`Client disconnected from ${this.namespacePath}`, {
      userId: socket.userId,
      socketId: socket.id
    });

    this.connections.delete(socket.id);
  }

  /**
   * 커스텀 이벤트 핸들러 설정
   * 각 네임스페이스에서 오버라이드해야 함
   */
  setupCustomHandlers(socket) {
    // 기본 구현 없음 - 각 네임스페이스에서 구현
  }

  /**
   * 룸 참가
   */
  joinRoom(socket, roomName) {
    socket.join(roomName);
    this.logger.debug(`Socket joined room`, { 
      socketId: socket.id, 
      room: roomName,
      namespace: this.namespacePath
    });
  }

  /**
   * 룸 나가기
   */
  leaveRoom(socket, roomName) {
    socket.leave(roomName);
    this.logger.debug(`Socket left room`, { 
      socketId: socket.id, 
      room: roomName,
      namespace: this.namespacePath
    });
  }

  /**
   * 특정 룸으로 이벤트 전송
   */
  emitToRoom(roomName, event, data) {
    this.namespace.to(roomName).emit(event, data);
    this.logger.debug(`Event emitted to room`, { 
      room: roomName, 
      event, 
      namespace: this.namespacePath
    });
  }

  /**
   * 특정 소켓으로 이벤트 전송
   */
  emitToSocket(socketId, event, data) {
    this.namespace.to(socketId).emit(event, data);
    this.logger.debug(`Event emitted to socket`, { 
      socketId, 
      event, 
      namespace: this.namespacePath
    });
  }

  /**
   * 전체 네임스페이스로 브로드캐스트
   */
  broadcast(event, data) {
    this.namespace.emit(event, data);
    this.logger.debug(`Event broadcasted`, { 
      event, 
      namespace: this.namespacePath
    });
  }

  /**
   * 사용자별 연결 조회
   */
  getConnectionsByUser(userId) {
    return Array.from(this.connections.values())
      .filter(conn => conn.userId === userId || conn.userId === userId.toString());
  }

  /**
   * 연결 통계 조회
   */
  getStats() {
    return {
      namespace: this.namespacePath,
      totalConnections: this.connections.size,
      rooms: this.namespace.adapter.rooms.size,
      connectionsPerType: this.getConnectionStats()
    };
  }

  /**
   * 연결 타입별 통계
   */
  getConnectionStats() {
    const stats = {};
    for (const conn of this.connections.values()) {
      const type = conn.userType || 'unknown';
      stats[type] = (stats[type] || 0) + 1;
    }
    return stats;
  }

  /**
   * 에러 처리
   */
  handleError(socket, error, context = {}) {
    this.logger.error(`Namespace error: ${this.namespacePath}`, {
      error: error.message,
      socketId: socket?.id,
      userId: socket?.userId,
      context
    });

    if (socket) {
      socket.emit('error', {
        message: error.message,
        timestamp: new Date()
      });
    }
  }
}

export default BaseNamespace;