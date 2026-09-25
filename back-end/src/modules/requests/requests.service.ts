import type { DatabaseSync } from "node:sqlite";
import {
  ATTACHMENT_MIME_TYPES,
  CATEGORIES,
  CLOSED_STATUSES,
  MAX_ASSISTANT_CONTEXT_LENGTH,
  MAX_ATTACHMENT_BYTES,
  MAX_DESCRIPTION_LENGTH,
  MAX_FILE_NAME_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_SUBJECT_LENGTH,
  OPEN_STATUSES,
  PRIORITIES,
  REQUEST_STATUSES,
  teamFor,
  type Priority,
  type RequestStatus,
} from "../../config/constants.js";
import { insertedId, transaction } from "../../db/sql.js";
import { HttpError, includesTr, isRecord, limitText } from "../../shared/http.js";
import type { Employee, Now } from "../../shared/types.js";

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

export type AttachmentInput = {
  name: string;
  mimeType: string;
  sizeBytes: number;
};

export type CreateRequestInput = {
  category: string;
  subcategory: string;
  subject: string;
  description: string;
  priority: Priority;
  attachments: AttachmentInput[];
  assistantContext: string | null;
  clientRequestId: string | null;
};

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
  if (filter.scope && !["all", "open", "closed"].includes(filter.scope)) {
    throw new HttpError(400, "Kapsam all, open veya closed olmalıdır.");
  }
  if (filter.status && !REQUEST_STATUSES.includes(filter.status as RequestStatus)) {
    throw new HttpError(400, "Bilinmeyen talep durumu.");
  }
  if (filter.category && !(filter.category in CATEGORIES)) {
    throw new HttpError(400, "Bilinmeyen kategori.");
  }
  const rows = db
    .prepare(
      `SELECT * FROM requests WHERE employee_id = ?
       ORDER BY updated_at DESC, id DESC`,
    )
    .all(employeeId) as RequestRow[];
  return rows
    .filter((row) => {
      if (filter.status && row.status !== filter.status) return false;
      if (filter.category && row.category !== filter.category) return false;
      if (filter.scope === "open" && !openStatuses.has(row.status)) return false;
      if (filter.scope === "closed" && !closedStatuses.has(row.status)) return false;
      if (filter.q && !includesTr(`${row.number} ${row.subject}`, filter.q)) return false;
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
  if (!isRecord(body)) throw new HttpError(400, "Talep bilgileri eksik.");
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const subcategory = typeof body.subcategory === "string" ? body.subcategory.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const priority = typeof body.priority === "string" ? body.priority.trim() : "";
  if (!category || !subcategory || !subject || !description || !priority) {
    throw new HttpError(
      400,
      "Kategori, alt kategori, konu, açıklama ve öncelik zorunludur.",
    );
  }
  const subcategories = CATEGORIES[category];
  if (!subcategories) throw new HttpError(400, "Bilinmeyen kategori.");
  if (!subcategories.includes(subcategory)) {
    throw new HttpError(400, "Alt kategori seçilen kategoriye ait değil.");
  }
  if (!PRIORITIES.includes(priority as Priority)) {
    throw new HttpError(400, "Öncelik Düşük, Normal veya Yüksek olmalıdır.");
  }
  limitText(subject, MAX_SUBJECT_LENGTH, "Konu");
  limitText(description, MAX_DESCRIPTION_LENGTH, "Açıklama");
  const attachments = parseAttachments(body.attachments);
  const assistantContext =
    typeof body.assistantContext === "string" && body.assistantContext.trim()
      ? limitText(body.assistantContext.trim(), MAX_ASSISTANT_CONTEXT_LENGTH, "Asistan bağlamı")
      : null;
  let clientRequestId: string | null = null;
  if (body.clientRequestId !== undefined && body.clientRequestId !== null) {
    if (typeof body.clientRequestId !== "string" || !body.clientRequestId.trim()) {
      throw new HttpError(400, "clientRequestId metin olmalıdır.");
    }
    clientRequestId = body.clientRequestId.trim();
    if (clientRequestId.length > 100) {
      throw new HttpError(400, "clientRequestId en fazla 100 karakter olabilir.");
    }
  }
  return {
    category,
    subcategory,
    subject,
    description,
    priority: priority as Priority,
    attachments,
    assistantContext,
    clientRequestId,
  };
}

function parseAttachments(value: unknown): AttachmentInput[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new HttpError(400, "Ekler liste olmalıdır.");
  return value.map((item) => {
    if (!isRecord(item)) throw new HttpError(400, "Ek bilgisi eksik.");
    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (name) limitText(name, MAX_FILE_NAME_LENGTH, "Dosya adı");
    const mimeType = typeof item.mimeType === "string" ? item.mimeType : "";
    const sizeBytes = item.sizeBytes;
    const allowed = ATTACHMENT_MIME_TYPES.includes(
      mimeType as (typeof ATTACHMENT_MIME_TYPES)[number],
    );
    if (
      !name ||
      !allowed ||
      typeof sizeBytes !== "number" ||
      !Number.isInteger(sizeBytes) ||
      sizeBytes < 0 ||
      sizeBytes > MAX_ATTACHMENT_BYTES
    ) {
      throw new HttpError(
        400,
        "Dosyalar PDF, PNG veya JPG olmalı ve 5 MB sınırını aşmamalıdır.",
      );
    }
    return { name, mimeType, sizeBytes };
  });
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
  text: string,
  now: Now,
) {
  const message = text.trim();
  if (!message) throw new HttpError(400, "Mesaj boş olamaz.");
  limitText(message, MAX_MESSAGE_LENGTH, "Mesaj");
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
