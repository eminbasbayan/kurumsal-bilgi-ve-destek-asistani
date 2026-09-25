import type { RequestHandler } from "express";
import type { DatabaseSync } from "node:sqlite";
import { employeeForToken } from "../modules/auth/auth.service.js";
import { HttpError } from "../shared/http.js";

export function bearerToken(header: string | undefined): string | undefined {
  const match = /^Bearer\s+(\S+)$/i.exec(header ?? "");
  return match?.[1];
}

export function requireAuth(db: DatabaseSync): RequestHandler {
  return (req, res, next) => {
    const token = bearerToken(req.header("authorization"));
    if (!token) throw new HttpError(401, "Oturum gerekli.");
    const employee = employeeForToken(db, token);
    if (!employee) throw new HttpError(401, "Oturum geçersiz veya süresi dolmuş.");
    res.locals.employee = employee;
    res.locals.token = token;
    next();
  };
}
