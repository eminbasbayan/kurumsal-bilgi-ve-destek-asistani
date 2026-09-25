import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../shared/http.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (error instanceof SyntaxError && "status" in error && error.status === 400) {
    res.status(400).json({ error: "Geçersiz JSON." });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Beklenmeyen bir hata oluştu." });
};

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Kayıt bulunamadı." });
};
