/**
 * @file Sequelize ENUM 자동 생성기
 * @description ENUM 마스터 정의에서 Sequelize 모델용 ENUM을 자동 생성
 * @date 2025-09-21
 * @version 1.0.0
 */

import { ENUM_DEFINITIONS } from './enumDefinitions.js';

/**
 * Sequelize 모델에서 사용할 ENUM 객체 생성
 */
export function generateSequelizeEnums() {
  const sequelizeEnums = {};

  Object.entries(ENUM_DEFINITIONS).forEach(([enumName, definition]) => {
    sequelizeEnums[enumName] = {
      values: definition.values,
      defaultValue: definition.defaultValue,

      // Sequelize DataTypes.ENUM 형태로 변환하는 헬퍼
      toSequelizeEnum() {
        return definition.values;
      },

      // 필드 정의 헬퍼 (allowNull, defaultValue 포함)
      toFieldDefinition(options = {}) {
        return {
          type: `DataTypes.ENUM(${definition.values.map(v => `'${v}'`).join(', ')})`,
          allowNull: options.allowNull !== false,
          defaultValue: options.defaultValue || definition.defaultValue,
          comment: definition.description.ko || definition.description.en,
          validate: {
            isIn: {
              args: [definition.values],
              msg: `Value must be one of: ${definition.values.join(', ')}`
            }
          }
        };
      }
    };
  });

  return sequelizeEnums;
}

/**
 * 특정 모델에서 사용하는 ENUM들만 가져오기
 */
export function getEnumsForModel(modelName) {
  const modelEnums = {};

  Object.entries(ENUM_DEFINITIONS).forEach(([enumName, definition]) => {
    if (definition.sequelizeModels?.includes(modelName)) {
      modelEnums[enumName] = {
        values: definition.values,
        defaultValue: definition.defaultValue
      };
    }
  });

  return modelEnums;
}

/**
 * Sequelize 모델 파일에 삽입할 ENUM import 문 생성
 */
export function generateSequelizeImport() {
  return `// Auto-generated ENUM imports from central definition
import { SEQUELIZE_ENUMS } from '../shared/enums/index.js';

// Usage example:
// status: {
//   type: DataTypes.ENUM(...SEQUELIZE_ENUMS.OrderStatusEnum.values),
//   allowNull: false,
//   defaultValue: SEQUELIZE_ENUMS.OrderStatusEnum.defaultValue
// }`;
}

/**
 * 모델별 ENUM 사용 예제 코드 생성
 */
export function generateModelEnumExamples(modelName) {
  const modelEnums = getEnumsForModel(modelName);

  if (Object.keys(modelEnums).length === 0) {
    return `// No ENUMs defined for model: ${modelName}`;
  }

  const examples = Object.entries(modelEnums).map(([enumName, enumDef]) => {
    const fieldName = enumName.replace('Enum', '').toLowerCase();

    return `  ${fieldName}: {
    type: DataTypes.ENUM(${enumDef.values.map(v => `'${v}'`).join(', ')}),
    allowNull: false,
    defaultValue: '${enumDef.defaultValue || enumDef.values[0]}',
    comment: '${enumName} - ${enumDef.values.join(', ')}'
  }`;
  }).join(',\n\n');

  return `// ENUM field definitions for ${modelName} model:
${examples}`;
}

/**
 * 전체 프로젝트의 Sequelize ENUM 사용 현황 분석
 */
export function analyzeSequelizeEnumUsage() {
  const analysis = {
    totalEnums: 0,
    byModel: {},
    unusedEnums: [],
    statistics: {}
  };

  Object.entries(ENUM_DEFINITIONS).forEach(([enumName, definition]) => {
    analysis.totalEnums++;

    if (!definition.sequelizeModels || definition.sequelizeModels.length === 0) {
      analysis.unusedEnums.push(enumName);
      return;
    }

    definition.sequelizeModels.forEach(modelName => {
      if (!analysis.byModel[modelName]) {
        analysis.byModel[modelName] = {
          enums: [],
          count: 0
        };
      }

      analysis.byModel[modelName].enums.push({
        name: enumName,
        values: definition.values,
        defaultValue: definition.defaultValue
      });
      analysis.byModel[modelName].count++;
    });
  });

  // 통계 계산
  analysis.statistics = {
    modelsUsingEnums: Object.keys(analysis.byModel).length,
    averageEnumsPerModel: analysis.totalEnums / Object.keys(analysis.byModel).length,
    mostEnumRichModel: Object.entries(analysis.byModel)
      .sort(([,a], [,b]) => b.count - a.count)[0],
    unusedEnumCount: analysis.unusedEnums.length
  };

  return analysis;
}

/**
 * Sequelize 마이그레이션 파일용 ENUM 변경 스크립트 생성
 */
export function generateEnumMigrationScript(enumName, oldValues, newValues) {
  const added = newValues.filter(v => !oldValues.includes(v));
  const removed = oldValues.filter(v => !newValues.includes(v));

  if (added.length === 0 && removed.length === 0) {
    return '// No ENUM changes detected';
  }

  let script = `// Migration script for ${enumName}\n`;

  if (added.length > 0) {
    script += `// Added values: ${added.join(', ')}\n`;
    script += `await queryInterface.changeColumn('YourTableName', 'your_field_name', {\n`;
    script += `  type: DataTypes.ENUM(${newValues.map(v => `'${v}'`).join(', ')}),\n`;
    script += `  allowNull: false\n`;
    script += `});\n\n`;
  }

  if (removed.length > 0) {
    script += `// ⚠️  Removed values: ${removed.join(', ')}\n`;
    script += `// WARNING: Ensure no existing data uses these values before migration!\n\n`;
  }

  return script;
}

// Export된 ENUM 객체 (다른 모듈에서 import 용)
export const SEQUELIZE_ENUMS = generateSequelizeEnums();

export default {
  generateSequelizeEnums,
  getEnumsForModel,
  generateSequelizeImport,
  generateModelEnumExamples,
  analyzeSequelizeEnumUsage,
  generateEnumMigrationScript,
  SEQUELIZE_ENUMS
};