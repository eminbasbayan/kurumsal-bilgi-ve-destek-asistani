import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";
import { employeeOf, parseId, type Now } from "../../shared/types.js";
import { parseInput } from "../../shared/validate.js";
import { conversationSchema, feedbackSchema } from "./assistant.schema.js";
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
    const { title } = parseInput(conversationSchema, req.body, "Sohbet başlığı geçersiz.");
    res.status(201).json(createConversation(db, employeeOf(res).id, title, now));
  });
  router.get("/:id", (req, res) => {
    res.json(
      getConversation(db, employeeOf(res).id, parseId(req.params.id, "Sohbet bulunamadı.")),
    );
  });
  router.post("/:id/messages", (req, res) => {
    res.status(201).json(
      addConversationMessage(
        db,
        employeeOf(res).id,
        parseId(req.params.id, "Sohbet bulunamadı."),
        req.body,
        now,
      ),
    );
  });
  return router;
}

export function createAssistantRouter(db: DatabaseSync): Router {
  const router = Router();
  router.patch("/messages/:id/feedback", (req, res) => {
    const { helpful } = parseInput(feedbackSchema, req.body, "Değerlendirme true veya false olmalıdır.");
    res.json(
      setMessageFeedback(
        db,
        employeeOf(res).id,
        parseId(req.params.id, "Mesaj bulunamadı."),
        helpful,
      ),
    );
  });
  return router;
}
