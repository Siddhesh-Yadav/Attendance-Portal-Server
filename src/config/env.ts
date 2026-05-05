import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),

  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432').transform(Number),
  DB_NAME: z.string().default('attendance_portal'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),

  // JWT
  JWT_SECRET: z.string().default('your-super-secret-jwt-key-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('24h'),

  // Session
  SESSION_TIMEOUT_MINUTES: z.string().default('15').transform(Number),

  // Logging
  LOG_LEVEL: z.string().default('info'),

  // Rate Limiting
  LOGIN_RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  LOGIN_RATE_LIMIT_MAX: z.string().default('5').transform(Number),

  // Cookie
  COOKIE_DOMAIN: z.string().default('localhost'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
