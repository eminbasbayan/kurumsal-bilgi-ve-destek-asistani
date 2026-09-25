import type { DatabaseSync } from "node:sqlite";
import { replyToQuestion, type SourceRecord } from "./assistant.js";
import {
  ATTACHMENT_MIME_TYPES,
  CATEGORIES,
  CLOSED_STATUSES,
  DEFAULT_CONVERSATION_TITLE,
  MAX_ATTACHMENT_BYTES,
  OPEN_STATUSES,
  PRIORITIES,
  REQUEST_STATUSES,
  teamFor,
  type Priority,
  type RequestStatus,
} from "./config/constants.js";
import { HttpError, includesTr, isRecord } from "./shared/http.js";
import { insertedId, transaction } from "./sql.js";

export type Now = () => Date;

export type Employee = {
  id: number;
  name: string;
  initials: string;
  title: string;
  department: string;
  email: string;
  employeeNo: string;
  location: string;
};

type EmployeeRow = {
  id: number;
  name: string;
  initials: string;
  title: string;
  department: string;
  email: string;
  employee_no: string;
  location: string;
  password_hash?: string;
};

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

function employeeFrom(row: EmployeeRow): Employee {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    title: row.title,
    department: row.department,
    email: row.email,
    employeeNo: row.employee_no,
    location: row.location,
  };
}

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

export function findEmployeeByEmail(
  db: DatabaseSync,
  email: string,
): (Employee & { passwordHash: string }) | undefined {
  const row = db
    .prepare(
      `SELECT id, name, initials, title, department, email, employee_no, location, password_hash
       FROM employees WHERE email = ?`,
    )
    .get(email) as EmployeeRow | undefined;
  if (!row?.password_hash) return undefined;
  return { ...employeeFrom(row), passwordHash: row.password_hash };
}

export function findEmployeeById(
  db: DatabaseSync,
  id: number,
): Employee | undefined {
  const row = db
    .prepare(
      `SELECT id, name, initials, title, department, email, employee_no, location
       FROM employees WHERE id = ?`,
    )
    .get(id) as EmployeeRow | undefined;
  return row ? employeeFrom(row) : undefined;
}

export function createSession(
  db: DatabaseSync,
  employeeId: number,
  token: string,
  expiresAt: string,
): void {
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString());
  db.prepare(
    "INSERT INTO sessions (token, employee_id, expires_at) VALUES (?, ?, ?)",
  ).run(token, employeeId, expiresAt);
}

export function employeeForToken(
  db: DatabaseSync,
  token: string,
): Employee | undefined {
  const row = db
    .prepare(
      `SELECT e.id, e.name, e.initials, e.title, e.department, e.email, e.employee_no, e.location
       FROM sessions s
       JOIN employees e ON e.id = s.employee_id
       WHERE s.token = ? AND s.expires_at > ?`,
    )
    .get(token, new Date().toISOString()) as EmployeeRow | undefined;
  return row ? employeeFrom(row) : undefined;
}

