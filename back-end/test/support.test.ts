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
import { SCHEMA, migrateAndSeed, openDatabase } from "../src/db/database.js";
import { runMigrations } from "../src/db/migrations.js";
import { seedIfEmpty } from "../src/db/seed.js";
import { findEmployeeByEmail } from "../src/modules/auth/auth.service.js";
import { addRequestMessage, createRequest } from "../src/modules/requests/requests.service.js";

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

  function tick() {
    nowMs += 1000;
  }

  type SupportDetail = {
    id: number;
    number: string;
    status: string;
    team: string;
    updatedAt: string;
    assignee: { id: number; name: string } | null;
    messages: { author: string; role: string; text: string }[];
    timeline: {
      id: number;
      label: string;
      actor: string;
      detail: string | null;
      eventType: string;
      visibility: string;
      actorId: number | null;
      fromStatus: string | null;
      toStatus: string | null;
    }[];
    internalNotes: { text: string }[];
  };

  type EmployeeNotice = {
    id: number;
    title: string;
    text: string;
    read: boolean;
    requestId: number | null;
  };

  async function supportDetail(id: number, email: string) {
    const result = await api(`/api/support/requests/${id}`, {}, tokens[email] ?? "");
    assert.equal(result.status, 200, String(id));
    return result.body as SupportDetail;
  }

  async function employeeNotifications() {
    const result = await api("/api/notifications", {}, tokens[DEMO_EMAIL] ?? "");
    assert.equal(result.status, 200);
    return {
      unread: Number(result.body?.unread),
      notifications: result.body?.notifications as EmployeeNotice[],
    };
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
    const badScope = await list("scope=nope");
    assert.equal(badScope.status, 400);
    assert.equal(badScope.body?.error, "Kapsam all, open veya closed olmalıdır.");
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
      "/api/support/requests/{id}/claim",
      "/api/support/requests/{id}/assign",
      "/api/support/requests/{id}/status",
      "/api/support/requests/{id}/messages",
      "/api/support/requests/{id}/notes",
    ]) {
      assert.ok(document.paths[path], path);
    }
  });

  test("personel atanmamış talebi üstlenir; ikinci üstlenme 409 döner", async () => {
    const token = tokens[ahmetAccount.email] ?? "";
    tick();
    const claimed = await api("/api/support/requests/6/claim", { method: "POST" }, token);
    assert.equal(claimed.status, 200);
    const body = claimed.body as SupportDetail;
    assert.equal(body.assignee?.name, "Ahmet Kaya");
    assert.equal(body.assignee?.id, profiles[ahmetAccount.email]?.id);
    const claimRow = body.timeline.find((item) => item.label === "Talep üstlenildi");
    assert.ok(claimRow);
    assert.equal(claimRow.eventType, "assignment");
    assert.equal(claimRow.visibility, "internal");
    assert.equal(claimRow.actor, "Ahmet Kaya");
    assert.equal(claimRow.actorId, profiles[ahmetAccount.email]?.id);

    const again = await api("/api/support/requests/6/claim", { method: "POST" }, token);
    assert.equal(again.status, 409);
    assert.equal(again.body?.error, "Talep zaten size atanmış.");

    const employeeView = await api("/api/requests/6", {}, tokens[DEMO_EMAIL] ?? "");
    assert.equal(employeeView.status, 200);
    assert.equal(JSON.stringify(employeeView.body).includes("Talep üstlenildi"), false);
  });

  test("talep yalnızca aynı ekipteki destek personeline atanır", async () => {
    const token = tokens[ahmetAccount.email] ?? "";
    const current = await supportDetail(6, ahmetAccount.email);
    const assign = (assigneeId: number) =>
      api(
        "/api/support/requests/6/assign",
        {
          method: "POST",
          body: JSON.stringify({ assigneeId, expectedUpdatedAt: current.updatedAt }),
        },
        token,
      );
    for (const assigneeId of [profiles[zeynepAccount.email]?.id, profiles[DEMO_EMAIL]?.id, 9999]) {
      const denied = await assign(Number(assigneeId));
      assert.equal(denied.status, 400, String(assigneeId));
      assert.equal(denied.body?.error, "Talep yalnızca aynı ekipteki destek personeline atanabilir.");
    }
    tick();
    const assigned = await assign(Number(profiles[elifAccount.email]?.id));
    assert.equal(assigned.status, 200);
    const body = assigned.body as SupportDetail;
    assert.equal(body.assignee?.name, "Elif Demir");
    const row = body.timeline.find((item) => item.label === "Talep atandı: Elif Demir");
    assert.ok(row);
    assert.equal(row.eventType, "assignment");
    assert.equal(row.visibility, "internal");
    assert.equal(row.actorId, profiles[ahmetAccount.email]?.id);
  });

  test("eski expectedUpdatedAt ile atama ve durum değişikliği 409 döner", async () => {
    const token = tokens[ahmetAccount.email] ?? "";
    const before = await supportDetail(3, ahmetAccount.email);
    tick();
    const moved = await api(
      "/api/support/requests/3/status",
      {
        method: "POST",
        body: JSON.stringify({ status: "İnceleniyor", expectedUpdatedAt: before.updatedAt }),
      },
      token,
    );
    assert.equal(moved.status, 200);
    const stale = before.updatedAt;
    const assign = await api(
      "/api/support/requests/3/assign",
      {
        method: "POST",
        body: JSON.stringify({
          assigneeId: profiles[elifAccount.email]?.id,
          expectedUpdatedAt: stale,
        }),
      },
      token,
    );
    assert.equal(assign.status, 409);
    assert.equal(
      assign.body?.error,
      "Talep siz işlem yaparken güncellendi. Güncel hâlini görüntüleyip tekrar deneyin.",
    );
    const status = await api(
      "/api/support/requests/3/status",
      {
        method: "POST",
        body: JSON.stringify({ status: "Çözüldü", expectedUpdatedAt: stale }),
      },
      token,
    );
    assert.equal(status.status, 409);
    assert.equal(
      status.body?.error,
      "Talep siz işlem yaparken güncellendi. Güncel hâlini görüntüleyip tekrar deneyin.",
    );
  });

  test("atanmamış ya da başkasına atanmış talepte durum ve mesaj 409 döner", async () => {
    const unassigned = await supportDetail(10, zeynepAccount.email);
    assert.equal(unassigned.assignee, null);
    const zeynep = tokens[zeynepAccount.email] ?? "";
    const waitingStatus = await api(
      "/api/support/requests/10/status",
      {
        method: "POST",
        body: JSON.stringify({ status: "Devam Ediyor", expectedUpdatedAt: unassigned.updatedAt }),
      },
      zeynep,
    );
    assert.equal(waitingStatus.status, 409);
    assert.equal(
      waitingStatus.body?.error,
      "Bu işlem yalnızca talebe atanan personel tarafından yapılabilir.",
    );
    const waitingMessage = await api(
      "/api/support/requests/10/messages",
      { method: "POST", body: JSON.stringify({ text: "Ek bilgi" }) },
      zeynep,
    );
    assert.equal(waitingMessage.status, 409);
    assert.equal(
      waitingMessage.body?.error,
      "Bu işlem yalnızca talebe atanan personel tarafından yapılabilir.",
    );

    const others = await supportDetail(6, ahmetAccount.email);
    const ahmet = tokens[ahmetAccount.email] ?? "";
    const foreignStatus = await api(
      "/api/support/requests/6/status",
      {
        method: "POST",
        body: JSON.stringify({ status: "İnceleniyor", expectedUpdatedAt: others.updatedAt }),
      },
      ahmet,
    );
    assert.equal(foreignStatus.status, 409);
    assert.equal(
      foreignStatus.body?.error,
      "Bu işlem yalnızca talebe atanan personel tarafından yapılabilir.",
    );
    const foreignMessage = await api(
      "/api/support/requests/6/messages",
      { method: "POST", body: JSON.stringify({ text: "Ek bilgi" }) },
      ahmet,
    );
    assert.equal(foreignMessage.status, 409);
    assert.equal(
      foreignMessage.body?.error,
      "Bu işlem yalnızca talebe atanan personel tarafından yapılabilir.",
    );
  });

  test("geçerli durum geçişi kaydedilir, bildirim oluşur ve son durum kaydıyla uyumludur", async () => {
    const token = tokens[ahmetAccount.email] ?? "";
    const before = await supportDetail(3, ahmetAccount.email);
    assert.equal(before.status, "İnceleniyor");
    const notesBefore = await employeeNotifications();
    tick();
    const changed = await api(
      "/api/support/requests/3/status",
      {
        method: "POST",
        body: JSON.stringify({ status: "Çözüldü", expectedUpdatedAt: before.updatedAt }),
      },
      token,
    );
    assert.equal(changed.status, 200);
    const body = changed.body as SupportDetail;
    assert.equal(body.status, "Çözüldü");
    const last = body.timeline.filter((item) => item.eventType === "status_change").at(-1);
    assert.equal(last?.toStatus, body.status);
    assert.equal(last?.fromStatus, "İnceleniyor");
    assert.equal(last?.label, "Durum güncellendi: Çözüldü");
    assert.equal(last?.visibility, "public");
    assert.equal(last?.actor, "Ahmet Kaya");
    assert.equal(last?.actorId, profiles[ahmetAccount.email]?.id);
    assert.equal(last?.detail, null);

    const notesAfter = await employeeNotifications();
    const created = notesAfter.notifications.filter(
      (item) => !notesBefore.notifications.some((prev) => prev.id === item.id),
    );
    assert.equal(created.length, 1);
    assert.equal(created[0]?.title, "Talebiniz çözüldü");
    assert.equal(created[0]?.text, "DST-2026-1038 numaralı talebiniz çözüldü.");
    assert.equal(created[0]?.requestId, 3);
    assert.equal(created[0]?.read, false);

    const employeeView = await api("/api/requests/3", {}, tokens[DEMO_EMAIL] ?? "");
    const timeline = (employeeView.body as { timeline: { label: string; actor: string }[] }).timeline;
    assert.equal(timeline.at(-1)?.label, "Durum güncellendi: Çözüldü");
    assert.equal(timeline.at(-1)?.actor, "Ahmet Kaya");
  });

  test("geçersiz geçiş ve aynı duruma geçiş 409 döner", async () => {
    const elif = tokens[elifAccount.email] ?? "";
    const open = await supportDetail(6, elifAccount.email);
    assert.equal(open.status, "Yeni");
    const invalid = await api(
      "/api/support/requests/6/status",
      {
        method: "POST",
        body: JSON.stringify({ status: "Devam Ediyor", expectedUpdatedAt: open.updatedAt }),
      },
      elif,
    );
    assert.equal(invalid.status, 409);
    assert.equal(invalid.body?.error, `"Yeni" durumundan "Devam Ediyor" durumuna geçilemez.`);
    const same = await api(
      "/api/support/requests/6/status",
      {
        method: "POST",
        body: JSON.stringify({ status: "Yeni", expectedUpdatedAt: open.updatedAt }),
      },
      elif,
    );
    assert.equal(same.status, 409);
    assert.equal(same.body?.error, "Talep zaten bu durumda.");

    const closed = await supportDetail(9, ahmetAccount.email);
    assert.equal(closed.status, "Kapatıldı");
    const fromClosed = await api(
      "/api/support/requests/9/status",
      {
        method: "POST",
        body: JSON.stringify({ status: "İnceleniyor", expectedUpdatedAt: closed.updatedAt }),
      },
      tokens[ahmetAccount.email] ?? "",
    );
    assert.equal(fromClosed.status, 409);
    assert.equal(fromClosed.body?.error, "Kapatılmış talepte işlem yapılamaz.");
  });

  test("Kapatıldı için gerekçe zorunludur ve çalışana görünür", async () => {
    const elif = tokens[elifAccount.email] ?? "";
    const open = await supportDetail(6, elifAccount.email);
    const missing = await api(
      "/api/support/requests/6/status",
      {
        method: "POST",
        body: JSON.stringify({ status: "Kapatıldı", expectedUpdatedAt: open.updatedAt }),
      },
      elif,
    );
    assert.equal(missing.status, 400);
    assert.equal(missing.body?.error, "Kapatma gerekçesi zorunludur.");
    const tooLong = await api(
      "/api/support/requests/6/status",
      {
        method: "POST",
        body: JSON.stringify({
          status: "Kapatıldı",
          reason: "a".repeat(501),
          expectedUpdatedAt: open.updatedAt,
        }),
      },
      elif,
    );
    assert.equal(tooLong.status, 400);
    assert.equal(tooLong.body?.error, "Gerekçe en fazla 500 karakter olabilir.");

    const reason = "Yinelenen kayıt olduğu için kapatıldı.";
    tick();
    const closed = await api(
      "/api/support/requests/6/status",
      {
        method: "POST",
        body: JSON.stringify({ status: "Kapatıldı", reason, expectedUpdatedAt: open.updatedAt }),
      },
      elif,
    );
    assert.equal(closed.status, 200);
    const body = closed.body as SupportDetail;
    assert.equal(body.status, "Kapatıldı");
    const row = body.timeline.find((item) => item.label === "Durum güncellendi: Kapatıldı");
    assert.equal(row?.detail, reason);
    assert.equal(row?.visibility, "public");

    const employeeView = await api("/api/requests/6", {}, tokens[DEMO_EMAIL] ?? "");
    const timeline = (employeeView.body as { timeline: { label: string; detail: string | null }[] }).timeline;
    assert.equal(timeline.find((item) => item.label === "Durum güncellendi: Kapatıldı")?.detail, reason);
  });

  test("personel mesajı çalışana görünür ve bildirim oluşturur", async () => {
    const token = tokens[ahmetAccount.email] ?? "";
    const empty = await api(
      "/api/support/requests/2/messages",
      { method: "POST", body: JSON.stringify({ text: " " }) },
      token,
    );
    assert.equal(empty.status, 400);
    assert.equal(empty.body?.error, "Mesaj boş olamaz.");
    const long = await api(
      "/api/support/requests/2/messages",
      { method: "POST", body: JSON.stringify({ text: "a".repeat(2001) }) },
      token,
    );
    assert.equal(long.status, 400);
    assert.equal(long.body?.error, "Mesaj en fazla 2000 karakter olabilir.");

    const before = await employeeNotifications();
    tick();
    const text = "İşletim sistemi bilgisini aldık.";
    const sent = await api(
      "/api/support/requests/2/messages",
      { method: "POST", body: JSON.stringify({ text }) },
      token,
    );
    assert.equal(sent.status, 201);
    const body = sent.body as SupportDetail;
    assert.equal(body.status, "Kullanıcıdan Bilgi Bekleniyor");
    assert.equal(body.messages.at(-1)?.role, "support");
    assert.equal(body.messages.at(-1)?.author, "Ahmet Kaya");
    assert.equal(body.messages.at(-1)?.text, text);
    const timeline = body.timeline.find((item) => item.label === "Destek ekibi yanıt verdi");
    assert.equal(timeline?.eventType, "support_message");
    assert.equal(timeline?.visibility, "public");
    assert.equal(timeline?.actorId, profiles[ahmetAccount.email]?.id);

    const employeeView = await api("/api/requests/2", {}, tokens[DEMO_EMAIL] ?? "");
    const messages = (employeeView.body as { messages: { role: string; author: string; text: string }[] }).messages;
    assert.equal(messages.at(-1)?.text, text);
    assert.equal(messages.at(-1)?.role, "support");
    assert.equal(messages.at(-1)?.author, "Ahmet Kaya");

    const after = await employeeNotifications();
    const created = after.notifications.filter(
      (item) => !before.notifications.some((prev) => prev.id === item.id),
    );
    assert.equal(created.length, 1);
    assert.equal(created[0]?.title, "Destek ekibinden yeni mesaj");
    assert.equal(created[0]?.text, "DST-2026-1041 numaralı talebinize destek ekibinden yeni bir mesaj geldi.");
    assert.equal(created[0]?.requestId, 2);
  });

  test("iç not çalışana hiçbir şekilde görünmez", async () => {
    const before = await employeeNotifications();
    const detailBefore = await supportDetail(3, elifAccount.email);
    const noteText = "İç not: yedek lisans anahtarı doğrulandı.";
    tick();
    const added = await api(
      "/api/support/requests/3/notes",
      { method: "POST", body: JSON.stringify({ text: noteText }) },
      tokens[elifAccount.email] ?? "",
    );
    assert.equal(added.status, 201);
    const body = added.body as SupportDetail;
    assert.equal(body.updatedAt, detailBefore.updatedAt);
    assert.equal(body.internalNotes.some((note) => note.text === noteText), true);
    const internal = body.timeline.find((item) => item.label === "İç not eklendi");
    assert.equal(internal?.visibility, "internal");
    assert.equal(internal?.eventType, "internal_note");
    assert.equal(internal?.actor, "Elif Demir");

    const employeeView = await api("/api/requests/3", {}, tokens[DEMO_EMAIL] ?? "");
    const raw = JSON.stringify(employeeView.body);
    assert.equal(raw.includes(noteText), false);
    assert.equal(raw.includes("İç not eklendi"), false);
    const after = await employeeNotifications();
    assert.equal(after.notifications.length, before.notifications.length);
    assert.equal(after.unread, before.unread);
  });

  test("çalışan yanıtı bilgi bekleyen talebi İnceleniyor durumuna alır", async () => {
    const before = await employeeNotifications();
    const waiting = await api("/api/requests/2", {}, tokens[DEMO_EMAIL] ?? "");
    assert.equal((waiting.body as { status: string }).status, "Kullanıcıdan Bilgi Bekleniyor");
    tick();
    const replied = await api(
      "/api/requests/2/messages",
      { method: "POST", body: JSON.stringify({ text: "Windows 11 kullanıyorum." }) },
      tokens[DEMO_EMAIL] ?? "",
    );
    assert.equal(replied.status, 201);
    const body = replied.body as {
      status: string;
      timeline: { label: string; actor: string }[];
    };
    assert.equal(body.status, "İnceleniyor");
    const labels = body.timeline.map((item) => item.label);
    const messageIndex = labels.lastIndexOf("Mesaj gönderildi");
    const statusIndex = labels.lastIndexOf("Durum güncellendi: İnceleniyor");
    assert.equal(statusIndex, messageIndex + 1);
    assert.equal(body.timeline[statusIndex]?.actor, "Sistem");

    const support = await supportDetail(2, ahmetAccount.email);
    const statusRow = support.timeline.filter((item) => item.label === "Durum güncellendi: İnceleniyor").at(-1);
    const messageRow = support.timeline.filter((item) => item.label === "Mesaj gönderildi").at(-1);
    assert.ok(messageRow && statusRow);
    assert.ok(messageRow.id < statusRow.id);
    assert.equal(statusRow.eventType, "status_change");
    assert.equal(statusRow.actor, "Sistem");
    assert.equal(statusRow.actorId, null);
    assert.equal(statusRow.fromStatus, "Kullanıcıdan Bilgi Bekleniyor");
    assert.equal(statusRow.toStatus, "İnceleniyor");
    assert.equal(statusRow.visibility, "public");

    const after = await employeeNotifications();
    assert.equal(after.notifications.length, before.notifications.length);
    assert.equal(after.unread, before.unread);
  });

  test("kapatılmış talepte personel işlemleri 409 döner", async () => {
    const closed = await supportDetail(9, ahmetAccount.email);
    assert.equal(closed.status, "Kapatıldı");
    const token = tokens[ahmetAccount.email] ?? "";
    const calls = [
      ["/claim", { method: "POST" }],
      [
        "/assign",
        {
          method: "POST",
          body: JSON.stringify({
            assigneeId: profiles[elifAccount.email]?.id,
            expectedUpdatedAt: closed.updatedAt,
          }),
        },
      ],
      [
        "/status",
        {
          method: "POST",
          body: JSON.stringify({ status: "İnceleniyor", expectedUpdatedAt: closed.updatedAt }),
        },
      ],
      ["/messages", { method: "POST", body: JSON.stringify({ text: "Merhaba" }) }],
      ["/notes", { method: "POST", body: JSON.stringify({ text: "İç not" }) }],
    ] as const;
    for (const [path, init] of calls) {
      const result = await api(`/api/support/requests/9${path}`, init, token);
      assert.equal(result.status, 409, path);
      assert.equal(result.body?.error, "Kapatılmış talepte işlem yapılamaz.");
    }
  });

  test("çalışan talep oluştururken durum ve atama alanlarını değiştiremez", async () => {
    tick();
    const created = await api(
      "/api/requests",
      {
        method: "POST",
        body: JSON.stringify({
          category: "Bilgi Teknolojileri",
          subcategory: "Yazılım",
          subject: "Durum alanı yok sayılır",
          description: "Çalışan durum ve atama gönderemez",
          priority: "Normal",
          status: "Çözüldü",
          assigneeId: profiles[ahmetAccount.email]?.id,
          team: "İnsan Kaynakları Ekibi",
        }),
      },
      tokens[DEMO_EMAIL] ?? "",
    );
    assert.equal(created.status, 201);
    const body = created.body as { id: number; status: string; team: string; number: string };
    assert.equal(body.status, "Yeni");
    assert.equal(body.team, "BT Destek Ekibi");
    assert.equal(body.number, "DST-2026-1043");
    const support = await supportDetail(body.id, ahmetAccount.email);
    assert.equal(support.status, "Yeni");
    assert.equal(support.assignee, null);
    assert.equal(support.team, "BT Destek Ekibi");
  });

  test("kapatılmış talepte çalışan mesajı 409 döner", async () => {
    const denied = await api(
      "/api/requests/5/messages",
      { method: "POST", body: JSON.stringify({ text: "Kapatılmış talebe not" }) },
      tokens[DEMO_EMAIL] ?? "",
    );
    assert.equal(denied.status, 409);
    assert.equal(denied.body?.error, "Kapatılmış talebe mesaj eklenemez.");

    tick();
    const allowed = await api(
      "/api/requests/4/messages",
      { method: "POST", body: JSON.stringify({ text: "Çözülen talebe ek bilgi" }) },
      tokens[DEMO_EMAIL] ?? "",
    );
    assert.equal(allowed.status, 201);
    assert.equal((allowed.body as { status: string }).status, "Çözüldü");
  });

  test("eski veritabanı yükseltmesi mesaj geçmişini sınıflar", () => {
    const upgradeDir = mkdtempSync(join(tmpdir(), "kda-upgrade-"));
    const upgradeDb = openDatabase(join(upgradeDir, "old.sqlite"));
    try {
      upgradeDb.exec(SCHEMA);
      seedIfEmpty(upgradeDb);
      const version = upgradeDb.prepare("PRAGMA user_version").get() as { user_version: number };
      assert.equal(Number(version.user_version), 0);
      const target = upgradeDb
        .prepare("SELECT id FROM requests WHERE number = ?")
        .get("DST-2026-1041") as { id: number };
      upgradeDb
        .prepare(
          `INSERT INTO request_timeline (request_id, label, actor, created_at)
           VALUES (?, 'Mesaj gönderildi', 'Deniz Yılmaz', ?)`,
        )
        .run(target.id, "2026-09-22T12:00:00.000Z");
      runMigrations(upgradeDb);
      const classified = upgradeDb
        .prepare(
          `SELECT event_type, actor_id, visibility
           FROM request_timeline WHERE request_id = ? AND label = 'Mesaj gönderildi'`,
        )
        .get(target.id) as { event_type: string; actor_id: number | null; visibility: string };
      assert.equal(classified.event_type, "employee_message");
      assert.equal(classified.actor_id, null);
      assert.equal(classified.visibility, "public");
      const migrated = upgradeDb.prepare("PRAGMA user_version").get() as { user_version: number };
      assert.equal(Number(migrated.user_version), 2);
      runMigrations(upgradeDb);
      const again = upgradeDb.prepare("PRAGMA user_version").get() as { user_version: number };
      assert.equal(Number(again.user_version), 2);

      const deniz = findEmployeeByEmail(upgradeDb, DEMO_EMAIL);
      assert.ok(deniz);
      const created = createRequest(
        upgradeDb,
        deniz,
        {
          category: "Bilgi Teknolojileri",
          subcategory: "Yazılım",
          subject: "Yükseltme sonrası talep",
          description: "Yeni satır",
          priority: "Normal",
          attachments: [],
          assistantContext: null,
          clientRequestId: "upgrade-1",
        },
        () => new Date("2026-09-26T12:00:00.000Z"),
      );
      const createdRow = upgradeDb
        .prepare(
          `SELECT event_type, actor_id FROM request_timeline
           WHERE request_id = ? AND label = 'Talep oluşturuldu'`,
        )
        .get(created.request.id) as { event_type: string; actor_id: number | null };
      assert.equal(createdRow.event_type, "created");
      assert.equal(createdRow.actor_id, deniz.id);

      addRequestMessage(
        upgradeDb,
        deniz,
        created.request.id,
        { text: "Yeni mesaj" },
        () => new Date("2026-09-26T12:01:00.000Z"),
      );
      const messageRow = upgradeDb
        .prepare(
          `SELECT event_type, actor_id FROM request_timeline
           WHERE request_id = ? AND label = 'Mesaj gönderildi'`,
        )
        .get(created.request.id) as { event_type: string; actor_id: number | null };
      assert.equal(messageRow.event_type, "employee_message");
      assert.equal(messageRow.actor_id, deniz.id);
    } finally {
      upgradeDb.close();
      rmSync(upgradeDir, { recursive: true, force: true });
    }
  });

  test("başka ekibin talebinde yazma uçları 404 döner", async () => {
    const token = tokens[zeynepAccount.email] ?? "";
    const calls = [
      ["/claim", { method: "POST" }],
      [
        "/assign",
        {
          method: "POST",
          body: JSON.stringify({
            assigneeId: profiles[zeynepAccount.email]?.id,
            expectedUpdatedAt: "2026-09-25T12:00:00.000Z",
          }),
        },
      ],
      [
        "/status",
        {
          method: "POST",
          body: JSON.stringify({
            status: "İnceleniyor",
            expectedUpdatedAt: "2026-09-25T12:00:00.000Z",
          }),
        },
      ],
      ["/messages", { method: "POST", body: JSON.stringify({ text: "Merhaba" }) }],
      ["/notes", { method: "POST", body: JSON.stringify({ text: "Not" }) }],
    ] as const;
    for (const [path, init] of calls) {
      const result = await api(`/api/support/requests/6${path}`, init, token);
      assert.equal(result.status, 404, path);
      assert.equal(result.body?.error, "Talep bulunamadı.");
    }
  });

  test("başka personele atanmış talep üstlenilemez", async () => {
    const detail = await supportDetail(2, elifAccount.email);
    assert.equal(detail.assignee?.id, profiles[ahmetAccount.email]?.id);
    assert.notEqual(detail.status, "Kapatıldı");
    const result = await api(
      "/api/support/requests/2/claim",
      { method: "POST" },
      tokens[elifAccount.email] ?? "",
    );
    assert.equal(result.status, 409);
    assert.equal(result.body?.error, "Talep başka bir personele atanmış.");
  });

  test("aynı personele tekrar atama 409 döner", async () => {
    const detail = await supportDetail(2, ahmetAccount.email);
    const result = await api(
      "/api/support/requests/2/assign",
      {
        method: "POST",
        body: JSON.stringify({
          assigneeId: profiles[ahmetAccount.email]?.id,
          expectedUpdatedAt: detail.updatedAt,
        }),
      },
      tokens[ahmetAccount.email] ?? "",
    );
    assert.equal(result.status, 409);
    assert.equal(result.body?.error, "Talep zaten bu personele atanmış.");
  });
});
