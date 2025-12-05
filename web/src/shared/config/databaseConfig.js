/**
 * 데이터베이스 설정 및 최적화 구성
 * Local App MVP - 데이터베이스 파티셔닝, 읽기 전용 복제본 설정
 * 
 * @description
 * - 데이터베이스 연결 풀 최적화
 * - 읽기/쓰기 분리 전략
 * - 파티셔닝 전략 설정
 * - 캐싱 레이어 구성
 * - Local 지역 최적화
 */

'use client';

// 데이터베이스 설정
export const DATABASE_CONFIG = {
  // 기본 연결 설정
  CONNECTION: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'delivery_vn',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
    timezone: '+07:00', // Local 시간대
    
    // 연결 풀 설정
    pool: {
      min: 2,
      max: 10,
      idle: 30000,
      acquire: 60000,
      evict: 1000,
      handleDisconnects: true
    },
    
    // 성능 최적화
    options: {
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      benchmark: true,
      dialectOptions: {
        useUTC: false,
        dateStrings: true,
        typeCast: true,
        supportBigNumbers: true,
        bigNumberStrings: true,
        decimalNumbers: true
      },
      
      // 트랜잭션 설정
      transactionType: 'IMMEDIATE',
      isolationLevel: 'READ_COMMITTED',
      
      // 쿼리 최적화
      query: {
        nest: true,
        raw: false
      }
    }
  },
  
  // 읽기 전용 복제본 설정
  READ_REPLICA: {
    enabled: process.env.DB_READ_REPLICA_ENABLED === 'true',
    host: process.env.DB_READ_REPLICA_HOST || 'localhost',
    port: process.env.DB_READ_REPLICA_PORT || 3307,
    database: process.env.DB_READ_REPLICA_NAME || 'delivery_vn_readonly',
    user: process.env.DB_READ_REPLICA_USER || 'readonly_user',
    password: process.env.DB_READ_REPLICA_PASSWORD || '',
    
    // 읽기 전용 최적화
    pool: {
      min: 1,
      max: 15, // 읽기 요청이 많으므로 더 큰 풀
      idle: 20000,
      acquire: 30000
    },
    
    // 지연 허용 (복제 지연 고려)
    maxLag: 1000, // 1초까지 지연 허용
    
    // 읽기 전용으로 사용할 쿼리 패턴
    readOnlyQueries: [
      'SELECT',
      'SHOW',
      'DESCRIBE',
      'EXPLAIN'
    ]
  },
  
  // 파티셔닝 전략
  PARTITIONING: {
    enabled: process.env.DB_PARTITIONING_ENABLED === 'true',
    
    // 테이블별 파티셔닝 설정
    tables: {
      // 주문 테이블 - 월별 파티셔닝
      orders: {
        type: 'RANGE',
        column: 'createdAt',
        interval: 'MONTH',
        retention: 24, // 24개월 보관
        partitions: [
          { name: 'orders_2024_08', range: '2024-08-01' },
          { name: 'orders_2024_09', range: '2024-09-01' },
          { name: 'orders_2024_10', range: '2024-10-01' },
          { name: 'orders_2024_11', range: '2024-11-01' },
          { name: 'orders_2024_12', range: '2024-12-01' }
        ]
      },
      
      // 알림 테이블 - 주별 파티셔닝
      notifications: {
        type: 'RANGE', 
        column: 'createdAt',
        interval: 'WEEK',
        retention: 12, // 12주 보관
        partitions: [
          { name: 'notifications_2024_w35', range: '2024-08-26' },
          { name: 'notifications_2024_w36', range: '2024-09-02' },
          { name: 'notifications_2024_w37', range: '2024-09-09' }
        ]
      },
      
      // 채팅 메시지 - 일별 파티셔닝
      chatMessages: {
        type: 'RANGE',
        column: 'createdAt', 
        interval: 'DAY',
        retention: 90, // 90일 보관
        partitions: [
          { name: 'chat_messages_20240829', range: '2024-08-29' },
          { name: 'chat_messages_20240830', range: '2024-08-30' },
          { name: 'chat_messages_20240831', range: '2024-08-31' }
        ]
      },
      
      // 매출 분석 - 월별 파티셔닝
      salesAnalytics: {
        type: 'RANGE',
        column: 'date',
        interval: 'MONTH', 
        retention: 36, // 3년 보관
        partitions: [
          { name: 'sales_2024_08', range: '2024-08-01' },
          { name: 'sales_2024_09', range: '2024-09-01' }
        ]
      }
    }
  },
  
  // 인덱스 최적화 전략
  INDEXES: {
    // 복합 인덱스 설정
    composite: [
      {
        table: 'orders',
        name: 'idx_orders_store_status_date',
        columns: ['storeId', 'status', 'createdAt'],
        type: 'BTREE'
      },
      {
        table: 'notifications',
        name: 'idx_notifications_store_type_read',
        columns: ['storeId', 'type', 'isRead', 'createdAt'],
        type: 'BTREE'
      },
      {
        table: 'chatMessages',
        name: 'idx_chat_room_timestamp',
        columns: ['chatroomId', 'createdAt'],
        type: 'BTREE'
      },
      {
        table: 'menuItems',
        name: 'idx_menu_store_category_active',
        columns: ['storeId', 'categoryId', 'isActive'],
        type: 'BTREE'
      }
    ],
    
    // 풀텍스트 인덱스
    fulltext: [
      {
        table: 'menuItems',
        name: 'ft_menu_search',
        columns: ['name', 'description'],
        language: 'utf8mb4'
      },
      {
        table: 'stores',
        name: 'ft_store_search',
        columns: ['name', 'address', 'description'],
        language: 'utf8mb4'
      }
    ],
    
    // 공간 인덱스 (Local 지역 최적화)
    spatial: [
      {
        table: 'stores',
        name: 'idx_store_location',
        column: 'location',
        type: 'SPATIAL'
      },
      {
        table: 'deliveryAreas',
        name: 'idx_delivery_polygon',
        column: 'polygon',
        type: 'SPATIAL'
      }
    ]
  },
  
  // 캐싱 전략
  CACHING: {
    // Redis 설정
    redis: {
      enabled: process.env.REDIS_ENABLED === 'true',
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: process.env.REDIS_DB || 0,
      
      // 캐시 TTL 설정 (초)
      ttl: {
        userSessions: 3600, // 1시간
        menuItems: 1800, // 30분
        storeInfo: 7200, // 2시간
        analytics: 300, // 5분
        notifications: 900, // 15분
        chatRooms: 600, // 10분
        priceCalculations: 1200 // 20분
      },
      
      // 캐시 키 패턴
      keyPatterns: {
        user: 'user:{userId}',
        store: 'store:{storeId}',
        menu: 'menu:{storeId}:{categoryId}',
        order: 'order:{orderId}',
        analytics: 'analytics:{storeId}:{date}',
        notifications: 'notifications:{storeId}:{type}',
        chat: 'chat:{chatroomId}'
      }
    },
    
    // 메모리 캐시 설정
    memory: {
      enabled: true,
      maxSize: 100, // MB
      ttl: 300, // 5분
      
      // 캐시할 데이터 타입
      cacheTypes: [
        'frequentQueries',
        'userPreferences', 
        'storeSettings',
        'menuCategories',
        'commonResponses'
      ]
    }
  },
  
  // 쿼리 최적화 설정
  QUERY_OPTIMIZATION: {
    // 슬로우 쿼리 임계값 (ms)
    slowQueryThreshold: 1000,
    
    // 자동 EXPLAIN 실행
    autoExplain: process.env.NODE_ENV === 'development',
    
    // 쿼리 계획 캐시
    planCache: {
      enabled: true,
      maxSize: 1000,
      ttl: 3600 // 1시간
    },
    
    // 배치 쿼리 설정
    batch: {
      enabled: true,
      maxBatchSize: 100,
      maxWaitTime: 50, // ms
      
      // 배치 가능한 쿼리 패턴
      batchableQueries: [
        'getUserById',
        'getMenuItemById',
        'getOrderById',
        'getNotificationById'
      ]
    }
  },
  
  // 모니터링 설정
  MONITORING: {
    // 성능 메트릭 수집
    metrics: {
      enabled: true,
      interval: 60000, // 1분마다
      
      // 수집할 메트릭
      collect: [
        'connectionCount',
        'queryExecutionTime',
        'cacheHitRate',
        'errorRate',
        'throughput',
        'latency'
      ]
    },
    
    // 알림 임계값
    alerts: {
      connectionPoolExhaustion: 0.9, // 90% 사용시
      slowQueryThreshold: 5000, // 5초 이상
      errorRateThreshold: 0.05, // 5% 이상
      cacheHitRateThreshold: 0.8 // 80% 미만
    }
  }
};

