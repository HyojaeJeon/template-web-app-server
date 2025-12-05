'use client'

/**
 * 알림 큐잉 시스템 서비스
 * 대용량 알림 처리, 우선순위 관리, 배치 처리, 재시도 로직
 * 
 * @description
 * - 우선순위 기반 큐 관리
 * - 배치 처리 및 스케줄링
 * - 실패 시 재시도 로직
 * - 네트워크 오프라인 처리
 * - 성능 최적화
 * - 메모리 효율성
 */

class NotificationQueueService {
  constructor(options = {}) {
    // 큐 설정
    this.maxQueueSize = options.maxQueueSize || 10000
    this.batchSize = options.batchSize || 50
    this.batchInterval = options.batchInterval || 2000 // 2초
    this.maxRetries = options.maxRetries || 3
    this.retryDelay = options.retryDelay || 5000 // 5초
    this.priorityLevels = options.priorityLevels || 5

    // 우선순위별 큐
    this.queues = new Map()
    for (let i = 0; i < this.priorityLevels; i++) {
      this.queues.set(i, [])
    }

    // 처리 상태
    this.isProcessing = false
    this.processingStats = {
      sent: 0,
      failed: 0,
      retried: 0,
      queued: 0,
      lastProcessedAt: null,
      averageProcessingTime: 0
    }

    // 타이머들
    this.batchTimer = null
    this.retryTimer = null
    this.statsTimer = null

    // 실패한 알림 큐
    this.failedQueue = new Map()

    // 네트워크 상태
    this.isOnline = navigator.onLine
    
    // 성능 모니터링
    this.performanceMetrics = {
      processingTimes: [],
      memoryUsage: [],
      queueSizes: [],
      lastCleanup: Date.now()
    }

    this.init()
  }

  /**
   * 서비스 초기화
   */
  init() {
    console.log('🔔 알림 큐잉 서비스 초기화')

    // 배치 처리 타이머 시작
    this.startBatchProcessing()

    // 네트워크 상태 모니터링
    this.setupNetworkMonitoring()

    // 메모리 정리 스케줄링
    this.scheduleCleanup()

    // 성능 모니터링 시작
    this.startPerformanceMonitoring()

    // 페이지 언로드 시 정리
    this.setupCleanup()
  }

  /**
   * 알림을 큐에 추가
   */
  enqueue(notification) {
    try {
      // 큐 크기 확인
      const totalQueueSize = this.getTotalQueueSize()
      if (totalQueueSize >= this.maxQueueSize) {
        console.warn('큐가 가득 참. 오래된 알림을 제거합니다.')
        this.removeOldestNotifications(this.batchSize)
      }

      // 우선순위 결정
      const priority = this.calculatePriority(notification)
      
      // 중복 제거
      const isDuplicate = this.checkDuplicate(notification, priority)
      if (isDuplicate) {
        console.log('중복 알림 무시:', notification.id)
        return false
      }

      // 알림 강화
      const enhancedNotification = this.enhanceNotification(notification, priority)
      
      // 큐에 추가
      const queue = this.queues.get(priority)
      queue.push(enhancedNotification)
      
      // 통계 업데이트
      this.processingStats.queued++

      console.log(`알림 큐에 추가됨 (우선순위 ${priority}): ${notification.title || notification.message}`)

      // 즉시 처리가 필요한 긴급 알림
      if (priority >= 4) {
        this.processUrgentNotification(enhancedNotification)
      }

      return true
    } catch (error) {
      console.error('알림 큐 추가 실패:', error)
      return false
    }
  }

