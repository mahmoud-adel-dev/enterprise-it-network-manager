import 'server-only';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';

// Resolve DB path from env or default to data/endpoint-manager.sqlite
function getDbPath(): string {
  const envPath = process.env['DATABASE_PATH'];
  if (envPath) return path.resolve(envPath);
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'endpoint-manager.sqlite');
}

let _sqlite: Database.Database | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function createConnection() {
  const dbPath = getDbPath();
  const sqlite = new Database(dbPath);

  // Production-grade SQLite pragmas
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('cache_size = -64000'); // 64 MB
  sqlite.pragma('temp_store = memory');
  sqlite.pragma('mmap_size = 268435456'); // 256 MB

  return sqlite;
}

export function getSqlite(): Database.Database {
  if (!_sqlite) {
    _sqlite = createConnection();
    // Graceful shutdown
    process.on('exit', () => { _sqlite?.close(); });
    process.on('SIGINT', () => { _sqlite?.close(); process.exit(0); });
    process.on('SIGTERM', () => { _sqlite?.close(); process.exit(0); });
  }
  return _sqlite;
}

export function getDb() {
  if (!_db) {
    _db = drizzle(getSqlite(), { schema });
  }
  return _db;
}

// Singleton for Next.js hot-reload in development
declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof getDb> | undefined;
}

export const db = (() => {
  if (process.env['NODE_ENV'] === 'production') {
    return getDb();
  }
  if (!globalThis.__db) {
    globalThis.__db = getDb();
  }
  return globalThis.__db;
})();

export type Db = typeof db;
export { schema };
