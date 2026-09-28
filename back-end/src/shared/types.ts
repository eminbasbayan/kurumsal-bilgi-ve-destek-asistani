import type { Response } from "express";
import type { Priority, RequestStatus, TimelineEventType, UserRole } from "../config/constants.js";
import { HttpError } from "./http.js";

export type { TimelineEventType, UserRole };

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
  role: UserRole;
  team: string | null;
};

export type TimelineItem = {
  id: number;
  label: string;
  actor: string;
  createdAt: string;
  detail: string | null;
};

export type SupportTimelineItem = TimelineItem & {
  eventType: TimelineEventType;
  visibility: "public" | "internal";
  actorId: number | null;
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus | null;
};

export type PersonRef = { id: number; name: string };
export type RequestEmployee = PersonRef & { department: string };

export type RequestListItem = {
  id: number;
  number: string;
  subject: string;
  description: string;
  category: string;
  subcategory: string;
  priority: Priority;
  status: RequestStatus;
  team: string;
  createdAt: string;
  updatedAt: string;
  assistantContext: string | null;
};

export type SupportRequestListItem = RequestListItem & {
  employee: RequestEmployee;
  assignee: PersonRef | null;
};

export type Attachment = {
  id: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
};

export type RequestMessage = {
  id: number;
  author: string;
  role: "employee" | "support";
  text: string;
  createdAt: string;
};

export type InternalNote = {
  id: number;
  author: PersonRef;
  text: string;
  createdAt: string;
};

export type SupportRequestDetail = Omit<SupportRequestListItem, "employee"> & {
  employee: RequestEmployee & { title: string; email: string };
  contentStored: false;
  attachments: Attachment[];
  messages: RequestMessage[];
  timeline: SupportTimelineItem[];
  internalNotes: InternalNote[];
};

export type StaffMember = {
  id: number;
  name: string;
  initials: string;
  title: string;
  team: string;
  openAssigned: number;
};

export type SupportSummary = {
  team: string;
  open: number;
  unassigned: number;
  mine: number;
  waiting: number;
  byStatus: Record<RequestStatus, number>;
};

export function employeeOf(res: Response): Employee {
  const employee = res.locals.employee as Employee | undefined;
  if (!employee) throw new HttpError(401, "Oturum gerekli.");
  return employee;
}

export function parseId(value: string, message: string): number {
  if (!/^\d+$/.test(value)) throw new HttpError(404, message);
  return Number(value);
}
