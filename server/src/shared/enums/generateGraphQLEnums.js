/**
 * @file GraphQL ENUM 자동 생성기
 * @description ENUM 마스터 정의에서 GraphQL 스키마용 ENUM을 자동 생성
 * @date 2025-09-21
 * @version 1.0.0
 */

import { ENUM_DEFINITIONS } from './enumDefinitions.js';

/**
 * GraphQL 스키마용 ENUM 정의 문자열 생성
 */
export function generateGraphQLEnumSchema() {
  const enumSchemas = [];

  // 도메인별로 그룹화
  const domainGroups = {};
  Object.entries(ENUM_DEFINITIONS).forEach(([enumName, definition]) => {
    if (!domainGroups[definition.domain]) {
      domainGroups[definition.domain] = [];
    }
    domainGroups[definition.domain].push({ enumName, definition });
  });

  // 도메인별로 ENUM 생성
  Object.entries(domainGroups).forEach(([domain, enums]) => {
    enumSchemas.push(`# ===============================================`);
    enumSchemas.push(`# ${domain.toUpperCase()} 도메인 ENUM`);
    enumSchemas.push(`# ===============================================`);
    enumSchemas.push('');

    enums.forEach(({ enumName, definition }) => {
      // ENUM 설명 주석
      enumSchemas.push(`# ${definition.description.ko}`);
      if (definition.description.en) {
        enumSchemas.push(`# EN: ${definition.description.en}`);
      }
      if (definition.description.vi) {
        enumSchemas.push(`# VI: ${definition.description.vi}`);
      }

      // ENUM 정의
      enumSchemas.push(`enum ${enumName} {`);
      definition.values.forEach(value => {
        enumSchemas.push(`  ${value}`);
      });
      enumSchemas.push(`}`);
      enumSchemas.push('');
    });
  });

  return enumSchemas.join('\n');
}

/**
 * GraphQL 리졸버용 ENUM 객체 생성
 */
export function generateGraphQLEnumResolvers() {
  const resolvers = {};

  Object.entries(ENUM_DEFINITIONS).forEach(([enumName, definition]) => {
    resolvers[enumName] = definition.values.reduce((acc, value) => {
      acc[value] = value;
      return acc;
    }, {});
  });

  return resolvers;
}

/**
 * 특정 GraphQL 타입에서 사용하는 ENUM들 가져오기
 */
export function getEnumsForGraphQLType(typeName) {
  const typeEnums = {};

  Object.entries(ENUM_DEFINITIONS).forEach(([enumName, definition]) => {
    if (definition.graphqlTypes?.includes(typeName)) {
      typeEnums[enumName] = {
        values: definition.values,
        description: definition.description
      };
    }
  });

  return typeEnums;
}

/**
 * GraphQL 스키마 파일 헤더 생성
 */
export function generateGraphQLEnumFileHeader() {
  const totalEnums = Object.keys(ENUM_DEFINITIONS).length;
  const domains = [...new Set(Object.values(ENUM_DEFINITIONS).map(def => def.domain))];

  return `# ===============================================
# 🔄 AUTO-GENERATED ENUM DEFINITIONS
# ===============================================
# 이 파일은 자동으로 생성됩니다. 직접 수정하지 마세요.
# 수정이 필요한 경우 /shared/enums/enumDefinitions.js를 편집하세요.
#
# 생성 일시: ${new Date().toISOString()}
# 총 ENUM 수: ${totalEnums}
# 포함 도메인: ${domains.join(', ')}
# ===============================================

`;
}

/**
 * GraphQL Input 타입에서 ENUM 필드 정의 생성
 */
export function generateGraphQLInputEnumFields(inputTypeName) {
  const relatedEnums = getEnumsForGraphQLType(inputTypeName);

  if (Object.keys(relatedEnums).length === 0) {
    return `# No ENUM fields for input type: ${inputTypeName}`;
  }

  const fields = Object.entries(relatedEnums).map(([enumName, enumDef]) => {
    const fieldName = enumName.replace('Enum', '').toLowerCase();
    const description = enumDef.description.ko || enumDef.description.en;

    return `  ${fieldName}: ${enumName}    # ${description}`;
  }).join('\n');

  return `# ENUM fields for ${inputTypeName}:\n${fields}`;
}

/**
 * GraphQL ENUM 사용 현황 분석
 */
export function analyzeGraphQLEnumUsage() {
  const analysis = {
    totalEnums: 0,
    byGraphQLType: {},
    unusedEnums: [],
    domainDistribution: {},
    statistics: {}
  };

  Object.entries(ENUM_DEFINITIONS).forEach(([enumName, definition]) => {
    analysis.totalEnums++;

    // 도메인별 분포
    if (!analysis.domainDistribution[definition.domain]) {
      analysis.domainDistribution[definition.domain] = [];
    }
    analysis.domainDistribution[definition.domain].push(enumName);

    if (!definition.graphqlTypes || definition.graphqlTypes.length === 0) {
      analysis.unusedEnums.push(enumName);
      return;
    }

    definition.graphqlTypes.forEach(typeName => {
      if (!analysis.byGraphQLType[typeName]) {
        analysis.byGraphQLType[typeName] = {
          enums: [],
          count: 0
        };
      }

      analysis.byGraphQLType[typeName].enums.push({
        name: enumName,
        values: definition.values,
        description: definition.description
      });
      analysis.byGraphQLType[typeName].count++;
    });
  });

  // 통계 계산
  analysis.statistics = {
    typesUsingEnums: Object.keys(analysis.byGraphQLType).length,
    averageEnumsPerType: analysis.totalEnums / Object.keys(analysis.byGraphQLType).length,
    mostEnumRichType: Object.entries(analysis.byGraphQLType)
      .sort(([,a], [,b]) => b.count - a.count)[0],
    unusedEnumCount: analysis.unusedEnums.length,
    domainCount: Object.keys(analysis.domainDistribution).length
  };

  return analysis;
}

