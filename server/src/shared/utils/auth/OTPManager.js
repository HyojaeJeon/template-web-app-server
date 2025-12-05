/**
 * OTP Management System
 * Handles OTP generation, storage, verification and cleanup
 */

import encryptionManager from '../security/Encryption.js';

class OTPManager {
  constructor(cacheService = null) {
    this.cache = cacheService;
    this.otpTTL = 300; // 5 minutes in seconds
    this.maxAttempts = 3;
    this.cooldownPeriod = 60; // 60 seconds between resends
    
    // In-memory storage for development
    this.memoryStore = new Map();
  }

  /**
   * Generate OTP code
   */
  generateOTP(length = 6) {
    return encryptionManager.generateOTP(length);
  }

  /**
   * Save OTP with metadata
   */
  async saveOTP(identifier, otp, options = {}) {
    const data = {
      otp,
      attempts: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (options.ttl || this.otpTTL) * 1000),
      type: options.type || 'verification', // verification, reset, login
      metadata: options.metadata || {}
    };

    const key = `otp:${identifier}`;

    if (this.cache) {
      // Use Redis in production
      await this.cache.set(key, data, options.ttl || this.otpTTL);
    } else {
      // Use memory in development
      this.memoryStore.set(key, data);
      
      // Auto-cleanup after expiry
      setTimeout(() => {
        this.memoryStore.delete(key);
      }, (options.ttl || this.otpTTL) * 1000);
    }

    return {
      otp: process.env.NODE_ENV === 'development' ? otp : undefined, // Only return OTP in dev
      expiresAt: data.expiresAt,
      cooldownSeconds: this.cooldownPeriod
    };
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(identifier, code, options = {}) {
    // Development bypass
    if (process.env.NODE_ENV === 'development' && code === '123456') {
      return { valid: true, bypass: true };
    }

    const key = `otp:${identifier}`;
    let data;

    if (this.cache) {
      data = await this.cache.get(key);
    } else {
      data = this.memoryStore.get(key);
    }

    if (!data) {
      return { 
        valid: false, 
        error: 'OTP_NOT_FOUND',
        message: 'OTP has expired or does not exist'
      };
    }

    // Check expiration
    if (new Date() > new Date(data.expiresAt)) {
      await this.deleteOTP(identifier);
      return { 
        valid: false, 
        error: 'OTP_EXPIRED',
        message: 'OTP has expired'
      };
    }

    // Check attempts
    if (data.attempts >= this.maxAttempts) {
      await this.deleteOTP(identifier);
      return { 
        valid: false, 
        error: 'MAX_ATTEMPTS_EXCEEDED',
        message: 'Maximum verification attempts exceeded'
      };
    }

    // Verify OTP
    if (data.otp !== code) {
      data.attempts++;
      
      if (this.cache) {
        const ttl = Math.floor((new Date(data.expiresAt) - new Date()) / 1000);
        await this.cache.set(key, data, ttl);
      } else {
        this.memoryStore.set(key, data);
      }

      return { 
        valid: false, 
        error: 'INVALID_OTP',
        message: 'Invalid OTP code',
        remainingAttempts: this.maxAttempts - data.attempts
      };
    }

    // OTP is valid - delete it to prevent reuse
    await this.deleteOTP(identifier);

    return { 
      valid: true,
      type: data.type,
      metadata: data.metadata
    };
  }

  /**
   * Delete OTP
   */
  async deleteOTP(identifier) {
    const key = `otp:${identifier}`;
    
    if (this.cache) {
      await this.cache.delete(key);
    } else {
      this.memoryStore.delete(key);
    }
  }

  /**
   * Check if can resend OTP
   */
  async canResendOTP(identifier) {
    const key = `otp:${identifier}`;
    let data;

    if (this.cache) {
      data = await this.cache.get(key);
    } else {
      data = this.memoryStore.get(key);
    }

    if (!data) {
      return { canResend: true };
    }

    const timeSinceCreation = Date.now() - new Date(data.createdAt).getTime();
    const cooldownRemaining = Math.max(0, this.cooldownPeriod * 1000 - timeSinceCreation);

    if (cooldownRemaining > 0) {
      return {
        canResend: false,
        cooldownSeconds: Math.ceil(cooldownRemaining / 1000)
      };
    }

    return { canResend: true };
  }

  /**
   * Get OTP status
   */
  async getOTPStatus(identifier) {
    const key = `otp:${identifier}`;
    let data;

    if (this.cache) {
      data = await this.cache.get(key);
    } else {
      data = this.memoryStore.get(key);
    }

    if (!data) {
      return { exists: false };
    }

    const now = new Date();
    const expiresAt = new Date(data.expiresAt);
    const isExpired = now > expiresAt;
    const remainingTime = Math.max(0, Math.floor((expiresAt - now) / 1000));

    return {
      exists: true,
      isExpired,
      remainingTime,
      attempts: data.attempts,
      maxAttempts: this.maxAttempts,
      type: data.type
    };
  }

  /**
   * Clean expired OTPs (for memory store)
   */
  cleanupExpiredOTPs() {
    if (!this.cache) {
      const now = new Date();
      for (const [key, data] of this.memoryStore.entries()) {
        if (now > new Date(data.expiresAt)) {
          this.memoryStore.delete(key);
        }
      }
    }
  }
}

// Singleton instance
const otpManager = new OTPManager();

export default otpManager;
export { OTPManager };