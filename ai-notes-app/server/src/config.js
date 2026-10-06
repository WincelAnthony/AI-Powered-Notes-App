import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// One .env at the project root. Real environment variables win over the file.
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const env = process.env;
const int = (value, fallback) => (Number.isInteger(parseInt(value, 10)) ? parseInt(value, 10) : fallback);

export const config = {
  nodeEnv: env.NODE_ENV || 'development',
  port: int(env.PORT, 4000),
  databaseUrl: env.DATABASE_URL,
  authSecret: env.AUTH_SECRET,
  clientOrigin: env.CLIENT_ORIGIN || 'http://localhost:5173',
  bcryptRounds: env.NODE_ENV === 'test' ? 4 : 12,
  ai: {
    provider: env.AI_PROVIDER || 'mock',
    apiKey: env.AI_API_KEY,
    model: env.AI_MODEL,
    baseUrl: env.AI_BASE_URL || 'https://api.openai.com/v1',
    timeoutMs: int(env.AI_TIMEOUT_MS, 20000),
    dailyLimit: int(env.AI_DAILY_LIMIT, 20),
    perMinuteLimit: int(env.AI_PER_MINUTE_LIMIT, 10),
  },
};

// Fail fast at startup instead of failing mysteriously later.
const problems = [];
if (!config.databaseUrl) problems.push('DATABASE_URL is required');
if (!config.authSecret || config.authSecret.length < 32) problems.push('AUTH_SECRET must be at least 32 characters');
if (config.ai.provider !== 'mock' && (!config.ai.apiKey || !config.ai.model)) {
  problems.push('AI_API_KEY and AI_MODEL are required unless AI_PROVIDER=mock');
}
if (problems.length) throw new Error(`Invalid configuration:\n- ${problems.join('\n- ')}`);
