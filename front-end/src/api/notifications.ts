import type { NotificationResponse, NotificationItem } from "../types";
import { api } from "./client";

export function listNotifications(): Promise<NotificationResponse> {
  return api<NotificationResponse>("/api/notifications");
}

export function markNotificationRead(id: number): Promise<NotificationItem> {
  return api<NotificationItem>(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead(): Promise<{ unread: 0 }> {
  return api<{ unread: 0 }>("/api/notifications/read-all", {
    method: "POST",
  });
}
