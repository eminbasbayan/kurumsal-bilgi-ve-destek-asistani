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
export const MAX_QUESTION_LENGTH = 1000;
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

export function teamFor(category: string): string {
  return category === "Bilgi Teknolojileri"
    ? "BT Destek Ekibi"
    : `${category} Ekibi`;
}
