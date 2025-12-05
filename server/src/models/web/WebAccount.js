import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcrypt';

/**
 * WebAccount Model
 * Web 클라이언트 계정 모델
 */
class WebAccount extends Model {
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
   * 마지막 로그인 시간 업데이트
   */
  async updateLastLogin() {
    this.lastLoginAt = new Date();
    return this.save();
  }

  /**
   * 권한 확인
   * @param {string} permission - 확인할 권한
   * @returns {boolean}
   */
  hasPermission(permission) {
    // OWNER는 모든 권한 보유
    if (this.role === 'OWNER') {
      return true;
    }

    // permissions 배열에 권한이 있는지 확인
    return this.permissions && this.permissions.includes(permission);
  }
}

/**
 * WebAccount 모델 초기화
 * @param {import('sequelize').Sequelize} sequelize
 */
export const initWebAccount = (sequelize) => {
  WebAccount.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      // 인증 정보
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
          msg: 'This email is already registered',
        },
        validate: {
          isEmail: {
            msg: 'Invalid email format',
          },
        },
        comment: '이메일 (고유)',
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '암호화된 비밀번호',
      },
      // 프로필 정보
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '이름',
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: '전화번호',
      },
      profileImage: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '프로필 이미지 URL',
      },
      // 역할 및 권한
      role: {
        type: DataTypes.ENUM('OWNER', 'MANAGER', 'STAFF'),
        defaultValue: 'STAFF',
        allowNull: false,
        comment: '역할',
      },
      permissions: {
        type: DataTypes.JSON,
        defaultValue: [],
        allowNull: true,
        comment: '커스텀 권한 배열',
      },
      // 상태
      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'),
        defaultValue: 'ACTIVE',
        allowNull: false,
        comment: '계정 상태',
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
      // 활동 정보
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '마지막 로그인 시각',
      },
      lastLoginIp: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'IPv4 또는 IPv6',
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
      modelName: 'WebAccount',
      tableName: 'webAccounts',
      timestamps: true,
      paranoid: true, // Soft delete 활성화
      indexes: [
        {
          unique: true,
          fields: ['email'],
          where: { deletedAt: null },
        },
        {
          fields: ['role'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['createdAt'],
        },
      ],
      hooks: {
        /**
         * 비밀번호 해싱 (생성 전)
         */
        beforeCreate: async (webAccount) => {
          if (webAccount.passwordHash) {
            const salt = await bcrypt.genSalt(10);
            webAccount.passwordHash = await bcrypt.hash(webAccount.passwordHash, salt);
          }
        },
        /**
         * 비밀번호 해싱 (업데이트 전)
         */
        beforeUpdate: async (webAccount) => {
          if (webAccount.changed('passwordHash') && webAccount.passwordHash) {
            const salt = await bcrypt.genSalt(10);
            webAccount.passwordHash = await bcrypt.hash(webAccount.passwordHash, salt);
          }
        },
      },
    }
  );

  return WebAccount;
};

export default WebAccount;
