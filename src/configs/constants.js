const path = require('path');

const cookieExpiresDays = Number(process.env.COOKIE_EXPIRES_DAYS) || 7;
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
const corsOrigin = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const uploadAllowedTypes = (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/webp')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

module.exports = {
  APP: {
    PORT: Number(process.env.PORT) || 8080,
    BASE_URL: (process.env.APP_BASE_URL || '').replace(/\/+$/, ''),
    CORS_ORIGIN: corsOrigin.length ? corsOrigin : ['*'],
    CORS_CREDENTIALS: process.env.CORS_CREDENTIALS === 'true',
    STATIC_DIR: process.env.STATIC_DIR || 'public',
    UPLOAD_PUBLIC_PATH: process.env.UPLOAD_PUBLIC_PATH || '/images',
    TIMEZONE: process.env.APP_TIMEZONE || 'Asia/Bangkok',
    MORGAN_FORMAT: process.env.MORGAN_FORMAT || 'dev',
  },

  JWT: {
    SECRET: process.env.JWT_ACCESS_SECRET || 'complex-secret-key-at-least-32-chars',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'complex-secret-key-at-least-32-chars',
    ACCESS_TOKEN_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    REFRESH_TOKEN_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    COOKIE_EXPIRES_IN: cookieExpiresDays * 24 * 60 * 60 * 1000,
  },

  COOKIE: {
    HTTP_ONLY: process.env.COOKIE_HTTP_ONLY !== 'false',
    SECURE: process.env.COOKIE_SECURE === 'true',
    SAME_SITE: process.env.COOKIE_SAME_SITE || 'strict',
    PATH: process.env.COOKIE_PATH || '/',
  },

  UPLOAD: {
    PATH: path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'public/images'),
    ALLOWED_TYPES: uploadAllowedTypes,
    MAX_SIZE: Number(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024,
    MAX_FILES: Number(process.env.UPLOAD_MAX_FILES) || 5,
  },

  SECURITY: {
    SALT_ROUNDS: saltRounds,
  },

  HTTP_STATUS: {
    SUCCESS: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },

  ROLES: {
    ADMIN: 'admin',
    CUSTOMER: 'customer',
    GUEST: 'guest',
  },

  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    SHIPPING: 'shipping',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  ERROR_MESSAGE: {
    NOT_LOGGED_IN: 'Vui lòng đăng nhập để tiếp tục',
    INVALID_TOKEN: 'Token không hợp lệ hoặc đã hết hạn',
    ACCESS_DENIED: 'Bạn không có quyền truy cập tài nguyên này',
  },

  DB: {
    RETRY_ATTEMPTS: Number(process.env.DB_RETRY_ATTEMPTS) || 3,
    RETRY_DELAY: Number(process.env.DB_RETRY_DELAY_MS) || 1000,
  },
};
