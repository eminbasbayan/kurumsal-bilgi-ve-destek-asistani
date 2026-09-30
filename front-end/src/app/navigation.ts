import type { Priority, RequestStatus } from "../types";

export const OPEN_STATUSES: RequestStatus[] = [
  "Yeni",
  "İnceleniyor",
  "Kullanıcıdan Bilgi Bekleniyor",
  "Devam Ediyor",
];

export const REQUEST_STATUSES: RequestStatus[] = [
  ...OPEN_STATUSES,
  "Çözüldü",
  "Kapatıldı",
];

export const PRIORITIES: Priority[] = ["Düşük", "Normal", "Yüksek"];

/** Keep identical to STATUS_TRANSITIONS in back-end/src/config/constants.ts. */
export const STATUS_TRANSITIONS: Record<
  RequestStatus,
  readonly RequestStatus[]
> = {
  Yeni: ["İnceleniyor", "Kapatıldı"],
  İnceleniyor: ["Kullanıcıdan Bilgi Bekleniyor", "Devam Ediyor", "Çözüldü"],
  "Kullanıcıdan Bilgi Bekleniyor": ["İnceleniyor", "Devam Ediyor", "Çözüldü"],
  "Devam Ediyor": ["İnceleniyor", "Kullanıcıdan Bilgi Bekleniyor", "Çözüldü"],
  Çözüldü: ["Devam Ediyor", "Kapatıldı"],
  Kapatıldı: [],
};

export const PAGE_TITLES: Record<string, string> = {
  home: "Ana Sayfa",
  assistant: "Bilgi Asistanı",
  new: "Yeni Destek Talebi",
  requests: "Taleplerim",
  detail: "Talep Detayı",
  notifications: "Bildirimler",
  profile: "Profil",
  queue: "Ekip Kuyruğu",
};

export type AppRoute = { page: string; id?: number };

export function readRoute(): AppRoute {
  const parts = location.hash.replace(/^#\/?/, "").split("/");
  return parts[0] === "request"
    ? { page: "detail", id: Number(parts[1]) }
    : { page: parts[0] || "home" };
}

export function go(path: string) {
  location.hash = `/${path.replace(/^\//, "")}`;
}

export function statusClass(status: RequestStatus) {
  return `status-${status
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ı", "i")
    .replaceAll(" ", "-")}`;
}
