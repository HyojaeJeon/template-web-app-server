/**
 * Database Performance Optimization Service
 * Query optimization and index management
 */

export class DatabaseOptimizer {
  constructor(container) {
    this.container = container;
    this.logger = container.resolve('logger');
    this.sequelize = container.resolve('sequelize');
  }

  /**
   * Generate optimized index SQL statements
   */
  generateOptimizedIndexes() {
    return {
      // User table - Phone number search optimization
      users: [
        'CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phoneNumber, phoneCountryCode)',
        'CREATE INDEX IF NOT EXISTS idx_users_location ON users (district, ward, province)',
        'CREATE INDEX IF NOT EXISTS idx_users_active ON users (isActive, createdAt) WHERE isActive = 1',
      ],

      // Address table - Administrative region optimization
      addresses: [
        'CREATE INDEX IF NOT EXISTS idx_addresses_admin ON addresses (province, district, ward)',
        'CREATE INDEX IF NOT EXISTS idx_addresses_location ON addresses (latitude, longitude)',
        'CREATE FULLTEXT INDEX IF NOT EXISTS idx_addresses_search ON addresses (streetAddress, ward, district) WITH PARSER ngram',
      ],

      // Store table - Location-based search optimization
      stores: [
        'CREATE SPATIAL INDEX IF NOT EXISTS idx_stores_location ON stores (location)',
        'CREATE INDEX IF NOT EXISTS idx_stores_delivery_zone ON stores (district, ward, deliveryRadius)',
        'CREATE INDEX IF NOT EXISTS idx_stores_active ON stores (isActive, isOpen, province) WHERE isActive = 1',
      ],

      // Order table - Real-time tracking optimization
      orders: [
        'CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders (userId, status, createdAt)',
        'CREATE INDEX IF NOT EXISTS idx_orders_store_status ON orders (storeId, status, createdAt)',
        'CREATE INDEX IF NOT EXISTS idx_orders_delivery_tracking ON orders (status, deliveryAddress, createdAt) WHERE status IN ("DELIVERING", "DELIVERED")',
        'CREATE INDEX IF NOT EXISTS idx_orders_time ON orders (createdAt, province)',
      ],

      // Notification table - Real-time notification optimization
      notifications: [
        'CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (userId, readAt, createdAt) WHERE readAt IS NULL',
        'CREATE INDEX IF NOT EXISTS idx_notifications_type_priority ON notifications (type, priority, createdAt)',
        'CREATE INDEX IF NOT EXISTS idx_notifications_batch_processing ON notifications (status, scheduledAt) WHERE status = "PENDING"',
      ],

      // Event table - Festival optimization
      events: [
        'CREATE INDEX IF NOT EXISTS idx_events_festivals ON events (country, eventType, startDate)',
        'CREATE INDEX IF NOT EXISTS idx_events_active_period ON events (status, startDate, endDate) WHERE status = "ACTIVE"',
        'CREATE INDEX IF NOT EXISTS idx_events_target_audience ON events (targetAudience, isActive)',
      ],

      // Coupon table - Validation optimization
      coupons: [
        'CREATE INDEX IF NOT EXISTS idx_coupons_code_active ON coupons (code, isActive, expiresAt) WHERE isActive = 1',
        'CREATE INDEX IF NOT EXISTS idx_coupons_user_valid ON user_coupons (userId, isUsed, expiresAt) WHERE isUsed = 0',
        'CREATE INDEX IF NOT EXISTS idx_coupons_festival ON coupons (festivalType, country)',
      ],

      // Loyalty table - Point management optimization
      loyalty: [
        'CREATE INDEX IF NOT EXISTS idx_loyalty_points_user ON loyalty_points (userId, isActive, expiresAt) WHERE isActive = 1',
        'CREATE INDEX IF NOT EXISTS idx_loyalty_tier_calculation ON users (loyaltyTier, totalOrders, totalSpent)',
        'CREATE INDEX IF NOT EXISTS idx_loyalty_transactions ON loyalty_transactions (userId, type, createdAt)',
      ],

      // Review table - Search and analysis optimization
      reviews: [
        'CREATE INDEX IF NOT EXISTS idx_reviews_store_rating ON reviews (storeId, rating, isActive) WHERE isActive = 1',
        'CREATE INDEX IF NOT EXISTS idx_reviews_user_recent ON reviews (userId, createdAt, rating)',
        'CREATE FULLTEXT INDEX IF NOT EXISTS idx_reviews_content ON reviews (comment) WITH PARSER ngram',
      ],

      // Payment table - Payment gateway optimization
      payments: [
        'CREATE INDEX IF NOT EXISTS idx_payments_gateways ON payments (paymentMethod, status, createdAt) WHERE paymentMethod IN ("MOMO", "ZALOPAY", "VNPAY")',
        'CREATE INDEX IF NOT EXISTS idx_payments_order_status ON payments (orderId, status, createdAt)',
        'CREATE INDEX IF NOT EXISTS idx_payments_fraud_detection ON payments (amount, paymentMethod, userId, createdAt)',
      ],
    };
  }

