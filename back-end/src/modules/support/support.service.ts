import type { DatabaseSync } from "node:sqlite";
import {
  CLOSED_STATUSES,
  OPEN_STATUSES,
  REQUEST_STATUSES,
  STATUS_TRANSITIONS,
  type Priority,
  type RequestStatus,
  type TimelineEventType,
} from "../../config/constants.js";
import { transaction } from "../../db/sql.js";
import { HttpError, includesTr } from "../../shared/http.js";
import { parseInput } from "../../shared/validate.js";
import type {
  Attachment,
  Employee,
  InternalNote,
  Now,
  PersonRef,
  RequestMessage,
  StaffMember,
  SupportRequestDetail,
  SupportRequestListItem,
  SupportSummary,
  SupportTimelineItem,
} from "../../shared/types.js";
import { requestMessageSchema } from "../requests/requests.schema.js";
import { insertNotification, insertTimeline } from "../requests/requests.service.js";
import {
  assignRequestSchema,
  noteSchema,
  statusChangeSchema,
  supportListFilterSchema,
} from "./support.schema.js";

type SupportRequestRow = {
  id: number;
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
  employee_id: number;
  employee_name: string;
  employee_department: string;
  employee_title: string;
  employee_email: string;
  assignee_id: number | null;
  assignee_name: string | null;
};

const openStatuses = new Set<string>(OPEN_STATUSES);
const closedStatuses = new Set<string>(CLOSED_STATUSES);

const requestSelect = `
  SELECT
    r.id, r.number, r.subject, r.description, r.category, r.subcategory,
    r.priority, r.status, r.team, r.created_at, r.updated_at, r.assistant_context,
    e.id AS employee_id, e.name AS employee_name, e.department AS employee_department,
    e.title AS employee_title, e.email AS employee_email,
    a.id AS assignee_id, a.name AS assignee_name
  FROM requests r
  JOIN employees e ON e.id = r.employee_id
  LEFT JOIN employees a ON a.id = r.assignee_id
`;

function teamOf(employee: Employee): string {
  if (employee.role !== "support" || !employee.team) {
    throw new HttpError(403, "Bu işlem için yetkiniz yok.");
  }
  return employee.team;
}

function assigneeOf(row: SupportRequestRow): PersonRef | null {
  if (row.assignee_id === null || row.assignee_name === null) return null;
  return { id: row.assignee_id, name: row.assignee_name };
}

function listItem(row: SupportRequestRow): SupportRequestListItem {
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
    employee: {
      id: row.employee_id,
      name: row.employee_name,
      department: row.employee_department,
    },
    assignee: assigneeOf(row),
  };
}

export function supportSummary(db: DatabaseSync, employee: Employee): SupportSummary {
  const team = teamOf(employee);
  const rows = db
    .prepare("SELECT status, assignee_id FROM requests WHERE team = ?")
    .all(team) as { status: RequestStatus; assignee_id: number | null }[];
  const byStatus = {} as Record<RequestStatus, number>;
  for (const status of REQUEST_STATUSES) byStatus[status] = 0;
  let open = 0;
  let unassigned = 0;
  let mine = 0;
  let waiting = 0;
  for (const row of rows) {
    byStatus[row.status] += 1;
    const isOpen = openStatuses.has(row.status);
    if (isOpen) open += 1;
    if (isOpen && row.assignee_id === null) unassigned += 1;
    if (isOpen && row.assignee_id === employee.id) mine += 1;
    if (row.status === "Kullanıcıdan Bilgi Bekleniyor") waiting += 1;
  }
  return { team, open, unassigned, mine, waiting, byStatus };
}

export function listSupportRequests(
  db: DatabaseSync,
  employee: Employee,
  filter: {
    queue?: string;
    scope?: string;
    status?: string;
    priority?: string;
    unassigned?: string;
    q?: string;
  },
): SupportRequestListItem[] {
  const team = teamOf(employee);
  const parsed = parseInput(supportListFilterSchema, filter, "Geçersiz süzgeç.");
  const queue = parsed.queue ?? "team";
  const scope = parsed.status ? undefined : (parsed.scope ?? "open");
  const rows = db
    .prepare(`${requestSelect} WHERE r.team = ? ORDER BY r.created_at ASC, r.id ASC`)
    .all(team) as SupportRequestRow[];
  return rows
    .filter((row) => {
      if (queue === "mine" && row.assignee_id !== employee.id) return false;
      if (parsed.status && row.status !== parsed.status) return false;
      if (scope === "open" && !openStatuses.has(row.status)) return false;
      if (scope === "closed" && !closedStatuses.has(row.status)) return false;
      if (parsed.priority && row.priority !== parsed.priority) return false;
      if (parsed.unassigned === "true" && row.assignee_id !== null) return false;
      if (
        parsed.q &&
        !includesTr(`${row.number} ${row.subject} ${row.employee_name}`, parsed.q)
      ) {
        return false;
      }
      return true;
    })
    .map(listItem);
}

