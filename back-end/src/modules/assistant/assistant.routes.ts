import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";
import { HttpError, isRecord } from "../../shared/http.js";
import { employeeOf, parseId, type Now } from "../../shared/types.js";
import {
  addConversationMessage,
  createConversation,
  getConversation,
  listConversations,
  setMessageFeedback,
} from "./assistant.service.js";

export function createConversationsRouter(db: DatabaseSync, now: Now): Router {
  const router = Router();
  router.get("/", (_req, res) => {
    res.json({ conversations: listConversations(db, employeeOf(res).id) });
  });
  router.post("/", (req, res) => {
    const title =
      isRecord(req.body) && typeof req.body.title === "string" ? req.body.title : undefined;
    res.status(201).json(createConversation(db, employeeOf(res).id, title, now));
  });
  router.get("/:id", (req, res) => {
    res.json(
      getConversation(db, employeeOf(res).id, parseId(req.params.id, "Sohbet bulunamadı.")),
    );
  });
  router.post("/:id/messages", (req, res) => {
    if (!isRecord(req.body)) throw new HttpError(400, "Soru boş olamaz.");
    const text = typeof req.body.text === "string" ? req.body.text : "";
    res.status(201).json(
      addConversationMessage(
        db,
        employeeOf(res).id,
        parseId(req.params.id, "Sohbet bulunamadı."),
        text,
        now,
      ),
    );
  });
  return router;
}

export function createAssistantRouter(db: DatabaseSync): Router {
  const router = Router();
  router.patch("/messages/:id/feedback", (req, res) => {
    if (!isRecord(req.body) || typeof req.body.helpful !== "boolean") {
      throw new HttpError(400, "Değerlendirme true veya false olmalıdır.");
    }
    res.json(
      setMessageFeedback(
        db,
        employeeOf(res).id,
        parseId(req.params.id, "Mesaj bulunamadı."),
        req.body.helpful,
      ),
    );
  });
  return router;
}