  /**
   * 우선순위 계산
   */
  calculatePriority(notification) {
    let priority = 2 // 기본 우선순위

    // 알림 타입별 기본 우선순위
    const typePriorities = {
      'POS_ERROR': 4,        // 최고 우선순위
      'PAYMENT_FAILED': 4,
      'SECURITY_ALERT': 4,
      'SYSTEM_CRITICAL': 4,
      'NEW_ORDER': 3,        // 높은 우선순위
      'ORDER_UPDATE': 3,
      'CUSTOMER_COMPLAINT': 3,
      'EMERGENCY_CALL': 4,
      'STAFF_ALERT': 3,
      'INVENTORY_LOW': 2,    // 보통 우선순위
      'REVIEW_NEW': 2,
      'PROMOTION_REMINDER': 1, // 낮은 우선순위
      'SALES_REPORT': 1,
      'NEWSLETTER': 0        // 가장 낮은 우선순위
    }

    priority = typePriorities[notification.type] || priority

    // 사용자별 조정
    if (notification.userType === 'VIP') priority = Math.min(priority + 1, 4)
    if (notification.isOwner) priority = Math.min(priority + 1, 4)

    // 시간 민감성 조정
    if (notification.timeToLive && notification.timeToLive < 300000) { // 5분 미만
      priority = Math.min(priority + 1, 4)
    }

    // 고객 등급별 조정
    if (notification.customerTier === 'VIP') priority = Math.min(priority + 1, 4)

    // 비즈니스 임팩트 조정
    if (notification.businessImpact === 'HIGH') priority = Math.min(priority + 1, 4)

    return Math.max(0, Math.min(priority, 4))
  }

  /**
   * 알림 강화 (메타데이터 추가)
   */
  enhanceNotification(notification, priority) {
    const now = Date.now()
    
    return {
      ...notification,
      id: notification.id || `notif_${now}_${Math.random().toString(36).substr(2, 9)}`,
      priority,
      enqueuedAt: now,
      attempts: 0,
      maxRetries: this.getMaxRetriesForPriority(priority),
      timeToLive: notification.timeToLive || this.getDefaultTTL(notification.type),
      processingDeadline: now + (notification.timeToLive || this.getDefaultTTL(notification.type)),
      metadata: {
        ...notification.metadata,
        queueVersion: '2.0',
        enhancedAt: now
      }
    }
  }

  /**
   * 중복 확인
   */
  checkDuplicate(notification, priority) {
    if (!notification.deduplicationKey) return false

    const queue = this.queues.get(priority)
    return queue.some(n => 
      n.deduplicationKey === notification.deduplicationKey &&
      n.enqueuedAt > Date.now() - 60000 // 1분 내 중복 체크
    )
  }

  /**
   * 긴급 알림 즉시 처리
   */
  async processUrgentNotification(notification) {
    console.log('🚨 긴급 알림 즉시 처리:', notification.title)
    
    try {
      await this.sendNotification(notification)
      this.processingStats.sent++
    } catch (error) {
      console.error('긴급 알림 처리 실패:', error)
      // 실패해도 큐에는 유지 (배치에서 재시도)
    }
  }

  /**
   * 배치 처리 시작
   */
  startBatchProcessing() {
    const processBatch = async () => {
      if (!this.isOnline) {
        console.log('오프라인 상태. 배치 처리 연기.')
        return
      }

      if (this.isProcessing) {
        console.log('이미 처리 중. 배치 건너뜀.')
        return
      }

      const batch = this.getBatch()
      if (batch.length === 0) return

      await this.processBatch(batch)
    }

    this.batchTimer = setInterval(processBatch, this.batchInterval)
    console.log(`배치 처리 타이머 시작 (${this.batchInterval}ms 간격)`)
  }

  /**
   * 처리할 배치 수집
   */
  getBatch() {
    const batch = []
    const now = Date.now()

    // 우선순위 순으로 배치 수집 (높은 우선순위부터)
    for (let priority = this.priorityLevels - 1; priority >= 0; priority--) {
      const queue = this.queues.get(priority)
      
      while (queue.length > 0 && batch.length < this.batchSize) {
        const notification = queue[0]
        
        // TTL 확인
        if (notification.processingDeadline < now) {
          console.log('TTL 만료된 알림 제거:', notification.id)
          queue.shift()
          continue
        }
        
        batch.push(queue.shift())
      }

      if (batch.length >= this.batchSize) break
    }

    return batch
  }

