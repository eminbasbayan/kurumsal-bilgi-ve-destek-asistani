import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { after, before, describe, test } from "node:test";
import type { Server } from "node:http";
import { createApp } from "../src/app.js";
import { migrateAndSeed, openDatabase } from "../src/db/database.js";

test("örnek veri boş veritabanına bir kez yazılır", () => {
  const dir = mkdtempSync(join(tmpdir(), "kda-seed-"));
  const db = openDatabase(join(dir, "app.sqlite"));
  try {
    migrateAndSeed(db);
    migrateAndSeed(db);
    const employees = db.prepare("SELECT COUNT(*) AS count FROM employees").get() as {
      count: number;
    };
    const requests = db.prepare("SELECT COUNT(*) AS count FROM requests").get() as {
      count: number;
    };
    const support = db
      .prepare("SELECT COUNT(*) AS count FROM employees WHERE role = 'support'")
      .get() as { count: number };
    const version = db.prepare("PRAGMA user_version").get() as { user_version: number };
    assert.equal(Number(employees.count), 4);
    assert.equal(Number(support.count), 3);
    assert.equal(version.user_version, 2);
    assert.equal(Number(requests.count), 10);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("API", { concurrency: false }, () => {
const dir = mkdtempSync(join(tmpdir(), "kda-api-"));
const db = openDatabase(join(dir, "app.sqlite"));
migrateAndSeed(db);
let seconds = 0;
const app = createApp(db, () => new Date(Date.UTC(2026, 8, 25, 12, 0, seconds++)));
const server: Server = app.listen(0);
let base = "";
let token = "";

async function api(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(`${base}${path}`, { ...init, headers });
  const text = await response.text();
  const body = text ? (JSON.parse(text) as Record<string, unknown>) : undefined;
  return { status: response.status, body };
}

before(async () => {
  if (!server.listening) await once(server, "listening");
  const address = server.address() as AddressInfo;
  base = `http://127.0.0.1:${address.port}`;
  const login = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "deniz.yilmaz@ornek-kurum.com",
      password: "kurumsaldemo",
    }),
  });
  assert.equal(login.status, 200);
  assert.equal(login.body?.demo, true);
  assert.match(String(login.body?.message), /Demo hesap/);
  token = String(login.body?.token);
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

test("swagger bütün uçları oturumsuz açar", async () => {
  const page = await fetch(`${base}/api-docs/`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type") ?? "", /html/);
  const spec = await fetch(`${base}/api-docs.json`);
  assert.equal(spec.status, 200);
  const document = (await spec.json()) as { paths: Record<string, unknown> };
  for (const path of [
    "/api/auth/login",
    "/api/auth/logout",
    "/api/profile",
    "/api/categories",
    "/api/requests/summary",
    "/api/requests",
    "/api/requests/{id}",
    "/api/requests/{id}/messages",
    "/api/notifications",
    "/api/notifications/{id}/read",
    "/api/notifications/read-all",
    "/api/sources",
    "/api/sources/{id}",
    "/api/conversations",
    "/api/conversations/{id}",
    "/api/conversations/{id}/messages",
    "/api/assistant/messages/{id}/feedback",
  ]) {
    assert.ok(document.paths[path], path);
  }
});

test("hatalı parola ve eksik oturum reddedilir", async () => {
  const saved = token;
  token = "";
  const denied = await api("/api/profile");
  assert.equal(denied.status, 401);
  token = saved;
  const wrong = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "deniz.yilmaz@ornek-kurum.com",
      password: "yanlis",
    }),
  });
  assert.equal(wrong.status, 401);
});

test("özet mevcut taleplerden hesaplanır", async () => {
  const summary = await api("/api/requests/summary");
  assert.equal(summary.status, 200);
  assert.equal(summary.body?.open, 6);
  assert.equal(summary.body?.waiting, 1);
  assert.equal(summary.body?.completed, 4);
  const recent = summary.body?.recent as { number: string }[];
  assert.deepEqual(
    recent.map((item) => item.number),
    ["DST-2026-1042", "DST-2026-1041", "DST-2026-1038", "DST-2026-1032"],
  );
});

test("talep araması Türkçe harf duyarsız çalışır", async () => {
  const found = await api("/api/requests?q=YILLIK");
  const requests = found.body?.requests as { number: string }[];
  assert.deepEqual(
    requests.map((item) => item.number),
    ["DST-2026-1027"],
  );
});

