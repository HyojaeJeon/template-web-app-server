'use client'

/**
 * 알림 캐싱 시스템 서비스
 * IndexedDB 기반 오프라인 알림 저장 및 동기화 관리
 * 
 * @description
 * - IndexedDB를 통한 영구 저장
 * - 오프라인 알림 큐잉
 * - 네트워크 복구 시 자동 동기화
 * - 메타데이터 관리 및 압축
 * - 저장 용량 최적화
 * - Local어/한국어 지원
 */

class NotificationCacheService {
  constructor(options = {}) {
    this.dbName = options.dbName || 'DeliveryVNNotifications'
    this.dbVersion = options.dbVersion || 3
    this.storeName = options.storeName || 'notifications'
    this.metaStoreName = options.metaStoreName || 'metadata'
    this.maxCacheSize = options.maxCacheSize || 50000 // 50MB
    this.maxNotifications = options.maxNotifications || 10000
    this.compressionEnabled = options.compressionEnabled || true
    this.encryptionEnabled = options.encryptionEnabled || false

    this.db = null
    this.isInitialized = false
    this.syncInProgress = false

    // 캐시 통계
    this.stats = {
      totalStored: 0,
      totalSize: 0,
      lastSync: null,
      lastCleanup: null,
      syncErrors: 0,
      compressionRatio: 0
    }

    this.init()
  }

  /**
   * IndexedDB 초기화
   */
  async init() {
    try {
      this.db = await this.openDatabase()
      await this.loadStats()
      this.isInitialized = true
      
      console.log('🗃️ 알림 캐시 서비스 초기화 완료')
      
      // 정기 정리 스케줄링
      this.scheduleCleanup()
      
      // 네트워크 복구 시 동기화
      this.setupNetworkSync()
      
    } catch (error) {
      console.error('알림 캐시 초기화 실패:', error)
      this.isInitialized = false
    }
  }