  /**
   * 배치 처리
   */
  async processBatch(batch) {
    if (batch.length === 0) return

    this.isProcessing = true
    const startTime = performance.now()

    console.log(`배치 처리 시작: ${batch.length}개 알림`)

    const results = await Promise.allSettled(
      batch.map(notification => this.sendNotification(notification))
    )

    // 결과 처리
    const successes = results.filter(r => r.status === 'fulfilled').length
    const failures = results.filter(r => r.status === 'rejected').length

    this.processingStats.sent += successes
    this.processingStats.failed += failures
    this.processingStats.lastProcessedAt = Date.now()

    // 실패한 알림들 재시도 큐에 추가
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const failedNotification = batch[index]
        this.handleFailedNotification(failedNotification, result.reason)
      }
    })

    // 성능 메트릭 기록
    const processingTime = performance.now() - startTime
    this.recordPerformanceMetric('processingTime', processingTime)
    
    this.processingStats.averageProcessingTime = 
      this.performanceMetrics.processingTimes.length > 0 ?
      this.performanceMetrics.processingTimes.reduce((a, b) => a + b, 0) / 
      this.performanceMetrics.processingTimes.length : 0

    console.log(`배치 처리 완료: 성공 ${successes}, 실패 ${failures}, 소요시간 ${processingTime.toFixed(2)}ms`)

    this.isProcessing = false
  }

  /**
   * 개별 알림 전송
   */
  async sendNotification(notification) {
    const startTime = performance.now()
    
    try {
      // 브라우저 알림
      if ('Notification' in window && Notification.permission === 'granted') {
        const notifOptions = {
          body: notification.message,
          icon: notification.icon || '/icons/default-icon.svg',
          badge: notification.badge || '/icons/badge-icon.svg',
          tag: notification.tag || `notif-${notification.id}`,
          silent: notification.silent || false,
          requireInteraction: notification.priority >= 3,
          actions: notification.actions || [],
          data: notification.metadata || {},
          timestamp: Date.now()
        }

        // iOS 특별 설정
        if (notification.platform === 'ios') {
          notifOptions.critical = notification.priority >= 4
          notifOptions.sound = notification.soundUrl
        }

        // Android 특별 설정
        if (notification.platform === 'android') {
          notifOptions.vibrate = this.getVibrationPattern(notification.type)
        }

        const browserNotif = new Notification(notification.title || '알림', notifOptions)
        
        // 알림 클릭 처리
        browserNotif.onclick = () => {
          if (notification.clickAction) {
            window.focus()
            notification.clickAction()
          }
          browserNotif.close()
        }

        // 자동 닫기
        if (notification.autoClose !== false) {
          setTimeout(() => browserNotif.close(), notification.duration || 5000)
        }
      }

      // PWA Push 알림 (Service Worker)
      if ('serviceWorker' in navigator && notification.sendAsPush) {
        const registration = await navigator.serviceWorker.ready
        
        if (registration.pushManager) {
          await registration.showNotification(notification.title || '알림', {
            body: notification.message,
            icon: notification.icon || '/icons/default-icon.svg',
            badge: notification.badge || '/icons/badge-icon.svg',
            tag: notification.tag || `push-${notification.id}`,
            data: notification.metadata || {},
            actions: notification.actions || []
          })
        }
      }

      // 배지 카운터 업데이트
      if (notification.updateBadge && navigator.setAppBadge) {
        const currentBadge = await navigator.getAppBadge?.() || 0
        await navigator.setAppBadge(currentBadge + 1)
      }

      const processingTime = performance.now() - startTime
      this.recordPerformanceMetric('notificationSendTime', processingTime)

      return { success: true, processingTime }
    } catch (error) {
      const processingTime = performance.now() - startTime
      console.error('알림 전송 실패:', error)
      throw error
    }
  }

  /**
   * 실패한 알림 처리
   */
  handleFailedNotification(notification, error) {
    const retryKey = `${notification.id}_${notification.attempts || 0}`
    
    // 재시도 횟수 확인
    if ((notification.attempts || 0) >= notification.maxRetries) {
      console.error('최대 재시도 횟수 초과:', notification.id)
      this.recordFailedNotification(notification, error)
      return
    }

    // 재시도 큐에 추가
    const retryNotification = {
      ...notification,
      attempts: (notification.attempts || 0) + 1,
      lastError: error.message,
      retryAt: Date.now() + this.calculateRetryDelay(notification.attempts || 0)
    }

    this.failedQueue.set(retryKey, retryNotification)
    this.processingStats.retried++

    console.log(`재시도 큐에 추가: ${notification.id} (시도 ${retryNotification.attempts}/${notification.maxRetries})`)
  }

  /**
   * 재시도 지연시간 계산 (지수 백오프)
   */
  calculateRetryDelay(attempts) {
    return this.retryDelay * Math.pow(2, attempts) + Math.random() * 1000 // 지터 추가
  }

  /**
   * 재시도 처리
   */
  processRetries() {
    const now = Date.now()
    const retryNotifications = []

    for (const [key, notification] of this.failedQueue.entries()) {
      if (notification.retryAt <= now) {
        retryNotifications.push(notification)
        this.failedQueue.delete(key)
      }
    }

    // 재시도 알림들을 다시 큐에 추가
    retryNotifications.forEach(notification => {
      const queue = this.queues.get(notification.priority)
      queue.unshift(notification) // 앞쪽에 추가 (우선 처리)
    })

    if (retryNotifications.length > 0) {
      console.log(`${retryNotifications.length}개 알림 재시도`)
    }
  }

  /**
   * 네트워크 모니터링 설정
   */
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      console.log('네트워크 연결 복구됨. 큐 처리 재개.')
      this.isOnline = true
      this.processRetries() // 실패한 알림들 재시도
    })

    window.addEventListener('offline', () => {
      console.log('네트워크 연결 끊김. 큐 처리 일시정지.')
      this.isOnline = false
    })
  }

  /**
   * 진동 패턴 가져오기
   */
  getVibrationPattern(notificationType) {
    const patterns = {
      'NEW_ORDER': [0, 250, 100, 250],
      'POS_ERROR': [0, 500, 200, 500, 200, 500],
      'CUSTOMER_COMPLAINT': [0, 200, 100, 200, 100, 200],
      'PAYMENT_FAILED': [0, 800, 200, 800],
      'EMERGENCY_CALL': [0, 1000, 200, 1000, 200, 1000],
      'SYSTEM_CRITICAL': [0, 500, 200, 500, 200, 500, 200, 500],
      'DEFAULT': [0, 200, 100, 200]
    }

    return patterns[notificationType] || patterns.DEFAULT
  }

  /**
   * 기본 TTL 가져오기
   */
  getDefaultTTL(notificationType) {
    const ttls = {
      'POS_ERROR': 300000,        // 5분
      'PAYMENT_FAILED': 600000,   // 10분
      'NEW_ORDER': 900000,        // 15분
      'CUSTOMER_COMPLAINT': 1800000, // 30분
      'INVENTORY_LOW': 3600000,   // 1시간
      'REVIEW_NEW': 3600000,      // 1시간
      'SALES_REPORT': 86400000,   // 24시간
      'PROMOTION_REMINDER': 86400000, // 24시간
      'DEFAULT': 3600000          // 1시간
    }

    return ttls[notificationType] || ttls.DEFAULT
  }

  /**
   * 우선순위별 최대 재시도 횟수
   */
  getMaxRetriesForPriority(priority) {
    const retries = {
      4: 5, // 최고 우선순위
      3: 3, // 높은 우선순위
      2: 2, // 보통 우선순위
      1: 1, // 낮은 우선순위
      0: 0  // 가장 낮은 우선순위
    }

    return retries[priority] || 2
  }

  /**
   * 큐 통계 조회
   */
  getQueueStats() {
    const stats = {
      byPriority: {},
      total: 0,
      processing: this.isProcessing,
      failed: this.failedQueue.size,
      performance: {
        ...this.processingStats,
        averageMemoryUsage: this.getAverageMetric('memoryUsage'),
        averageQueueSize: this.getAverageMetric('queueSizes')
      }
    }

    for (let i = 0; i < this.priorityLevels; i++) {
      const queueSize = this.queues.get(i).length
      stats.byPriority[i] = queueSize
      stats.total += queueSize
    }

    return stats
  }

  /**
   * 총 큐 크기
   */
  getTotalQueueSize() {
    let total = 0
    for (const queue of this.queues.values()) {
      total += queue.length
    }
    return total
  }

  /**
   * 가장 오래된 알림들 제거
   */
  removeOldestNotifications(count) {
    let removed = 0

    // 낮은 우선순위부터 제거
    for (let priority = 0; priority < this.priorityLevels && removed < count; priority++) {
      const queue = this.queues.get(priority)
      
      while (queue.length > 0 && removed < count) {
        const removedNotification = queue.shift()
        console.log('오래된 알림 제거:', removedNotification.id)
        removed++
      }
    }

    return removed
  }

  /**
   * 실패 기록
   */
  recordFailedNotification(notification, error) {
    // 실패 로그 기록 (실제로는 서버로 전송)
    console.error('알림 전송 최종 실패:', {
      id: notification.id,
      type: notification.type,
      attempts: notification.attempts,
      error: error.message,
      enqueuedAt: notification.enqueuedAt,
      processingDeadline: notification.processingDeadline
    })
  }

  /**
   * 성능 메트릭 기록
   */
  recordPerformanceMetric(metricName, value) {
    if (!this.performanceMetrics[metricName]) {
      this.performanceMetrics[metricName] = []
    }

    const metrics = this.performanceMetrics[metricName]
    metrics.push({ timestamp: Date.now(), value })

    // 최대 1000개까지만 유지
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000)
    }
  }

  /**
   * 평균 메트릭 계산
   */
  getAverageMetric(metricName) {
    const metrics = this.performanceMetrics[metricName]
    if (!metrics || metrics.length === 0) return 0

    const sum = metrics.reduce((acc, m) => acc + m.value, 0)
    return sum / metrics.length
  }

  /**
   * 성능 모니터링 시작
   */
  startPerformanceMonitoring() {
    this.statsTimer = setInterval(() => {
      // 메모리 사용량 기록
      if (performance.memory) {
        this.recordPerformanceMetric('memoryUsage', performance.memory.usedJSHeapSize)
      }

      // 큐 크기 기록
      this.recordPerformanceMetric('queueSizes', this.getTotalQueueSize())

      // 큐 상태 로그 (개발 모드)
      if (process.env.NODE_ENV === 'development') {
        console.log('큐 상태:', this.getQueueStats())
      }
    }, 30000) // 30초마다
  }

  /**
   * 메모리 정리 스케줄링
   */
  scheduleCleanup() {
    const cleanup = () => {
      const now = Date.now()
      
      // 만료된 알림 정리
      let cleaned = 0
      for (const queue of this.queues.values()) {
        for (let i = queue.length - 1; i >= 0; i--) {
          if (queue[i].processingDeadline < now) {
            queue.splice(i, 1)
            cleaned++
          }
        }
      }

      // 실패 큐 정리
      for (const [key, notification] of this.failedQueue.entries()) {
        if (notification.processingDeadline < now) {
          this.failedQueue.delete(key)
          cleaned++
        }
      }

      // 성능 메트릭 정리 (1시간 이상 된 데이터)
      const oneHourAgo = now - 3600000
      for (const metricArray of Object.values(this.performanceMetrics)) {
        if (Array.isArray(metricArray)) {
          for (let i = metricArray.length - 1; i >= 0; i--) {
            if (metricArray[i].timestamp < oneHourAgo) {
              metricArray.splice(0, i + 1)
              break
            }
          }
        }
      }

      this.performanceMetrics.lastCleanup = now

      if (cleaned > 0) {
        console.log(`메모리 정리 완료: ${cleaned}개 항목 제거`)
      }
    }

    // 5분마다 정리
    setInterval(cleanup, 300000)
  }

  /**
   * 정리 작업 설정
   */
  setupCleanup() {
    const cleanup = () => {
      console.log('알림 큐 서비스 정리 중...')
      
      // 타이머들 정리
      if (this.batchTimer) {
        clearInterval(this.batchTimer)
        this.batchTimer = null
      }
      
      if (this.retryTimer) {
        clearInterval(this.retryTimer)
        this.retryTimer = null
      }
      
      if (this.statsTimer) {
        clearInterval(this.statsTimer)
        this.statsTimer = null
      }

      // 큐 정리
      this.queues.clear()
      this.failedQueue.clear()
    }

    // 페이지 언로드 시 정리
    window.addEventListener('beforeunload', cleanup)
    window.addEventListener('pagehide', cleanup)
  }

  /**
   * 큐 일시정지
   */
  pause() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer)
      this.batchTimer = null
    }
    console.log('알림 큐 처리 일시정지')
  }

  /**
   * 큐 재시작
   */
  resume() {
    if (!this.batchTimer) {
      this.startBatchProcessing()
      console.log('알림 큐 처리 재시작')
    }
  }

  /**
   * 큐 비우기
   */
  clear() {
    for (const queue of this.queues.values()) {
      queue.length = 0
    }
    this.failedQueue.clear()
    console.log('모든 큐가 비워졌습니다')
  }

  /**
   * 특정 우선순위 큐 조회
   */
  getQueueByPriority(priority) {
    return this.queues.get(priority) || []
  }

  /**
   * 특정 알림 제거
   */
  remove(notificationId) {
    let removed = false

    // 모든 우선순위 큐에서 검색 및 제거
    for (const queue of this.queues.values()) {
      const index = queue.findIndex(n => n.id === notificationId)
      if (index !== -1) {
        queue.splice(index, 1)
        removed = true
        break
      }
    }

    // 실패 큐에서도 제거
    for (const [key, notification] of this.failedQueue.entries()) {
      if (notification.id === notificationId) {
        this.failedQueue.delete(key)
        removed = true
        break
      }
    }

    return removed
  }

  /**
   * 큐 상태 내보내기 (디버깅용)
   */
  exportQueueState() {
    const state = {
      timestamp: Date.now(),
      queues: {},
      failedQueue: Array.from(this.failedQueue.entries()),
      stats: this.processingStats,
      performance: this.performanceMetrics,
      isOnline: this.isOnline,
      isProcessing: this.isProcessing
    }

    for (const [priority, queue] of this.queues.entries()) {
      state.queues[priority] = queue.map(n => ({
        id: n.id,
        type: n.type,
        priority: n.priority,
        enqueuedAt: n.enqueuedAt,
        attempts: n.attempts,
        processingDeadline: n.processingDeadline
      }))
    }

    return state
  }
}