// 데이터베이스 연결 관리자
export class DatabaseConnectionManager {
  constructor() {
    this.writeConnection = null;
    this.readConnection = null;
    this.connectionPool = new Map();
    this.metrics = {
      queries: 0,
      readQueries: 0,
      writeQueries: 0,
      avgResponseTime: 0,
      errors: 0
    };
  }

  /**
   * 쓰기 연결 설정
   */
  async setupWriteConnection() {
    if (this.writeConnection) return this.writeConnection;
    
    const config = DATABASE_CONFIG.CONNECTION;
    
    try {
      // 실제 구현에서는 Sequelize나 Prisma 등 ORM 사용
      console.log('🔧 쓰기 데이터베이스 연결 설정');
      
      this.writeConnection = {
        config,
        type: 'write',
        status: 'connected',
        createdAt: Date.now()
      };
      
      return this.writeConnection;
    } catch (error) {
      console.error('❌ 쓰기 DB 연결 실패:', error);
      throw error;
    }
  }

  /**
   * 읽기 전용 연결 설정
   */
  async setupReadConnection() {
    if (!DATABASE_CONFIG.READ_REPLICA.enabled) {
      return this.writeConnection; // 읽기 복제본이 비활성화된 경우 쓰기 연결 사용
    }
    
    if (this.readConnection) return this.readConnection;
    
    const config = DATABASE_CONFIG.READ_REPLICA;
    
    try {
      console.log('📖 읽기 전용 데이터베이스 연결 설정');
      
      this.readConnection = {
        config,
        type: 'read',
        status: 'connected',
        createdAt: Date.now(),
        lastHealthCheck: Date.now()
      };
      
      // 정기적인 헬스 체크
      this.startReadReplicaHealthCheck();
      
      return this.readConnection;
    } catch (error) {
      console.error('❌ 읽기 DB 연결 실패:', error);
      
      // 읽기 복제본 연결 실패 시 쓰기 연결로 폴백
      console.log('📝 쓰기 연결로 폴백');
      return this.writeConnection;
    }
  }