  /**
   * IndexedDB 열기
   */
  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // 알림 저장소 생성/업그레이드
        if (!db.objectStoreNames.contains(this.storeName)) {
          const notificationStore = db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: false
          })

          // 인덱스 생성
          notificationStore.createIndex('timestamp', 'timestamp', { unique: false })
          notificationStore.createIndex('type', 'type', { unique: false })
          notificationStore.createIndex('priority', 'priority', { unique: false })
          notificationStore.createIndex('userId', 'userId', { unique: false })
          notificationStore.createIndex('read', 'read', { unique: false })
          notificationStore.createIndex('synced', 'synced', { unique: false })
          notificationStore.createIndex('storeId', 'storeId', { unique: false })
          
          console.log('알림 저장소 생성 완료')
        }

        // 메타데이터 저장소 생성/업그레이드
        if (!db.objectStoreNames.contains(this.metaStoreName)) {
          const metaStore = db.createObjectStore(this.metaStoreName, {
            keyPath: 'key',
            autoIncrement: false
          })
          
          console.log('메타데이터 저장소 생성 완료')
        }
      }
    })
  }

  /**
   * 알림 저장
   */
  async storeNotification(notification) {
    if (!this.isInitialized) {
      console.warn('캐시가 초기화되지 않음')
      return false
    }

    try {
      // 데이터 압축 (옵션)
      let processedNotification = { ...notification }
      if (this.compressionEnabled && notification.largeData) {
        processedNotification = await this.compressNotification(notification)
      }

      // 메타데이터 추가
      processedNotification = {
        ...processedNotification,
        id: notification.id || `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        cachedAt: Date.now(),
        synced: false,
        compressed: this.compressionEnabled && notification.largeData,
        version: this.dbVersion,
        checksum: await this.generateChecksum(processedNotification)
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      await this.promisifyRequest(store.put(processedNotification))
      
      // 통계 업데이트
      this.stats.totalStored++
      await this.updateStats()

      // 용량 확인 및 정리
      await this.checkAndCleanupStorage()

      console.log(`알림 캐시 저장: ${notification.id}`)
      return true

    } catch (error) {
      console.error('알림 캐시 저장 실패:', error)
      return false
    }
  }

  /**
   * 알림 조회
   */
  async getNotification(notificationId) {
    if (!this.isInitialized) return null

    try {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const result = await this.promisifyRequest(store.get(notificationId))

      if (!result) return null

      // 압축 해제 (필요한 경우)
      if (result.compressed) {
        return await this.decompressNotification(result)
      }

      return result
    } catch (error) {
      console.error('알림 조회 실패:', error)
      return null
    }
  }

  /**
   * 알림 목록 조회 (필터링)
   */
  async getNotifications(filters = {}) {
    if (!this.isInitialized) return []

    try {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)

      let request
      if (filters.type) {
        request = store.index('type').getAll(filters.type)
      } else if (filters.userId) {
        request = store.index('userId').getAll(filters.userId)
      } else if (filters.read !== undefined) {
        request = store.index('read').getAll(filters.read)
      } else {
        request = store.getAll()
      }

      const results = await this.promisifyRequest(request)

      // 추가 필터링
      let filteredResults = results

      if (filters.startDate) {
        filteredResults = filteredResults.filter(n => 
          new Date(n.timestamp) >= new Date(filters.startDate)
        )
      }

      if (filters.endDate) {
        filteredResults = filteredResults.filter(n => 
          new Date(n.timestamp) <= new Date(filters.endDate)
        )
      }

      if (filters.priority !== undefined) {
        filteredResults = filteredResults.filter(n => n.priority === filters.priority)
      }

      if (filters.synced !== undefined) {
        filteredResults = filteredResults.filter(n => n.synced === filters.synced)
      }

      // 정렬
      if (filters.sortBy) {
        filteredResults.sort((a, b) => {
          const aValue = a[filters.sortBy]
          const bValue = b[filters.sortBy]
          
          if (filters.displayOrder === 'desc') {
            return bValue > aValue ? 1 : bValue < aValue ? -1 : 0
          } else {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
          }
        })
      }

      // 제한
      if (filters.limit) {
        filteredResults = filteredResults.slice(0, filters.limit)
      }

      // 압축 해제 (필요한 경우)
      const decompressedResults = await Promise.all(
        filteredResults.map(async notification => {
          if (notification.compressed) {
            return await this.decompressNotification(notification)
          }
          return notification
        })
      )

      return decompressedResults
    } catch (error) {
      console.error('알림 목록 조회 실패:', error)
      return []
    }
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(notificationId, userId) {
    if (!this.isInitialized) return false

    try {
      const notification = await this.getNotification(notificationId)
      if (!notification) return false

      const updatedNotification = {
        ...notification,
        read: true,
        readAt: Date.now(),
        readBy: userId,
        synced: false // 서버와 재동기화 필요
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      await this.promisifyRequest(store.put(updatedNotification))

      console.log(`알림 읽음 처리: ${notificationId}`)
      return true
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error)
      return false
    }
  }

  /**
   * 알림 삭제
   */
  async deleteNotification(notificationId) {
    if (!this.isInitialized) return false

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      await this.promisifyRequest(store.delete(notificationId))

      this.stats.totalStored = Math.max(0, this.stats.totalStored - 1)
      await this.updateStats()

      console.log(`알림 삭제: ${notificationId}`)
      return true
    } catch (error) {
      console.error('알림 삭제 실패:', error)
      return false
    }
  }

  /**
   * 서버와 동기화
   */
  async syncWithServer(serverApi) {
    if (!this.isInitialized || this.syncInProgress) return false

    this.syncInProgress = true
    console.log('🔄 서버와 알림 동기화 시작')

    try {
      // 동기화되지 않은 알림들 조회
      const unsyncedNotifications = await this.getNotifications({ synced: false })
      
      if (unsyncedNotifications.length === 0) {
        console.log('동기화할 알림이 없습니다')
        return true
      }

      // 배치 단위로 서버에 전송
      const batchSize = 100
      let syncedCount = 0
      let errorCount = 0

      for (let i = 0; i < unsyncedNotifications.length; i += batchSize) {
        const batch = unsyncedNotifications.slice(i, i + batchSize)
        
        try {
          const response = await serverApi.syncNotifications(batch)
          
          if (response.success) {
            // 동기화 완료 표시
            await Promise.all(
              batch.map(notification => 
                this.markAsSynced(notification.id, response.serverTimestamp)
              )
            )
            syncedCount += batch.length
          } else {
            console.error('배치 동기화 실패:', response.error)
            errorCount += batch.length
          }
        } catch (error) {
          console.error('배치 동기화 오류:', error)
          errorCount += batch.length
        }
      }

      // 서버에서 새 알림 가져오기
      try {
        const serverNotifications = await serverApi.getNewNotifications(this.stats.lastSync)
        
        for (const notification of serverNotifications) {
          await this.storeNotification({
            ...notification,
            synced: true,
            fromServer: true
          })
        }
      } catch (error) {
        console.error('서버 알림 가져오기 실패:', error)
      }

      // 동기화 통계 업데이트
      this.stats.lastSync = Date.now()
      this.stats.syncErrors = errorCount
      await this.updateStats()

      console.log(`동기화 완료: 성공 ${syncedCount}, 실패 ${errorCount}`)
      return errorCount === 0

    } catch (error) {
      console.error('서버 동기화 실패:', error)
      this.stats.syncErrors++
      return false
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * 동기화 완료 표시
   */
  async markAsSynced(notificationId, serverTimestamp) {
    try {
      const notification = await this.getNotification(notificationId)
      if (!notification) return false

      const updatedNotification = {
        ...notification,
        synced: true,
        syncedAt: Date.now(),
        serverTimestamp
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      await this.promisifyRequest(store.put(updatedNotification))

      return true
    } catch (error) {
      console.error('동기화 표시 실패:', error)
      return false
    }
  }

  /**
   * 데이터 압축
   */
  async compressNotification(notification) {
    if (!this.compressionEnabled) return notification

    try {
      // 큰 데이터 필드들 압축
      const largeFields = ['message', 'metadata', 'customData', 'history']
      const compressed = { ...notification }
      let originalSize = 0
      let compressedSize = 0

      for (const field of largeFields) {
        if (notification[field] && typeof notification[field] === 'string') {
          const original = notification[field]
          originalSize += original.length

          // 간단한 LZ77 스타일 압축 시뮬레이션
          const compressedField = this.simpleCompress(original)
          compressedSize += compressedField.length

          compressed[field] = compressedField
          compressed[`${field}_compressed`] = true
        } else if (notification[field] && typeof notification[field] === 'object') {
          const original = JSON.stringify(notification[field])
          originalSize += original.length

          const compressedField = this.simpleCompress(original)
          compressedSize += compressedField.length

          compressed[field] = compressedField
          compressed[`${field}_compressed`] = true
        }
      }

      // 압축률 계산
      const compressionRatio = originalSize > 0 ? 
        ((originalSize - compressedSize) / originalSize) * 100 : 0

      compressed.compressionRatio = compressionRatio
      this.stats.compressionRatio = 
        (this.stats.compressionRatio + compressionRatio) / 2

      return compressed
    } catch (error) {
      console.error('알림 압축 실패:', error)
      return notification
    }
  }

  /**
   * 데이터 압축 해제
   */
  async decompressNotification(notification) {
    if (!notification.compressed && !notification.compressionRatio) {
      return notification
    }

    try {
      const decompressed = { ...notification }
      const largeFields = ['message', 'metadata', 'customData', 'history']

      for (const field of largeFields) {
        if (notification[`${field}_compressed`]) {
          const compressedData = notification[field]
          const decompressedData = this.simpleDecompress(compressedData)

          if (field === 'metadata' || field === 'customData') {
            try {
              decompressed[field] = JSON.parse(decompressedData)
            } catch {
              decompressed[field] = decompressedData
            }
          } else {
            decompressed[field] = decompressedData
          }

          delete decompressed[`${field}_compressed`]
        }
      }

      return decompressed
    } catch (error) {
      console.error('알림 압축 해제 실패:', error)
      return notification
    }
  }

  /**
   * 간단한 압축 (실제 프로덕션에서는 더 강력한 압축 라이브러리 사용)
   */
  simpleCompress(text) {
    try {
      // Base64 인코딩으로 간단한 압축 시뮬레이션
      const compressed = btoa(unescape(encodeURIComponent(text)))
      return compressed.length < text.length ? compressed : text
    } catch {
      return text
    }
  }

  /**
   * 간단한 압축 해제
   */
  simpleDecompress(compressedText) {
    try {
      return decodeURIComponent(escape(atob(compressedText)))
    } catch {
      return compressedText
    }
  }

  /**
   * 체크섬 생성
   */
  async generateChecksum(data) {
    try {
      const text = typeof data === 'string' ? data : JSON.stringify(data)
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(text)
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch {
      // 간단한 해시 대안
      let hash = 0
      const text = typeof data === 'string' ? data : JSON.stringify(data)
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // 32bit 정수로 변환
      }
      return hash.toString(36)
    }
  }

  /**
   * 알림 검색
   */
  async searchNotifications(query, filters = {}) {
    if (!this.isInitialized) return []

    try {
      const allNotifications = await this.getNotifications(filters)
      const searchQuery = query.toLowerCase()

      const searchResults = allNotifications.filter(notification => {
        const searchFields = [
          notification.title,
          notification.message,
          notification.type,
          notification.source,
          notification.metadata?.customerName,
          notification.metadata?.orderNumber
        ]

        return searchFields.some(field => 
          field && field.toString().toLowerCase().includes(searchQuery)
        )
      })

      // 관련성 점수로 정렬 (간단한 구현)
      searchResults.sort((a, b) => {
        const aScore = this.calculateRelevanceScore(a, query)
        const bScore = this.calculateRelevanceScore(b, query)
        return bScore - aScore
      })

      return searchResults.slice(0, filters.limit || 100)
    } catch (error) {
      console.error('알림 검색 실패:', error)
      return []
    }
  }

  /**
   * 관련성 점수 계산
   */
  calculateRelevanceScore(notification, query) {
    const queryLower = query.toLowerCase()
    let score = 0

    // 제목 매치 (가중치 높음)
    if (notification.title?.toLowerCase().includes(queryLower)) {
      score += 10
    }

    // 메시지 매치
    if (notification.message?.toLowerCase().includes(queryLower)) {
      score += 5
    }

    // 타입 매치
    if (notification.type?.toLowerCase().includes(queryLower)) {
      score += 3
    }

    // 최신성 보너스
    const ageHours = (Date.now() - new Date(notification.timestamp)) / 3600000
    if (ageHours < 24) score += 2
    if (ageHours < 1) score += 3

    // 우선순위 보너스
    score += notification.priority || 0

    return score
  }

  /**
   * 저장소 용량 확인 및 정리
   */
  async checkAndCleanupStorage() {
    try {
      // 저장소 사용량 확인
      const usage = await this.getStorageUsage()
      
      if (usage.used > this.maxCacheSize || usage.count > this.maxNotifications) {
        console.log('저장소 정리 필요')
        await this.cleanupOldNotifications()
      }
    } catch (error) {
      console.error('저장소 정리 확인 실패:', error)
    }
  }

  /**
   * 저장소 사용량 조회
   */
  async getStorageUsage() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        return {
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
          count: this.stats.totalStored
        }
      }

      // 대안: 수동 계산
      const allNotifications = await this.getNotifications()
      const totalSize = allNotifications.reduce((size, notif) => {
        return size + (JSON.stringify(notif).length * 2) // UTF-16 추정
      }, 0)

      return {
        used: totalSize,
        quota: this.maxCacheSize,
        count: allNotifications.length
      }
    } catch (error) {
      console.error('저장소 사용량 조회 실패:', error)
      return { used: 0, quota: this.maxCacheSize, count: 0 }
    }
  }

  /**
   * 오래된 알림 정리
   */
  async cleanupOldNotifications() {
    try {
      console.log('오래된 알림 정리 시작')

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const timestampIndex = store.index('timestamp')

      // 30일 이전 알림들 조회
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      const oldNotificationsRequest = timestampIndex.getAll(IDBKeyRange.upperBound(thirtyDaysAgo))
      const oldNotifications = await this.promisifyRequest(oldNotificationsRequest)

      // 읽지 않은 중요 알림은 보존
      const toDelete = oldNotifications.filter(notification => {
        return notification.read || notification.priority < 3
      })

      // 삭제 실행
      await Promise.all(
        toDelete.map(notification => 
          this.promisifyRequest(store.delete(notification.id))
        )
      )

      this.stats.totalStored -= toDelete.length
      this.stats.lastCleanup = Date.now()
      await this.updateStats()

      console.log(`${toDelete.length}개의 오래된 알림 정리 완료`)
      return true

    } catch (error) {
      console.error('알림 정리 실패:', error)
      return false
    }
  }

  /**
   * 통계 로드
   */
  async loadStats() {
    try {
      const transaction = this.db.transaction([this.metaStoreName], 'readonly')
      const store = transaction.objectStore(this.metaStoreName)
      const statsData = await this.promisifyRequest(store.get('stats'))

      if (statsData) {
        this.stats = { ...this.stats, ...statsData.value }
      }

      // 실제 카운트로 보정
      const actualCount = await this.getActualNotificationCount()
      this.stats.totalStored = actualCount

    } catch (error) {
      console.error('통계 로드 실패:', error)
    }
  }

  /**
   * 통계 업데이트
   */
  async updateStats() {
    try {
      const transaction = this.db.transaction([this.metaStoreName], 'readwrite')
      const store = transaction.objectStore(this.metaStoreName)
      
      await this.promisifyRequest(store.put({
        key: 'stats',
        value: this.stats,
        updatedAt: Date.now()
      }))

    } catch (error) {
      console.error('통계 업데이트 실패:', error)
    }
  }

  /**
   * 실제 알림 개수 조회
   */
  async getActualNotificationCount() {
    try {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const count = await this.promisifyRequest(store.count())
      return count
    } catch {
      return 0
    }
  }

  /**
   * 정기 정리 스케줄링
   */
  scheduleCleanup() {
    // 1시간마다 정리
    setInterval(() => {
      this.cleanupOldNotifications()
    }, 3600000)

    // 30분마다 메모리 최적화
    setInterval(() => {
      if (performance.memory) {
        const usedMemory = performance.memory.usedJSHeapSize
        if (usedMemory > 100 * 1024 * 1024) { // 100MB 초과
          console.log('메모리 사용량 높음. 캐시 정리 실행.')
          this.optimizeMemory()
        }
      }
    }, 1800000)
  }

  /**
   * 메모리 최적화
   */
  async optimizeMemory() {
    try {
      // 읽은 알림 중 오래된 것들 제거
      const readNotifications = await this.getNotifications({ 
        read: true, 
        limit: 1000,
        sortBy: 'timestamp',
        displayOrder: 'asc'
      })

      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      const oldReadNotifications = readNotifications.filter(n => 
        new Date(n.timestamp) < oneWeekAgo
      )

      await Promise.all(
        oldReadNotifications.slice(0, 500).map(n => 
          this.deleteNotification(n.id)
        )
      )

      console.log(`메모리 최적화: ${oldReadNotifications.length}개 알림 제거`)
    } catch (error) {
      console.error('메모리 최적화 실패:', error)
    }
  }

  /**
   * 네트워크 동기화 설정
   */
  setupNetworkSync() {
    window.addEventListener('online', async () => {
      console.log('네트워크 연결 복구. 동기화 시작.')
      
      // 서버 API가 설정된 경우 자동 동기화
      if (this.serverApi) {
        await this.syncWithServer(this.serverApi)
      }
    })
  }

  /**
   * 서버 API 설정
   */
  setServerApi(serverApi) {
    this.serverApi = serverApi
  }

  /**
   * Promise 래퍼
   */
  promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * 캐시 상태 내보내기
   */
  async exportCacheState() {
    try {
      const notifications = await this.getNotifications({ limit: 100 })
      const usage = await this.getStorageUsage()

      return {
        timestamp: Date.now(),
        stats: this.stats,
        usage,
        recentNotifications: notifications.slice(0, 10),
        queueSizes: {
          total: notifications.length,
          unsynced: notifications.filter(n => !n.synced).length,
          unread: notifications.filter(n => !n.read).length
        },
        performance: {
          averageCompressionRatio: this.stats.compressionRatio,
          isOnline: navigator.onLine,
          syncInProgress: this.syncInProgress
        }
      }
    } catch (error) {
      console.error('캐시 상태 내보내기 실패:', error)
      return null
    }
  }

  /**
   * 전체 캐시 삭제
   */
  async clearCache() {
    try {
      const transaction = this.db.transaction([this.storeName, this.metaStoreName], 'readwrite')
      const notificationStore = transaction.objectStore(this.storeName)
      const metaStore = transaction.objectStore(this.metaStoreName)

      await this.promisifyRequest(notificationStore.clear())
      await this.promisifyRequest(metaStore.clear())

      this.stats = {
        totalStored: 0,
        totalSize: 0,
        lastSync: null,
        lastCleanup: Date.now(),
        syncErrors: 0,
        compressionRatio: 0
      }

      console.log('전체 캐시 삭제 완료')
      return true
    } catch (error) {
      console.error('캐시 삭제 실패:', error)
      return false
    }
  }

  /**
   * 서비스 종료
   */
  destroy() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
    
    this.isInitialized = false
    console.log('알림 캐시 서비스 종료')
  }
}

// 싱글톤 인스턴스
let cacheServiceInstance = null

/**
 * 알림 캐시 서비스 인스턴스 가져오기
 */
export const getNotificationCacheService = (options = {}) => {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new NotificationCacheService(options)
  }
  return cacheServiceInstance
}

/**
 * React Hook - 알림 캐시 관리
 */
export const useNotificationCache = (options = {}) => {
  const [isReady, setIsReady] = useState(false)
  const [stats, setStats] = useState({})
  const cacheService = getNotificationCacheService(options)

  useEffect(() => {
    const checkInitialization = () => {
      if (cacheService.isInitialized) {
        setIsReady(true)
        setStats(cacheService.stats)
        clearInterval(checkInterval)
      }
    }

    const checkInterval = setInterval(checkInitialization, 100)
    checkInitialization()

    // 정기 통계 업데이트
    const statsInterval = setInterval(() => {
      if (cacheService.isInitialized) {
        setStats({ ...cacheService.stats })
      }
    }, 10000) // 10초마다

    return () => {
      clearInterval(checkInterval)
      clearInterval(statsInterval)
    }
  }, [cacheService])

  const store = useCallback(async (notification) => {
    return await cacheService.storeNotification(notification)
  }, [cacheService])

  const get = useCallback(async (notificationId) => {
    return await cacheService.getNotification(notificationId)
  }, [cacheService])

  const getList = useCallback(async (filters) => {
    return await cacheService.getNotifications(filters)
  }, [cacheService])

  const search = useCallback(async (query, filters) => {
    return await cacheService.searchNotifications(query, filters)
  }, [cacheService])

  const markAsRead = useCallback(async (notificationId, userId) => {
    return await cacheService.markAsRead(notificationId, userId)
  }, [cacheService])

  const remove = useCallback(async (notificationId) => {
    return await cacheService.deleteNotification(notificationId)
  }, [cacheService])

  const sync = useCallback(async (serverApi) => {
    return await cacheService.syncWithServer(serverApi)
  }, [cacheService])

  const clear = useCallback(async () => {
    return await cacheService.clearCache()
  }, [cacheService])

  return {
    isReady,
    stats,
    store,
    get,
    getList,
    search,
    markAsRead,
    remove,
    sync,
    clear,
    exportState: () => cacheService.exportCacheState()
  }
}

export default NotificationCacheService