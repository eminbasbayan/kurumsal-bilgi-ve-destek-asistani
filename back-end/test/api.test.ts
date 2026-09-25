import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { after, before, describe, test } from "node:test";
import type { Server } from "node:http";
import { replyToQuestion, type SourceRecord } from "../src/modules/assistant/reply.js";
import { createApp } from "../src/app.js";
import { migrateAndSeed, openDatabase } from "../src/db/database.js";

const sources: SourceRecord[] = [
  {
    id: "izin",
    title: "Çalışan İzin Prosedürü",
    section: "4.2 Yıllık İzin Kullanımı",
    excerpt: "Yıllık izin talepleri planlanan başlangıç tarihinden en az üç iş günü önce iletilir.",
    updatedAt: "2026-08-12",
  },
  {
    id: "vpn",
    title: "Uzaktan Erişim Rehberi",
    section: "3.1 VPN Bağlantısı",
    excerpt: "Kurumsal VPN bağlantısı için çok faktörlü kimlik doğrulama gerekir.",
    updatedAt: "2026-09-02",
  },
  {
    id: "bordro",
    title: "Bordro ve Yan Haklar Rehberi",
    section: "2.4 Bordro Görüntüleme",
    excerpt: "Aylık bordrolar takip eden ayın ilk iş gününde yayımlanır.",
    updatedAt: "2026-08-30",
  },
  {
    id: "masraf",
    title: "Masraf Yönetimi Prosedürü",
    section: "5.3 Belge Yükleme",
    excerpt: "Masraf belgeleri on iş günü içinde yüklenmelidir.",
    updatedAt: "2026-07-18",
  },
];

test("asistan bilinen konuları ilgili kaynağa bağlar", () => {
  const izin = replyToQuestion("Yıllık izin nasıl kullanılır?", sources);
  const vpn = replyToQuestion("VPN bağlantısını nasıl kurarım?", sources);
  const bordro = replyToQuestion("Bordroma nereden ulaşırım?", sources);
  const masraf = replyToQuestion("Masraf belgesi nasıl yüklenir?", sources);
  const both = replyToQuestion("vpn ve izin", sources);
  const unknown = replyToQuestion("Kantin menüsü", sources);

  assert.equal(izin.source?.id, "izin");
  assert.match(izin.text, /üç iş günü/);
  assert.equal(vpn.source?.id, "vpn");
  assert.match(vpn.text, /çok faktörlü/);
  assert.equal(bordro.source?.id, "bordro");
  assert.match(bordro.text, /ilk iş günü/);
  assert.equal(masraf.source?.id, "masraf");
  assert.match(masraf.text, /on iş günü/);
  assert.equal(both.source?.id, "vpn");
  assert.equal(unknown.source, undefined);
  assert.match(unknown.text, /destek talebi oluşturabilirsiniz/);
});

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
    assert.equal(Number(employees.count), 1);
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
  const assistant = (
    answer.body as { assistantMessage: { id: number; source: { id: string; demo: boolean } | null } }
  ).assistantMessage;
  assert.equal(assistant.source?.id, "vpn");
  assert.equal(assistant.source?.demo, true);

  const unknown = await api(`/api/conversations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ text: "Kantin menüsü" }),
  });
  const missing = (
    unknown.body as { assistantMessage: { source: unknown; text: string } }
  ).assistantMessage;
  assert.equal(missing.source, null);
  assert.match(missing.text, /destek talebi/);

  const feedback = await api(`/api/assistant/messages/${assistant.id}/feedback`, {
    method: "PATCH",
    body: JSON.stringify({ helpful: true }),
  });
  assert.equal(feedback.status, 200);
  assert.equal((feedback.body as { helpful: boolean }).helpful, true);

  const stored = await api(`/api/conversations/${id}`);
  assert.equal((stored.body as { messages: unknown[] }).messages.length, 4);
});
});
