import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

let db: Database.Database | null = null;

const migrations = `
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    mode TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    last_activity TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS session_participants (
    session_id TEXT NOT NULL,
    ai_model_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    name TEXT NOT NULL,
    persona TEXT NOT NULL,
    color TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (session_id, ai_model_id),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    ai_model_id TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    response_time INTEGER,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );
`;

function initialize(dbInstance: Database.Database) {
  dbInstance.exec('PRAGMA journal_mode = WAL;');
  dbInstance.exec('PRAGMA foreign_keys = ON;');
  dbInstance.exec(migrations);
}

export function getDb() {
  if (db) {
    return db;
  }

  const databasePath = process.env.ROUNDTABLE_DB_PATH
    ? path.resolve(process.env.ROUNDTABLE_DB_PATH)
    : path.join(process.cwd(), 'data', 'roundtable.db');

  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  db = new Database(databasePath);
  initialize(db);
  return db;
}
