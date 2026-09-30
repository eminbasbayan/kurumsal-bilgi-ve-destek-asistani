import type { DatabaseSync } from "node:sqlite";
import {
  DEMO_PASSWORD,
  DEMO_SUPPORT_ACCOUNTS,
  REQUEST_STATUSES,
  SUPPORT_TEAMS,
  SYSTEM_ACTOR,
  TIMELINE_EVENT_TYPES,
  USER_ROLES,
} from "../config/constants.js";
import { normalizeText } from "../shared/normalize.js";
import { hashPassword } from "../shared/passwords.js";
import { SOURCE_SECTIONS } from "./documents.js";
import { transaction } from "./sql.js";

function quoteList(values: readonly string[]): string {
  return values.map((value) => `'${value.replaceAll("'", "''")}'`).join(", ");
}

function userVersion(db: DatabaseSync): number {
  const row = db.prepare("PRAGMA user_version").get() as { user_version: number };
  return Number(row.user_version);
}

function ensureSupportStaff(db: DatabaseSync): void {
  const existing = db.prepare(
    "SELECT id FROM employees WHERE email = ? AND role = 'support'",
  );
  const insert = db.prepare(
    `INSERT INTO employees
      (name, initials, title, department, email, employee_no, location, password_hash, role, team)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'support', ?)`,
  );
  for (const account of DEMO_SUPPORT_ACCOUNTS) {
    if (!SUPPORT_TEAMS.includes(account.team)) {
      throw new Error(`Demo destek ekibi tanımsız: ${account.team}`);
    }
    if (existing.get(account.email)) continue;
    insert.run(
      account.name,
      account.initials,
      account.title,
      account.department,
      account.email,
      account.employeeNo,
      account.location,
      hashPassword(DEMO_PASSWORD),
      account.team,
    );
  }
}

function assignDemoRequest(
  db: DatabaseSync,
  number: string,
  email: string,
  team: string,
  assigneeName: string,
): void {
  const staff = db
    .prepare("SELECT id FROM employees WHERE email = ? AND role = 'support'")
    .get(email) as
    | { id: number }
    | undefined;
  if (!staff) return;
  const updated = db
    .prepare(
      `UPDATE requests SET assignee_id = ?
       WHERE number = ? AND assignee_id IS NULL AND team = ?`,
    )
    .run(staff.id, number, team);
  if (Number(updated.changes) !== 1) return;
  const request = db.prepare("SELECT id, updated_at FROM requests WHERE number = ?").get(number) as {
    id: number;
    updated_at: string;
  };
  db.prepare(
    `INSERT INTO request_timeline (
      request_id, label, actor, created_at, event_type, actor_id,
      from_status, to_status, visibility, detail
    ) VALUES (?, ?, ?, ?, 'assignment', NULL, NULL, NULL, 'internal', NULL)`,
  ).run(request.id, `Talep atandı: ${assigneeName}`, SYSTEM_ACTOR, request.updated_at);
}

function migrateV1(db: DatabaseSync): void {
  const statuses = quoteList(REQUEST_STATUSES);
  db.exec(`
    ALTER TABLE employees ADD COLUMN role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN (${quoteList(USER_ROLES)}));
    ALTER TABLE employees ADD COLUMN team TEXT;
    ALTER TABLE requests ADD COLUMN assignee_id INTEGER REFERENCES employees(id);
    ALTER TABLE request_timeline ADD COLUMN event_type TEXT NOT NULL DEFAULT 'created' CHECK (event_type IN (${quoteList(TIMELINE_EVENT_TYPES)}));
    ALTER TABLE request_timeline ADD COLUMN actor_id INTEGER REFERENCES employees(id);
    ALTER TABLE request_timeline ADD COLUMN from_status TEXT CHECK (from_status IS NULL OR from_status IN (${statuses}));
    ALTER TABLE request_timeline ADD COLUMN to_status TEXT CHECK (to_status IS NULL OR to_status IN (${statuses}));
    ALTER TABLE request_timeline ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'internal'));
    ALTER TABLE request_timeline ADD COLUMN detail TEXT;
    CREATE TABLE request_internal_notes (
      id INTEGER PRIMARY KEY,
      request_id INTEGER NOT NULL REFERENCES requests(id),
      author_id INTEGER NOT NULL REFERENCES employees(id),
      text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX idx_requests_team_created ON requests (team, created_at);
    CREATE INDEX idx_requests_assignee_created ON requests (assignee_id, created_at);
    CREATE INDEX idx_internal_notes_request ON request_internal_notes (request_id, id);
    UPDATE request_timeline SET event_type = 'status_change',
      to_status = trim(substr(label, instr(label, ':') + 1))
      WHERE label LIKE 'Durum güncellendi:%';
    UPDATE request_timeline SET event_type = 'employee_message' WHERE label = 'Mesaj gönderildi';
  `);
  ensureSupportStaff(db);
  const ahmet = DEMO_SUPPORT_ACCOUNTS.find((account) => account.email === "ahmet.kaya@ornek-kurum.com");
  const zeynep = DEMO_SUPPORT_ACCOUNTS.find((account) => account.email === "zeynep.arslan@ornek-kurum.com");
  if (!ahmet || !zeynep) return;
  assignDemoRequest(db, "DST-2026-1041", ahmet.email, ahmet.team, ahmet.name);
  assignDemoRequest(db, "DST-2026-1038", ahmet.email, ahmet.team, ahmet.name);
  assignDemoRequest(db, "DST-2026-1042", zeynep.email, zeynep.team, zeynep.name);
}