test("geçerli talep bir kez oluşur ve mesaj son güncellemeyi yeniler", async () => {
  const payload = {
    category: "Bilgi Teknolojileri",
    subcategory: "VPN ve Uzaktan Erişim",
    subject: "Test VPN kaydı",
    description: "Bağlantı kurulmuyor",
    priority: "Yüksek",
    status: "Çözüldü",
    clientRequestId: "istemci-1",
    assistantContext: "VPN sorusu",
    attachments: [{ name: "ekran.png", mimeType: "image/png", sizeBytes: 1200 }],
  };
  const created = await api("/api/requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  assert.equal(created.status, 201);
  const request = created.body as {
    id: number;
    number: string;
    status: string;
    team: string;
    contentStored: boolean;
    attachments: { name: string; mimeType: string; sizeBytes: number }[];
    timeline: { label: string }[];
    messages: unknown[];
  };
  assert.equal(request.number, "DST-2026-1043");
  assert.equal(request.status, "Yeni");
  assert.equal(request.team, "BT Destek Ekibi");
  assert.equal(request.contentStored, false);
  assert.equal(request.attachments[0]?.name, "ekran.png");
  assert.deepEqual(
    request.timeline.map((item) => item.label),
    ["Talep oluşturuldu"],
  );
  assert.equal(request.messages.length, 0);

  const duplicate = await api("/api/requests", {
    method: "POST",
    body: JSON.stringify({ ...payload, subject: "İkinci konu" }),
  });
  assert.equal(duplicate.status, 200);
  assert.equal((duplicate.body as { id: number; subject: string }).id, request.id);
  assert.equal((duplicate.body as { subject: string }).subject, "Test VPN kaydı");

  const rejected = await api("/api/requests", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      clientRequestId: "istemci-2",
      attachments: [{ name: "not.exe", mimeType: "application/octet-stream", sizeBytes: 10 }],
    }),
  });
  assert.equal(rejected.status, 400);

  const updatedAt = (created.body as { updatedAt: string }).updatedAt;
  const messaged = await api(`/api/requests/${request.id}/messages`, {
    method: "POST",
    body: JSON.stringify({ text: "Windows 11 kullanıyorum." }),
  });
  assert.equal(messaged.status, 201);
  const next = messaged.body as {
    status: string;
    updatedAt: string;
    messages: { role: string; text: string }[];
    timeline: { label: string; createdAt: string }[];
  };
  assert.equal(next.status, "Yeni");
  assert.notEqual(next.updatedAt, updatedAt);
  assert.equal(next.messages.length, 1);
  assert.equal(next.messages[0]?.role, "employee");
  assert.equal(next.timeline.at(-1)?.label, "Mesaj gönderildi");
  assert.equal(next.timeline.at(-1)?.createdAt, next.updatedAt);

  const notes = await api("/api/notifications");
  const notifications = notes.body?.notifications as { title: string; text: string; read: boolean }[];
  assert.equal(notifications[0]?.title, "Talebiniz oluşturuldu");
  assert.match(notifications[0]?.text ?? "", /DST-2026-1043/);
  assert.equal(notes.body?.unread, 3);
});

test("bilinmeyen talep 404 döner", async () => {
  const missing = await api("/api/requests/9999");
  assert.equal(missing.status, 404);
});

