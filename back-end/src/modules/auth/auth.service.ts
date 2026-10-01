import type { DatabaseSync } from "node:sqlite";
import { DEMO_EMAIL, DEMO_SUPPORT_ACCOUNTS, type UserRole } from "../../config/constants.js";
import type { Employee, Now } from "../../shared/types.js";

type EmployeeRow = {
  id: number;
  name: string;
  initials: string;
  title: string;
  department: string;
  email: string;
  employee_no: string;
  location: string;
  role: UserRole;
  team: string | null;
  password_hash?: string;
};

function employeeFrom(row: EmployeeRow): Employee {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    title: row.title,
    department: row.department,
    email: row.email,
    employeeNo: row.employee_no,
    location: row.location,
    role: row.role,
    team: row.team,
  };
}

export function findEmployeeByEmail(
  db: DatabaseSync,
  email: string,
): (Employee & { passwordHash: string }) | undefined {
  const row = db
    .prepare(
      `SELECT id, name, initials, title, department, email, employee_no, location, role, team, password_hash
       FROM employees WHERE email = ?`,
    )
    .get(email) as EmployeeRow | undefined;
  if (!row?.password_hash) return undefined;
  return { ...employeeFrom(row), passwordHash: row.password_hash };
}

export function listDemoAccounts(db: DatabaseSync) {
  const select = db.prepare("SELECT name, email, role, team FROM employees WHERE email = ?");
  return [DEMO_EMAIL, ...DEMO_SUPPORT_ACCOUNTS.map((account) => account.email)]
    .flatMap((email) => {
      const account = select.get(email) as Pick<Employee, "name" | "email" | "role" | "team"> | undefined;
      return account ? [account] : [];
    });
}

export function createSession(
  db: DatabaseSync,
  employeeId: number,
  token: string,
  expiresAt: string,
  now: Now,
): void {
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now().toISOString());
  db.prepare(
    "INSERT INTO sessions (token, employee_id, expires_at) VALUES (?, ?, ?)",
  ).run(token, employeeId, expiresAt);
}

export function employeeForToken(
  db: DatabaseSync,
  token: string,
  now: Now,
): Employee | undefined {
  const row = db
    .prepare(
      `SELECT e.id, e.name, e.initials, e.title, e.department, e.email,
              e.employee_no, e.location, e.role, e.team
       FROM sessions s
       JOIN employees e ON e.id = s.employee_id
       WHERE s.token = ? AND s.expires_at > ?`,
    )
    .get(token, now().toISOString()) as EmployeeRow | undefined;
  return row ? employeeFrom(row) : undefined;
}

export function deleteSession(db: DatabaseSync, token: string): void {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}
