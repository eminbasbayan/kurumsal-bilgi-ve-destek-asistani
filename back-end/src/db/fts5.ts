import { existsSync } from "node:fs";
import type { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

/**
 * node:sqlite in Node 22.14 is built without FTS5. This loadable extension
 * is SQLite 3.47.2's FTS5 module, the same SQLite version bundled with that Node.
 */
export const fts5ExtensionPath = fileURLToPath(
  new URL("../../native/fts5.so", import.meta.url),
);

export function loadFts5(db: DatabaseSync): void {
  if (!existsSync(fts5ExtensionPath)) {
    throw new Error(`FTS5 eklentisi bulunamadı: ${fts5ExtensionPath}`);
  }
  db.enableLoadExtension(true);
  db.loadExtension(fts5ExtensionPath);
  db.enableLoadExtension(false);
}
