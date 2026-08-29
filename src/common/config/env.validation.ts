import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().url(),

  THROTTLE_TTL: z.coerce.number().positive(),
  THROTTLE_LIMIT: z.coerce.number().positive(),

  FRONTEND_URL: z.string().optional(),

  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().min(1),
  REFRESH_TOKEN_SECRET: z.string().min(1),
  REFRESH_TOKEN_EXPIRES_IN: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (env: Record<string, unknown>): Env => envSchema.parse(env);