/**
 * GraphQL ENUM 값 검증 스키마 생성 (Joi 등에서 사용)
 */
export function generateEnumValidationSchema() {
  const validationSchemas = {};

  Object.entries(ENUM_DEFINITIONS).forEach(([enumName, definition]) => {
    validationSchemas[enumName] = {
      type: 'string',
      valid: definition.values,
      default: definition.defaultValue,
      description: definition.description.en || definition.description.ko
    };
  });

  return validationSchemas;
}

/**
 * TypeScript enum 정의 생성 (클라이언트용)
 */
export function generateTypeScriptEnums() {
  const tsEnums = [];

  Object.entries(ENUM_DEFINITIONS).forEach(([enumName, definition]) => {
    const enumComment = `/**
 * ${definition.description.ko}
 * ${definition.description.en ? `EN: ${definition.description.en}` : ''}
 * Domain: ${definition.domain}
 */`;

    const enumValues = definition.values.map(value =>
      `  ${value} = '${value}'`
    ).join(',\n');

    tsEnums.push(`${enumComment}
export enum ${enumName} {
${enumValues}
}`);
  });

  return tsEnums.join('\n\n');
}

/**
 * GraphQL 스키마 변경 감지 및 마이그레이션 가이드 생성
 */
export function generateGraphQLEnumMigrationGuide(oldEnums, newEnums) {
  const changes = [];

  // 새로 추가된 ENUM
  Object.keys(newEnums).forEach(enumName => {
    if (!oldEnums[enumName]) {
      changes.push({
        type: 'ADDED',
        enumName,
        action: `새 ENUM 추가: ${enumName}`,
        impact: 'GraphQL 스키마에 새 타입 추가됨'
      });
    }
  });

  // 삭제된 ENUM
  Object.keys(oldEnums).forEach(enumName => {
    if (!newEnums[enumName]) {
      changes.push({
        type: 'REMOVED',
        enumName,
        action: `ENUM 삭제: ${enumName}`,
        impact: '⚠️  기존 쿼리/뮤테이션에 영향 가능'
      });
    }
  });

  // 변경된 ENUM 값
  Object.keys(newEnums).forEach(enumName => {
    if (oldEnums[enumName]) {
      const oldValues = oldEnums[enumName].values;
      const newValues = newEnums[enumName].values;

      const added = newValues.filter(v => !oldValues.includes(v));
      const removed = oldValues.filter(v => !newValues.includes(v));

      if (added.length > 0) {
        changes.push({
          type: 'ENUM_VALUES_ADDED',
          enumName,
          action: `${enumName}에 값 추가: ${added.join(', ')}`,
          impact: '기존 코드에 영향 없음'
        });
      }

      if (removed.length > 0) {
        changes.push({
          type: 'ENUM_VALUES_REMOVED',
          enumName,
          action: `${enumName}에서 값 제거: ${removed.join(', ')}`,
          impact: '⚠️  기존 데이터 확인 필요'
        });
      }
    }
  });

  return {
    hasChanges: changes.length > 0,
    changes,
    migrationSteps: generateMigrationSteps(changes)
  };
}

/**
 * 마이그레이션 단계 생성
 */
function generateMigrationSteps(changes) {
  const steps = [];

  changes.forEach((change, index) => {
    switch (change.type) {
      case 'ADDED':
        steps.push(`${index + 1}. GraphQL 스키마에 ${change.enumName} 추가`);
        steps.push(`   - 클라이언트 코드 생성 업데이트 필요`);
        break;

      case 'REMOVED':
        steps.push(`${index + 1}. ⚠️  ${change.enumName} 제거 전 영향도 분석`);
        steps.push(`   - 기존 쿼리/뮤테이션에서 사용 여부 확인`);
        steps.push(`   - 클라이언트 앱 업데이트 후 제거`);
        break;

      case 'ENUM_VALUES_ADDED':
        steps.push(`${index + 1}. ${change.enumName} 값 추가 - 안전한 변경`);
        break;

      case 'ENUM_VALUES_REMOVED':
        steps.push(`${index + 1}. ⚠️  ${change.enumName} 값 제거 전 데이터 마이그레이션`);
        steps.push(`   - 기존 데이터에서 해당 값 사용 현황 확인`);
        steps.push(`   - 필요시 데이터 변환 스크립트 실행`);
        break;
    }
  });

  return steps;
}

export default {
  generateGraphQLEnumSchema,
  generateGraphQLEnumResolvers,
  getEnumsForGraphQLType,
  generateGraphQLEnumFileHeader,
  generateGraphQLInputEnumFields,
  analyzeGraphQLEnumUsage,
  generateEnumValidationSchema,
  generateTypeScriptEnums,
  generateGraphQLEnumMigrationGuide
};