// 싱글톤 인스턴스
let queueServiceInstance = null

/**
 * 알림 큐 서비스 인스턴스 가져오기
 */
export const getNotificationQueueService = (options = {}) => {
  if (!queueServiceInstance) {
    queueServiceInstance = new NotificationQueueService(options)
  }
  return queueServiceInstance
}

/**
 * React Hook - 알림 큐 관리
 */
export const useNotificationQueue = (options = {}) => {
  const queueService = getNotificationQueueService(options)
  const [stats, setStats] = useState(queueService.getQueueStats())

  useEffect(() => {
    // 통계 업데이트 타이머
    const updateStats = () => setStats(queueService.getQueueStats())
    const intervalId = setInterval(updateStats, 5000) // 5초마다 업데이트

    return () => clearInterval(intervalId)
  }, [queueService])

  const enqueue = useCallback((notification) => {
    return queueService.enqueue(notification)
  }, [queueService])

  const remove = useCallback((notificationId) => {
    return queueService.remove(notificationId)
  }, [queueService])

  const pause = useCallback(() => {
    queueService.pause()
  }, [queueService])

  const resume = useCallback(() => {
    queueService.resume()
  }, [queueService])

  const clear = useCallback(() => {
    queueService.clear()
  }, [queueService])

  return {
    enqueue,
    remove,
    pause,
    resume,
    clear,
    stats,
    isOnline: queueService.isOnline,
    isProcessing: queueService.isProcessing,
    exportState: () => queueService.exportQueueState()
  }
}

export default NotificationQueueService