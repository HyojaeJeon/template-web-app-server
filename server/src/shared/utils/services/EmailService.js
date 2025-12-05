/**
 * Email Service
 * nodemailer를 사용한 이메일 전송 서비스
 */

import nodemailer from 'nodemailer';
import { logger } from '../utilities/Logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  /**
   * nodemailer transporter 초기화
   */
  initialize() {
    try {
      // 환경변수에서 SMTP 설정 읽기
      const smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD
        }
      };

      // 개발 환경에서는 Ethereal Email 테스트 계정 사용
      if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
        logger.warn('[EmailService] SMTP 설정이 없습니다. 이메일은 로그로만 출력됩니다.');
        this.transporter = null;
        return;
      }

      this.transporter = nodemailer.createTransport(smtpConfig);

      // 연결 확인
      this.transporter.verify((error) => {
        if (error) {
          logger.error('[EmailService] SMTP 연결 실패:', error);
          this.transporter = null;
        } else {
          logger.info('[EmailService] SMTP 서버 연결 성공');
        }
      });
    } catch (error) {
      logger.error('[EmailService] 초기화 실패:', error);
      this.transporter = null;
    }
  }

  /**
   * 이메일 전송
   */
  async sendEmail({ to, subject, html, text }) {
    try {
      // transporter가 없으면 로그만 출력
      if (!this.transporter) {
        logger.info('[EmailService] 이메일 전송 (테스트 모드):', {
          to,
          subject,
          preview: text?.substring(0, 100)
        });
        return { success: true, messageId: 'test-mode' };
      }

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || process.env.EMAIL_FROM_NAME || 'Delivery VN'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('[EmailService] 이메일 전송 성공:', {
        to,
        subject,
        messageId: info.messageId
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('[EmailService] 이메일 전송 실패:', {
        to,
        subject,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * 직원 초대 이메일 전송
   */
  async sendStaffInvitation({ email, fullName, role, temporaryPassword, storeName, storeOwnerName }) {
    const roleNames = {
      'STORE_MANAGER': '매장 관리자',
      'CHEF': '요리사',
      'CASHIER': '계산원',
      'DELIVERY_MANAGER': '배달 관리자'
    };

    const roleName = roleNames[role] || role;

    const subject = `[${storeName}] 직원 초대 - 계정 정보 안내`;

    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>직원 초대</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: #f5f7fa;
            padding: 20px;
        }
        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #2AC1BC 0%, #00B14F 100%);
            padding: 48px 32px;
            text-align: center;
            position: relative;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="white" opacity="0.1"/></svg>');
            background-size: 100px 100px;
            opacity: 0.1;
        }
        .logo {
            width: 64px;
            height: 64px;
            background: white;
            border-radius: 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin-bottom: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .header h1 {
            color: white;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            position: relative;
        }
        .header p {
            color: rgba(255, 255, 255, 0.95);
            font-size: 16px;
            font-weight: 500;
            position: relative;
        }
        .content {
            padding: 40px 32px;
        }
        .greeting {
            font-size: 18px;
            color: #1a1a1a;
            margin-bottom: 24px;
        }
        .greeting strong {
            color: #2AC1BC;
            font-weight: 600;
        }
        .invitation-card {
            background: linear-gradient(135deg, #f8fffe 0%, #f0fdf4 100%);
            border: 2px solid #2AC1BC;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
        }
        .invitation-title {
            font-size: 14px;
            font-weight: 600;
            color: #00B14F;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 16px;
        }
        .invitation-details {
            display: grid;
            gap: 12px;
        }
        .detail-item {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .detail-icon {
            width: 36px;
            height: 36px;
            background: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
        }
        .detail-text {
            flex: 1;
        }
        .detail-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 2px;
        }
        .detail-value {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
        }
        .credentials-section {
            background: #f9fafb;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
        }
        .credentials-title {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .credential-box {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 12px;
            transition: all 0.2s ease;
        }
        .credential-box:hover {
            border-color: #2AC1BC;
            box-shadow: 0 2px 8px rgba(42, 193, 188, 0.15);
        }
        .credential-label {
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            font-weight: 600;
        }
        .credential-value {
            font-size: 20px;
            font-weight: 700;
            color: #2AC1BC;
            font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
            letter-spacing: 1px;
            word-break: break-all;
        }
        .cta-button {
            display: block;
            background: linear-gradient(135deg, #2AC1BC 0%, #00B14F 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 32px 0;
            box-shadow: 0 4px 12px rgba(42, 193, 188, 0.3);
            transition: all 0.3s ease;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(42, 193, 188, 0.4);
        }
        .warning-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            display: flex;
            gap: 12px;
        }
        .warning-icon {
            font-size: 20px;
            flex-shrink: 0;
        }
        .warning-content {
            flex: 1;
        }
        .warning-title {
            font-size: 14px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 4px;
        }
        .warning-text {
            font-size: 13px;
            color: #78350f;
            line-height: 1.5;
        }
        .steps {
            margin: 24px 0;
        }
        .step-item {
            display: flex;
            gap: 16px;
            margin-bottom: 16px;
        }
        .step-number {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #2AC1BC 0%, #00B14F 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
            flex-shrink: 0;
        }
        .step-content {
            flex: 1;
            padding-top: 4px;
        }
        .step-text {
            font-size: 14px;
            color: #4b5563;
            line-height: 1.6;
        }
        .footer {
            background: #f9fafb;
            padding: 32px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer-text {
            color: #6b7280;
            font-size: 13px;
            line-height: 1.6;
            margin-bottom: 12px;
        }
        .footer-brand {
            color: #2AC1BC;
            font-weight: 600;
            font-size: 14px;
        }
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
            margin: 24px 0;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <!-- Header -->
        <div class="header">
            <div class="logo">🍜</div>
            <h1>직원 초대장</h1>
            <p>Delivery VN Store System</p>
        </div>

        <!-- Content -->
        <div class="content">
            <!-- Greeting -->
            <div class="greeting">
                안녕하세요, <strong>${fullName}</strong>님!
            </div>

            <!-- Invitation Card -->
            <div class="invitation-card">
                <div class="invitation-title">📨 초대 정보</div>
                <div class="invitation-details">
                    <div class="detail-item">
                        <div class="detail-icon">🏪</div>
                        <div class="detail-text">
                            <div class="detail-label">매장명</div>
                            <div class="detail-value">${storeName}</div>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-icon">👤</div>
                        <div class="detail-text">
                            <div class="detail-label">초대자</div>
                            <div class="detail-value">${storeOwnerName}</div>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-icon">🎯</div>
                        <div class="detail-text">
                            <div class="detail-label">직책</div>
                            <div class="detail-value">${roleName}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="divider"></div>

            <!-- Credentials Section -->
            <div class="credentials-section">
                <div class="credentials-title">
                    <span>🔐</span>
                    <span>로그인 정보</span>
                </div>

                <div class="credential-box">
                    <div class="credential-label">이메일</div>
                    <div class="credential-value">${email}</div>
                </div>

                <div class="credential-box">
                    <div class="credential-label">임시 비밀번호</div>
                    <div class="credential-value">${temporaryPassword}</div>
                </div>
            </div>

            <!-- CTA Button -->
            <a href="${process.env.STORE_WEB_URL || 'http://localhost:5001'}/login?email=${encodeURIComponent(email)}" class="cta-button">
                🚀 로그인하고 비밀번호 변경하기
            </a>

            <!-- Warning Box -->
            <div class="warning-box">
                <div class="warning-icon">⚠️</div>
                <div class="warning-content">
                    <div class="warning-title">보안 안내</div>
                    <div class="warning-text">
                        첫 로그인 시 반드시 비밀번호를 변경해야 시스템을 사용할 수 있습니다.
                        초대 링크는 <strong>72시간 동안</strong> 유효합니다.
                    </div>
                </div>
            </div>

            <div class="divider"></div>

            <!-- Steps -->
            <div class="steps">
                <div class="step-item">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <div class="step-text">
                            위 버튼을 클릭하거나 ${process.env.STORE_WEB_URL || 'http://localhost:5001'}/login 에 접속하세요
                        </div>
                    </div>
                </div>
                <div class="step-item">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <div class="step-text">
                            이메일과 임시 비밀번호로 로그인하세요
                        </div>
                    </div>
                </div>
                <div class="step-item">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <div class="step-text">
                            안전한 새 비밀번호로 변경하고 시스템을 이용하세요
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-text">
                문의사항이 있으시면 매장 관리자에게 연락해주세요.
            </div>
            <div class="footer-brand">
                Delivery VN © 2025
            </div>
        </div>
    </div>
</body>
</html>
    `;

    const text = `
안녕하세요, ${fullName}님!

${storeOwnerName}님께서 ${storeName}의 ${roleName} 직원으로 초대하셨습니다.

계정 정보:
- 이메일: ${email}
- 임시 비밀번호: ${temporaryPassword}
- 역할: ${roleName}

로그인 URL: ${process.env.STORE_WEB_URL || 'http://localhost:5001'}/login

보안 안내:
- 임시 비밀번호는 첫 로그인 시 반드시 변경해주세요
- 비밀번호는 타인과 공유하지 마세요
- 이 이메일은 안전하게 보관하거나 삭제해주세요

문의사항이 있으시면 매장 관리자에게 연락 주세요.
감사합니다!

© 2025 Delivery VN
    `;

    return await this.sendEmail({ to: email, subject, html, text });
  }
}

// 싱글톤 인스턴스 export
export const emailService = new EmailService();
export default emailService;