  /**
   * Execute index creation
   */
  async createOptimizedIndexes() {
    try {
      this.logger.info('[DatabaseOptimizer] Starting index creation...');

      const indexes = this.generateOptimizedIndexes();
      let createdCount = 0;
      let failedCount = 0;

      for (const [tableName, indexQueries] of Object.entries(indexes)) {
        this.logger.info(`[DatabaseOptimizer] Creating indexes for ${tableName} table...`);

        for (const indexQuery of indexQueries) {
          try {
            await this.sequelize.query(indexQuery);
            createdCount++;
            this.logger.debug(`[DatabaseOptimizer] Index created: ${indexQuery.substring(0, 100)}...`);
          } catch (error) {
            failedCount++;
            this.logger.warn(`[DatabaseOptimizer] Index creation failed (ignored): ${error.message}`);
          }
        }
      }

      this.logger.info(`[DatabaseOptimizer] Index creation completed: ${createdCount} created, ${failedCount} failed`);
      return { created: createdCount, failed: failedCount };
    } catch (error) {
      this.logger.error('[DatabaseOptimizer] Index creation failed:', error);
      throw error;
    }
  }

  /**
   * Analyze query performance
   *
   * @param query
   * @param params
   */
  async analyzeQueryPerformance(query, params = []) {
    try {
      // Performance analysis using EXPLAIN query
      const explainQuery = `EXPLAIN FORMAT=JSON ${query}`;
      const [results] = await this.sequelize.query(explainQuery, {
        replacements: params,
        type: this.sequelize.QueryTypes.SELECT,
      });

      const analysis = {
        query: query.substring(0, 200),
        executionPlan: results,
        recommendations: [],
      };

      // Analyze performance recommendations
      const planString = JSON.stringify(results);

      if (planString.includes('"using_filesort": true')) {
        analysis.recommendations.push({
          type: 'INDEX_OPTIMIZATION',
          message: 'Sorting operation is not using indexes. Consider adding indexes for ORDER BY clause.',
          priority: 'HIGH',
        });
      }

      if (planString.includes('"using_temporary": true')) {
        analysis.recommendations.push({
          type: 'TEMP_TABLE_WARNING',
          message: 'Temporary table is being used. Consider index optimization.',
          priority: 'MEDIUM',
        });
      }

      if (planString.includes('"rows_examined"') && results.query_block?.cost_info?.read_cost > 1000) {
        analysis.recommendations.push({
          type: 'LARGE_SCAN_WARNING',
          message: 'Scanning many rows. Consider optimizing WHERE clause or adding indexes.',
          priority: 'HIGH',
        });
      }

      return analysis;
    } catch (error) {
      this.logger.error('[DatabaseOptimizer] Query performance analysis failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Optimize location-based queries
   *
   * @param baseQuery
   * @param userLocation
   */
  optimizeLocationQuery(baseQuery, userLocation) {
    const { latitude, longitude, district, ward } = userLocation;

    // Geographic proximity optimization
    if (latitude && longitude) {
      return {
        ...baseQuery,
        where: {
          ...baseQuery.where,
          // Distance calculation using Haversine formula
          [this.sequelize.Op.and]: [
            this.sequelize.literal(`
              (6371 * acos(
                cos(radians(${latitude})) *
                cos(radians(latitude)) *
                cos(radians(longitude) - radians(${longitude})) +
                sin(radians(${latitude})) *
                sin(radians(latitude))
              )) <= deliveryRadius
            `),
          ],
        },
        order: [
          // Sort by distance
          this.sequelize.literal(`
            (6371 * acos(
              cos(radians(${latitude})) *
              cos(radians(latitude)) *
              cos(radians(longitude) - radians(${longitude})) +
              sin(radians(${latitude})) *
              sin(radians(latitude))
            ))
          `),
        ],
      };
    }

    // Administrative region optimization
    if (district) {
      return {
        ...baseQuery,
        where: {
          ...baseQuery.where,
          district,
          ward: ward || { [this.sequelize.Op.ne]: null },
        },
        order: [
          // Sort by region priority
          ['district', 'ASC'],
          ['ward', 'ASC'],
        ],
      };
    }

    return baseQuery;
  }

  /**
   * Local 시간대 기반 쿼리 최적화
   *
   * @param baseQuery
   * @param vietnamDateTime
   */
  optimizeTimeBasedQuery(baseQuery, vietnamDateTime) {
    // Local 시간대(+07:00)로 변환
    const vietnamTime = new Date(vietnamDateTime);
    vietnamTime.setHours(vietnamTime.getHours() + 7);
    
    return {
      ...baseQuery,
      where: {
        ...baseQuery.where,
        createdAt: {
          [this.sequelize.Op.gte]: vietnamTime,
        },
      },
    };
  }

  /**
   * Local 통화(VND) 기반 쿼리 최적화
   *
   * @param baseQuery
   * @param priceRange
   */
  optimizePriceQuery(baseQuery, priceRange) {
    const { minPrice, maxPrice } = priceRange;
    
    // VND는 큰 숫자이므로 인덱스 효율을 위해 범위 쿼리 최적화
    const optimizedWhere = {
      ...baseQuery.where,
    };

    if (minPrice || maxPrice) {
      optimizedWhere.price = {};
      
      if (minPrice) {
        optimizedWhere.price[this.sequelize.Op.gte] = Math.floor(minPrice);
      }
      
      if (maxPrice) {
        optimizedWhere.price[this.sequelize.Op.lte] = Math.ceil(maxPrice);
      }
    }

    return {
      ...baseQuery,
      where: optimizedWhere,
      order: [
        ['price', 'ASC'], // 가격순 정렬로 인덱스 활용
      ],
    };
  }

  /**
   * Local어 텍스트 검색 최적화
   *
   * @param baseQuery
   * @param searchTerm
   */
  optimizeVietnameseTextSearch(baseQuery, searchTerm) {
    // Local어 특수문자 정규화
    const normalizedTerm = this._normalizeVietnameseText(searchTerm);
    
    return {
      ...baseQuery,
      where: {
        ...baseQuery.where,
        [this.sequelize.Op.or]: [
          // FULLTEXT 검색 (ngram 파서 사용)
          this.sequelize.literal(`MATCH(name, description) AGAINST('${normalizedTerm}' IN BOOLEAN MODE)`),
          // LIKE 검색 (백업)
          { name: { [this.sequelize.Op.like]: `%${normalizedTerm}%` } },
          { description: { [this.sequelize.Op.like]: `%${normalizedTerm}%` } },
        ],
      },
    };
  }

  /**
   * Local어 텍스트 정규화
   *
   * @param text
   */
  _normalizeVietnameseText(text) {
    // Local어 성조 기호 정규화
    return text
      .toLowerCase()
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/đ/g, 'd')
      .trim();
  }

  /**
   * 주문 패턴 기반 쿼리 최적화
   */
  optimizeOrderQueries() {
    return {
      // 실시간 주문 추적 쿼리
      realtimeOrderTracking: `
        SELECT o.id, o.status, o.estimatedDeliveryTime, 
               r.name as storeName, r.phone as storePhone,
               d.currentLocation, d.estimatedArrival
        FROM orders o
        INNER JOIN stores r ON o.storeId = r.id
        LEFT JOIN deliveries d ON o.id = d.orderId
        WHERE o.status IN ('CONFIRMED', 'PREPARING', 'DELIVERING')
          AND o.userId = ?
        ORDER BY o.createdAt DESC
        LIMIT 10
      `,

      // 매장 인기 메뉴 쿼리 (Local 특화)
      popularMenuItems: `
        SELECT mi.id, mi.name, mi.price,
               COUNT(oi.id) as orderCount,
               AVG(r.rating) as avgRating
        FROM menu_items mi
        INNER JOIN order_items oi ON mi.id = oi.menuItemId
        INNER JOIN orders o ON oi.orderId = o.id
        LEFT JOIN reviews r ON o.id = r.orderId AND r.menuItemId = mi.id
        WHERE mi.storeId = ?
          AND o.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          AND o.status = 'DELIVERED'
        GROUP BY mi.id
        ORDER BY orderCount DESC, avgRating DESC
        LIMIT 20
      `,

      // Local 지역별 배달 통계
      deliveryStatsByRegion: `
        SELECT 
          province, district, ward,
          COUNT(*) as totalOrders,
          AVG(TIMESTAMPDIFF(MINUTE, createdAt, deliveredAt)) as avgDeliveryTime,
          COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as successfulDeliveries
        FROM orders
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          AND province = 'Vietnam'
        GROUP BY province, district, ward
        ORDER BY totalOrders DESC
      `,
    };
  }

  /**
   * 쿼리 캐시 최적화
   */
  async enableQueryCache() {
    try {
      // MySQL 쿼리 캐시 활성화
      await this.sequelize.query('SET GLOBAL query_cache_type = ON');
      await this.sequelize.query('SET GLOBAL query_cache_size = 134217728'); // 128MB
      
      this.logger.info('[DatabaseOptimizer] MySQL 쿼리 캐시가 활성화되었습니다.');
      return true;
    } catch (error) {
      this.logger.error('[DatabaseOptimizer] 쿼리 캐시 활성화 실패:', error);
      return false;
    }
  }

  /**
   * 연결 풀 최적화 설정 생성
   */
  getOptimizedPoolConfig() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      pool: {
        max: isProduction ? 20 : 5,
        min: 2,
        acquire: 30000,
        idle: 10000,
        evict: 10000,
        handleDisconnects: true,
      },
      dialectOptions: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_vietnamese_ci',
        timezone: '+07:00',
        acquireTimeout: 30000,
        timeout: 60000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        // Local 특화 설정
        dateStrings: true,
        typeCast(field, next) {
          // Local 시간대 자동 변환
          if (field.type === 'DATETIME') {
            return new Date(`${field.string()  } +07:00`);
          }
          return next();
        },
      },
      define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_vietnamese_ci',
        timestamps: true,
        paranoid: true, // soft delete 지원
        underscored: false, // camelCase 유지
        freezeTableName: true,
      },
      logging: isProduction ? false : (sql, timing) => {
        // 개발환경에서 느린 쿼리만 로깅
        if (timing > 500) {
          this.logger.warn(`[DatabaseOptimizer] 느린 쿼리 (${timing}ms): ${sql.substring(0, 200)}...`);
        }
      },
    };
  }

  /**
   * 데이터베이스 성능 분석
   */
  async analyzePerformance() {
    try {
      const analysis = {};

      // 현재 실행 중인 쿼리 분석
      const [processlist] = await this.sequelize.query('SHOW PROCESSLIST');
      analysis.activeQueries = processlist.length;

      // 느린 쿼리 로그 분석
      try {
        const [slowQueries] = await this.sequelize.query(`
          SELECT sql_text, exec_count, avg_timer_wait/1000000000 as avg_time_sec
          FROM performance_schema.events_statements_summary_by_digest 
          WHERE avg_timer_wait > 1000000000 
          ORDER BY avg_timer_wait DESC 
          LIMIT 10
        `);
        analysis.slowQueries = slowQueries;
      } catch (err) {
        analysis.slowQueries = [];
      }

      // 인덱스 사용률 분석
      try {
        const [indexStats] = await this.sequelize.query(`
          SELECT table_schema, table_name, index_name, cardinality
          FROM information_schema.statistics 
          WHERE table_schema = DATABASE()
          ORDER BY cardinality DESC
        `);
        analysis.indexUsage = indexStats.slice(0, 20); // 상위 20개
      } catch (err) {
        analysis.indexUsage = [];
      }

      // 테이블별 크기 분석
      const [tablesSizes] = await this.sequelize.query(`
        SELECT table_name, 
               ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
               table_rows
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
        ORDER BY (data_length + index_length) DESC
      `);
      analysis.tableSizes = tablesSizes;

      // 연결 풀 상태
      analysis.connectionPool = {
        active: this.sequelize.connectionManager.pool.size,
        idle: this.sequelize.connectionManager.pool.available.length,
        waiting: this.sequelize.connectionManager.pool.pending.length,
      };

      return analysis;
    } catch (error) {
      this.logger.error('[DatabaseOptimizer] 데이터베이스 성능 분석 실패:', error);
      return { error: error.message };
    }
  }

  /**
   * Local 특화 파티셔닝 전략
   */
  generatePartitioningStrategy() {
    return {
      // 주문 테이블 - 월별 파티셔닝
      orders: {
        type: 'RANGE',
        column: 'createdAt',
        strategy: 'MONTHLY',
        retentionMonths: 24, // 2년간 보관
        sqlTemplate: `
          ALTER TABLE orders PARTITION BY RANGE (MONTH(createdAt)) (
            PARTITION p01 VALUES LESS THAN (2),
            PARTITION p02 VALUES LESS THAN (3),
            PARTITION p03 VALUES LESS THAN (4),
            PARTITION p04 VALUES LESS THAN (5),
            PARTITION p05 VALUES LESS THAN (6),
            PARTITION p06 VALUES LESS THAN (7),
            PARTITION p07 VALUES LESS THAN (8),
            PARTITION p08 VALUES LESS THAN (9),
            PARTITION p09 VALUES LESS THAN (10),
            PARTITION p10 VALUES LESS THAN (11),
            PARTITION p11 VALUES LESS THAN (12),
            PARTITION p12 VALUES LESS THAN (13)
          )
        `,
      },

      // 알림 테이블 - 주별 파티셔닝  
      notifications: {
        type: 'RANGE',
        column: 'createdAt',
        strategy: 'WEEKLY',
        retentionWeeks: 12, // 3개월간 보관
        sqlTemplate: `
          ALTER TABLE notifications PARTITION BY RANGE (WEEKOFYEAR(createdAt)) (
            PARTITION pw01 VALUES LESS THAN (14),
            PARTITION pw02 VALUES LESS THAN (27),
            PARTITION pw03 VALUES LESS THAN (40),
            PARTITION pw04 VALUES LESS THAN (53)
          )
        `,
      },

      // 로열티 거래 테이블 - 분기별 파티셔닝
      loyaltyTransactions: {
        type: 'RANGE', 
        column: 'createdAt',
        strategy: 'QUARTERLY',
        retentionQuarters: 8, // 2년간 보관
        sqlTemplate: `
          ALTER TABLE loyalty_transactions PARTITION BY RANGE (QUARTER(createdAt)) (
            PARTITION pq1 VALUES LESS THAN (2),
            PARTITION pq2 VALUES LESS THAN (3),
            PARTITION pq3 VALUES LESS THAN (4),
            PARTITION pq4 VALUES LESS THAN (5)
          )
        `,
      },
    };
  }
}