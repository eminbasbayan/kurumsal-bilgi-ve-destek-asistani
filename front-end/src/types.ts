export type RequestStatus =
  | "Yeni"
  | "İnceleniyor"
  | "Kullanıcıdan Bilgi Bekleniyor"
  | "Devam Ediyor"
  | "Çözüldü"
  | "Kapatıldı";

export type Priority = "Düşük" | "Normal" | "Yüksek";

export type UserRole = "employee" | "support";

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

export type DemoAccount = Pick<Employee, "name" | "email" | "role" | "team">;

export type Attachment = {
  id?: number;
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

export type TimelineEventType =
  | "created"
  | "status_change"
  | "employee_message"
  | "support_message"
  | "assignment"
  | "internal_note";

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

export type PersonRef = {
  id: number;
  name: string;
};

export type RequestListItem = {
  id: number;
  number: string;
  subject: string;
  description: string;
  category: string;
  subcategory: string;
  priority: Priority;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  team: string;
  assistantContext: string | null;
};

export type SupportRequest = RequestListItem & {
  contentStored: false;
  attachments: Attachment[];
  messages: RequestMessage[];
  timeline: TimelineItem[];
};

export type RequestSummary = {
  open: number;
  waiting: number;
  completed: number;
  recent: RequestListItem[];
};

export type SupportRequestListItem = RequestListItem & {
  employee: PersonRef & { department: string };
  assignee: PersonRef | null;
};

export type InternalNote = {
  id: number;
  author: PersonRef;
  text: string;
  createdAt: string;
};

export type SupportRequestDetail = Omit<SupportRequestListItem, "employee"> & {
  employee: PersonRef & {
    department: string;
    title: string;
    email: string;
  };
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

export type NotificationItem = {
  id: number;
  title: string;
  text: string;
  createdAt: string;
  read: boolean;
  requestId: number | null;
};

export type NotificationResponse = {
  notifications: NotificationItem[];
  unread: number;
};

export type SourceDocument = {
  id: string;
  title: string;
  section: string;
  excerpt: string;
  updatedAt: string;
  demo: true;
  documentId: string;
  category: string;
  subcategory: string;
};

export type SourceDocumentDetail = SourceDocument & {
  body: string;
};

export type AnswerMode = "quote" | "no_source" | "generated" | "legacy";

export type ConversationMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  helpful: boolean | null;
  source: SourceDocument | null;
  sources: SourceDocument[];
  answerMode: AnswerMode | null;
};

export type ConversationSummary = {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type Conversation = ConversationSummary & {
  messages: ConversationMessage[];
};

export type CategoryItem = {
  name: string;
  subcategories: string[];
};

export type RequestDraft = {
  category: string;
  subcategory: string;
  subject: string;
  description: string;
  priority: Priority;
  attachments: Attachment[];
  assistantContext: string;
};

export type CreateRequestInput = RequestDraft & {
  clientRequestId: string;
};
