import cors from "cors";
import express from "express";
import type { DatabaseSync } from "node:sqlite";
import { mountDocs } from "./docs/swagger.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requireAuth } from "./middleware/auth.js";
import { createAssistantRouter, createConversationsRouter } from "./modules/assistant/assistant.routes.js";
import {
  createPrivateAuthRouter,
  createProfileRouter,
  createPublicAuthRouter,
} from "./modules/auth/auth.routes.js";
import { createCategoriesRouter } from "./modules/categories/categories.routes.js";
import { createNotificationsRouter } from "./modules/notifications/notifications.routes.js";
import { createRequestsRouter } from "./modules/requests/requests.routes.js";
import { createSourcesRouter } from "./modules/sources/sources.routes.js";
import type { Now } from "./shared/types.js";

export function createApp(db: DatabaseSync, now: Now = () => new Date()): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: "http://localhost:5173" }));
  app.use(express.json());
  mountDocs(app);

  app.use("/api/auth", createPublicAuthRouter(db));
  app.use("/api", requireAuth(db));
  app.use("/api/auth", createPrivateAuthRouter(db));
  app.use("/api", createProfileRouter());
  app.use("/api/categories", createCategoriesRouter());
  app.use("/api/requests", createRequestsRouter(db, now));
  app.use("/api/notifications", createNotificationsRouter(db));
  app.use("/api/sources", createSourcesRouter(db));
  app.use("/api/conversations", createConversationsRouter(db, now));
  app.use("/api/assistant", createAssistantRouter(db));
  app.use("/api", notFound);
  app.use(errorHandler);
  return app;
}