export function getSupportRequest(
  db: DatabaseSync,
  employee: Employee,
  id: number,
): SupportRequestDetail {
  const team = teamOf(employee);
  const row = db
    .prepare(`${requestSelect} WHERE r.id = ? AND r.team = ?`)
    .get(id, team) as SupportRequestRow | undefined;
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
      `SELECT id, label, actor, created_at, detail, event_type, visibility, actor_id,
              from_status, to_status
       FROM request_timeline WHERE request_id = ? ORDER BY id`,
    )
    .all(row.id) as {
    id: number;
    label: string;
    actor: string;
    created_at: string;
    detail: string | null;
    event_type: TimelineEventType;
    visibility: "public" | "internal";
    actor_id: number | null;
    from_status: RequestStatus | null;
    to_status: RequestStatus | null;
  }[];
  const notes = db
    .prepare(
      `SELECT n.id, n.text, n.created_at, n.author_id, e.name AS author_name
       FROM request_internal_notes n
       JOIN employees e ON e.id = n.author_id
       WHERE n.request_id = ?
       ORDER BY n.id`,
    )
    .all(row.id) as {
    id: number;
    text: string;
    created_at: string;
    author_id: number;
    author_name: string;
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
  const mappedMessages: RequestMessage[] = messages.map((item) => ({
    id: item.id,
    author: item.author,
    role: item.role,
    text: item.text,
    createdAt: item.created_at,
  }));
  const mappedTimeline: SupportTimelineItem[] = timeline.map((item) => ({
    id: item.id,
    label: item.label,
    actor: item.actor,
    createdAt: item.created_at,
    detail: item.detail,
    eventType: item.event_type,
    visibility: item.visibility,
    actorId: item.actor_id,
    fromStatus: item.from_status,
    toStatus: item.to_status,
  }));
  const internalNotes: InternalNote[] = notes.map((item) => ({
    id: item.id,
    author: { id: item.author_id, name: item.author_name },
    text: item.text,
    createdAt: item.created_at,
  }));
  const mappedAttachments: Attachment[] = attachments.map((item) => ({
    id: item.id,
    name: item.file_name,
    mimeType: item.mime_type,
    sizeBytes: item.size_bytes,
  }));
  return {
    ...listItem(row),
    employee: {
      id: row.employee_id,
      name: row.employee_name,
      department: row.employee_department,
      title: row.employee_title,
      email: row.employee_email,
    },
    contentStored: false,
    attachments: mappedAttachments,
    messages: mappedMessages,
    timeline: mappedTimeline,
    internalNotes,
  };
}