test("asistan yanıtı kaydedilir ve değerlendirilir", async () => {
  const created = await api("/api/conversations", {
    method: "POST",
    body: JSON.stringify({}),
  });
  assert.equal(created.status, 201);
  const id = (created.body as { id: number }).id;
  const answer = await api(`/api/conversations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ text: "VPN bağlantısını nasıl kurarım?" }),
  });
  assert.equal(answer.status, 201);
  const payload = answer.body as {
    userMessage: { source: unknown; sources: unknown[]; answerMode: unknown };
    assistantMessage: {
      id: number;
      answerMode: string;
      text: string;
      source: { id: string; demo: boolean; documentId: string; category: string; body?: string } | null;
      sources: { id: string; body?: string }[];
    };
  };
  const assistant = payload.assistantMessage;
  assert.equal(payload.userMessage.answerMode, null);
  assert.deepEqual(payload.userMessage.sources, []);
  assert.equal(payload.userMessage.source, null);
  assert.equal(assistant.answerMode, "quote");
  assert.equal(assistant.source?.id, "vpn");
  assert.equal(assistant.source?.demo, true);
  assert.equal(assistant.source?.documentId, "vpn-kurulum");
  assert.equal(assistant.source?.category, "Bilgi Teknolojileri");
  assert.equal(assistant.source?.body, undefined);
  assert.equal(assistant.sources[0]?.id, "vpn");
  assert.equal(assistant.sources[0]?.body, undefined);
  assert.match(assistant.text, /İlgili politikaya göre:/);
  assert.match(assistant.text, /çok faktörlü/);

  const unknown = await api(`/api/conversations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ text: "Hisse senedi edinebilir miyim?" }),
  });
  const missing = (
    unknown.body as {
      assistantMessage: { source: unknown; sources: unknown[]; text: string; answerMode: string };
    }
  ).assistantMessage;
  assert.equal(missing.answerMode, "no_source");
  assert.equal(missing.source, null);
  assert.deepEqual(missing.sources, []);
  assert.equal(
    missing.text,
    "Bu konuda doğrulanmış bir kaynak bulamadım. İstersen bir destek talebi oluşturabilirsin.",
  );

  const feedback = await api(`/api/assistant/messages/${assistant.id}/feedback`, {
    method: "PATCH",
    body: JSON.stringify({ helpful: true }),
  });
  assert.equal(feedback.status, 200);
  assert.equal((feedback.body as { helpful: boolean; answerMode: string }).helpful, true);
  assert.equal((feedback.body as { answerMode: string }).answerMode, "quote");

  const stored = await api(`/api/conversations/${id}`);
  assert.equal((stored.body as { messages: unknown[] }).messages.length, 4);

  const listed = await api("/api/sources");
  const sources = (listed.body as { sources: { id: string; body?: string; documentId: string }[] }).sources;
  assert.ok(sources.length >= 45);
  assert.equal(sources.find((item) => item.id === "vpn")?.body, undefined);
  assert.equal(sources.find((item) => item.id === "vpn")?.documentId, "vpn-kurulum");
  const detail = await api("/api/sources/vpn");
  assert.equal(detail.status, 200);
  const vpn = detail.body as { id: string; body: string; excerpt: string };
  assert.equal(vpn.id, "vpn");
  assert.match(vpn.body, /çok faktörlü/);
  assert.notEqual(vpn.body, vpn.excerpt);
});

