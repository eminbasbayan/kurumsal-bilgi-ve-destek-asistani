import { GENERATION_RATE_LIMIT, GENERATION_RATE_WINDOW_MS } from "../../config/constants.js";

export type RateLimiter = {
  allow(employeeId: number, now: Date): boolean;
};

export function createRateLimiter(
  limit = GENERATION_RATE_LIMIT,
  windowMs = GENERATION_RATE_WINDOW_MS,
): RateLimiter {
  const hits = new Map<number, number[]>();
  return {
    allow(employeeId, now) {
      const time = now.getTime();
      const recent = (hits.get(employeeId) ?? []).filter((stamp) => time - stamp < windowMs);
      if (recent.length >= limit) {
        hits.set(employeeId, recent);
        return false;
      }
      recent.push(time);
      hits.set(employeeId, recent);
      return true;
    },
  };
}
