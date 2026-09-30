import cors from "cors";
import express from "express";
import type { DatabaseSync } from "node:sqlite";
import { mountDocs } from "./docs/swagger.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requireAuth, requireRole } from "./middleware/auth.js";
import { createAssistantRouter, createConversationsRouter } from "./modules/assistant/assistant.routes.js";
import type { AssistantRuntime } from "./modules/assistant/assistant.service.js";
import { assistantTimeoutFromEnv, createGeminiProviderFromEnv } from "./modules/assistant/provider.js";
import { createRateLimiter } from "./modules/assistant/rateLimit.js";
import {
  createPrivateAuthRouter,
  createProfileRouter,
  createPublicAuthRouter,
} from "./modules/auth/auth.routes.js";
import { createCategoriesRouter } from "./modules/categories/categories.routes.js";
import { createNotificationsRouter } from "./modules/notifications/notifications.routes.js";
import { createRequestsRouter } from "./modules/requests/requests.routes.js";
import { createSourcesRouter } from "./modules/sources/sources.routes.js";
import { createSupportRouter } from "./modules/support/support.routes.js";
import { DEFAULT_CORS_ORIGIN } from "./config/constants.js";
import type { Now } from "./shared/types.js";

export type AssistantOverrides = {
  provider?: AssistantRuntime["provider"];
  timeoutMs?: number;
  rateLimiter?: AssistantRuntime["rateLimiter"];
};

function assistantRuntime(overrides?: AssistantOverrides): AssistantRuntime {
  if (!overrides) {
    return {
      provider: createGeminiProviderFromEnv(),
      timeoutMs: assistantTimeoutFromEnv(),
      rateLimiter: createRateLimiter(),
    };
  }
  return {
    provider: overrides.provider ?? null,
    timeoutMs: overrides.timeoutMs ?? assistantTimeoutFromEnv(),
    rateLimiter: overrides.rateLimiter ?? createRateLimiter(),
  };
}

export function createApp(
  db: DatabaseSync,
  now: Now = () => new Date(),
  corsOrigin = DEFAULT_CORS_ORIGIN,
  assistant?: AssistantOverrides,
): express.Express {
  const runtime = assistantRuntime(assistant);
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());
  mountDocs(app);

  app.use("/api/auth", createPublicAuthRouter(db, now));
  app.use("/api", requireAuth(db, now));
  app.use("/api/auth", createPrivateAuthRouter(db));
  app.use("/api", createProfileRouter());
  app.use("/api/categories", createCategoriesRouter());
  app.use("/api/requests", requireRole("employee"), createRequestsRouter(db, now));
  app.use("/api/notifications", requireRole("employee"), createNotificationsRouter(db));
  app.use("/api/sources", requireRole("employee"), createSourcesRouter(db));
  app.use("/api/conversations", requireRole("employee"), createConversationsRouter(db, now, runtime));
  app.use("/api/assistant", requireRole("employee"), createAssistantRouter(db));
  app.use("/api/support", requireRole("support"), createSupportRouter(db, now));
  app.use("/api", notFound);
  app.use(errorHandler);
  return app;
}
