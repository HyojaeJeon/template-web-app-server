/**
 * 다단계 인증(MFA) 서비스
 * - TOTP (Time-based One-Time Password) 구현
 * - SMS 기반 2FA
 * - 백업 코드 생성 및 관리
 * - Local 현지화 지원
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { formatVietnamesePhone } from '../../../shared/utils/vietnam';

class MFAService {
  constructor() {
    this.serviceName = 'DeliveryVN Store';
    this.backupCodeLength = 8;
    this.backupCodeCount = 10;
    this.totpWindow = 2; // ±2 시간 윈도우
    this.smsProvider = process.env.VIETNAM_SMS_PROVIDER || 'viettel';
  }

  /**
   * TOTP 시크릿 키 생성
   * @param {string} userId - 사용자 ID
   * @param {string} email - 사용자 이메일
   * @returns {Object} TOTP 설정 정보
   */
  generateTOTPSecret(userId, email) {
    const secret = speakeasy.generateSecret({
      name: `${this.serviceName} (${email})`,
      issuer: this.serviceName,
      length: 32
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      manual_entry_key: secret.base32,
      qr_code_setup: this.generateQRCodeSetupInfo(secret.otpauth_url),
      vietnamese: {
        setup_instructions: 'Mở ứng dụng xác thực (như Google Authenticator) và quét mã QR này',
        manual_entry_label: 'Hoặc nhập mã thủ công',
        verification_label: 'Nhập mã xác thực 6 chữ số'
      }
    };
  }

  /**
   * QR 코드 생성
   * @param {string} otpauthUrl - TOTP URL
   * @returns {Promise<string>} Base64 QR 코드 이미지
   */
  async generateQRCode(otpauthUrl) {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#2AC1BC', // Local 테마 민트색
          light: '#FFFFFF'
        }
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('QR 코드 생성 오류:', error);
      throw new Error('QR 코드 생성에 실패했습니다');
    }
  }

  /**
   * TOTP 코드 검증
   * @param {string} token - 사용자가 입력한 6자리 코드
   * @param {string} secret - 사용자의 TOTP 시크릿
   * @returns {Object} 검증 결과
   */
  verifyTOTP(token, secret) {
    try {
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: this.totpWindow,
        time: Math.floor(Date.now() / 1000)
      });

      return {
        verified,
        timestamp: Date.now(),
        method: 'totp',
        vietnamese: {
          message: verified 
            ? 'Xác thực thành công' 
            : 'Mã xác thực không đúng hoặc đã hết hạn'
        }
      };
    } catch (error) {
      console.error('TOTP 검증 오류:', error);
      return {
        verified: false,
        error: error.message,
        vietnamese: {
          message: 'Có lỗi xảy ra khi xác thực. Vui lòng thử lại.'
        }
      };
    }
  }

  /**
   * SMS 기반 2FA 코드 생성 및 발송
   * @param {string} phoneNumber - Local 전화번호
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} SMS 발송 결과
   */
  async sendSMSCode(phoneNumber, userId) {
    try {
      // 6자리 숫자 코드 생성
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expireTime = Date.now() + (5 * 60 * 1000); // 5분 만료
      
      // Local 전화번호 형식 정규화
      const normalizedPhone = formatVietnamesePhone(phoneNumber);
      
      // SMS 메시지 구성 (Local어)
      const message = `Mã xác thực DeliveryVN Store: ${code}. Mã có hiệu lực trong 5 phút. Không chia sẻ mã này với ai.`;
      
      // SMS 발송 (실제 구현에서는 SMS 서비스 연동)
      const smsResult = await this.sendVietnameseSMS(normalizedPhone, message);
      
      // 임시 저장 (실제 구현에서는 Redis 사용)
      this.storeSMSCode(userId, code, expireTime, normalizedPhone);
      
      return {
        success: true,
        phone: this.maskPhoneNumber(normalizedPhone),
        expiresAt: expireTime,
        vietnamese: {
          message: `Mã xác thực đã được gửi đến ${this.maskPhoneNumber(normalizedPhone)}`,
          instructions: 'Vui lòng nhập mã 6 chữ số bạn nhận được qua tin nhắn'
        }
      };
    } catch (error) {
      console.error('SMS 발송 오류:', error);
      return {
        success: false,
        error: error.message,
        vietnamese: {
          message: 'Không thể gửi mã xác thực. Vui lòng thử lại sau.'
        }
      };
    }
  }

  /**
   * SMS 코드 검증
   * @param {string} code - 사용자가 입력한 코드
   * @param {string} userId - 사용자 ID
   * @returns {Object} 검증 결과
   */
  verifySMSCode(code, userId) {
    try {
      const storedData = this.getSMSCode(userId);
      
      if (!storedData) {
        return {
          verified: false,
          error: 'NO_CODE_FOUND',
          vietnamese: {
            message: 'Không tìm thấy mã xác thực. Vui lòng yêu cầu mã mới.'
          }
        };
      }
      
      if (Date.now() > storedData.expireTime) {
        return {
          verified: false,
          error: 'CODE_EXPIRED',
          vietnamese: {
            message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.'
          }
        };
      }
      
      if (code !== storedData.code) {
        return {
          verified: false,
          error: 'INVALID_CODE',
          vietnamese: {
            message: 'Mã xác thực không đúng. Vui lòng kiểm tra và thử lại.'
          }
        };
      }
      
      // 사용된 코드 삭제
      this.deleteSMSCode(userId);
      
      return {
        verified: true,
        method: 'sms',
        phone: storedData.phone,
        vietnamese: {
          message: 'Xác thực SMS thành công'
        }
      };
    } catch (error) {
      console.error('SMS 코드 검증 오류:', error);
      return {
        verified: false,
        error: error.message,
        vietnamese: {
          message: 'Có lỗi xảy ra khi xác thực. Vui lòng thử lại.'
        }
      };
    }
  }

  /**
   * 백업 코드 생성
   * @param {string} userId - 사용자 ID
   * @returns {Object} 백업 코드 정보
   */
  generateBackupCodes(userId) {
    const codes = [];
    
    for (let i = 0; i < this.backupCodeCount; i++) {
      const code = crypto.randomBytes(this.backupCodeLength)
        .toString('hex')
        .toUpperCase()
        .match(/.{1,4}/g)
        .join('-');
      codes.push(code);
    }
    
    // 해시화된 코드 저장 (실제 구현에서는 데이터베이스)
    const hashedCodes = codes.map(code => ({
      hash: crypto.createHash('sha256').update(code).digest('hex'),
      used: false,
      createdAt: Date.now()
    }));
    
    this.storeBackupCodes(userId, hashedCodes);
    
    return {
      codes,
      count: codes.length,
      createdAt: Date.now(),
      vietnamese: {
        title: 'Mã sao lưu xác thực hai yếu tố',
        instructions: [
          'Lưu trữ những mã này ở nơi an toàn',
          'Mỗi mã chỉ có thể sử dụng một lần',
          'Sử dụng khi không thể truy cập ứng dụng xác thực',
          'Tạo mã mới khi sử dụng hết'
        ],
        warning: 'Cảnh báo: Không chia sẻ mã này với bất kỳ ai'
      }
    };
  }

  /**
   * 백업 코드 검증
   * @param {string} code - 백업 코드
   * @param {string} userId - 사용자 ID
   * @returns {Object} 검증 결과
   */
  verifyBackupCode(code, userId) {
    try {
      const storedCodes = this.getBackupCodes(userId);
      
      if (!storedCodes || storedCodes.length === 0) {
        return {
          verified: false,
          error: 'NO_BACKUP_CODES',
          vietnamese: {
            message: 'Không tìm thấy mã sao lưu. Vui lòng liên hệ hỗ trợ.'
          }
        };
      }
      
      const inputHash = crypto.createHash('sha256').update(code).digest('hex');
      const codeIndex = storedCodes.findIndex(
        storedCode => storedCode.hash === inputHash && !storedCode.used
      );
      
      if (codeIndex === -1) {
        return {
          verified: false,
          error: 'INVALID_BACKUP_CODE',
          vietnamese: {
            message: 'Mã sao lưu không đúng hoặc đã được sử dụng'
          }
        };
      }
      
      // 코드를 사용됨으로 표시
      storedCodes[codeIndex].used = true;
      storedCodes[codeIndex].usedAt = Date.now();
      this.updateBackupCodes(userId, storedCodes);
      
      const remainingCodes = storedCodes.filter(code => !code.used).length;
      
      return {
        verified: true,
        method: 'backup_code',
        remainingCodes,
        vietnamese: {
          message: 'Xác thực mã sao lưu thành công',
          warning: remainingCodes <= 2 
            ? `Bạn chỉ còn ${remainingCodes} mã sao lưu. Hãy tạo mã mới sớm.`
            : null
        }
      };
    } catch (error) {
      console.error('백업 코드 검증 오류:', error);
      return {
        verified: false,
        error: error.message,
        vietnamese: {
          message: 'Có lỗi xảy ra khi xác thực. Vui lòng thử lại.'
        }
      };
    }
  }

  /**
   * MFA 상태 확인
   * @param {string} userId - 사용자 ID
   * @returns {Object} MFA 상태 정보
   */
  getMFAStatus(userId) {
    try {
      const totpEnabled = this.isTOTPEnabled(userId);
      const smsEnabled = this.isSMSEnabled(userId);
      const backupCodes = this.getBackupCodes(userId);
      const remainingBackupCodes = backupCodes ? 
        backupCodes.filter(code => !code.used).length : 0;
      
      return {
        enabled: totpEnabled || smsEnabled,
        methods: {
          totp: totpEnabled,
          sms: smsEnabled,
          backup_codes: remainingBackupCodes > 0
        },
        remainingBackupCodes,
        lastEnabled: this.getLastMFAEnabledTime(userId),
        vietnamese: {
          status: (totpEnabled || smsEnabled) 
            ? 'Xác thực hai yếu tố đã được kích hoạt'
            : 'Xác thực hai yếu tố chưa được kích hoạt',
          recommendation: !(totpEnabled || smsEnabled)
            ? 'Khuyến nghị kích hoạt xác thực hai yếu tố để tăng cường bảo mật tài khoản'
            : null
        }
      };
    } catch (error) {
      console.error('MFA 상태 확인 오류:', error);
      return {
        enabled: false,
        error: error.message,
        vietnamese: {
          message: 'Không thể kiểm tra trạng thái xác thực hai yếu tố'
        }
      };
    }
  }

  // 헬퍼 메서드들

  generateQRCodeSetupInfo(otpauthUrl) {
    return {
      steps: [
        'Google Authenticator 또는 Authy 앱을 설치하세요',
        '앱에서 "계정 추가" 또는 "+" 버튼을 누르세요',
        'QR 코드를 스캔하거나 수동으로 키를 입력하세요',
        '앱에서 생성된 6자리 코드를 입력하여 설정을 완료하세요'
      ],
      vietnamese_steps: [
        'Cài đặt ứng dụng Google Authenticator hoặc Authy',
        'Nhấn "Thêm tài khoản" hoặc nút "+" trong ứng dụng',
        'Quét mã QR hoặc nhập mã thủ công',
        'Nhập mã 6 chữ số được tạo trong ứng dụng để hoàn tất thiết lập'
      ]
    };
  }

  async sendVietnameseSMS(phone, message) {
    // 실제 구현에서는 Local SMS 제공업체 API 연동
    // Viettel, VNPT, Mobifone 등
    console.log(`SMS 발송 (시뮬레이션): ${phone} - ${message}`);
    
    return {
      success: true,
      messageId: crypto.randomUUID(),
      provider: this.smsProvider
    };
  }

  maskPhoneNumber(phone) {
    if (!phone || phone.length < 4) return phone;
    return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
  }

  // 임시 저장 메서드들 (실제 구현에서는 Redis/데이터베이스 사용)
  storeSMSCode(userId, code, expireTime, phone) {
    if (!this.smsCodeStore) this.smsCodeStore = new Map();
    this.smsCodeStore.set(userId, { code, expireTime, phone });
  }

  getSMSCode(userId) {
    if (!this.smsCodeStore) return null;
    return this.smsCodeStore.get(userId);
  }

  deleteSMSCode(userId) {
    if (!this.smsCodeStore) return;
    this.smsCodeStore.delete(userId);
  }

  storeBackupCodes(userId, codes) {
    if (!this.backupCodeStore) this.backupCodeStore = new Map();
    this.backupCodeStore.set(userId, codes);
  }

  getBackupCodes(userId) {
    if (!this.backupCodeStore) return null;
    return this.backupCodeStore.get(userId);
  }

  updateBackupCodes(userId, codes) {
    if (!this.backupCodeStore) this.backupCodeStore = new Map();
    this.backupCodeStore.set(userId, codes);
  }

  isTOTPEnabled(userId) {
    // 실제 구현에서는 데이터베이스에서 확인
    return false;
  }

  isSMSEnabled(userId) {
    // 실제 구현에서는 데이터베이스에서 확인
    return false;
  }

  getLastMFAEnabledTime(userId) {
    // 실제 구현에서는 데이터베이스에서 확인
    return null;
  }
}

// 싱글톤 인스턴스
const mfaService = new MFAService();

export default mfaService;
export { MFAService };