import type { DatabaseSync } from "node:sqlite";
import {
  CLOSED_STATUSES,
  OPEN_STATUSES,
  teamFor,
  type Priority,
  type RequestStatus,
} from "../../config/constants.js";
import { insertedId, transaction } from "../../db/sql.js";
import { HttpError, includesTr } from "../../shared/http.js";
import { parseInput } from "../../shared/validate.js";
import type { Employee, Now } from "../../shared/types.js";
import {
  createRequestSchema,
  requestListFilterSchema,
  requestMessageSchema,
  type CreateRequestInput,
} from "./requests.schema.js";

type RequestRow = {
  id: number;
  employee_id: number;
  number: string;
  subject: string;
  description: string;
  category: string;
  subcategory: string;
  priority: Priority;
  status: RequestStatus;
  team: string;
  created_at: string;
  updated_at: string;
  assistant_context: string | null;
};

export type { CreateRequestInput };

const openStatuses = new Set<string>(OPEN_STATUSES);
const closedStatuses = new Set<string>(CLOSED_STATUSES);

function requestListItem(row: RequestRow) {
  return {
    id: row.id,
    number: row.number,
    subject: row.subject,
    description: row.description,
    category: row.category,
    subcategory: row.subcategory,
    priority: row.priority,
    status: row.status,
    team: row.team,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assistantContext: row.assistant_context,
  };
}

export function requestSummary(db: DatabaseSync, employeeId: number) {
  const rows = db
    .prepare("SELECT status FROM requests WHERE employee_id = ?")
    .all(employeeId) as { status: string }[];
  let open = 0;
  let waiting = 0;
  let completed = 0;
  for (const row of rows) {
    if (openStatuses.has(row.status)) open += 1;
    if (row.status === "Kullanıcıdan Bilgi Bekleniyor") waiting += 1;
    if (closedStatuses.has(row.status)) completed += 1;
  }
  const recent = (
    db
      .prepare(
        `SELECT * FROM requests WHERE employee_id = ?
         ORDER BY updated_at DESC, id DESC LIMIT 4`,
      )
      .all(employeeId) as RequestRow[]
  ).map(requestListItem);
  return { open, waiting, completed, recent };
}

export function listRequests(
  db: DatabaseSync,
  employeeId: number,
  filter: { q?: string; status?: string; category?: string; scope?: string },
) {
  const parsed = parseInput(requestListFilterSchema, filter, "Geçersiz süzgeç.");
  const rows = db
    .prepare(
      `SELECT * FROM requests WHERE employee_id = ?
       ORDER BY updated_at DESC, id DESC`,
    )
    .all(employeeId) as RequestRow[];
  return rows
    .filter((row) => {
      if (parsed.status && row.status !== parsed.status) return false;
      if (parsed.category && row.category !== parsed.category) return false;
      if (parsed.scope === "open" && !openStatuses.has(row.status)) return false;
      if (parsed.scope === "closed" && !closedStatuses.has(row.status)) return false;
      if (parsed.q && !includesTr(`${row.number} ${row.subject}`, parsed.q)) return false;
      return true;
    })
    .map(requestListItem);
}

function loadDetail(db: DatabaseSync, employeeId: number, id: number) {
  const row = db
    .prepare("SELECT * FROM requests WHERE id = ? AND employee_id = ?")
    .get(id, employeeId) as RequestRow | undefined;
  if (!row) throw new HttpError(404, "Talep bulunamadı.");
  const messages = db
    .prepare(
      `SELECT id, author, role, text, created_at
       FROM request_messages WHERE request_id = ? ORDER BY id`,
    )
    .all(row.id) as {
    id: number;
    author: string;
    role: "employee" | "support";
    text: string;
    created_at: string;
  }[];
  const timeline = db
    .prepare(
      `SELECT id, label, actor, created_at
       FROM request_timeline WHERE request_id = ? ORDER BY id`,
    )
    .all(row.id) as {
    id: number;
    label: string;
    actor: string;
    created_at: string;
  }[];
  const attachments = db
    .prepare(
      `SELECT id, file_name, mime_type, size_bytes
       FROM request_attachments WHERE request_id = ? ORDER BY id`,
    )
    .all(row.id) as {
    id: number;
    file_name: string;
    mime_type: string;
    size_bytes: number;
  }[];
  return {
    ...requestListItem(row),
    contentStored: false as const,
    messages: messages.map((item) => ({
      id: item.id,
      author: item.author,
      role: item.role,
      text: item.text,
      createdAt: item.created_at,
    })),
    timeline: timeline.map((item) => ({
      id: item.id,
      label: item.label,
      actor: item.actor,
      createdAt: item.created_at,
    })),
    attachments: attachments.map((item) => ({
      id: item.id,
      name: item.file_name,
      mimeType: item.mime_type,
      sizeBytes: item.size_bytes,
    })),
  };
}

