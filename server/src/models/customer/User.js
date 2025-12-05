import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcrypt';

/**
 * User Model
 * 고객 사용자 모델
 */
class User extends Model {
  /**
   * 비밀번호 검증
   * @param {string} password - 검증할 비밀번호
   * @returns {Promise<boolean>}
   */
  async comparePassword(password) {
    if (!this.passwordHash) return false;
    return bcrypt.compare(password, this.passwordHash);
  }

  /**
   * 전화번호 인증 완료 처리
   */
  async verifyPhone() {
    this.isPhoneVerified = true;
    return this.save();
  }

  /**
   * 이메일 인증 완료 처리
   */
  async verifyEmail() {
    this.isEmailVerified = true;
    return this.save();
  }

  /**
   * 마지막 로그인 시간 업데이트
   */
  async updateLastLogin() {
    this.lastLoginAt = new Date();
    return this.save();
  }
}

/**
 * User 모델 초기화
 * @param {import('sequelize').Sequelize} sequelize
 */
export const initUser = (sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      // 인증 정보
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
        comment: '전화번호 (고유)',
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        validate: {
          isEmail: {
            msg: 'Invalid email format',
          },
        },
        comment: '이메일 (고유)',
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '암호화된 비밀번호',
      },
      // 프로필 정보
      name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '이름',
      },
      nickname: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '닉네임',
      },
      profileImage: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '프로필 이미지 URL',
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '생년월일',
      },
      gender: {
        type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'),
        allowNull: true,
        comment: '성별',
      },
      // 위치 정보
      address: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '주소',
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        comment: '위도',
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        comment: '경도',
      },
      // 인증 상태
      isPhoneVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: '전화번호 인증 여부',
      },
      isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: '이메일 인증 여부',
      },
      // 계정 상태
      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'BANNED'),
        defaultValue: 'ACTIVE',
        allowNull: false,
        comment: '계정 상태',
      },
      role: {
        type: DataTypes.ENUM('CUSTOMER', 'DRIVER', 'ADMIN', 'SUPER_ADMIN'),
        defaultValue: 'CUSTOMER',
        allowNull: false,
        comment: '사용자 역할',
      },
      // 설정
      language: {
        type: DataTypes.ENUM('VI', 'EN', 'KO'),
        defaultValue: 'VI',
        allowNull: true,
        comment: '선호 언어',
      },
      notificationsEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: '알림 활성화 여부',
      },
      marketingOptIn: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: '마케팅 수신 동의',
      },
      // 소셜 로그인
      socialProvider: {
        type: DataTypes.ENUM('GOOGLE', 'FACEBOOK', 'APPLE', 'KAKAO', 'NAVER'),
        allowNull: true,
        comment: '소셜 로그인 제공자',
      },
      socialId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '소셜 로그인 ID',
      },
      // 푸시 알림
      fcmToken: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Firebase Cloud Messaging 토큰',
      },
      deviceType: {
        type: DataTypes.ENUM('IOS', 'ANDROID', 'WEB', 'DESKTOP'),
        allowNull: true,
        comment: '디바이스 타입',
      },
      // 활동 정보
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '마지막 로그인 시각',
      },
      lastActivityAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '마지막 활동 시각',
      },
      // 시스템 정보
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '삭제 시각 (Soft Delete)',
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      paranoid: true, // Soft delete 활성화
      indexes: [
        {
          unique: true,
          fields: ['phone'],
          where: { deletedAt: null },
        },
        {
          unique: true,
          fields: ['email'],
          where: { deletedAt: null },
        },
        {
          fields: ['status'],
        },
        {
          fields: ['role'],
        },
        {
          fields: ['socialProvider', 'socialId'],
        },
        {
          fields: ['createdAt'],
        },
      ],
      hooks: {
        /**
         * 비밀번호 해싱 (생성 전)
         */
        beforeCreate: async (user) => {
          if (user.passwordHash) {
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
          }
        },
        /**
         * 비밀번호 해싱 (업데이트 전)
         */
        beforeUpdate: async (user) => {
          if (user.changed('passwordHash') && user.passwordHash) {
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
          }
        },
      },
    }
  );

  return User;
};

export default User;
