// Drizzle Kit configuration for migrations
import type { Config } from 'drizzle-kit';
import path from 'path';

const dbPath = process.env['DATABASE_PATH'] ?? path.resolve('./data/endpoint-manager.sqlite');

export default {
  schema: './src/server/db/schema/index.ts',
  out: './src/server/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbPath,
  },
} satisfies Config;