  /**
   * 쿼리 타입에 따른 연결 선택
   */
  getConnectionForQuery(query) {
    const upperQuery = query.trim().toUpperCase();
    
    // 읽기 쿼리 패턴
    const readPatterns = DATABASE_CONFIG.READ_REPLICA.readOnlyQueries || [];
    const isReadQuery = readPatterns.some(pattern => upperQuery.startsWith(pattern));
    
    if (isReadQuery && this.readConnection?.status === 'connected') {
      this.metrics.readQueries++;
      return this.readConnection;
    }
    
    this.metrics.writeQueries++;
    return this.writeConnection;
  }

  /**
   * 읽기 복제본 헬스 체크
   */
  startReadReplicaHealthCheck() {
    if (!DATABASE_CONFIG.READ_REPLICA.enabled) return;
    
    setInterval(async () => {
      if (!this.readConnection) return;
      
      try {
        // 간단한 헬스 체크 쿼리
        const startTime = Date.now();
        
        // 실제 구현에서는 "SELECT 1" 쿼리 실행
        const isHealthy = true; // Mock
        const responseTime = Date.now() - startTime;
        
        if (isHealthy && responseTime < 5000) {
          this.readConnection.status = 'connected';
          this.readConnection.lastHealthCheck = Date.now();
        } else {
          this.readConnection.status = 'unhealthy';
          console.warn('⚠️ 읽기 복제본 응답 지연:', responseTime + 'ms');
        }
        
      } catch (error) {
        this.readConnection.status = 'disconnected';
        console.error('❌ 읽기 복제본 헬스 체크 실패:', error);
      }
    }, 30000); // 30초마다 체크
  }

