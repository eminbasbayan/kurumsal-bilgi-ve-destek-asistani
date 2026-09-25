export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function requiredText(value: unknown, message: string): string {
  if (typeof value !== "string" || !value.trim()) throw new HttpError(400, message);
  return value.trim();
}

export function limitText(value: string, max: number, label: string): string {
  if (value.length > max) {
    throw new HttpError(400, `${label} en fazla ${max} karakter olabilir.`);
  }
  return value;
}

export function queryText(value: unknown): string | undefined {
  if (Array.isArray(value)) return queryText(value[0]);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function includesTr(haystack: string, needle: string): boolean {
  return haystack
    .toLocaleLowerCase("tr-TR")
    .includes(needle.toLocaleLowerCase("tr-TR"));
}
