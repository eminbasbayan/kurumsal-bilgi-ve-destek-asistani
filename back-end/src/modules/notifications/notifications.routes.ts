import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";
import { employeeOf, parseId } from "../../shared/types.js";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notifications.service.js";

export function createNotificationsRouter(db: DatabaseSync): Router {
  const router = Router();
  router.get("/", (_req, res) => {
    res.json(listNotifications(db, employeeOf(res).id));
  });
  router.patch("/:id/read", (req, res) => {
    res.json(
      markNotificationRead(
        db,
        employeeOf(res).id,
        parseId(req.params.id, "Bildirim bulunamadı."),
      ),
    );
  });
  router.post("/read-all", (_req, res) => {
    res.json(markAllNotificationsRead(db, employeeOf(res).id));
  });
  return router;
}