  /**
   * 연결 상태 조회
   */
  getConnectionStatus() {
    return {
      write: {
        status: this.writeConnection?.status || 'disconnected',
        lastCheck: this.writeConnection?.createdAt || null
      },
      read: {
        enabled: DATABASE_CONFIG.READ_REPLICA.enabled,
        status: this.readConnection?.status || 'disconnected',
        lastHealthCheck: this.readConnection?.lastHealthCheck || null
      },
      metrics: this.metrics
    };
  }
}

// 파티셔닝 유틸리티
export class DatabasePartitionManager {
  constructor() {
    this.partitionConfig = DATABASE_CONFIG.PARTITIONING;
  }

  /**
   * 파티션 생성 SQL 생성
   */
  generatePartitionSQL(tableName, partitionName, partitionValue) {
    const tableConfig = this.partitionConfig.tables[tableName];
    
    if (!tableConfig) {
      throw new Error(`테이블 ${tableName}에 대한 파티션 설정이 없습니다`);
    }
    
    switch (tableConfig.type) {
      case 'RANGE':
        return `
          ALTER TABLE ${tableName} 
          ADD PARTITION (
            PARTITION ${partitionName} 
            VALUES LESS THAN ('${partitionValue}')
          )
        `;
        
      case 'HASH':
        return `
          ALTER TABLE ${tableName}
          ADD PARTITION PARTITIONS ${partitionValue}
        `;
        
      case 'LIST':
        return `
          ALTER TABLE ${tableName}
          ADD PARTITION (
            PARTITION ${partitionName}
            VALUES IN (${partitionValue})
          )
        `;
        
      default:
        throw new Error(`지원하지 않는 파티션 타입: ${tableConfig.type}`);
    }
  }

