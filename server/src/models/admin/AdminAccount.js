import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcrypt';

/**
 * AdminAccount Model
 * 슈퍼관리자 계정 관리
 */
class AdminAccount extends Model {
  /**
   * 비밀번호 검증
   * @param {string} password - 검증할 비밀번호
   * @returns {Promise<boolean>}
   */
  async comparePassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  }

  /**
   * 권한 확인
   * @param {string} permission - 확인할 권한
   * @returns {boolean}
   */
  hasPermission(permission) {
    // SUPER_ADMIN은 모든 권한 보유
    if (this.role === 'SUPER_ADMIN') {
      return true;
    }

    // permissions 배열에 권한이 있는지 확인
    return this.permissions && this.permissions.includes(permission);
  }

  /**
   * 역할별 기본 권한 가져오기
   * @returns {string[]}
   */
  getDefaultPermissions() {
    const defaultPermissions = {
      SUPER_ADMIN: ['*'], // 모든 권한
      ADMIN: [
        'VIEW_DASHBOARD',
        'VIEW_USERS',
        'MANAGE_USERS',
        'VIEW_STORES',
        'MANAGE_STORES',
        'VIEW_ORDERS',
        'MANAGE_ORDERS',
        'VIEW_ANALYTICS',
        'VIEW_PAYMENTS',
        'MANAGE_PAYMENTS',
        'VIEW_REVIEWS',
        'MANAGE_REVIEWS',
        'VIEW_PROMOTIONS',
        'MANAGE_PROMOTIONS',
      ],
      VIEWER: [
        'VIEW_DASHBOARD',
        'VIEW_USERS',
        'VIEW_STORES',
        'VIEW_ORDERS',
        'VIEW_ANALYTICS',
        'VIEW_PAYMENTS',
        'VIEW_REVIEWS',
        'VIEW_PROMOTIONS',
      ],
    };

    return defaultPermissions[this.role] || [];
  }

  /**
   * 모든 권한 가져오기 (기본 권한 + 커스텀 권한)
   * @returns {string[]}
   */
  getAllPermissions() {
    if (this.role === 'SUPER_ADMIN') {
      return ['*'];
    }

    const defaultPerms = this.getDefaultPermissions();
    const customPerms = this.permissions || [];

    return [...new Set([...defaultPerms, ...customPerms])];
  }
}

/**
 * AdminAccount 모델 초기화
 * @param {import('sequelize').Sequelize} sequelize
 */
export const initAdminAccount = (sequelize) => {
  AdminAccount.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
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
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      fullName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      avatarUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN', 'VIEWER'),
        defaultValue: 'VIEWER',
        allowNull: false,
      },
      permissions: {
        type: DataTypes.JSON,
        defaultValue: [],
        allowNull: true,
        comment: '커스텀 권한 배열',
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'TERMINATED'),
        defaultValue: 'ACTIVE',
        allowNull: false,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastLoginIp: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'IPv4 또는 IPv6',
      },
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
    },
    {
      sequelize,
      modelName: 'AdminAccount',
      tableName: 'adminAccounts',
      timestamps: true,
      paranoid: false,  // soft delete 비활성화
      indexes: [
        {
          unique: true,
          fields: ['email'],
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
        beforeCreate: async (adminAccount) => {
          if (adminAccount.passwordHash) {
            const salt = await bcrypt.genSalt(10);
            adminAccount.passwordHash = await bcrypt.hash(adminAccount.passwordHash, salt);
          }
        },

        /**
         * 비밀번호 해싱 (업데이트 전)
         */
        beforeUpdate: async (adminAccount) => {
          if (adminAccount.changed('passwordHash')) {
            const salt = await bcrypt.genSalt(10);
            adminAccount.passwordHash = await bcrypt.hash(adminAccount.passwordHash, salt);
          }
        },
      },
    }
  );

  return AdminAccount;
};

export default AdminAccount;
