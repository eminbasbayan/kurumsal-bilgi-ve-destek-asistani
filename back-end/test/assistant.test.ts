import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { CATEGORIES, DEMO_EMAIL } from "../src/config/constants.js";
import { SCHEMA, assertFts5Available, migrateAndSeed, openDatabase } from "../src/db/database.js";
import { LEGACY_SECTION_IDS, SOURCE_SECTIONS } from "../src/db/documents.js";
import { runMigrations } from "../src/db/migrations.js";
import { seedIfEmpty } from "../src/db/seed.js";
import { getConversation } from "../src/modules/assistant/assistant.service.js";
import { answerQuestion } from "../src/modules/assistant/assistant.service.js";
import { NO_SOURCE_TEXT, QUOTE_INTRO, suggestCategory } from "../src/modules/assistant/reply.js";
import { getSource } from "../src/modules/sources/sources.service.js";
import { buildFtsQuery, foldTurkish, normalizeText } from "../src/shared/normalize.js";

test("FTS5 yoksa açılış anlaşılır hatayla durur", () => {
  const fake = {
    exec() {
      throw new Error("no such module: fts5");
    },
  };
  assert.throws(
    () => assertFts5Available(fake),
    (error: unknown) => error instanceof Error && error.message ===
      "Bu Node sürümünde SQLite FTS5 yok; Node 22.16+ veya 24 kullanın.",
  );
});

test("Türkçe I ve İ aynı köke iner", () => {
  assert.equal(foldTurkish("İZİN"), "izin");
  assert.equal(foldTurkish("IZIN"), "izin");
  assert.equal(normalizeText("İZİN"), "izin");
  assert.equal(normalizeText("IZIN"), "izin");
});

test("ASCII katlama noktalamayı ve durak kelimeleri temizler", () => {
  assert.equal(normalizeText("Maaş!"), "maas");
  assert.equal(normalizeText("Nasıl izin alınır?"), "izin alinir");
  assert.equal(buildFtsQuery("ne mi ben"), null);
});

test("eş anlamlılar ve ünsüz yumuşaması sorguya eklenir", () => {
  assert.match(buildFtsQuery("maaşı nereden görürüm") ?? "", /bordro\*/);
  assert.match(buildFtsQuery("maas") ?? "", /maas\*/);
  assert.match(buildFtsQuery("yıllık tatil hakkım") ?? "", /izin\*/);
  assert.match(buildFtsQuery("uzaktan bağlantı kuramıyorum") ?? "", /vpn\*/);
  assert.match(buildFtsQuery("market fişi yüklenmiyor") ?? "", /masraf\*/);
  assert.match(buildFtsQuery("fatura nerede") ?? "", /belgesi\*/);
  assert.match(buildFtsQuery("şifremi unuttum") ?? "", /parola\*/);
  assert.match(buildFtsQuery("izni kaç gün") ?? "", /izin\*/);
});

test("ekler için kök önek üretilir", () => {
  assert.match(buildFtsQuery("izinli") ?? "", /izin\*/);
  assert.match(buildFtsQuery("bordroma") ?? "", /bordr\*/);
  assert.match(buildFtsQuery("masraflar") ?? "", /masra\*/);
  const board = buildFtsQuery("Yönetim kurulu kimlerden oluşur?") ?? "";
  assert.match(board, /yonetim\*/);
  assert.doesNotMatch(board, /(^| )kurul\*/);
  assert.doesNotMatch(board, /(^| )kurulu\*/);
  assert.doesNotMatch(board, /(^| )olusu\*/);
});

test("katalog kategorileri ve bölüm uzunlukları geçerli", () => {
  const documents = new Set(SOURCE_SECTIONS.map((section) => section.documentId));
  assert.equal(documents.size, 17);
  assert.ok(SOURCE_SECTIONS.length >= 45 && SOURCE_SECTIONS.length <= 70);
  const ids = new Set<string>();
  for (const section of SOURCE_SECTIONS) {
    assert.ok(!ids.has(section.id), section.id);
    ids.add(section.id);
    assert.ok(section.category in CATEGORIES, section.category);
    assert.ok(CATEGORIES[section.category]?.includes(section.subcategory), section.subcategory);
    const words = section.body.trim().split(/\s+/).length;
    assert.ok(words >= 40 && words <= 150, `${section.id} ${words}`);
  }
  for (const id of LEGACY_SECTION_IDS) assert.ok(ids.has(id));
});

test("kategori önerisi yalnız ortak kategori ve alt kategoride dolar", () => {
  const izin = { category: "İnsan Kaynakları", subcategory: "İzinler" };
  const vpn = { category: "Bilgi Teknolojileri", subcategory: "VPN ve Uzaktan Erişim" };
  assert.deepEqual(suggestCategory([izin, izin]), izin);
  assert.equal(suggestCategory([izin, vpn]), null);
  assert.equal(suggestCategory([]), null);
});

