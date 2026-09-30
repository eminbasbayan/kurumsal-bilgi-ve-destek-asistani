import type { DatabaseSync } from "node:sqlite";
import { buildFtsQuery } from "../../shared/normalize.js";
import { sourceFromRow, type SourceRow } from "../sources/sources.service.js";

/**
 * FTS5 bm25 is negative; more negative means a stronger match.
 * Results weaker than this fixed floor are treated as no source.
 * Neighbors below RELATIVE_BM25 of the best score are dropped so a strong
 * section does not drag unrelated prefix hits into the top three.
 */
export const MIN_BM25_SCORE = -4.5;
export const RELATIVE_BM25 = 0.45;

export type RankedSection = ReturnType<typeof sourceFromRow> & {
  body: string;
  score: number;
};

type HitRow = SourceRow & { body: string; score: number };

export function searchSections(db: DatabaseSync, question: string): RankedSection[] {
  const query = buildFtsQuery(question);
  if (!query) return [];
  const rows = db
    .prepare(
      `SELECT d.id, d.title, d.section, d.excerpt, d.updated_at, d.document_id,
              d.category, d.subcategory, d.body, bm25(source_documents_fts) AS score
       FROM source_documents_fts
       JOIN source_documents d ON d.rowid = source_documents_fts.rowid
       WHERE source_documents_fts MATCH ?
       ORDER BY score
       LIMIT 15`,
    )
    .all(query) as HitRow[];
  const eligible = rows.filter((row) => row.score <= MIN_BM25_SCORE);
  const best = eligible[0]?.score;
  return eligible
    .filter((row) => best !== undefined && row.score <= best * RELATIVE_BM25)
    .slice(0, 3)
    .map((row) => ({
      ...sourceFromRow(row),
      body: row.body,
      score: row.score,
    }));
}