export function listSupportStaff(db: DatabaseSync, employee: Employee): StaffMember[] {
  const team = teamOf(employee);
  const staff = db
    .prepare(
      `SELECT id, name, initials, title, team
       FROM employees
       WHERE role = 'support' AND team = ?`,
    )
    .all(team) as {
    id: number;
    name: string;
    initials: string;
    title: string;
    team: string;
  }[];
  const counts = db
    .prepare(
      `SELECT assignee_id AS id, COUNT(*) AS count
       FROM requests
       WHERE team = ? AND assignee_id IS NOT NULL AND status IN (${OPEN_STATUSES.map(() => "?").join(", ")})
       GROUP BY assignee_id`,
    )
    .all(team, ...OPEN_STATUSES) as { id: number; count: number }[];
  const openAssigned = new Map(counts.map((row) => [row.id, Number(row.count)]));
  return staff
    .map((member) => ({
      id: member.id,
      name: member.name,
      initials: member.initials,
      title: member.title,
      team: member.team,
      openAssigned: openAssigned.get(member.id) ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "tr-TR"));
}

const STALE = "Talep siz işlem yaparken güncellendi. Güncel hâlini görüntüleyip tekrar deneyin.";
const CLOSED = "Kapatılmış talepte işlem yapılamaz.";
const NOT_ASSIGNEE = "Bu işlem yalnızca talebe atanan personel tarafından yapılabilir.";

type TeamRequest = {
  id: number;
  number: string;
  status: RequestStatus;
  updated_at: string;
  employee_id: number;
  assignee_id: number | null;
};

function loadTeamRequest(db: DatabaseSync, employee: Employee, id: number): TeamRequest {
  const team = teamOf(employee);
  const row = db
    .prepare(
      `SELECT id, number, status, updated_at, employee_id, assignee_id
       FROM requests WHERE id = ? AND team = ?`,
    )
    .get(id, team) as TeamRequest | undefined;
  if (!row) throw new HttpError(404, "Talep bulunamadı.");
  return row;
}

function assertCurrent(row: TeamRequest, expectedUpdatedAt: string): void {
  if (row.updated_at !== expectedUpdatedAt) throw new HttpError(409, STALE);
}

function assertNotClosed(row: TeamRequest): void {
  if (row.status === "Kapatıldı") throw new HttpError(409, CLOSED);
}

function assertAssignedTo(row: TeamRequest, employee: Employee): void {
  if (row.assignee_id !== employee.id) throw new HttpError(409, NOT_ASSIGNEE);
}

function statusNotification(number: string, status: RequestStatus): { title: string; text: string } {
  if (status === "Kullanıcıdan Bilgi Bekleniyor") {
    return {
      title: "Bilgi bekleniyor",
      text: `${number} numaralı talebiniz için sizden ek bilgi bekleniyor.`,
    };
  }
  if (status === "Çözüldü") {
    return { title: "Talebiniz çözüldü", text: `${number} numaralı talebiniz çözüldü.` };
  }
  if (status === "Kapatıldı") {
    return { title: "Talebiniz kapatıldı", text: `${number} numaralı talebiniz kapatıldı.` };
  }
  return {
    title: "Talebiniz güncellendi",
    text: `${number} numaralı talebinizin durumu "${status}" olarak güncellendi.`,
  };
}

export function claimRequest(
  db: DatabaseSync,
  employee: Employee,
  id: number,
  now: Now,
): SupportRequestDetail {
  return transaction(db, () => {
    const row = loadTeamRequest(db, employee, id);
    assertNotClosed(row);
    if (row.assignee_id === employee.id) throw new HttpError(409, "Talep zaten size atanmış.");
    if (row.assignee_id !== null) throw new HttpError(409, "Talep başka bir personele atanmış.");
    const stamp = now().toISOString();
    const updated = db
      .prepare(
        `UPDATE requests SET assignee_id = ?, updated_at = ?
         WHERE id = ? AND assignee_id IS NULL`,
      )
      .run(employee.id, stamp, row.id);
    if (Number(updated.changes) !== 1) {
      const again = loadTeamRequest(db, employee, id);
      if (again.assignee_id === employee.id) throw new HttpError(409, "Talep zaten size atanmış.");
      throw new HttpError(409, "Talep başka bir personele atanmış.");
    }
    insertTimeline(db, {
      requestId: row.id,
      label: "Talep üstlenildi",
      actor: employee.name,
      createdAt: stamp,
      eventType: "assignment",
      actorId: employee.id,
      visibility: "internal",
    });
    return getSupportRequest(db, employee, row.id);
  });
}

export function assignRequest(
  db: DatabaseSync,
  employee: Employee,
  id: number,
  body: unknown,
  now: Now,
): SupportRequestDetail {
  const input = parseInput(assignRequestSchema, body, "Atanacak personel seçilmelidir.");
  return transaction(db, () => {
    const team = teamOf(employee);
    const row = loadTeamRequest(db, employee, id);
    assertCurrent(row, input.expectedUpdatedAt);
    assertNotClosed(row);
    const target = db
      .prepare(
        `SELECT id, name FROM employees WHERE id = ? AND role = 'support' AND team = ?`,
      )
      .get(input.assigneeId, team) as { id: number; name: string } | undefined;
    if (!target) {
      throw new HttpError(400, "Talep yalnızca aynı ekipteki destek personeline atanabilir.");
    }
    if (row.assignee_id === target.id) throw new HttpError(409, "Talep zaten bu personele atanmış.");
    const stamp = now().toISOString();
    db.prepare("UPDATE requests SET assignee_id = ?, updated_at = ? WHERE id = ?").run(
      target.id,
      stamp,
      row.id,
    );
    insertTimeline(db, {
      requestId: row.id,
      label: `Talep atandı: ${target.name}`,
      actor: employee.name,
      createdAt: stamp,
      eventType: "assignment",
      actorId: employee.id,
      visibility: "internal",
    });
    return getSupportRequest(db, employee, row.id);
  });
}

export function changeRequestStatus(
  db: DatabaseSync,
  employee: Employee,
  id: number,
  body: unknown,
  now: Now,
): SupportRequestDetail {
  const input = parseInput(statusChangeSchema, body, "Bilinmeyen talep durumu.");
  return transaction(db, () => {
    const row = loadTeamRequest(db, employee, id);
    assertCurrent(row, input.expectedUpdatedAt);
    assertNotClosed(row);
    assertAssignedTo(row, employee);
    if (row.status === input.status) throw new HttpError(409, "Talep zaten bu durumda.");
    if (!STATUS_TRANSITIONS[row.status].includes(input.status)) {
      throw new HttpError(409, `"${row.status}" durumundan "${input.status}" durumuna geçilemez.`);
    }
    const stamp = now().toISOString();
    db.prepare("UPDATE requests SET status = ?, updated_at = ? WHERE id = ?").run(
      input.status,
      stamp,
      row.id,
    );
    insertTimeline(db, {
      requestId: row.id,
      label: `Durum güncellendi: ${input.status}`,
      actor: employee.name,
      createdAt: stamp,
      eventType: "status_change",
      actorId: employee.id,
      fromStatus: row.status,
      toStatus: input.status,
      visibility: "public",
      detail: input.reason,
    });
    const notice = statusNotification(row.number, input.status);
    insertNotification(db, {
      employeeId: row.employee_id,
      title: notice.title,
      text: notice.text,
      createdAt: stamp,
      requestId: row.id,
    });
    return getSupportRequest(db, employee, row.id);
  });
}

export function addSupportMessage(
  db: DatabaseSync,
  employee: Employee,
  id: number,
  body: unknown,
  now: Now,
): SupportRequestDetail {
  const { text } = parseInput(requestMessageSchema, body, "Mesaj boş olamaz.");
  return transaction(db, () => {
    const row = loadTeamRequest(db, employee, id);
    assertNotClosed(row);
    assertAssignedTo(row, employee);
    const stamp = now().toISOString();
    db.prepare("UPDATE requests SET updated_at = ? WHERE id = ?").run(stamp, row.id);
    db.prepare(
      `INSERT INTO request_messages (request_id, author, role, text, created_at)
       VALUES (?, ?, 'support', ?, ?)`,
    ).run(row.id, employee.name, text, stamp);
    insertTimeline(db, {
      requestId: row.id,
      label: "Destek ekibi yanıt verdi",
      actor: employee.name,
      createdAt: stamp,
      eventType: "support_message",
      actorId: employee.id,
      visibility: "public",
    });
    insertNotification(db, {
      employeeId: row.employee_id,
      title: "Destek ekibinden yeni mesaj",
      text: `${row.number} numaralı talebinize destek ekibinden yeni bir mesaj geldi.`,
      createdAt: stamp,
      requestId: row.id,
    });
    return getSupportRequest(db, employee, row.id);
  });
}

export function addInternalNote(
  db: DatabaseSync,
  employee: Employee,
  id: number,
  body: unknown,
  now: Now,
): SupportRequestDetail {
  const { text } = parseInput(noteSchema, body, "Not boş olamaz.");
  return transaction(db, () => {
    const row = loadTeamRequest(db, employee, id);
    assertNotClosed(row);
    const stamp = now().toISOString();
    db.prepare(
      `INSERT INTO request_internal_notes (request_id, author_id, text, created_at)
       VALUES (?, ?, ?, ?)`,
    ).run(row.id, employee.id, text, stamp);
    insertTimeline(db, {
      requestId: row.id,
      label: "İç not eklendi",
      actor: employee.name,
      createdAt: stamp,
      eventType: "internal_note",
      actorId: employee.id,
      visibility: "internal",
    });
    return getSupportRequest(db, employee, row.id);
  });
}
