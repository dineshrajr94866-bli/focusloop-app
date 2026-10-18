import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'FocusLoop.db'));

function hasTable(name) {
  return db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(name);
}

function hasColumn(tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some(column => column.name === columnName);
}

// Configure database
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create core tables

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    notes TEXT DEFAULT '',
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'doing', 'done')),
    estimated_minutes INTEGER,
    due_date TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    color TEXT DEFAULT '#6C5CE7',
    target_per_week INTEGER DEFAULT 7,
    archived INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS habit_logs (
    id TEXT PRIMARY KEY,
    habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS moods (
    id TEXT PRIMARY KEY,
    mood INTEGER NOT NULL CHECK(mood BETWEEN 1 AND 5),
    energy INTEGER NOT NULL CHECK(energy BETWEEN 1 AND 5),
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    type TEXT DEFAULT 'focus' CHECK(type IN ('focus', 'break')),
    duration_minutes INTEGER NOT NULL,
    completed_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ai_chat_history (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    text TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

if (hasTable('focus_sessions') && !hasTable('sessions')) {
  db.exec('ALTER TABLE focus_sessions RENAME TO sessions');
}

if (!hasColumn('habits', 'created_at')) {
  db.exec('ALTER TABLE habits ADD COLUMN created_at TEXT DEFAULT (datetime("now"))');
}

if (hasColumn('moods', 'value')) {
  if (!hasColumn('moods', 'mood')) {
    db.exec('ALTER TABLE moods ADD COLUMN mood INTEGER');
  }
  if (!hasColumn('moods', 'energy')) {
    db.exec('ALTER TABLE moods ADD COLUMN energy INTEGER');
  }
  db.exec('UPDATE moods SET mood = COALESCE(mood, value), energy = COALESCE(energy, 3) WHERE mood IS NULL OR energy IS NULL');
  try {
    db.exec('ALTER TABLE moods DROP COLUMN value');
  } catch (e) {
    console.warn('Could not drop legacy value column:', e.message);
  }
}

if (!hasColumn('moods', 'mood')) {
  db.exec('ALTER TABLE moods ADD COLUMN mood INTEGER');
}
if (!hasColumn('moods', 'energy')) {
  db.exec('ALTER TABLE moods ADD COLUMN energy INTEGER');
}

if (!hasColumn('sessions', 'type')) {
  db.exec('ALTER TABLE sessions ADD COLUMN type TEXT DEFAULT "focus"');
}

if (!hasColumn('sessions', 'completed_at')) {
  db.exec('ALTER TABLE sessions ADD COLUMN completed_at TEXT DEFAULT (datetime("now"))');
}

export default db;