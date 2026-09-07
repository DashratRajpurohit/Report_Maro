import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  REDIS_URL: z.string().min(1),
  API_INTERNAL_BASE_URL: z.string().url(),
  INTERNAL_API_SECRET: z.string().min(16),
  DEDUPE_MIN_SCORE: z.coerce.number().min(0).max(1).default(0.8),
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  CLASSIFIER_CONFIDENCE_FALLBACK_THRESHOLD: z.coerce.number().min(0).max(1).default(0.55),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration — see printed errors above');
}

export const env = parsed.data;

/** True only when an OpenAI key is actually configured — the fallback stays fully optional. */
export const openAiEnabled = env.OPENAI_API_KEY.length > 0;
