// Must be imported BEFORE the app so env vars are set when config.js reads them.
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });
if (!process.env.TEST_DATABASE_URL) throw new Error('Set TEST_DATABASE_URL in .env (a separate database: tests wipe it).');

Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: process.env.TEST_DATABASE_URL,
  AUTH_SECRET: 'test-secret-test-secret-test-secret-1234',
  AI_PROVIDER: 'mock',
  AI_API_KEY: 'sk-test-secret-key-12345',
  AI_MODEL: 'mock',
  AI_DAILY_LIMIT: '6',
  AI_PER_MINUTE_LIMIT: '100',
});
