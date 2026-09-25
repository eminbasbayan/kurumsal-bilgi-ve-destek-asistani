import type { DatabaseSync } from "node:sqlite";

export function transaction<T>(db: DatabaseSync, run: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const value = run();
    db.exec("COMMIT");
    return value;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function insertedId(result: { lastInsertRowid: number | bigint }): number {
  return Number(result.lastInsertRowid);
}