test("v1 veritabanı v2'ye taşınır ve ikinci çalıştırma aynı kalır", () => {
  const dir = mkdtempSync(join(tmpdir(), "kda-v2-"));
  const db = openDatabase(join(dir, "app.sqlite"));
  const freshDir = mkdtempSync(join(tmpdir(), "kda-v2-fresh-"));
  const fresh = openDatabase(join(freshDir, "app.sqlite"));
  try {
    db.exec(SCHEMA);
    seedIfEmpty(db);
    runMigrations(db, 1);
    assert.equal(
      (db.prepare("PRAGMA user_version").get() as { user_version: number }).user_version,
      1,
    );
    const columns = db.prepare("PRAGMA table_info(source_documents)").all() as { name: string }[];
    assert.equal(columns.some((column) => column.name === "document_id"), false);

    const employee = db.prepare("SELECT id FROM employees WHERE email = ?").get(DEMO_EMAIL) as {
      id: number;
    };
    const conversation = db
      .prepare(
        `INSERT INTO conversations (employee_id, title, created_at, updated_at)
         VALUES (?, 'Eski sohbet', '2026-09-01T09:00:00.000Z', '2026-09-01T09:00:00.000Z')`,
      )
      .run(employee.id);
    const conversationId = Number(conversation.lastInsertRowid);
    db.prepare(
      `INSERT INTO conversation_messages
        (conversation_id, role, text, source_id, helpful, created_at)
       VALUES (?, 'user', 'Eski soru', NULL, NULL, '2026-09-01T09:00:00.000Z')`,
    ).run(conversationId);
    db.prepare(
      `INSERT INTO conversation_messages
        (conversation_id, role, text, source_id, helpful, created_at)
       VALUES (?, 'assistant', 'Eski yanıt', 'izin', NULL, '2026-09-01T09:00:01.000Z')`,
    ).run(conversationId);
    db.prepare(
      `INSERT INTO conversation_messages
        (conversation_id, role, text, source_id, helpful, created_at)
       VALUES (?, 'assistant', 'Eski boş yanıt', NULL, NULL, '2026-09-01T09:00:02.000Z')`,
    ).run(conversationId);

    runMigrations(db);
    const version = db.prepare("PRAGMA user_version").get() as { user_version: number };
    assert.equal(version.user_version, 3);
    const stored = getConversation(db, employee.id, conversationId);
    assert.equal(stored.messages[0]?.answerMode, null);
    assert.deepEqual(stored.messages[0]?.sources, []);
    assert.equal(stored.messages[1]?.answerMode, "legacy");
    assert.equal(stored.messages[1]?.source?.id, "izin");
    assert.equal(stored.messages[1]?.sources[0]?.id, "izin");
    assert.equal(stored.messages[1]?.sources[0]?.documentId, "yillik-izin");
    assert.equal(stored.messages[2]?.answerMode, "legacy");
    assert.equal(stored.messages[2]?.source, null);
    assert.deepEqual(stored.messages[2]?.sources, []);

    const before = db.prepare("SELECT COUNT(*) AS count FROM source_documents").get() as {
      count: number;
    };
    const links = db.prepare("SELECT COUNT(*) AS count FROM conversation_message_sources").get() as {
      count: number;
    };
    runMigrations(db);
    const after = db.prepare("SELECT COUNT(*) AS count FROM source_documents").get() as {
      count: number;
    };
    const linksAgain = db
      .prepare("SELECT COUNT(*) AS count FROM conversation_message_sources")
      .get() as { count: number };
    assert.equal(Number(after.count), Number(before.count));
    assert.equal(Number(linksAgain.count), Number(links.count));
    assert.equal(Number(after.count), SOURCE_SECTIONS.length);

    const fts = db.prepare("SELECT COUNT(*) AS count FROM source_documents_fts").get() as {
      count: number;
    };
    assert.equal(Number(fts.count), SOURCE_SECTIONS.length);

    migrateAndSeed(fresh);
    const left = db
      .prepare(
        `SELECT id, document_id, category, subcategory, body
         FROM source_documents ORDER BY id`,
      )
      .all();
    const right = fresh
      .prepare(
        `SELECT id, document_id, category, subcategory, body
         FROM source_documents ORDER BY id`,
      )
      .all();
    assert.deepEqual(left, right);
  } finally {
    db.close();
    fresh.close();
    rmSync(dir, { recursive: true, force: true });
    rmSync(freshDir, { recursive: true, force: true });
  }
});

test("kaynak bulununca alıntı, bulunamayınca no_source döner", () => {
  const dir = mkdtempSync(join(tmpdir(), "kda-quote-"));
  const db = openDatabase(join(dir, "app.sqlite"));
  try {
    migrateAndSeed(db);
    const quote = answerQuestion(db, "Yıllık izin başvurusu nasıl yapılır?");
    assert.equal(quote.answerMode, "quote");
    assert.equal(quote.sources[0]?.id, "izin");
    const body = getSource(db, "izin").body;
    assert.equal(quote.text.startsWith(`${QUOTE_INTRO} "${body}"`), true);
    assert.equal(quote.sources.some((item) => "body" in item), false);

    const synonym = answerQuestion(db, "yıllık tatil hakkımı nasıl kullanırım");
    assert.equal(synonym.answerMode, "quote");
    assert.ok(synonym.sources.some((item) => item.documentId === "yillik-izin"));

    const missing = answerQuestion(db, "Hisse senedi edinebilir miyim?");
    assert.equal(missing.answerMode, "no_source");
    assert.deepEqual(missing.sources, []);
    assert.equal(missing.text, NO_SOURCE_TEXT);

    const board = answerQuestion(db, "Yönetim kurulu kimlerden oluşur?");
    assert.equal(board.answerMode, "no_source");
    assert.deepEqual(board.sources, []);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
