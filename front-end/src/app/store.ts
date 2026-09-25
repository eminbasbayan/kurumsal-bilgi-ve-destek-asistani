import { initialNotifications, initialRequests } from "../data";
import type { NotificationItem, SupportRequest } from "../types";
import { STORAGE_KEY } from "./navigation";

export type AppStore = {
  loggedIn: boolean;
  requests: SupportRequest[];
  notifications: NotificationItem[];
};

export function initialStore(): AppStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppStore;
  } catch {
    /* use demo records */
  }
  return {
    loggedIn: true,
    requests: initialRequests,
    notifications: initialNotifications,
  };
}
