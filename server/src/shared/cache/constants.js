// Global cache constants and key helpers
// Source of truth: config/redis.js (CACHE_TTL there can be extended)

export const CACHE_TTL = Object.freeze({
  SEC10: 10,
  MIN2: 120,
  TINY: 30,
  SHORT: 60,
  MIN5: 300,
  MIN10: 600,
  MIN30: 1800,
  HOUR1: 3600,
  HOUR2: 7200,
  HOUR6: 21600,
  HOUR12: 43200,
  DAY1: 86400,
});

export const KEYS = Object.freeze({
  // Print domain
  print: {
    TEMPLATE_BY_ID: (id) => `print:template:${id}`,
    TEMPLATES_BY_STORE: (storeId) => `print:templates:store:${storeId}`,
    TEMPLATE_USAGE: (templateId) => `print:template:usage:${templateId}`,
    JOB_STATS: (storeId) => `print:stats:store:${storeId}`,
    JOB_QUEUE: (storeId, printerName) => `print:queue:${storeId}:${printerName}`,
    JOB_STATUS: (jobId) => `print:job:status:${jobId}`,
    PRINTER_STATUS: (storeId, printerName) => `print:printer:status:${storeId}:${printerName}`,
    PRINTER_HEALTH: (printerName) => `print:printer:health:${printerName}`,
    SETTINGS: (storeId) => `print:settings:store:${storeId}`,
    PRINTER_CONFIG: (storeId) => `print:config:store:${storeId}`,
    RECEIPT_BY_ORDER: (orderId) => `print:receipt:order:${orderId}`,
    RECEIPT_TEMPLATE: (storeId, type) => `print:receipt:template:${storeId}:${type}`,
    PERFORMANCE_METRICS: (storeId) => `print:metrics:store:${storeId}`,
    COST_ANALYTICS: (storeId, date) => `print:cost:${storeId}:${date}`,
  },
  // Review/ratings
  review: {
    STORE_RATING_REALTIME: (storeId) => `store:${storeId}:rating:realtime`,
    STORE_RATING_AVG: (storeId) => `store:${storeId}:rating:avg`,
    STORE_KEYWORDS: (storeId, range) => `store:${storeId}:keywords:${range}`,
    STORE_TRENDS: (storeId, period) => `store:${storeId}:trends:${period}`,
    MENU_RATING_REALTIME: (menuId) => `menuItem:${menuId}:rating:realtime`,
    MENU_RATING_AVG: (menuId) => `menu:${menuId}:rating:avg`,
  },
  // POS/delivery (examples)
  pos: {
    CONNECTION: (storeId) => `pos:${storeId}:connection`,
    SYNC_STATS: (storeId) => `pos:${storeId}:syncStats`,
    ORDER_STATUS: (orderId) => `pos:order:${orderId}:status`,
    METRICS: (storeId) => `pos:${storeId}:metrics`,
    LAST_PING: (storeId) => `pos:${storeId}:lastPing`,
  },
  // Chat domain
  chat: {
    MY_ROOMS: (userId, limit, offset) => `chat:my:rooms:${userId}:${limit}:${offset}`,
    CHAT_MESSAGES: (roomId, page, limit, userId) => `chat:messages:${roomId}:${page}:${limit}:${userId}`,
    PARTICIPANTS: (roomId) => `chat:participants:${roomId}`,
    LAST_MESSAGE: (roomId) => `chat:lastmsg:${roomId}`,
    TYPING: (roomId, userId) => `chat:typing:${roomId}:${userId}`,
    ONLINE: (userId) => `chat:online:${userId}`,
    USER_UNREAD: (userId, roomId) => `chat:user:unread:${userId}:${roomId}`,
    USER_UNREAD_TOTAL: (userId) => `chat:user:unread:${userId}:total`,
    NOTIF_UNREAD_TOTAL: (userId) => `notif:unread:${userId}:total`,
    NOTIF_UNREAD_TYPE: (userId, type) => `notif:unread:${userId}:${type}`,
    ACTIVE_ROOMS: () => `chat:active`,
    FAQ: (category, language) => `faq:cache:${category || 'all'}:${language}`,

    // Response time metrics
    averageResponseTime: (storeId) => `chat:store:${storeId}:avg_response`,
    responseTimeCount: (storeId) => `chat:store:${storeId}:response_count`,

    // Patterns/helpers for invalidation
    ROOM_PREFIX: (roomId) => `chat:room:${roomId}`,
    MESSAGES_PREFIX: (roomId) => `chat:messages:${roomId}`,
    TYPING_ROOM_PREFIX: (roomId) => `chat:typing:${roomId}:*`,
    TYPING_USER_PREFIX: (userId) => `chat:typing:*:${userId}`,
  },
  // Search domain
  search: {
    UNIFIED_SEARCH: (query, filters) => `search:unified:${query}:${JSON.stringify(filters)}`,
    STORE_SEARCH: (query, filters) => `search:stores:${query}:${JSON.stringify(filters)}`,
    MENU_SEARCH: (query, filters) => `search:menu:${query}:${JSON.stringify(filters)}`,
    AUTOCOMPLETE: (query) => `search:autocomplete:${query}`,
    SUGGESTIONS: (query) => `search:suggestions:${query}`,
    POPULAR_SET: () => `search:popular`,
    TRENDING_SLOT: (slot) => `search:trending:${slot}`,
    SEARCH_COUNTER: (keyword) => `search:count:${keyword}`,
    USER_HISTORY: (userId) => `search:history:${userId}`,
    VN_KEYWORD_MAPPING: (original) => `search:vn_normalize:${original}`,
    SEARCH_PATTERNS: () => `search:patterns`,
    HOURLY_STATS: (hour) => `search:stats:${hour}`,
    LOCATION_SEARCH: (lat, lng, radius) => `search:location:${lat}:${lng}:${radius}`,
    CATEGORY_SEARCH: (category) => `search:category:${category}`,
  },
});
