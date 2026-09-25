import type { Express } from "express";
import { serve, setup } from "swagger-ui-express";
import { openApiDocument } from "./openapi.js";

export function mountDocs(app: Express): void {
  app.get("/api-docs.json", (_req, res) => {
    res.json(openApiDocument);
  });
  app.use(
    "/api-docs",
    serve,
    setup(openApiDocument, {
      customSiteTitle: "Kurumsal Destek API",
      swaggerOptions: { persistAuthorization: true },
    }),
  );
}
