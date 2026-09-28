import type { RequestHandler } from "express";
import type { DatabaseSync } from "node:sqlite";
import type { UserRole } from "../config/constants.js";
import { employeeForToken } from "../modules/auth/auth.service.js";
import { HttpError } from "../shared/http.js";
import type { Employee, Now } from "../shared/types.js";

export function bearerToken(header: string | undefined): string | undefined {
  const match = /^Bearer\s+(\S+)$/i.exec(header ?? "");
  return match?.[1];
}

export function requireAuth(db: DatabaseSync, now: Now): RequestHandler {
  return (req, res, next) => {
    const token = bearerToken(req.header("authorization"));
    if (!token) throw new HttpError(401, "Oturum gerekli.");
    const employee = employeeForToken(db, token, now);
    if (!employee) throw new HttpError(401, "Oturum geçersiz veya süresi dolmuş.");
    res.locals.employee = employee;
    res.locals.token = token;
    next();
  };
}

export function requireRole(role: UserRole): RequestHandler {
  return (_req, res, next) => {
    const employee = res.locals.employee as Employee | undefined;
    if (employee?.role !== role) throw new HttpError(403, "Bu işlem için yetkiniz yok.");
    next();
  };
}
