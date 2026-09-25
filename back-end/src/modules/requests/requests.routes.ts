import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";
import { HttpError, isRecord, queryText } from "../../shared/http.js";
import { employeeOf, parseId, type Now } from "../../shared/types.js";
import {
  addRequestMessage,
  createRequest,
  getRequest,
  listRequests,
  parseCreateRequest,
  requestSummary,
} from "./requests.service.js";

export function createRequestsRouter(db: DatabaseSync, now: Now): Router {
  const router = Router();

  router.get("/summary", (_req, res) => {
    res.json(requestSummary(db, employeeOf(res).id));
  });

  router.get("/", (req, res) => {
    res.json({
      requests: listRequests(db, employeeOf(res).id, {
        q: queryText(req.query.q),
        status: queryText(req.query.status),
        category: queryText(req.query.category),
        scope: queryText(req.query.scope),
      }),
    });
  });

  router.get("/:id", (req, res) => {
    res.json(getRequest(db, employeeOf(res).id, parseId(req.params.id, "Talep bulunamadı.")));
  });

  router.post("/", (req, res) => {
    const result = createRequest(db, employeeOf(res), parseCreateRequest(req.body), now);
    res.status(result.created ? 201 : 200).json(result.request);
  });

  router.post("/:id/messages", (req, res) => {
    if (!isRecord(req.body)) throw new HttpError(400, "Mesaj boş olamaz.");
    const text = typeof req.body.text === "string" ? req.body.text : "";
    res
      .status(201)
      .json(
        addRequestMessage(
          db,
          employeeOf(res),
          parseId(req.params.id, "Talep bulunamadı."),
          text,
          now,
        ),
      );
  });

  return router;
}
