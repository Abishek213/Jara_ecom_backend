export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const JWT_SECRET = process.env.JWT_SECRET;
export const COOKIE_EXPIRES_IN = process.env.COOKIE_EXPIRES_IN || 7 * 24 * 60 * 60 * 1000; // 7 days in ms
export const MAX_FILE_UPLOAD = process.env.MAX_FILE_UPLOAD || 5 * 1024 * 1024; // 5MB
export const RATE_LIMIT_WINDOW = process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || 100;
export const NODE_ENV = process.env.NODE_ENV || 'development';