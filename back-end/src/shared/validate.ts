import type { ZodType } from "zod";
import { HttpError } from "./http.js";

export function parseInput<T>(schema: ZodType<T>, value: unknown, fallback: string): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message || fallback);
  }
  return parsed.data;
}
