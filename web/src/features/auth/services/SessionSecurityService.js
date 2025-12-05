/**
 * 세션 보안 관리 서비스
 * - JWT 토큰 갱신 메커니즘
 * - 세션 타임아웃 관리
 * - 동시 로그인 제한
 * - 의심스러운 로그인 감지 및 알림
 * - Local 현지 보안 정책 준수
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import UAParser from 'ua-parser-js';

class SessionSecurityService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'vietnam-delivery-secret';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'vietnam-delivery-refresh';
    this.accessStoreTokenExpiry = '15m'; // 액세스 점주 토큰 15분
    this.refreshStoreTokenExpiry = '7d';  // 리프레시 점주 토큰 7일
    this.maxConcurrentSessions = 5; // 최대 동시 세션 수
    this.suspiciousLoginThreshold = 3; // 의심스러운 로그인 임계값
    this.sessionTimeout = 30 * 60 * 1000; // 30분 비활성 타임아웃
    
    // Local 시간대 설정
    this.vietnamTimezone = 'Asia/Ho_Chi_Minh';
    this.activeSessions = new Map(); // 실제 구현에서는 Redis 사용
    this.failedLoginAttempts = new Map();
  }

  /**
   * 새로운 세션 생성
   * @param {Object} user - 사용자 정보
   * @param {Object} loginInfo - 로그인 정보
   * @returns {Object} 토큰 및 세션 정보
   */
  async createSession(user, loginInfo) {
    try {
      const { ip, userAgent, location } = loginInfo;
      const sessionId = crypto.randomUUID();
      const deviceInfo = this.parseUserAgent(userAgent);
      
      // 의심스러운 로그인 검사
      const suspiciousCheck = await this.checkSuspiciousLogin(user.id, ip, deviceInfo, location);
      
      if (suspiciousCheck.isSuspicious) {
        return {
          success: false,
          error: 'SUSPICIOUS_LOGIN',
          details: suspiciousCheck,
          vietnamese: {
            message: 'Phát hiện hoạt động đăng nhập bất thường. Vui lòng xác thực danh tính.',
            action_required: 'Cần xác thực bổ sung'
          }
        };
      }

      // 기존 세션 수 확인 및 정리
      await this.manageConcurrentSessions(user.id);

      // 토큰 생성
      const tokens = this.generateTokens(user, sessionId);
      
      // 세션 정보 저장
      const session = {
        sessionId,
        userId: user.id,
        ip,
        userAgent,
        deviceInfo,
        location,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        isActive: true,
        accessStoreToken: tokens.accessStoreToken,
        refreshStoreToken: tokens.refreshStoreToken,
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7일
        vietnamese: {
          deviceName: this.getVietnameseDeviceName(deviceInfo),
          location: location?.city || 'Không xác định',
          loginTime: new Intl.DateTimeFormat('vi-VN', {
            timeZone: this.vietnamTimezone,
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(new Date())
        }
      };

      this.activeSessions.set(sessionId, session);
      
      // 로그인 성공 기록
      this.recordSuccessfulLogin(user.id, ip);
      
      // 새 기기 로그인 알림
      if (suspiciousCheck.isNewDevice) {
        await this.sendNewDeviceNotification(user, session);
      }

      return {
        success: true,
        sessionId,
        accessStoreToken: tokens.accessStoreToken,
        refreshStoreToken: tokens.refreshStoreToken,
        expiresIn: 15 * 60, // 15분 (초 단위)
        sessionInfo: {
          deviceInfo: session.vietnamese.deviceName,
          location: session.vietnamese.location,
          loginTime: session.vietnamese.loginTime
        },
        vietnamese: {
          message: 'Đăng nhập thành công',
          sessionInfo: `Đăng nhập từ ${session.vietnamese.deviceName} tại ${session.vietnamese.location}`
        }
      };
    } catch (error) {
      console.error('세션 생성 오류:', error);
      return {
        success: false,
        error: error.message,
        vietnamese: {
          message: 'Có lỗi xảy ra khi tạo phiên đăng nhập. Vui lòng thử lại.'
        }
      };
    }
  }

  /**
   * 액세스 토큰 갱신
   * @param {string} refreshStoreToken - 점주 리프레시 토큰
   * @returns {Object} 새로운 액세스 토큰
   */
  async refreshAccessToken(refreshStoreToken) {
    try {
      // 리프레시 토큰 검증
      const decoded = jwt.verify(refreshStoreToken, this.refreshSecret);
      const { userId, sessionId } = decoded;

      // 세션 유효성 확인
      const session = this.activeSessions.get(sessionId);
      
      if (!session || !session.isActive) {
        return {
          success: false,
          error: 'INVALID_SESSION',
          vietnamese: {
            message: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.'
          }
        };
      }

      // 세션 만료 확인
      if (Date.now() > session.expiresAt) {
        this.activeSessions.delete(sessionId);
        return {
          success: false,
          error: 'SESSION_EXPIRED',
          vietnamese: {
            message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
          }
        };
      }

      // 새로운 액세스 토큰 생성
      const newAccessToken = jwt.sign(
        { 
          userId, 
          sessionId,
          role: decoded.role || 'store_owner',
          permissions: decoded.permissions || []
        },
        this.jwtSecret,
        { expiresIn: this.accessStoreTokenExpiry }
      );

      // 세션 활동 시간 업데이트
      session.lastActivity = Date.now();
      session.accessStoreToken = newAccessToken;

      return {
        success: true,
        accessStoreToken: newAccessToken,
        expiresIn: 15 * 60, // 15분
        vietnamese: {
          message: 'Token đã được làm mới thành công'
        }
      };
    } catch (error) {
      console.error('토큰 갱신 오류:', error);
      return {
        success: false,
        error: error.message,
        vietnamese: {
          message: 'Không thể làm mới token. Vui lòng đăng nhập lại.'
        }
      };
    }
  }

  /**
   * 세션 검증
   * @param {string} sessionId - 세션 ID
   * @param {string} ip - 클라이언트 IP
   * @returns {Object} 검증 결과
   */
  validateSession(sessionId, ip) {
    try {
      const session = this.activeSessions.get(sessionId);
      
      if (!session || !session.isActive) {
        return {
          valid: false,
          error: 'SESSION_NOT_FOUND',
          vietnamese: {
            message: 'Phiên đăng nhập không tồn tại'
          }
        };
      }

      // 세션 만료 확인
      if (Date.now() > session.expiresAt) {
        this.terminateSession(sessionId);
        return {
          valid: false,
          error: 'SESSION_EXPIRED',
          vietnamese: {
            message: 'Phiên đăng nhập đã hết hạn'
          }
        };
      }

      // 비활성 타임아웃 확인
      const inactiveTime = Date.now() - session.lastActivity;
      if (inactiveTime > this.sessionTimeout) {
        this.terminateSession(sessionId);
        return {
          valid: false,
          error: 'SESSION_TIMEOUT',
          vietnamese: {
            message: 'Phiên đăng nhập hết hạn do không hoạt động'
          }
        };
      }

      // IP 주소 변경 감지
      if (session.ip !== ip) {
        console.warn(`IP 주소 변경 감지: ${session.ip} -> ${ip} (세션: ${sessionId})`);
        // 심각한 경우 세션 종료, 일반적으로는 경고만
        if (this.isIPChangeSignificant(session.ip, ip)) {
          this.terminateSession(sessionId);
          return {
            valid: false,
            error: 'IP_ADDRESS_CHANGED',
            vietnamese: {
              message: 'Địa chỉ IP đã thay đổi. Vui lòng đăng nhập lại để bảo mật.'
            }
          };
        }
      }

      // 세션 활동 시간 업데이트
      session.lastActivity = Date.now();

      return {
        valid: true,
        session,
        userId: session.userId,
        vietnamese: {
          message: 'Phiên đăng nhập hợp lệ'
        }
      };
    } catch (error) {
      console.error('세션 검증 오류:', error);
      return {
        valid: false,
        error: error.message,
        vietnamese: {
          message: 'Có lỗi xảy ra khi kiểm tra phiên đăng nhập'
        }
      };
    }
  }

  /**
   * 세션 종료
   * @param {string} sessionId - 세션 ID
   * @returns {Object} 종료 결과
   */
  terminateSession(sessionId) {
    try {
      const session = this.activeSessions.get(sessionId);
      
      if (session) {
        session.isActive = false;
        session.terminatedAt = Date.now();
        
        // 실제로는 블랙리스트에 토큰 추가
        this.addTokenToBlacklist(session.accessStoreToken);
        this.addTokenToBlacklist(session.refreshStoreToken);
        
        // 메모리에서 제거
        this.activeSessions.delete(sessionId);
        
        return {
          success: true,
          vietnamese: {
            message: 'Phiên đăng nhập đã được kết thúc thành công'
          }
        };
      }
      
      return {
        success: false,
        error: 'SESSION_NOT_FOUND',
        vietnamese: {
          message: 'Không tìm thấy phiên đăng nhập'
        }
      };
    } catch (error) {
      console.error('세션 종료 오류:', error);
      return {
        success: false,
        error: error.message,
        vietnamese: {
          message: 'Có lỗi xảy ra khi kết thúc phiên đăng nhập'
        }
      };
    }
  }

  /**
   * 모든 세션 종료 (로그아웃)
   * @param {string} userId - 사용자 ID
   * @param {string} excludeSessionId - 제외할 세션 ID (현재 세션)
   * @returns {Object} 종료 결과
   */
  terminateAllSessions(userId, excludeSessionId = null) {
    try {
      let terminatedCount = 0;
      
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.userId === userId && sessionId !== excludeSessionId) {
          this.terminateSession(sessionId);
          terminatedCount++;
        }
      }
      
      return {
        success: true,
        terminatedCount,
        vietnamese: {
          message: `Đã kết thúc ${terminatedCount} phiên đăng nhập khác`
        }
      };
    } catch (error) {
      console.error('모든 세션 종료 오류:', error);
      return {
        success: false,
        error: error.message,
        vietnamese: {
          message: 'Có lỗi xảy ra khi kết thúc các phiên đăng nhập'
        }
      };
    }
  }

  /**
   * 활성 세션 조회
   * @param {string} userId - 사용자 ID
   * @returns {Array} 활성 세션 목록
   */
  getActiveSessions(userId) {
    try {
      const userSessions = [];
      
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.userId === userId && session.isActive) {
          userSessions.push({
            sessionId,
            deviceInfo: session.vietnamese.deviceName,
            location: session.vietnamese.location,
            loginTime: session.vietnamese.loginTime,
            lastActivity: new Intl.DateTimeFormat('vi-VN', {
              timeZone: this.vietnamTimezone,
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }).format(new Date(session.lastActivity)),
            isCurrentSession: false, // 클라이언트에서 현재 세션 표시
            ip: this.maskIP(session.ip)
          });
        }
      }
      
      return {
        success: true,
        sessions: userSessions,
        count: userSessions.length,
        vietnamese: {
          title: 'Các phiên đăng nhập đang hoạt động',
          empty_message: 'Không có phiên đăng nhập nào khác'
        }
      };
    } catch (error) {
      console.error('활성 세션 조회 오류:', error);
      return {
        success: false,
        error: error.message,
        vietnamese: {
          message: 'Không thể tải danh sách phiên đăng nhập'
        }
      };
    }
  }

  // 헬퍼 메서드들

  generateTokens(user, sessionId) {
    const accessStoreTokenPayload = {
      userId: user.id,
      sessionId,
      role: user.role || 'store_owner',
      permissions: user.permissions || [],
      storeId: user.storeId
    };

    const refreshStoreTokenPayload = {
      userId: user.id,
      sessionId,
      role: user.role,
      tokenType: 'refresh'
    };

    const accessStoreToken = jwt.sign(accessStoreTokenPayload, this.jwtSecret, {
      expiresIn: this.accessStoreTokenExpiry
    });

    const refreshStoreToken = jwt.sign(refreshStoreTokenPayload, this.refreshSecret, {
      expiresIn: this.refreshStoreTokenExpiry
    });

    return { accessStoreToken, refreshStoreToken };
  }

  parseUserAgent(userAgent) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    return {
      browser: `${result.browser.name} ${result.browser.version}`,
      os: `${result.os.name} ${result.os.version}`,
      device: result.device.type || 'desktop',
      model: result.device.model || '',
      vendor: result.device.vendor || ''
    };
  }

  getVietnameseDeviceName(deviceInfo) {
    const deviceTranslations = {
      'desktop': 'Máy tính',
      'mobile': 'Điện thoại di động',
      'tablet': 'Máy tính bảng'
    };
    
    const deviceType = deviceTranslations[deviceInfo.device] || 'Thiết bị';
    return `${deviceType} (${deviceInfo.browser})`;
  }

  async checkSuspiciousLogin(userId, ip, deviceInfo, location) {
    // 기존 로그인 기록 조회
    const recentLogins = this.getRecentLogins(userId, 24 * 60 * 60 * 1000); // 24시간
    
    let isSuspicious = false;
    let isNewDevice = false;
    let reasons = [];

    // 새로운 기기 체크
    const knownDevices = recentLogins.map(login => login.deviceInfo.browser);
    if (!knownDevices.includes(deviceInfo.browser)) {
      isNewDevice = true;
      reasons.push('새로운 기기에서 로그인');
    }

    // 위치 변경 체크
    const knownLocations = recentLogins.map(login => login.location?.country);
    if (location?.country && !knownLocations.includes(location.country)) {
      isSuspicious = true;
      reasons.push('새로운 국가에서 로그인');
    }

    // 실패한 로그인 시도 체크
    const failedAttempts = this.failedLoginAttempts.get(userId) || 0;
    if (failedAttempts >= this.suspiciousLoginThreshold) {
      isSuspicious = true;
      reasons.push('최근 여러 번의 로그인 실패');
    }

    // 비정상적인 시간 체크 (Local 시간 기준)
    const vietnamTime = new Date().toLocaleString('en-US', {timeZone: this.vietnamTimezone});
    const hour = new Date(vietnamTime).getHours();
    if (hour < 6 || hour > 23) {
      reasons.push('비정상적인 시간대 로그인');
    }

    return {
      isSuspicious,
      isNewDevice,
      reasons,
      vietnameseReasons: this.translateSuspiciousReasons(reasons)
    };
  }

  translateSuspiciousReasons(reasons) {
    const translations = {
      '새로운 기기에서 로그인': 'Đăng nhập từ thiết bị mới',
      '새로운 국가에서 로그인': 'Đăng nhập từ quốc gia mới',
      '최근 여러 번의 로그인 실패': 'Nhiều lần đăng nhập thất bại gần đây',
      '비정상적인 시간대 로그인': 'Đăng nhập vào thời gian bất thường'
    };
    
    return reasons.map(reason => translations[reason] || reason);
  }

  async manageConcurrentSessions(userId) {
    const userSessions = Array.from(this.activeSessions.entries())
      .filter(([_, session]) => session.userId === userId && session.isActive)
      .sort((a, b) => b[1].lastActivity - a[1].lastActivity);

    // 최대 세션 수 초과 시 오래된 세션 제거
    if (userSessions.length >= this.maxConcurrentSessions) {
      const sessionsToRemove = userSessions.slice(this.maxConcurrentSessions - 1);
      sessionsToRemove.forEach(([sessionId, _]) => {
        this.terminateSession(sessionId);
      });
    }
  }

  async sendNewDeviceNotification(user, session) {
    // 실제 구현에서는 이메일/SMS/푸시 알림 발송
    console.log(`새 기기 로그인 알림: ${user.email}`);
    console.log(`기기: ${session.vietnamese.deviceName}`);
    console.log(`위치: ${session.vietnamese.location}`);
    console.log(`시간: ${session.vietnamese.loginTime}`);
  }

  recordSuccessfulLogin(userId, ip) {
    this.failedLoginAttempts.delete(userId);
  }

  recordFailedLogin(userId, ip) {
    const current = this.failedLoginAttempts.get(userId) || 0;
    this.failedLoginAttempts.set(userId, current + 1);
  }

  getRecentLogins(userId, timeWindow) {
    // 실제 구현에서는 데이터베이스에서 조회
    return [];
  }

  isIPChangeSignificant(oldIP, newIP) {
    // 실제 구현에서는 IP 지리적 위치 비교
    // 같은 도시 내 변경은 허용, 국가 간 변경은 차단
    return false;
  }

  addTokenToBlacklist(token) {
    // 실제 구현에서는 Redis 블랙리스트에 추가
    console.log(`토큰 블랙리스트 추가: ${token.substring(0, 20)}...`);
  }

  maskIP(ip) {
    if (!ip) return '';
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.***`;
    }
    return ip.substring(0, 8) + '***';
  }
}

// 싱글톤 인스턴스
const sessionSecurityService = new SessionSecurityService();

export default sessionSecurityService;
export { SessionSecurityService };