export type RequestStatus =
  | "Yeni"
  | "İnceleniyor"
  | "Kullanıcıdan Bilgi Bekleniyor"
  | "Devam Ediyor"
  | "Çözüldü"
  | "Kapatıldı";

export type Priority = "Düşük" | "Normal" | "Yüksek";

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

export type TimelineItem = {
  id: number;
  label: string;
  actor: string;
  createdAt: string;
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
};

export type ConversationMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  helpful: boolean | null;
  source: SourceDocument | null;
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
