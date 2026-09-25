import type { Response } from "express";
import { HttpError } from "./http.js";

export type Now = () => Date;

export type Employee = {
  id: number;
  name: string;
  initials: string;
  title: string;
  department: string;
  email: string;
  employeeNo: string;
  location: string;
};

export function employeeOf(res: Response): Employee {
  const employee = res.locals.employee as Employee | undefined;
  if (!employee) throw new HttpError(401, "Oturum gerekli.");
  return employee;
}

export function parseId(value: string, message: string): number {
  if (!/^\d+$/.test(value)) throw new HttpError(404, message);
  return Number(value);
}
