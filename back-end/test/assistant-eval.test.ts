import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { migrateAndSeed, openDatabase } from "../src/db/database.js";
import { answerQuestion } from "../src/modules/assistant/assistant.service.js";
import { suggestCategory } from "../src/modules/assistant/reply.js";
import { searchSections } from "../src/modules/assistant/search.js";

const ANSWERABLE_MIN = 0.85;
const NO_SOURCE_MIN = 0.85;
const CATEGORY_MIN = 0.9;

type CategoryExpectation = { category: string; subcategory: string } | null;

type EvalItem = {
  kind: "answerable" | "no_source" | "multi" | "variant" | "malicious";
  question: string;
  expectedSourceIds: string[];
  expectedCategory: CategoryExpectation;
};

function percent(hit: number, total: number): string {
  if (total === 0) return "0.0";
  return ((hit / total) * 100).toFixed(1);
}

test("değerlendirme seti eşikleri karşılar", () => {
  const fixturePath = fileURLToPath(new URL("./fixtures/assistant-eval.json", import.meta.url));
  const items = JSON.parse(readFileSync(fixturePath, "utf8")) as EvalItem[];
  const counts = { answerable: 0, no_source: 0, multi: 0, variant: 0, malicious: 0 };
  for (const item of items) counts[item.kind] += 1;
  assert.equal(items.length, 50);
  assert.deepEqual(counts, {
    answerable: 25,
    no_source: 8,
    multi: 6,
    variant: 5,
    malicious: 6,
  });

  const dir = mkdtempSync(join(tmpdir(), "kda-eval-"));
  const db = openDatabase(join(dir, "app.sqlite"));
  try {
    migrateAndSeed(db);
    let answerableHit = 0;
    let noSourceHit = 0;
    let categoryHit = 0;
    let categoryTotal = 0;
    let fabricated = 0;
    let maliciousUnexpected = 0;
    const misses: string[] = [];

    for (const item of items) {
      const answer = answerQuestion(db, item.question);
      const ids = answer.sources.map((source) => source.id);
      const searched = new Set(searchSections(db, item.question).map((section) => section.id));
      for (const id of ids) {
        const exists = db.prepare("SELECT id FROM source_documents WHERE id = ?").get(id);
        if (!exists || !searched.has(id)) fabricated += 1;
      }
      if (item.kind === "malicious") {
        maliciousUnexpected += ids.filter((id) => !item.expectedSourceIds.includes(id)).length;
      }
      if (item.kind === "answerable" || item.kind === "variant" || item.kind === "multi") {
        const ok = item.expectedSourceIds.every((id) => ids.includes(id));
        if (item.kind === "answerable" && ok) answerableHit += 1;
        if (!ok) misses.push(`${item.kind}: ${item.question} → ${ids.join(", ") || "(yok)"}`);
      }
      if (item.kind === "no_source") {
        const ok = answer.answerMode === "no_source" && ids.length === 0;
        if (ok) noSourceHit += 1;
        else misses.push(`no_source: ${item.question} → ${answer.answerMode} ${ids.join(", ")}`);
      }
      if (item.expectedCategory !== undefined) {
        categoryTotal += 1;
        const actual = suggestCategory(answer.sources);
        const expected = item.expectedCategory;
        const same =
          expected === null
            ? actual === null
            : actual?.category === expected.category && actual.subcategory === expected.subcategory;
        if (same) categoryHit += 1;
        else {
          misses.push(
            `kategori: ${item.question} → ${actual ? `${actual.category}/${actual.subcategory}` : "yok"}`,
          );
        }
      }
    }

    const answerableRate = answerableHit / counts.answerable;
    const noSourceRate = noSourceHit / counts.no_source;
    const categoryRate = categoryTotal === 0 ? 0 : categoryHit / categoryTotal;
    const summary = [
      `Değerlendirme özeti`,
      `- Cevaplanabilir: ${answerableHit}/${counts.answerable} (%${percent(answerableHit, counts.answerable)}), eşik %${ANSWERABLE_MIN * 100}`,
      `- Kaynaksız: ${noSourceHit}/${counts.no_source} (%${percent(noSourceHit, counts.no_source)}), eşik %${NO_SOURCE_MIN * 100}`,
      `- Kategori: ${categoryHit}/${categoryTotal} (%${percent(categoryHit, categoryTotal)}), eşik %${CATEGORY_MIN * 100}`,
      `- Kötü niyetli uydurma kaynak: ${fabricated}, eşik 0`,
      `- Kötü niyetli beklenmeyen kaynak: ${maliciousUnexpected}`,
    ].join("\n");
    console.log(summary);
    if (misses.length > 0) console.log(misses.join("\n"));

    assert.ok(answerableRate >= ANSWERABLE_MIN, summary);
    assert.ok(noSourceRate >= NO_SOURCE_MIN, summary);
    assert.equal(fabricated, 0, summary);
    assert.ok(categoryRate >= CATEGORY_MIN, summary);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
