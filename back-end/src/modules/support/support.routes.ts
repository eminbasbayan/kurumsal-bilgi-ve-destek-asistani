import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";
import { queryText } from "../../shared/http.js";
import { employeeOf, parseId, type Now } from "../../shared/types.js";
import {
  addInternalNote,
  addSupportMessage,
  assignRequest,
  changeRequestStatus,
  claimRequest,
  getSupportRequest,
  listSupportRequests,
  listSupportStaff,
  supportSummary,
} from "./support.service.js";

export function createSupportRouter(db: DatabaseSync, now: Now): Router {
  const router = Router();

  router.get("/summary", (_req, res) => {
    res.json(supportSummary(db, employeeOf(res)));
  });

  router.get("/requests", (req, res) => {
    res.json({
      requests: listSupportRequests(db, employeeOf(res), {
        queue: queryText(req.query.queue),
        scope: queryText(req.query.scope),
        status: queryText(req.query.status),
        priority: queryText(req.query.priority),
        unassigned: queryText(req.query.unassigned),
        q: queryText(req.query.q),
      }),
    });
  });

  router.get("/staff", (_req, res) => {
    res.json({ staff: listSupportStaff(db, employeeOf(res)) });
  });

  router.get("/requests/:id", (req, res) => {
    const id = parseId(req.params.id, "Talep bulunamadı.");
    res.json(getSupportRequest(db, employeeOf(res), id));
  });

  router.post("/requests/:id/claim", (req, res) => {
    const id = parseId(req.params.id, "Talep bulunamadı.");
    res.json(claimRequest(db, employeeOf(res), id, now));
  });

  router.post("/requests/:id/assign", (req, res) => {
    const id = parseId(req.params.id, "Talep bulunamadı.");
    res.json(assignRequest(db, employeeOf(res), id, req.body, now));
  });

  router.post("/requests/:id/status", (req, res) => {
    const id = parseId(req.params.id, "Talep bulunamadı.");
    res.json(changeRequestStatus(db, employeeOf(res), id, req.body, now));
  });

  router.post("/requests/:id/messages", (req, res) => {
    const id = parseId(req.params.id, "Talep bulunamadı.");
    res.status(201).json(addSupportMessage(db, employeeOf(res), id, req.body, now));
  });

  router.post("/requests/:id/notes", (req, res) => {
    const id = parseId(req.params.id, "Talep bulunamadı.");
    res.status(201).json(addInternalNote(db, employeeOf(res), id, req.body, now));
  });

  return router;
}