export function getRequest(db: DatabaseSync, employeeId: number, id: number) {
  return loadDetail(db, employeeId, id);
}

export function parseCreateRequest(body: unknown): CreateRequestInput {
  return parseInput(createRequestSchema, body, "Talep bilgileri eksik.");
}

function nextRequestNumber(db: DatabaseSync, year: number): string {
  const prefix = `DST-${year}-`;
  const rows = db
    .prepare("SELECT number FROM requests WHERE number LIKE ?")
    .all(`${prefix}%`) as { number: string }[];
  let max = 1000;
  for (const row of rows) {
    if (!row.number.startsWith(prefix)) continue;
    const value = Number(row.number.slice(prefix.length));
    if (Number.isInteger(value) && value > max) max = value;
  }
  return `${prefix}${max + 1}`;
}

export function createRequest(
  db: DatabaseSync,
  employee: Employee,
  input: CreateRequestInput,
  now: Now,
) {
  return transaction(db, () => {
    if (input.clientRequestId) {
      const existing = db
        .prepare(
          `SELECT id FROM requests
           WHERE employee_id = ? AND client_request_id = ?`,
        )
        .get(employee.id, input.clientRequestId) as { id: number } | undefined;
      if (existing) {
        return { created: false, request: loadDetail(db, employee.id, existing.id) };
      }
    }
    const current = now();
    const stamp = current.toISOString();
    const number = nextRequestNumber(db, current.getFullYear());
    const team = teamFor(input.category);
    const inserted = db
      .prepare(
        `INSERT INTO requests (
          employee_id, number, subject, description, category, subcategory,
          priority, status, team, created_at, updated_at, assistant_context,
          client_request_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Yeni', ?, ?, ?, ?, ?)`,
      )
      .run(
        employee.id,
        number,
        input.subject,
        input.description,
        input.category,
        input.subcategory,
        input.priority,
        team,
        stamp,
        stamp,
        input.assistantContext,
        input.clientRequestId,
      );
    const id = insertedId(inserted);
    const insertAttachment = db.prepare(
      `INSERT INTO request_attachments (request_id, file_name, mime_type, size_bytes)
       VALUES (?, ?, ?, ?)`,
    );
    for (const file of input.attachments) {
      insertAttachment.run(id, file.name, file.mimeType, file.sizeBytes);
    }
    db.prepare(
      `INSERT INTO request_timeline (request_id, label, actor, created_at)
       VALUES (?, 'Talep oluşturuldu', ?, ?)`,
    ).run(id, employee.name, stamp);
    db.prepare(
      `INSERT INTO notifications
        (employee_id, title, text, created_at, read, request_id)
       VALUES (?, 'Talebiniz oluşturuldu', ?, ?, 0, ?)`,
    ).run(employee.id, `${number} numaralı talebiniz kaydedildi.`, stamp, id);
    return { created: true, request: loadDetail(db, employee.id, id) };
  });
}

export function addRequestMessage(
  db: DatabaseSync,
  employee: Employee,
  requestId: number,
  body: unknown,
  now: Now,
) {
  const { text: message } = parseInput(requestMessageSchema, body, "Mesaj boş olamaz.");
  return transaction(db, () => {
    const current = db
      .prepare("SELECT id, status FROM requests WHERE id = ? AND employee_id = ?")
      .get(requestId, employee.id) as { id: number; status: string } | undefined;
    if (!current) throw new HttpError(404, "Talep bulunamadı.");
    const stamp = now().toISOString();
    db.prepare("UPDATE requests SET updated_at = ? WHERE id = ?").run(stamp, current.id);
    db.prepare(
      `INSERT INTO request_messages (request_id, author, role, text, created_at)
       VALUES (?, ?, 'employee', ?, ?)`,
    ).run(current.id, employee.name, message, stamp);
    db.prepare(
      `INSERT INTO request_timeline (request_id, label, actor, created_at)
       VALUES (?, 'Mesaj gönderildi', ?, ?)`,
    ).run(current.id, employee.name, stamp);
    return loadDetail(db, employee.id, current.id);
  });
}
