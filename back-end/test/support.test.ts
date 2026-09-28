import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_SUPPORT_ACCOUNTS, REQUEST_STATUSES } from "../src/config/constants.js";
import { createApp } from "../src/app.js";
import { migrateAndSeed, openDatabase } from "../src/db/database.js";

const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const start = Date.parse("2026-09-25T12:00:00.000Z");

function demoAccount(email: string) {
  const account = DEMO_SUPPORT_ACCOUNTS.find((item) => item.email === email);
  if (!account) throw new Error(email);
  return account;
}

const ahmetAccount = demoAccount("ahmet.kaya@ornek-kurum.com");
const elifAccount = demoAccount("elif.demir@ornek-kurum.com");
const zeynepAccount = demoAccount("zeynep.arslan@ornek-kurum.com");

describe("destek personeli", { concurrency: false }, () => {
  const dir = mkdtempSync(join(tmpdir(), "kda-support-"));
  const db = openDatabase(join(dir, "app.sqlite"));
  migrateAndSeed(db);
  let nowMs = start;
  const app = createApp(db, () => new Date(nowMs));
  const server: Server = app.listen(0);
  let base = "";

  type Profile = { id: number; name: string; role: string; team: string | null };
  const tokens: Record<string, string> = {};
  const profiles: Record<string, Profile> = {};

  async function api(path: string, init: RequestInit = {}, bearer = "") {
    const headers = new Headers(init.headers);
    if (bearer) headers.set("authorization", `Bearer ${bearer}`);
    if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
    const response = await fetch(`${base}${path}`, { ...init, headers });
    const text = await response.text();
    const body = text ? (JSON.parse(text) as Record<string, unknown>) : undefined;
    return { status: response.status, body };
  }

  async function login(email: string) {
    const result = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: DEMO_PASSWORD }),
    });
    assert.equal(result.status, 200, email);
    const employee = result.body?.employee as Profile;
    tokens[email] = String(result.body?.token);
    profiles[email] = employee;
    return result;
  }

  function requestNumbers(body: Record<string, unknown> | undefined): string[] {
    const requests = body?.requests as { number: string }[];
    return requests.map((item) => item.number);
  }

  before(async () => {
    if (!server.listening) await once(server, "listening");
    const address = server.address() as AddressInfo;
    base = `http://127.0.0.1:${address.port}`;
    await login(DEMO_EMAIL);
    await login(ahmetAccount.email);
    await login(elifAccount.email);
    await login(zeynepAccount.email);
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  test("destek personeli girişte rol ve ekip bilgisini alır", async () => {
    const deniz = profiles[DEMO_EMAIL];
    assert.equal(deniz?.role, "employee");
    assert.equal(deniz?.team, null);
    const ahmet = profiles[ahmetAccount.email];
    assert.equal(ahmet?.role, "support");
    assert.equal(ahmet?.team, "BT Destek Ekibi");
    const zeynep = profiles[zeynepAccount.email];
    assert.equal(zeynep?.role, "support");
    assert.equal(zeynep?.team, "İnsan Kaynakları Ekibi");

    const profile = await api("/api/profile", {}, tokens[ahmetAccount.email]);
    assert.equal(profile.status, 200);
    assert.equal((profile.body as Profile).role, "support");
    assert.equal((profile.body as Profile).team, "BT Destek Ekibi");
    assert.equal((profile.body as Profile).name, "Ahmet Kaya");
  });

  test("çalışan destek uçlarına erişemez", async () => {
    // Write paths are not implemented in this revision. requireRole on /api/support
    // still rejects them before routing.
    const calls = [
      ["GET", "/api/support/summary"],
      ["GET", "/api/support/requests"],
      ["GET", "/api/support/requests/2"],
      ["GET", "/api/support/staff"],
      ["POST", "/api/support/requests/2/claim"],
      ["POST", "/api/support/requests/2/assign"],
      ["POST", "/api/support/requests/2/status"],
      ["POST", "/api/support/requests/2/messages"],
      ["POST", "/api/support/requests/2/notes"],
    ] as const;
    assert.equal(calls.length, 9);
    for (const [method, path] of calls) {
      const result = await api(path, { method }, tokens[DEMO_EMAIL]);
      assert.equal(result.status, 403, path);
      assert.equal(result.body?.error, "Bu işlem için yetkiniz yok.");
    }
  });

  test("destek personeli çalışan uçlarına erişemez", async () => {
    const token = tokens[ahmetAccount.email];
    const denied = [
      ["GET", "/api/requests"],
      ["GET", "/api/requests/summary"],
      ["POST", "/api/requests"],
      ["GET", "/api/conversations"],
      ["POST", "/api/conversations"],
      ["GET", "/api/notifications"],
      ["GET", "/api/sources"],
      ["PATCH", "/api/assistant/messages/1/feedback"],
    ] as const;
    for (const [method, path] of denied) {
      const result = await api(path, { method }, token);
      assert.equal(result.status, 403, path);
      assert.equal(result.body?.error, "Bu işlem için yetkiniz yok.");
    }
    const profile = await api("/api/profile", {}, token);
    assert.equal(profile.status, 200);
    const categories = await api("/api/categories", {}, token);
    assert.equal(categories.status, 200);
  });

  test("ekip kuyruğu yalnızca kendi ekibini oluşturulma sırasıyla listeler", async () => {
    const bt = await api("/api/support/requests", {}, tokens[ahmetAccount.email]);
    assert.equal(bt.status, 200);
    assert.deepEqual(requestNumbers(bt.body), [
      "DST-2026-1020",
      "DST-2026-1038",
      "DST-2026-1041",
    ]);
    const btRows = bt.body?.requests as { team: string }[];
    assert.ok(btRows.every((row) => row.team === "BT Destek Ekibi"));

    const ik = await api("/api/support/requests", {}, tokens[zeynepAccount.email]);
    assert.equal(ik.status, 200);
    assert.deepEqual(requestNumbers(ik.body), ["DST-2026-1003", "DST-2026-1042"]);
    const ikRows = ik.body?.requests as { team: string }[];
    assert.ok(ikRows.every((row) => row.team === "İnsan Kaynakları Ekibi"));
  });

  test("kuyruk süzgeçleri durum, öncelik, atanmamış, bana atananlar ve arama ile çalışır", async () => {
    const token = tokens[ahmetAccount.email];
    const list = (query: string) => api(`/api/support/requests?${query}`, {}, token);

    assert.deepEqual(requestNumbers((await list("status=Yeni")).body), ["DST-2026-1020"]);
    assert.deepEqual(requestNumbers((await list("priority=Normal")).body), ["DST-2026-1038"]);
    assert.deepEqual(requestNumbers((await list("unassigned=true")).body), ["DST-2026-1020"]);
    assert.deepEqual(requestNumbers((await list("queue=mine")).body), [
      "DST-2026-1038",
      "DST-2026-1041",
    ]);
    assert.deepEqual(requestNumbers((await list("queue=mine&unassigned=true")).body), []);
    assert.deepEqual(requestNumbers((await list("q=MONİTÖR")).body), ["DST-2026-1038"]);
    assert.deepEqual(requestNumbers((await list("q=Yılmaz")).body), [
      "DST-2026-1020",
      "DST-2026-1038",
      "DST-2026-1041",
    ]);
    assert.deepEqual(requestNumbers((await list("status=Kapatıldı&scope=open")).body), [
      "DST-2026-1008",
    ]);
    assert.deepEqual(requestNumbers((await list("scope=all")).body), [
      "DST-2026-1008",
      "DST-2026-1020",
      "DST-2026-1038",
      "DST-2026-1041",
    ]);

    const badQueue = await list("queue=nope");
    assert.equal(badQueue.status, 400);
    assert.equal(badQueue.body?.error, "Kuyruk team veya mine olmalıdır.");
    const badUnassigned = await list("unassigned=false");
    assert.equal(badUnassigned.status, 400);
    assert.equal(badUnassigned.body?.error, "unassigned yalnızca true olabilir.");
    const badStatus = await list("status=Bilinmeyen");
    assert.equal(badStatus.status, 400);
    assert.equal(badStatus.body?.error, "Bilinmeyen talep durumu.");
    const badPriority = await list("priority=Acil");
    assert.equal(badPriority.status, 400);
    assert.equal(badPriority.body?.error, "Bilinmeyen öncelik.");
  });

  test("başka ekibin talebi ve bilinmeyen talep 404 döner", async () => {
    const token = tokens[zeynepAccount.email];
    for (const path of ["/api/support/requests/2", "/api/support/requests/9999", "/api/support/requests/abc"]) {
      const result = await api(path, {}, token);
      assert.equal(result.status, 404, path);
      assert.equal(result.body?.error, "Talep bulunamadı.");
    }
  });

  test("destek detayı çalışan, atanan kişi, iç notlar ve tüm geçmişi içerir", async () => {
    const detail = await api("/api/support/requests/2", {}, tokens[ahmetAccount.email]);
    assert.equal(detail.status, 200);
    const body = detail.body as {
      number: string;
      contentStored: boolean;
      assistantContext: string | null;
      employee: { name: string; department: string; title: string; email: string };
      assignee: { id: number; name: string } | null;
      internalNotes: unknown[];
      messages: { role: string }[];
      timeline: {
        label: string;
        actor: string;
        detail: string | null;
        eventType: string;
        visibility: string;
        actorId: number | null;
        fromStatus: string | null;
        toStatus: string | null;
      }[];
    };
    assert.equal(body.number, "DST-2026-1041");
    assert.equal(body.contentStored, false);
    assert.equal(body.assistantContext, null);
    assert.equal(body.employee.name, "Deniz Yılmaz");
    assert.equal(body.employee.department, "Dijital Ürünler");
    assert.equal(body.employee.title, "Kıdemli Ürün Uzmanı");
    assert.equal(body.employee.email, DEMO_EMAIL);
    assert.deepEqual(body.assignee, { id: profiles[ahmetAccount.email]?.id, name: "Ahmet Kaya" });
    assert.deepEqual(body.internalNotes, []);
    assert.ok(body.messages.some((message) => message.role === "support"));
    assert.deepEqual(
      body.timeline.map((item) => item.eventType),
      ["created", "status_change", "assignment"],
    );
    assert.equal(body.timeline[0]?.visibility, "public");
    assert.equal(body.timeline[0]?.actorId, null);
    assert.equal(body.timeline[0]?.detail, null);
    assert.equal(body.timeline[1]?.eventType, "status_change");
    assert.equal(body.timeline[1]?.visibility, "public");
    assert.equal(body.timeline[1]?.toStatus, "Kullanıcıdan Bilgi Bekleniyor");
    assert.equal(body.timeline[1]?.detail, null);
    assert.equal(body.timeline[2]?.visibility, "internal");
    assert.equal(body.timeline[2]?.actor, "Sistem");
    assert.equal(body.timeline[2]?.actorId, null);
    assert.equal(body.timeline[2]?.label, "Talep atandı: Ahmet Kaya");
    assert.equal(body.timeline[2]?.fromStatus, null);
    assert.equal(body.timeline[2]?.toStatus, null);

    const employeeView = await api("/api/requests/2", {}, tokens[DEMO_EMAIL]);
    assert.equal(employeeView.status, 200);
    const employeeBody = employeeView.body as {
      timeline: { label: string; detail: string | null }[];
      internalNotes?: unknown;
    };
    assert.deepEqual(
      employeeBody.timeline.map((item) => item.label),
      ["Talep oluşturuldu", "Durum güncellendi: Kullanıcıdan Bilgi Bekleniyor"],
    );
    assert.ok(employeeBody.timeline.every((item) => item.detail === null));
    assert.equal("internalNotes" in employeeBody, false);
    assert.equal(JSON.stringify(employeeView.body).includes("Talep atandı"), false);
  });

  test("ekip arkadaşları listesi yalnızca aynı ekibi içerir", async () => {
    const bt = await api("/api/support/staff", {}, tokens[ahmetAccount.email]);
    assert.equal(bt.status, 200);
    const staff = bt.body?.staff as {
      name: string;
      title: string;
      team: string;
      openAssigned: number;
    }[];
    assert.deepEqual(
      staff.map((member) => member.name),
      ["Ahmet Kaya", "Elif Demir"],
    );
    assert.deepEqual(
      staff.map((member) => member.openAssigned),
      [2, 0],
    );
    assert.equal(staff[1]?.title, elifAccount.title);
    assert.ok(staff.every((member) => member.team === "BT Destek Ekibi"));

    const ik = await api("/api/support/staff", {}, tokens[zeynepAccount.email]);
    const ikStaff = ik.body?.staff as { name: string; openAssigned: number; team: string }[];
    assert.deepEqual(
      ikStaff.map((member) => member.name),
      ["Zeynep Arslan"],
    );
    assert.equal(ikStaff[0]?.openAssigned, 1);
    assert.equal(ikStaff[0]?.team, "İnsan Kaynakları Ekibi");
  });

  test("destek özeti ekip kayıtlarından hesaplanır", async () => {
    const summary = await api("/api/support/summary", {}, tokens[ahmetAccount.email]);
    assert.equal(summary.status, 200);
    assert.equal(summary.body?.team, "BT Destek Ekibi");
    assert.equal(summary.body?.open, 3);
    assert.equal(summary.body?.unassigned, 1);
    assert.equal(summary.body?.mine, 2);
    assert.equal(summary.body?.waiting, 1);
    const byStatus = summary.body?.byStatus as Record<string, number>;
    assert.deepEqual(byStatus, {
      Yeni: 1,
      İnceleniyor: 0,
      "Kullanıcıdan Bilgi Bekleniyor": 1,
      "Devam Ediyor": 1,
      Çözüldü: 0,
      Kapatıldı: 1,
    });
    for (const status of REQUEST_STATUSES) assert.equal(typeof byStatus[status], "number");

    const ik = await api("/api/support/summary", {}, tokens[zeynepAccount.email]);
    assert.equal(ik.body?.open, 2);
    assert.equal(ik.body?.unassigned, 1);
    assert.equal(ik.body?.mine, 1);
    assert.equal(ik.body?.waiting, 0);
    assert.equal((ik.body?.byStatus as Record<string, number>).İnceleniyor, 2);
    assert.equal((ik.body?.byStatus as Record<string, number>).Kapatıldı, 1);
  });

  test("oturum süresi enjekte edilen saate göre dolar", async () => {
    const token = tokens[ahmetAccount.email];
    try {
      const alive = await api("/api/profile", {}, token);
      assert.equal(alive.status, 200);
      nowMs = start + SESSION_MS + 1000;
      const expired = await api("/api/profile", {}, token);
      assert.equal(expired.status, 401);
      assert.equal(expired.body?.error, "Oturum geçersiz veya süresi dolmuş.");
    } finally {
      nowMs = start;
    }
    const restored = await api("/api/profile", {}, token);
    assert.equal(restored.status, 200);
  });

  test("eski geçmiş kayıtları public durum kaydı olarak sınıflanır", () => {
    const rows = db
      .prepare(
        `SELECT r.status,
          (
            SELECT to_status FROM request_timeline
            WHERE request_id = r.id AND event_type = 'status_change'
            ORDER BY id DESC LIMIT 1
          ) AS to_status,
          (
            SELECT visibility FROM request_timeline
            WHERE request_id = r.id AND event_type = 'status_change'
            ORDER BY id DESC LIMIT 1
          ) AS visibility
         FROM requests r`,
      )
      .all() as { status: string; to_status: string | null; visibility: string | null }[];
    assert.equal(rows.length, 10);
    for (const row of rows) {
      assert.equal(row.to_status, row.status);
      assert.equal(row.visibility, "public");
    }
    const created = db
      .prepare(
        `SELECT COUNT(*) AS count FROM request_timeline
         WHERE event_type = 'created' AND visibility = 'public'`,
      )
      .get() as { count: number };
    assert.equal(Number(created.count), 10);
  });

  test("swagger destek uçlarını listeler", async () => {
    const spec = await fetch(`${base}/api-docs.json`);
    assert.equal(spec.status, 200);
    const document = (await spec.json()) as { paths: Record<string, unknown> };
    for (const path of [
      "/api/support/summary",
      "/api/support/requests",
      "/api/support/requests/{id}",
      "/api/support/staff",
    ]) {
      assert.ok(document.paths[path], path);
    }
  });
});
