import dotenv from 'dotenv';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET,
  corsOrigin: process.env.CORS_ORIGIN,
  database: {
    url: process.env.DATABASE_URL
  },
  rateLimit: {
    windowMs: 5 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: true,
  }
}; 