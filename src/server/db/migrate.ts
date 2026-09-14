/**
 * Database migration runner.
 * Run: pnpm db:migrate
 *
 * Applies all pending Drizzle migrations to the SQLite database.
 * Safe to run multiple times (idempotent).
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';

async function main() {
  const dbPath = process.env['DATABASE_PATH'] ?? path.resolve('./data/endpoint-manager.sqlite');
  const migrationsFolder = path.resolve('./src/server/db/migrations');

  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Created data directory: ${dataDir}`);
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');

  const db = drizzle(sqlite);

  console.log(`[migrate] Applying migrations from: ${migrationsFolder}`);
  console.log(`[migrate] Database: ${dbPath}`);

  try {
    await migrate(db, { migrationsFolder });
    console.log('[migrate] ✓ All migrations applied successfully.');
  } catch (error) {
    console.error('[migrate] ✗ Migration failed:', error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
