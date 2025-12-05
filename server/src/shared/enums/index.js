/**
 * @file ENUM 중앙 관리 시스템 통합 진입점
 * @description 모든 ENUM 관련 기능을 통합하여 제공
 * @date 2025-09-21
 * @version 1.0.0
 */

// 핵심 ENUM 정의
export {
  ENUM_DEFINITIONS,
  validateEnumValue,
  getEnumDefaultValue,
  getEnumsByDomain,
  getEnumUsageAnalysis
} from './enumDefinitions.js';

// Sequelize 관련
export {
  generateSequelizeEnums,
  getEnumsForModel,
  generateSequelizeImport,
  generateModelEnumExamples,
  analyzeSequelizeEnumUsage,
  generateEnumMigrationScript,
  SEQUELIZE_ENUMS
} from './generateSequelizeEnums.js';

// GraphQL 관련
export {
  generateGraphQLEnumSchema,
  generateGraphQLEnumResolvers,
  getEnumsForGraphQLType,
  generateGraphQLEnumFileHeader,
  generateGraphQLInputEnumFields,
  analyzeGraphQLEnumUsage,
  generateEnumValidationSchema,
  generateTypeScriptEnums,
  generateGraphQLEnumMigrationGuide
} from './generateGraphQLEnums.js';

/**
 * ENUM 시스템 전체 상태 체크
 */
export function checkEnumSystemHealth() {
  const sequelizeAnalysis = analyzeSequelizeEnumUsage();
  const graphqlAnalysis = analyzeGraphQLEnumUsage();

  return {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    sequelize: {
      totalEnums: sequelizeAnalysis.totalEnums,
      modelsUsingEnums: sequelizeAnalysis.statistics.modelsUsingEnums,
      unusedEnums: sequelizeAnalysis.unusedEnums.length
    },
    graphql: {
      totalEnums: graphqlAnalysis.totalEnums,
      typesUsingEnums: graphqlAnalysis.statistics.typesUsingEnums,
      unusedEnums: graphqlAnalysis.unusedEnums.length
    },
    sync: {
      isInSync: sequelizeAnalysis.totalEnums === graphqlAnalysis.totalEnums,
      discrepancy: Math.abs(sequelizeAnalysis.totalEnums - graphqlAnalysis.totalEnums)
    }
  };
}

/**
 * 빠른 ENUM 조회를 위한 인덱스
 */
export const ENUM_REGISTRY = {
  // 자주 사용되는 ENUM들에 대한 빠른 접근
  ORDER_STATUS: ENUM_DEFINITIONS.OrderStatusEnum?.values || [],
  PAYMENT_METHOD: ENUM_DEFINITIONS.PaymentMethodEnum?.values || [],
  DELIVERY_STATUS: ENUM_DEFINITIONS.DeliveryStatusEnum?.values || [],
  STORE_STATUS: ENUM_DEFINITIONS.StoreStatusEnum?.values || [],
  USER_STATUS: ENUM_DEFINITIONS.CustomerStatusEnum?.values || [],

  // ENUM 값 검증 도우미
  isValidOrderStatus: (value) => ENUM_DEFINITIONS.OrderStatusEnum?.values.includes(value),
  isValidPaymentMethod: (value) => ENUM_DEFINITIONS.PaymentMethodEnum?.values.includes(value),
  isValidDeliveryStatus: (value) => ENUM_DEFINITIONS.DeliveryStatusEnum?.values.includes(value),

  // 기본값 조회
  getDefaultOrderStatus: () => getEnumDefaultValue('OrderStatusEnum'),
  getDefaultPaymentMethod: () => getEnumDefaultValue('PaymentMethodEnum'),
  getDefaultDeliveryStatus: () => getEnumDefaultValue('DeliveryStatusEnum')
};

/**
 * 개발용 ENUM 정보 출력
 */
export function printEnumInfo(enumName) {
  const enumDef = ENUM_DEFINITIONS[enumName];

  if (!enumDef) {
    console.log(`❌ ENUM not found: ${enumName}`);
    return;
  }

  console.log(`\n📋 ENUM: ${enumName}`);
  console.log(`🏷️  Domain: ${enumDef.domain}`);
  console.log(`📝 Description: ${enumDef.description.ko}`);
  console.log(`🔢 Values: ${enumDef.values.join(', ')}`);
  console.log(`⭐ Default: ${enumDef.defaultValue || 'None'}`);
  console.log(`🗃️  Sequelize Models: ${enumDef.sequelizeModels?.join(', ') || 'None'}`);
  console.log(`🔗 GraphQL Types: ${enumDef.graphqlTypes?.join(', ') || 'None'}`);
}

/**
 * 전체 ENUM 시스템 요약 출력
 */
export function printEnumSystemSummary() {
  const health = checkEnumSystemHealth();
  const usage = getEnumUsageAnalysis();

  console.log('\n' + '='.repeat(50));
  console.log('🔄 ENUM 중앙 관리 시스템 현황');
  console.log('='.repeat(50));

  console.log(`\n📊 전체 통계:`);
  console.log(`  총 ENUM 수: ${usage.totalEnums}`);
  console.log(`  도메인 수: ${Object.keys(usage.byDomain).length}`);
  console.log(`  Sequelize 모델 수: ${Object.keys(usage.byModel).length}`);
  console.log(`  GraphQL 타입 수: ${Object.keys(usage.byGraphQLType).length}`);

  console.log(`\n🏥 시스템 상태:`);
  console.log(`  Sequelize-GraphQL 동기화: ${health.sync.isInSync ? '✅' : '❌'}`);
  console.log(`  미사용 Sequelize ENUM: ${health.sequelize.unusedEnums}`);
  console.log(`  미사용 GraphQL ENUM: ${health.graphql.unusedEnums}`);

  console.log(`\n🏷️  도메인별 분포:`);
  Object.entries(usage.byDomain).forEach(([domain, enums]) => {
    console.log(`  ${domain}: ${enums.length}개`);
  });
}

// Default export for convenience
export default {
  ENUM_DEFINITIONS,
  SEQUELIZE_ENUMS,
  ENUM_REGISTRY,
  checkEnumSystemHealth,
  printEnumInfo,
  printEnumSystemSummary,
  validateEnumValue,
  getEnumDefaultValue
};