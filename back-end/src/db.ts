import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { seedIfEmpty } from "./db/seed.js";

export const defaultDatabasePath = fileURLToPath(
  new URL("../data/app.sqlite", import.meta.url),
);

const SCHEMA = `
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  employee_no TEXT NOT NULL,
  location TEXT NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  number TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Düşük', 'Normal', 'Yüksek')),
  status TEXT NOT NULL CHECK (status IN (
    'Yeni',
    'İnceleniyor',
    'Kullanıcıdan Bilgi Bekleniyor',
    'Devam Ediyor',
    'Çözüldü',
    'Kapatıldı'
  )),
  team TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  assistant_context TEXT,
  client_request_id TEXT,
  UNIQUE (employee_id, client_request_id)
);

CREATE TABLE IF NOT EXISTS request_messages (
  id INTEGER PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES requests(id),
  author TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'support')),
  text TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS request_timeline (
  id INTEGER PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES requests(id),
  label TEXT NOT NULL,
  actor TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS request_attachments (
  id INTEGER PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES requests(id),
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  read INTEGER NOT NULL CHECK (read IN (0, 1)),
  request_id INTEGER REFERENCES requests(id)
);

CREATE TABLE IF NOT EXISTS source_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  section TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id INTEGER PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  text TEXT NOT NULL,
  source_id TEXT REFERENCES source_documents(id),
  helpful INTEGER CHECK (helpful IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_requests_employee_updated
  ON requests (employee_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_employee
  ON notifications (employee_id, created_at DESC);
`;

export function openDatabase(path: string): DatabaseSync {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON");
  return db;
}

export function migrateAndSeed(db: DatabaseSync): void {
  db.exec(SCHEMA);
  seedIfEmpty(db);
}
