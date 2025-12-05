import logger from '@shared/utils/system/logger';

/**
 * Lightweight analytics wrapper
 * - Writes to logger for development
 * - If global.analytics or window.analytics is available, forwards events
 */
export const analytics = {
  track(event, payload = {}) {
    try {
      logger.info(`[analytics] ${event}`, payload);
      const ga = (global && global.analytics) || (typeof window !== 'undefined' && window.analytics) || null;
      if (ga && typeof ga.track === 'function') {
        ga.track(event, payload);
      }
    } catch (e) {
      // swallow analytics errors
      if (__DEV__) {
        console.debug('Analytics error:', e);
      }
    }
  }
};

export default analytics;

