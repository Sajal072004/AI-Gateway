import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('8080'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  GEMINI_KEY_CHEAP: z.string().min(1, 'GEMINI_KEY_CHEAP is required'),
  GEMINI_KEY_PREMIUM: z.string().min(1, 'GEMINI_KEY_PREMIUM is required'),
  GEMINI_MODEL_CHEAP: z.string().default('gemini-1.5-flash'),
  GEMINI_MODEL_PREMIUM: z.string().default('gemini-1.5-pro'),
  ADMIN_TOKEN: z.string().min(1, 'ADMIN_TOKEN is required'),
  SOFT_WARN_PCT: z.string().default('80'),
  SOFT_CRIT_PCT: z.string().default('95'),
  AUTO_PREMIUM_IF_CHARS_OVER: z.string().default('500'),
  AUTO_PREMIUM_KEYWORDS: z.string().default('analyze,complex,detailed,comprehensive,advanced,research,technical,professional'),
  FALLBACK_TO_CHEAP_ON_PREMIUM_ERROR: z.string().default('true'),
  SELF_HOSTED_URL: z.string().optional(),
  SELF_HOSTED_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:');
  console.error(parsed.error.format());
  process.exit(1);
}

const env = parsed.data;

export const config = {
  port: parseInt(env.PORT, 10),
  mongoUri: env.MONGODB_URI,
  gemini: {
    keys: {
      cheap: env.GEMINI_KEY_CHEAP,
      premium: env.GEMINI_KEY_PREMIUM,
    },
    models: {
      cheap: env.GEMINI_MODEL_CHEAP,
      premium: env.GEMINI_MODEL_PREMIUM,
    },
  },
  auth: {
    adminToken: env.ADMIN_TOKEN,
  },
  thresholds: {
    warningPct: parseInt(env.SOFT_WARN_PCT, 10),
    criticalPct: parseInt(env.SOFT_CRIT_PCT, 10),
  },
  routing: {
    autoPremiumIfCharsOver: parseInt(env.AUTO_PREMIUM_IF_CHARS_OVER, 10),
    autoPremiumIfContains: env.AUTO_PREMIUM_KEYWORDS.split(',').map(k => k.trim().toLowerCase()),
    fallbackToCheapOnPremiumError: env.FALLBACK_TO_CHEAP_ON_PREMIUM_ERROR === 'true',
  },
  selfHosted: {
    url: env.SELF_HOSTED_URL,
    key: env.SELF_HOSTED_KEY,
    model: 'qwen-2.5-7b', // Default/Internal name
  },
};
