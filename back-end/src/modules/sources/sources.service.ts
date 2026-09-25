import type { DatabaseSync } from "node:sqlite";
import { HttpError } from "../../shared/http.js";

export type SourceRecord = {
  id: string;
  title: string;
  section: string;
  excerpt: string;
  updatedAt: string;
};

type SourceRow = {
  id: string;
  title: string;
  section: string;
  excerpt: string;
  updated_at: string;
};

function sourceFrom(row: SourceRow): SourceRecord & { demo: true } {
  return {
    id: row.id,
    title: row.title,
    section: row.section,
    excerpt: row.excerpt,
    updatedAt: row.updated_at,
    demo: true,
  };
}

export function listSources(db: DatabaseSync) {
  const rows = db
    .prepare(
      `SELECT id, title, section, excerpt, updated_at
       FROM source_documents ORDER BY rowid`,
    )
    .all() as SourceRow[];
  return rows.map(sourceFrom);
}

export function getSource(db: DatabaseSync, id: string) {
  const row = db
    .prepare(
      `SELECT id, title, section, excerpt, updated_at
       FROM source_documents WHERE id = ?`,
    )
    .get(id) as SourceRow | undefined;
  if (!row) throw new HttpError(404, "Kaynak bulunamadı.");
  return sourceFrom(row);
}
