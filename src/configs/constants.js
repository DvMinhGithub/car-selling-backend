const path = require('path');

module.exports = {
  JWT: {
    SECRET: process.env.JWT_SECRET || 'complex-secret-key-at-least-32-chars',
    REFRESH_SECRET: process.env.REFRESH_SECRET || 'complex-secret-key-at-least-32-chars',
    ACCESS_TOKEN_EXPIRES_IN: '15m',
    REFRESH_TOKEN_EXPIRES_IN: '7d',
    COOKIE_EXPIRES_IN: 7 * 24 * 60 * 60 * 1000,
  },

  UPLOAD: {
    PATH: path.join(__dirname, '../public/uploads'),
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    MAX_SIZE: 5 * 1024 * 1024,
    MAX_FILES: 5,
  },

  PAGINATION: {
    LIMIT: 10,
    MAX_LIMIT: 100,
  },

  SECURITY: {
    SALT_ROUNDS: 12,
    RATE_LIMIT: {
      WINDOW_MS: 15 * 60 * 1000,
      MAX: 100,
    },
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

  ERROR_MESSAGES: {
    AUTH: {
      NOT_LOGGED_IN: 'Vui lòng đăng nhập để tiếp tục',
      INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
      INVALID_TOKEN: 'Token không hợp lệ hoặc đã hết hạn',
      ACCESS_DENIED: 'Bạn không có quyền truy cập tài nguyên này',
      ACCOUNT_LOCKED: 'Tài khoản tạm thời bị khóa do quá nhiều lần thử sai',
    },
    VALIDATION: {
      INVALID_EMAIL: 'Email không hợp lệ',
      PASSWORD_STRENGTH: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số',
      FILE_TYPE: 'Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)',
      FILE_SIZE: 'Kích thước file không được vượt quá 5MB',
    },
    DB: {
      DUPLICATE_KEY: 'Dữ liệu đã tồn tại trong hệ thống',
      CONSTRAINT_ERROR: 'Vi phạm ràng buộc dữ liệu',
    },
    SERVER: {
      INTERNAL_ERROR: 'Lỗi hệ thống, vui lòng thử lại sau',
      MAINTENANCE: 'Hệ thống đang bảo trì, vui lòng quay lại sau',
    },
  },

  DB: {
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },

  ENV: {
    PRODUCTION: 'production',
    DEVELOPMENT: 'development',
    TEST: 'test',
  },
};
