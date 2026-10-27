const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/endpoint-manager.sqlite');
const db = new Database(dbPath);

const cols = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);

if (!cols.includes('plan_expires_at')) {
  db.prepare('ALTER TABLE users ADD COLUMN plan_expires_at INTEGER').run();
  console.log('Added plan_expires_at');
}
if (!cols.includes('plan_name')) {
  db.prepare("ALTER TABLE users ADD COLUMN plan_name TEXT DEFAULT 'ENTERPRISE'").run();
  console.log('Added plan_name');
}
if (!cols.includes('max_managed_devices')) {
  db.prepare('ALTER TABLE users ADD COLUMN max_managed_devices INTEGER DEFAULT 100').run();
  console.log('Added max_managed_devices');
}
if (!cols.includes('notes')) {
  db.prepare('ALTER TABLE users ADD COLUMN notes TEXT').run();
  console.log('Added notes');
}

console.log('Columns now:', db.prepare('PRAGMA table_info(users)').all().map(c => c.name));
db.close();
