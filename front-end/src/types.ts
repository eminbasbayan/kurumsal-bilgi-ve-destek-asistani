export type RequestStatus =
  | "Yeni"
  | "İnceleniyor"
  | "Kullanıcıdan Bilgi Bekleniyor"
  | "Devam Ediyor"
  | "Çözüldü"
  | "Kapatıldı";

export type Priority = "Düşük" | "Normal" | "Yüksek";

export type RequestMessage = {
  id: number;
  author: string;
  role: "employee" | "support";
  text: string;
  date: string;
};

export type TimelineItem = {
  label: string;
  date: string;
};

export type SupportRequest = {
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
  attachments: string[];
  assistantContext?: string;
  messages: RequestMessage[];
  timeline: TimelineItem[];
};

export type NotificationItem = {
  id: number;
  title: string;
  text: string;
  date: string;
  read: boolean;
  requestId?: number;
};

export type SourceDocument = {
  id: string;
  title: string;
  section: string;
  excerpt: string;
  updatedAt: string;
};

export type RequestDraft = {
  category: string;
  subcategory: string;
  subject: string;
  description: string;
  priority: Priority;
  attachments: string[];
  assistantContext: string;
};
