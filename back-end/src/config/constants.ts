export const DEMO_EMAIL = "deniz.yilmaz@ornek-kurum.com";
export const DEMO_PASSWORD = "kurumsaldemo";
export const DEMO_LOGIN_MESSAGE =
  "Demo hesap. Gerçek kimlik doğrulama servisine bağlı değildir.";

export const OPEN_STATUSES = [
  "Yeni",
  "İnceleniyor",
  "Kullanıcıdan Bilgi Bekleniyor",
  "Devam Ediyor",
] as const;

export const CLOSED_STATUSES = ["Çözüldü", "Kapatıldı"] as const;

export const REQUEST_STATUSES = [...OPEN_STATUSES, ...CLOSED_STATUSES] as const;

export const PRIORITIES = ["Düşük", "Normal", "Yüksek"] as const;

export const CATEGORIES: Record<string, readonly string[]> = {
  "Bilgi Teknolojileri": [
    "VPN ve Uzaktan Erişim",
    "Donanım",
    "Yazılım",
    "Hesap ve Yetki",
  ],
  "İnsan Kaynakları": ["İzinler", "Yan Haklar", "Özlük İşlemleri", "Bordro"],
  "Finans ve İdari İşler": ["Masraf Bildirimi", "Satın Alma", "Seyahat"],
  "İşyeri Hizmetleri": ["Ofis ve Ekipman", "Ulaşım", "Yemek"],
};

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_SUBJECT_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_NOTE_LENGTH = 2000;
export const MAX_CLOSE_REASON_LENGTH = 500;
export const MAX_QUESTION_LENGTH = 1000;
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
export const DEFAULT_ASSISTANT_TIMEOUT_MS = 10_000;
export const MAX_MODEL_SECTION_CHARS = 6_000;
export const MAX_MODEL_OUTPUT_TOKENS = 512;
export const GENERATION_RATE_LIMIT = 10;
export const GENERATION_RATE_WINDOW_MS = 60_000;
export const MAX_ASSISTANT_CONTEXT_LENGTH = 4000;
export const MAX_FILE_NAME_LENGTH = 255;
export const DEFAULT_CORS_ORIGIN = "http://localhost:5173";

export const ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;

export const DEFAULT_CONVERSATION_TITLE = "Yeni sohbet";

export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];

export const STATUS_TRANSITIONS: Record<RequestStatus, readonly RequestStatus[]> = {
  Yeni: ["İnceleniyor", "Kapatıldı"],
  İnceleniyor: ["Kullanıcıdan Bilgi Bekleniyor", "Devam Ediyor", "Çözüldü"],
  "Kullanıcıdan Bilgi Bekleniyor": ["İnceleniyor", "Devam Ediyor", "Çözüldü"],
  "Devam Ediyor": ["İnceleniyor", "Kullanıcıdan Bilgi Bekleniyor", "Çözüldü"],
  Çözüldü: ["Devam Ediyor", "Kapatıldı"],
  Kapatıldı: [],
};

export const USER_ROLES = ["employee", "support"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const TIMELINE_EVENT_TYPES = [
  "created",
  "status_change",
  "employee_message",
  "support_message",
  "assignment",
  "internal_note",
] as const;
export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

export const SYSTEM_ACTOR = "Sistem";

export function teamFor(category: string): string {
  return category === "Bilgi Teknolojileri"
    ? "BT Destek Ekibi"
    : `${category} Ekibi`;
}

export const SUPPORT_TEAMS = Object.keys(CATEGORIES).map(teamFor);

export const DEMO_SUPPORT_ACCOUNTS = [
  {
    name: "Ahmet Kaya",
    initials: "AK",
    title: "Kıdemli BT Destek Uzmanı",
    department: "Bilgi Teknolojileri",
    email: "ahmet.kaya@ornek-kurum.com",
    employeeNo: "D-20101",
    location: "İstanbul Merkez Ofis",
    team: teamFor("Bilgi Teknolojileri"),
  },
  {
    name: "Elif Demir",
    initials: "ED",
    title: "BT Destek Uzmanı",
    department: "Bilgi Teknolojileri",
    email: "elif.demir@ornek-kurum.com",
    employeeNo: "D-20102",
    location: "İstanbul Merkez Ofis",
    team: teamFor("Bilgi Teknolojileri"),
  },
  {
    name: "Zeynep Arslan",
    initials: "ZA",
    title: "İK Destek Uzmanı",
    department: "İnsan Kaynakları",
    email: "zeynep.arslan@ornek-kurum.com",
    employeeNo: "D-20201",
    location: "İstanbul Merkez Ofis",
    team: teamFor("İnsan Kaynakları"),
  },
] as const;
