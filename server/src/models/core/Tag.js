import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Tag = sequelize.define('Tag', {
  // GraphQL 스키마 필드 순서: id → name → nameEn → nameKo → slug → type → category → usageCount → menuItemCount → isActive → isPromoted → description → iconUrl → colorCode
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  
  // 태그 정보 (GraphQL 스키마 순서)
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '태그명 (Local어)',
  },
  nameEn: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '영문 태그명',
  },
  nameKo: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '한글 태그명',
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'URL 슬러그 (검색용)',
  },
  
  // 태그 타입 (GraphQL 스키마 순서)
  type: {
    type: DataTypes.ENUM(
      'CUISINE',     // 요리 종류 (한식, 중식, 일식 등)
      'DIETARY',     // 식단 (비건, 할랄, 글루텐프리 등)
      'FEATURE',     // 특징 (24시간, 주차가능, 애견동반 등)
      'PROMOTION'    // 프로모션 (할인중, 신메뉴, 베스트셀러 등)
    ),
    allowNull: false,
    comment: '태그 타입',
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '태그 카테고리 (세부 분류)',
  },
  
  // 사용 통계 (GraphQL 스키마 순서)
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '총 사용 횟수',
  },
  menuItemCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '사용 중인 메뉴 수',
  },
  
  // 상태 (GraphQL 스키마 순서)
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '활성화 여부',
  },
  isPromoted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '홍보 태그 여부 (상단 노출)',
  },
  
  // SEO (GraphQL 스키마 순서)
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '태그 설명',
  },
  iconUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '태그 아이콘 URL',
  },
  colorCode: {
    type: DataTypes.STRING(7),
    allowNull: true,
    comment: '태그 색상 코드 (예: #FF5733)',
    validate: {
      is: /^#[0-9A-F]{6}$/i  // HEX 색상 코드 검증
    }
  },
}, {
  tableName: 'Tags',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['slug'],
      name: 'idx_tag_slug_unique',
    },
    {
      fields: ['type', 'isActive'],
      name: 'idx_tag_type_active',
    },
    {
      fields: ['name'],
      name: 'idx_tag_name',
    },
    {
      fields: ['isPromoted', 'isActive'],
      name: 'idx_tag_promoted',
    },
    {
      fields: ['usageCount'],
      name: 'idx_tag_usage',
    },
  ],
  hooks: {
    // slug 자동 생성 (입력이 없을 경우)
    beforeValidate: (tag) => {
      if (!tag.slug && tag.name) {
        // Local어 -> slug 변환 (간단한 버전)
        tag.slug = tag.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
    },
  }
});

// Instance methods
Tag.prototype.incrementUsage = async function() {
  this.usageCount += 1;
  return this.save();
};

Tag.prototype.updateStatistics = async function() {
  // MenuItemTags 카운트 업데이트
  const menuItemCount = await sequelize.models.MenuItemTag.count({ where: { tagId: this.id } });

  this.menuItemCount = menuItemCount;
  this.usageCount = menuItemCount;

  return this.save();
};

// Class methods
Tag.findPopularTags = function(options = {}) {
  const { limit = 10, type = null } = options;
  
  const whereClause = { isActive: true };
  if (type) {
    whereClause.type = type;
  }
  
  return this.findAll({
    where: whereClause,
    order: [['usageCount', 'DESC']],
    limit,
  });
};

Tag.findPromotedTags = function(options = {}) {
  const { limit = 5 } = options;
  
  return this.findAll({
    where: {
      isActive: true,
      isPromoted: true,
    },
    order: [['usageCount', 'DESC']],
    limit,
  });
};

export default Tag;