function applySourceCatalog(db: DatabaseSync): void {
  const update = db.prepare(
    `UPDATE source_documents
     SET title = ?, section = ?, excerpt = ?, updated_at = ?, document_id = ?,
         category = ?, subcategory = ?, body = ?, version = ?
     WHERE id = ?`,
  );
  const insert = db.prepare(
    `INSERT INTO source_documents (
       id, title, section, excerpt, updated_at, document_id, category, subcategory, body, version
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const section of SOURCE_SECTIONS) {
    const existing = db.prepare("SELECT id FROM source_documents WHERE id = ?").get(section.id);
    if (existing) {
      update.run(
        section.title,
        section.section,
        section.excerpt,
        section.updatedAt,
        section.documentId,
        section.category,
        section.subcategory,
        section.body,
        section.version,
        section.id,
      );
    } else {
      insert.run(
        section.id,
        section.title,
        section.section,
        section.excerpt,
        section.updatedAt,
        section.documentId,
        section.category,
        section.subcategory,
        section.body,
        section.version,
      );
    }
  }
}

function rebuildSourceFts(db: DatabaseSync): void {
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS source_documents_fts USING fts5(
      title,
      section,
      body_normalized,
      tokenize = 'unicode61'
    );
    DELETE FROM source_documents_fts;
  `);
  const rows = db
    .prepare("SELECT rowid, title, section, body FROM source_documents")
    .all() as { rowid: number; title: string; section: string; body: string }[];
  const insert = db.prepare(
    `INSERT INTO source_documents_fts (rowid, title, section, body_normalized)
     VALUES (?, ?, ?, ?)`,
  );
  for (const row of rows) {
    insert.run(
      Number(row.rowid),
      normalizeText(row.title),
      normalizeText(row.section),
      normalizeText(row.body),
    );
  }
}

function migrateV2(db: DatabaseSync): void {
  db.exec(`
    ALTER TABLE source_documents ADD COLUMN document_id TEXT NOT NULL DEFAULT '';
    ALTER TABLE source_documents ADD COLUMN category TEXT NOT NULL DEFAULT '';
    ALTER TABLE source_documents ADD COLUMN subcategory TEXT NOT NULL DEFAULT '';
    ALTER TABLE source_documents ADD COLUMN body TEXT NOT NULL DEFAULT '';
    ALTER TABLE source_documents ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
  `);
  applySourceCatalog(db);
  rebuildSourceFts(db);
  db.exec(`
    CREATE TABLE conversation_message_sources (
      message_id INTEGER NOT NULL REFERENCES conversation_messages(id),
      source_id TEXT NOT NULL REFERENCES source_documents(id),
      rank INTEGER NOT NULL,
      PRIMARY KEY (message_id, source_id)
    );
    ALTER TABLE conversation_messages ADD COLUMN answer_mode TEXT
      CHECK (answer_mode IS NULL OR answer_mode IN ('quote', 'no_source', 'generated', 'legacy'));
    UPDATE conversation_messages
      SET answer_mode = 'legacy'
      WHERE role = 'assistant' AND answer_mode IS NULL;
    INSERT INTO conversation_message_sources (message_id, source_id, rank)
      SELECT id, source_id, 1
      FROM conversation_messages
      WHERE role = 'assistant' AND source_id IS NOT NULL;
  `);
}

export function runMigrations(db: DatabaseSync, targetVersion = 2): void {
  transaction(db, () => {
    if (userVersion(db) < 1 && targetVersion >= 1) {
      migrateV1(db);
      db.exec("PRAGMA user_version = 1");
    }
    if (userVersion(db) < 2 && targetVersion >= 2) {
      migrateV2(db);
      db.exec("PRAGMA user_version = 2");
    }
  });
}
