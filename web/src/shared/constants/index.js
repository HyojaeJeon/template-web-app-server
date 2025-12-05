/**
 * Application constants
 */

// User roles
export const USER_ROLES = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN'
};

// Permissions
export const PERMISSIONS = {
  // User management
  'user.view': 'user.view',
  'user.create': 'user.create',
  'user.update': 'user.update',
  'user.delete': 'user.delete',

  // Settings
  'settings.view': 'settings.view',
  'settings.update': 'settings.update',

  // System
  'system.admin': 'system.admin'
};

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  [USER_ROLES.OWNER]: Object.values(PERMISSIONS),
  [USER_ROLES.ADMIN]: Object.values(PERMISSIONS),
  [USER_ROLES.MANAGER]: [
    'user.view',
    'user.create',
    'user.update',
    'settings.view',
    'settings.update'
  ],
  [USER_ROLES.STAFF]: [
    'user.view',
    'settings.view'
  ]
};

// Common status
export const STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Error codes
export const ERROR_CODES = {
  INVALID_INPUT: 1001,
  NETWORK_ERROR: 1002,
  SERVER_ERROR: 1003,
  UNAUTHORIZED: 2001,
  FORBIDDEN: 2002,
  TOKEN_EXPIRED: 2003,
  NOT_FOUND: 3001
};

export default {
  USER_ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  STATUS,
  ERROR_CODES
};