test("çok konulu soru birden fazla kaynağı alıntıyla döndürür", async () => {
  const created = await api("/api/conversations", {
    method: "POST",
    body: JSON.stringify({}),
  });
  assert.equal(created.status, 201);
  const id = (created.body as { id: number }).id;
  const answer = await api(`/api/conversations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({
      text: "VPN çok faktörlü doğrulama ve yıllık izin başvurusu",
    }),
  });
  assert.equal(answer.status, 201);
  const assistant = (
    answer.body as {
      assistantMessage: {
        text: string;
        answerMode: string;
        source: { id: string } | null;
        sources: { id: string }[];
      };
    }
  ).assistantMessage;
  assert.equal(assistant.answerMode, "quote");
  assert.equal(assistant.source?.id, assistant.sources[0]?.id);
  const ids = assistant.sources.map((item) => item.id);
  assert.ok(ids.includes("vpn") || ids.includes("vpn-kurulum-sorun"));
  assert.ok(ids.includes("izin"));
  assert.match(assistant.text, /Diğer ilgili kaynaklar/);
  assert.doesNotMatch(assistant.text, /ayrı sorarsanız/);
});

test("metin sınırları kaydı büyütmez ve clientRequestId aynı talebi döndürür", async () => {
  const count = () =>
    Number(
      (db.prepare("SELECT COUNT(*) AS count FROM requests").get() as { count: number }).count,
    );
  const draft = (extra: Record<string, unknown>) => ({
    category: "İnsan Kaynakları",
    subcategory: "İzinler",
    subject: "Kısa konu",
    description: "Kısa açıklama",
    priority: "Normal",
    ...extra,
  });
  const send = (extra: Record<string, unknown>) =>
    api("/api/requests", { method: "POST", body: JSON.stringify(draft(extra)) });

  const before = count();
  const accepted = await send({ subject: "k".repeat(100), clientRequestId: "sinir-konu" });
  assert.equal(accepted.status, 201);
  const requestId = (accepted.body as { id: number }).id;
  const duplicate = await send({ subject: "başka konu", clientRequestId: "sinir-konu" });
  assert.equal(duplicate.status, 200);
  assert.equal((duplicate.body as { id: number; subject: string }).id, requestId);
  assert.equal((duplicate.body as { subject: string }).subject, "k".repeat(100));
  assert.equal(count(), before + 1);

  const longSubject = await send({ subject: "k".repeat(101), clientRequestId: "sinir-konu-uzun" });
  assert.equal(longSubject.status, 400);
  assert.equal((longSubject.body as { error: string }).error, "Konu en fazla 100 karakter olabilir.");
  assert.equal(count(), before + 1);

  const description = await send({
    description: "a".repeat(2000),
    clientRequestId: "sinir-aciklama",
  });
  assert.equal(description.status, 201);
  const longDescription = await send({
    description: "a".repeat(2001),
    clientRequestId: "sinir-aciklama-uzun",
  });
  assert.equal(longDescription.status, 400);
  assert.equal(
    (longDescription.body as { error: string }).error,
    "Açıklama en fazla 2000 karakter olabilir.",
  );

  const context = await send({
    assistantContext: "b".repeat(4000),
    clientRequestId: "sinir-baglam",
  });
  assert.equal(context.status, 201);
  const longContext = await send({
    assistantContext: "b".repeat(4001),
    clientRequestId: "sinir-baglam-uzun",
  });
  assert.equal(longContext.status, 400);
  assert.equal(
    (longContext.body as { error: string }).error,
    "Asistan bağlamı en fazla 4000 karakter olabilir.",
  );

  const file = await send({
    clientRequestId: "sinir-dosya",
    attachments: [{ name: "d".repeat(255), mimeType: "image/png", sizeBytes: 10 }],
  });
  assert.equal(file.status, 201);
  const longFile = await send({
    clientRequestId: "sinir-dosya-uzun",
    attachments: [{ name: "d".repeat(256), mimeType: "image/png", sizeBytes: 10 }],
  });
  assert.equal(longFile.status, 400);
  assert.equal((longFile.body as { error: string }).error, "Dosya adı en fazla 255 karakter olabilir.");
  assert.equal(count(), before + 4);

  const message = await api(`/api/requests/${requestId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text: "m".repeat(2000) }),
  });
  assert.equal(message.status, 201);
  const longMessage = await api(`/api/requests/${requestId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text: "m".repeat(2001) }),
  });
  assert.equal(longMessage.status, 400);
  assert.equal((longMessage.body as { error: string }).error, "Mesaj en fazla 2000 karakter olabilir.");

  const conversation = await api("/api/conversations", {
    method: "POST",
    body: JSON.stringify({}),
  });
  const conversationId = (conversation.body as { id: number }).id;
  const question = await api(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text: "s".repeat(1000) }),
  });
  assert.equal(question.status, 201);
  const longQuestion = await api(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text: "s".repeat(1001) }),
  });
  assert.equal(longQuestion.status, 400);
  assert.equal((longQuestion.body as { error: string }).error, "Soru en fazla 1000 karakter olabilir.");
});
});

test("CORS verilen origin ve varsayılan adresi kullanır", async () => {
  const corsDir = mkdtempSync(join(tmpdir(), "kda-cors-"));
  const database = openDatabase(join(corsDir, "app.sqlite"));
  const customServer = createApp(database, () => new Date(), "http://portal.test").listen(0);
  const defaultServer = createApp(database).listen(0);
  try {
    if (!customServer.listening) await once(customServer, "listening");
    if (!defaultServer.listening) await once(defaultServer, "listening");
    const customPort = (customServer.address() as AddressInfo).port;
    const defaultPort = (defaultServer.address() as AddressInfo).port;
    const allowed = await fetch(`http://127.0.0.1:${customPort}/api-docs.json`, {
      headers: { Origin: "http://portal.test" },
    });
    assert.equal(allowed.headers.get("access-control-allow-origin"), "http://portal.test");
    const fallback = await fetch(`http://127.0.0.1:${defaultPort}/api-docs.json`, {
      headers: { Origin: "http://localhost:5173" },
    });
    assert.equal(fallback.headers.get("access-control-allow-origin"), "http://localhost:5173");
  } finally {
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        customServer.close((error) => (error ? reject(error) : resolve()));
      }),
      new Promise<void>((resolve, reject) => {
        defaultServer.close((error) => (error ? reject(error) : resolve()));
      }),
    ]);
    database.close();
    rmSync(corsDir, { recursive: true, force: true });
  }
});
