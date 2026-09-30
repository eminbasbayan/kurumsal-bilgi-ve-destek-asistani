import type { DatabaseSync } from "node:sqlite";
import { HttpError } from "../../shared/http.js";

export type SourceRecord = {
  id: string;
  title: string;
  section: string;
  excerpt: string;
  updatedAt: string;
  documentId: string;
  category: string;
  subcategory: string;
  demo: true;
};

export type SourceDetail = SourceRecord & { body: string };

export type SourceRow = {
  id: string;
  title: string;
  section: string;
  excerpt: string;
  updated_at: string;
  document_id: string;
  category: string;
  subcategory: string;
};

const SOURCE_COLUMNS = `id, title, section, excerpt, updated_at, document_id, category, subcategory`;

export function sourceFromRow(row: SourceRow): SourceRecord {
  return {
    id: row.id,
    title: row.title,
    section: row.section,
    excerpt: row.excerpt,
    updatedAt: row.updated_at,
    documentId: row.document_id,
    category: row.category,
    subcategory: row.subcategory,
    demo: true,
  };
}

export function listSources(db: DatabaseSync): SourceRecord[] {
  const rows = db
    .prepare(`SELECT ${SOURCE_COLUMNS} FROM source_documents ORDER BY rowid`)
    .all() as SourceRow[];
  return rows.map(sourceFromRow);
}

export function getSource(db: DatabaseSync, id: string): SourceDetail {
  const row = db
    .prepare(`SELECT ${SOURCE_COLUMNS}, body FROM source_documents WHERE id = ?`)
    .get(id) as (SourceRow & { body: string }) | undefined;
  if (!row) throw new HttpError(404, "Kaynak bulunamadı.");
  return { ...sourceFromRow(row), body: row.body };
}