export function deleteSession(db: DatabaseSync, token: string): void {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function listCategories() {
  return Object.entries(CATEGORIES).map(([name, subcategories]) => ({
    name,
    subcategories,
  }));
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
  if (
    filter.status &&
    !REQUEST_STATUSES.includes(filter.status as RequestStatus)
  ) {
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
      if (filter.q && !includesTr(`${row.number} ${row.subject}`, filter.q)) {
        return false;
      }
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
  if (!isRecord(body)) {
    throw new HttpError(400, "Talep bilgileri eksik.");
  }
  const category =
    typeof body.category === "string" ? body.category.trim() : "";
  const subcategory =
    typeof body.subcategory === "string" ? body.subcategory.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
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
  const attachments = parseAttachments(body.attachments);
  const assistantContext =
    typeof body.assistantContext === "string" && body.assistantContext.trim()
      ? body.assistantContext.trim()
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

export function listNotifications(db: DatabaseSync, employeeId: number) {
  const rows = db
    .prepare(
      `SELECT id, title, text, created_at, read, request_id
       FROM notifications WHERE employee_id = ?
       ORDER BY created_at DESC, id DESC`,
    )
    .all(employeeId) as {
    id: number;
    title: string;
    text: string;
    created_at: string;
    read: number;
    request_id: number | null;
  }[];
  const notifications = rows.map((row) => ({
    id: row.id,
    title: row.title,
    text: row.text,
    createdAt: row.created_at,
    read: row.read === 1,
    requestId: row.request_id,
  }));
  return {
    notifications,
    unread: notifications.filter((item) => !item.read).length,
  };
}

export function markNotificationRead(
  db: DatabaseSync,
  employeeId: number,
  id: number,
) {
  const row = db
    .prepare(
      `SELECT id FROM notifications WHERE id = ? AND employee_id = ?`,
    )
    .get(id, employeeId) as { id: number } | undefined;
  if (!row) throw new HttpError(404, "Bildirim bulunamadı.");
  db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(id);
  const updated = listNotifications(db, employeeId).notifications.find(
    (item) => item.id === id,
  );
  if (!updated) throw new HttpError(404, "Bildirim bulunamadı.");
  return updated;
}

export function markAllNotificationsRead(db: DatabaseSync, employeeId: number) {
  db.prepare("UPDATE notifications SET read = 1 WHERE employee_id = ?").run(
    employeeId,
  );
  return { unread: 0 };
}

function sourceFrom(row: {
  id: string;
  title: string;
  section: string;
  excerpt: string;
  updated_at: string;
}): SourceRecord & { demo: true } {
  return {
    id: row.id,
    title: row.title,
    section: row.section,
    excerpt: row.excerpt,
    updatedAt: row.updated_at,
    demo: true,
  };
}

export function listSources(db: DatabaseSync) {
  const rows = db
    .prepare(
      `SELECT id, title, section, excerpt, updated_at
       FROM source_documents ORDER BY rowid`,
    )
    .all() as {
    id: string;
    title: string;
    section: string;
    excerpt: string;
    updated_at: string;
  }[];
  return rows.map(sourceFrom);
}

export function getSource(db: DatabaseSync, id: string) {
  const row = db
    .prepare(
      `SELECT id, title, section, excerpt, updated_at
       FROM source_documents WHERE id = ?`,
    )
    .get(id) as
    | {
        id: string;
        title: string;
        section: string;
        excerpt: string;
        updated_at: string;
      }
    | undefined;
  if (!row) throw new HttpError(404, "Kaynak bulunamadı.");
  return sourceFrom(row);
}

type ConversationMessageRow = {
  id: number;
  conversation_id: number;
  role: "user" | "assistant";
  text: string;
  source_id: string | null;
  helpful: number | null;
  created_at: string;
};

function messageView(db: DatabaseSync, row: ConversationMessageRow) {
  return {
    id: row.id,
    role: row.role,
    text: row.text,
    createdAt: row.created_at,
    helpful: row.helpful === null ? null : row.helpful === 1,
    source: row.source_id ? getSource(db, row.source_id) : null,
  };
}

export function listConversations(db: DatabaseSync, employeeId: number) {
  const rows = db
    .prepare(
      `SELECT id, title, created_at, updated_at
       FROM conversations WHERE employee_id = ?
       ORDER BY updated_at DESC, id DESC`,
    )
    .all(employeeId) as {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
  }[];
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function createConversation(
  db: DatabaseSync,
  employeeId: number,
  title: string | undefined,
  now: Now,
) {
  const stamp = now().toISOString();
  const name = title?.trim() || DEFAULT_CONVERSATION_TITLE;
  const inserted = db
    .prepare(
      `INSERT INTO conversations (employee_id, title, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
    )
    .run(employeeId, name, stamp, stamp);
  return {
    id: insertedId(inserted),
    title: name,
    createdAt: stamp,
    updatedAt: stamp,
  };
}

export function getConversation(db: DatabaseSync, employeeId: number, id: number) {
  const row = db
    .prepare(
      `SELECT id, title, created_at, updated_at
       FROM conversations WHERE id = ? AND employee_id = ?`,
    )
    .get(id, employeeId) as
    | { id: number; title: string; created_at: string; updated_at: string }
    | undefined;
  if (!row) throw new HttpError(404, "Sohbet bulunamadı.");
  const messages = (
    db
      .prepare(
        `SELECT id, conversation_id, role, text, source_id, helpful, created_at
         FROM conversation_messages WHERE conversation_id = ? ORDER BY id`,
      )
      .all(row.id) as ConversationMessageRow[]
  ).map((item) => messageView(db, item));
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages,
  };
}

export function addConversationMessage(
  db: DatabaseSync,
  employeeId: number,
  conversationId: number,
  text: string,
  now: Now,
) {
  const question = text.trim();
  if (!question) throw new HttpError(400, "Soru boş olamaz.");
  return transaction(db, () => {
    const conversation = db
      .prepare(
        `SELECT id, title FROM conversations WHERE id = ? AND employee_id = ?`,
      )
      .get(conversationId, employeeId) as { id: number; title: string } | undefined;
    if (!conversation) throw new HttpError(404, "Sohbet bulunamadı.");
    const stamp = now().toISOString();
    const userInsert = db
      .prepare(
        `INSERT INTO conversation_messages
          (conversation_id, role, text, source_id, helpful, created_at)
         VALUES (?, 'user', ?, NULL, NULL, ?)`,
      )
      .run(conversation.id, question, stamp);
    const reply = replyToQuestion(question, listSources(db));
    const assistantInsert = db
      .prepare(
        `INSERT INTO conversation_messages
          (conversation_id, role, text, source_id, helpful, created_at)
         VALUES (?, 'assistant', ?, ?, NULL, ?)`,
      )
      .run(conversation.id, reply.text, reply.source?.id ?? null, stamp);
    const title =
      conversation.title === DEFAULT_CONVERSATION_TITLE
        ? question.slice(0, 80)
        : conversation.title;
    db.prepare(
      "UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?",
    ).run(title, stamp, conversation.id);
    const user = db
      .prepare(
        `SELECT id, conversation_id, role, text, source_id, helpful, created_at
         FROM conversation_messages WHERE id = ?`,
      )
      .get(insertedId(userInsert)) as ConversationMessageRow;
    const assistant = db
      .prepare(
        `SELECT id, conversation_id, role, text, source_id, helpful, created_at
         FROM conversation_messages WHERE id = ?`,
      )
      .get(insertedId(assistantInsert)) as ConversationMessageRow;
    return {
      userMessage: messageView(db, user),
      assistantMessage: messageView(db, assistant),
    };
  });
}

export function setMessageFeedback(
  db: DatabaseSync,
  employeeId: number,
  messageId: number,
  helpful: boolean,
) {
  const row = db
    .prepare(
      `SELECT m.id, m.role
       FROM conversation_messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE m.id = ? AND c.employee_id = ?`,
    )
    .get(messageId, employeeId) as { id: number; role: string } | undefined;
  if (!row) throw new HttpError(404, "Mesaj bulunamadı.");
  if (row.role !== "assistant") {
    throw new HttpError(400, "Yalnızca asistan yanıtı değerlendirilebilir.");
  }
  db.prepare("UPDATE conversation_messages SET helpful = ? WHERE id = ?").run(
    helpful ? 1 : 0,
    row.id,
  );
  const updated = db
    .prepare(
      `SELECT id, conversation_id, role, text, source_id, helpful, created_at
       FROM conversation_messages WHERE id = ?`,
    )
    .get(row.id) as ConversationMessageRow;
  return messageView(db, updated);
}
