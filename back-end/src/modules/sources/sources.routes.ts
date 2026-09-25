import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";
import { getSource, listSources } from "./sources.service.js";

export function createSourcesRouter(db: DatabaseSync): Router {
  const router = Router();
  router.get("/", (_req, res) => {
    res.json({ sources: listSources(db) });
  });
  router.get("/:id", (req, res) => {
    res.json(getSource(db, req.params.id));
  });
  return router;
}
