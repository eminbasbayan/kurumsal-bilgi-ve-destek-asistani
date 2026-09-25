import type { DatabaseSync } from "node:sqlite";
import { HttpError } from "../../shared/http.js";

export function listNotifications(db: DatabaseSync, employeeId: number) {
  const rows = db
    .prepare(
      `SELECT id, title, text, created_at, read, request_id
       FROM notifications WHERE employee_id = ?
       ORDER BY created_at DESC, id DESC`,
    )
    .all(employeeId) as {
    id: number;
    title: string;
    text: string;
    created_at: string;
    read: number;
    request_id: number | null;
  }[];
  const notifications = rows.map((row) => ({
    id: row.id,
    title: row.title,
    text: row.text,
    createdAt: row.created_at,
    read: row.read === 1,
    requestId: row.request_id,
  }));
  return {
    notifications,
    unread: notifications.filter((item) => !item.read).length,
  };
}

export function markNotificationRead(db: DatabaseSync, employeeId: number, id: number) {
  const row = db
    .prepare("SELECT id FROM notifications WHERE id = ? AND employee_id = ?")
    .get(id, employeeId) as { id: number } | undefined;
  if (!row) throw new HttpError(404, "Bildirim bulunamadı.");
  db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(id);
  const updated = listNotifications(db, employeeId).notifications.find((item) => item.id === id);
  if (!updated) throw new HttpError(404, "Bildirim bulunamadı.");
  return updated;
}

export function markAllNotificationsRead(db: DatabaseSync, employeeId: number) {
  db.prepare("UPDATE notifications SET read = 1 WHERE employee_id = ?").run(employeeId);
  return { unread: 0 };
}
