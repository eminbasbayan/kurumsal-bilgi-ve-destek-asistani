import type { DatabaseSync } from "node:sqlite";
import {
  CLOSED_STATUSES,
  OPEN_STATUSES,
  REQUEST_STATUSES,
  type Priority,
  type RequestStatus,
  type TimelineEventType,
} from "../../config/constants.js";
import { HttpError, includesTr } from "../../shared/http.js";
import { parseInput } from "../../shared/validate.js";
import type {
  Attachment,
  Employee,
  InternalNote,
  PersonRef,
  RequestMessage,
  StaffMember,
  SupportRequestDetail,
  SupportRequestListItem,
  SupportSummary,
  SupportTimelineItem,
} from "../../shared/types.js";
import { supportListFilterSchema } from "./support.schema.js";

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