  /**
   * 자동 파티션 생성
   */
  async createPartitionsForMonth(year, month) {
    if (!this.partitionConfig.enabled) {
      console.log('파티셔닝이 비활성화되어 있습니다');
      return;
    }
    
    const nextMonth = new Date(year, month, 1);
    const monthStr = nextMonth.toISOString().slice(0, 7); // YYYY-MM
    
    try {
      // 주문 테이블 파티션
      const orderPartitionName = `orders_${monthStr.replace('-', '_')}`;
      const orderPartitionValue = nextMonth.toISOString().slice(0, 10);
      
      console.log(`📊 주문 테이블 파티션 생성: ${orderPartitionName}`);
      
      // 실제 구현에서는 여기서 SQL 실행
      // await this.executeSQL(this.generatePartitionSQL('orders', orderPartitionName, orderPartitionValue));
      
      console.log(`✅ 파티션 생성 완료: ${orderPartitionName}`);
      
    } catch (error) {
      console.error('❌ 파티션 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 오래된 파티션 정리
   */
  async cleanupOldPartitions() {
    if (!this.partitionConfig.enabled) return;
    
    console.log('🧹 오래된 파티션 정리 시작');
    
    for (const [tableName, config] of Object.entries(this.partitionConfig.tables)) {
      try {
        const retentionMonths = config.retention;
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);
        
        console.log(`📅 ${tableName} 테이블: ${cutoffDate.toISOString()} 이전 파티션 정리`);
        
        // 실제 구현에서는 오래된 파티션 DROP
        // const dropSQL = `ALTER TABLE ${tableName} DROP PARTITION old_partition_name`;
        // await this.executeSQL(dropSQL);
        
        console.log(`✅ ${tableName} 파티션 정리 완료`);
        
      } catch (error) {
        console.error(`❌ ${tableName} 파티션 정리 실패:`, error);
      }
    }
  }
}

// 쿼리 최적화 도우미
export class QueryOptimizer {
  constructor() {
    this.config = DATABASE_CONFIG.QUERY_OPTIMIZATION;
    this.queryPlanCache = new Map();
    this.batchQueue = new Map();
  }

  /**
   * 쿼리 최적화 추천
   */
  analyzeQuery(sql) {
    const recommendations = [];
    
    // 기본적인 패턴 분석
    if (sql.includes('SELECT *')) {
      recommendations.push({
        type: 'warning',
        message: 'SELECT * 사용을 피하고 필요한 컬럼만 선택하세요',
        severity: 'medium'
      });
    }
    
    if (sql.includes('LEFT JOIN') && !sql.includes('WHERE')) {
      recommendations.push({
        type: 'warning', 
        message: 'JOIN 쿼리에 WHERE 조건을 추가하여 성능을 개선하세요',
        severity: 'high'
      });
    }
    
    if (!sql.includes('LIMIT') && sql.includes('ORDER BY')) {
      recommendations.push({
        type: 'info',
        message: 'ORDER BY 사용 시 LIMIT를 추가하는 것을 고려하세요',
        severity: 'low'
      });
    }
    
    return {
      sql,
      recommendations,
      estimatedCost: this.estimateQueryCost(sql),
      suggestedIndexes: this.suggestIndexes(sql)
    };
  }

  /**
   * 쿼리 비용 추정
   */
  estimateQueryCost(sql) {
    // 간단한 휴리스틱 기반 비용 추정
    let cost = 1;
    
    // JOIN 개수에 따른 비용 증가
    const joinCount = (sql.match(/JOIN/gi) || []).length;
    cost *= Math.pow(2, joinCount);
    
    // ORDER BY 비용
    if (sql.includes('ORDER BY')) cost *= 1.5;
    
    // GROUP BY 비용
    if (sql.includes('GROUP BY')) cost *= 2;
    
    // 서브쿼리 비용
    const subqueryCount = (sql.match(/\(SELECT/gi) || []).length;
    cost *= Math.pow(1.8, subqueryCount);
    
    return Math.round(cost);
  }

  /**
   * 인덱스 추천
   */
  suggestIndexes(sql) {
    const suggestions = [];
    
    // WHERE 절에서 사용된 컬럼들 추출
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+GROUP|\s+LIMIT|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1];
      const columns = this.extractColumnsFromWhere(whereClause);
      
      if (columns.length > 0) {
        suggestions.push({
          type: 'composite',
          columns: columns.slice(0, 3), // 최대 3개 컬럼
          reason: 'WHERE 절 최적화'
        });
      }
    }
    
    // ORDER BY 절 분석
    const orderMatch = sql.match(/ORDER BY\s+([^LIMIT]+)/i);
    if (orderMatch) {
      const orderColumns = orderMatch[1].split(',').map(col => 
        col.trim().replace(/\s+(ASC|DESC)$/i, '')
      );
      
      suggestions.push({
        type: 'ordering',
        columns: orderColumns,
        reason: 'ORDER BY 최적화'
      });
    }
    
    return suggestions;
  }

  /**
   * WHERE 절에서 컬럼 추출
   */
  extractColumnsFromWhere(whereClause) {
    // 간단한 패턴 매칭 (실제로는 더 복잡한 파싱 필요)
    const columnPattern = /(\w+)\s*[=<>!]/g;
    const columns = [];
    let match;
    
    while ((match = columnPattern.exec(whereClause)) !== null) {
      if (!columns.includes(match[1])) {
        columns.push(match[1]);
      }
    }
    
    return columns;
  }
}

// 싱글톤 인스턴스
export const databaseManager = new DatabaseConnectionManager();
export const partitionManager = new DatabasePartitionManager();
export const queryOptimizer = new QueryOptimizer();

export default DATABASE_CONFIG;