import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";
import { DEMO_LOGIN_MESSAGE } from "../../config/constants.js";
import { bearerToken } from "../../middleware/auth.js";
import { HttpError } from "../../shared/http.js";
import { parseInput } from "../../shared/validate.js";
import { loginSchema } from "./auth.schema.js";
import { createToken, verifyPassword } from "../../shared/passwords.js";
import { employeeOf } from "../../shared/types.js";
import { createSession, deleteSession, findEmployeeByEmail } from "./auth.service.js";

const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

export function createPublicAuthRouter(db: DatabaseSync): Router {
  const router = Router();
  router.post("/login", (req, res) => {
    const { email, password } = parseInput(loginSchema, req.body, "E-posta ve parola zorunludur.");
    const employee = findEmployeeByEmail(db, email);
    if (!employee || !verifyPassword(password, employee.passwordHash)) {
      throw new HttpError(401, "E-posta veya parola hatalı.");
    }
    const token = createToken();
    const expiresAt = new Date(Date.now() + SESSION_MS).toISOString();
    createSession(db, employee.id, token, expiresAt);
    const { passwordHash: _passwordHash, ...profile } = employee;
    res.json({
      token,
      demo: true,
      message: DEMO_LOGIN_MESSAGE,
      employee: profile,
    });
  });
  return router;
}

export function createPrivateAuthRouter(db: DatabaseSync): Router {
  const router = Router();
  router.post("/logout", (req, res) => {
    const token = bearerToken(req.header("authorization"));
    if (token) deleteSession(db, token);
    res.sendStatus(204);
  });
  return router;
}

export function createProfileRouter(): Router {
  const router = Router();
  router.get("/profile", (_req, res) => {
    res.json(employeeOf(res));
  });
  return router;
}
