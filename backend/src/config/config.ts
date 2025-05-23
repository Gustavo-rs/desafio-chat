import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  corsOrigin: process.env.CORS_ORIGIN,
  database: {
    url: process.env.DATABASE_URL
  },
  rateLimit: {
    windowMs: 5 * 60 * 1000,
    max: 100
  }
}; 