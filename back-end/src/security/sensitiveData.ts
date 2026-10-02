export const SENSITIVE_KINDS = [
  "email",
  "phone",
  "tckn",
  "card",
  "api_key",
  "token",
  "secret",
] as const;

export type SensitiveKind = (typeof SENSITIVE_KINDS)[number];

const LABELS: Record<SensitiveKind, string> = {
  email: "EMAIL",
  phone: "PHONE",
  tckn: "TCKN",
  card: "CARD",
  api_key: "API_KEY",
  token: "TOKEN",
  secret: "SECRET",
};

export type MaskState = Record<SensitiveKind, number>;

type Pattern = {
  kind: SensitiveKind;
  source: string;
  flags: string;
};

const PATTERNS: readonly Pattern[] = [
  {
    kind: "token",
    source: String.raw`eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}`,
    flags: "",
  },
  {
    kind: "token",
    source: String.raw`Bearer\s+[A-Za-z0-9\-._~+/]{8,}={0,2}`,
    flags: "i",
  },
  {
    kind: "api_key",
    source: String.raw`(?:sk-(?:proj-|ant-)?|ghp_|github_pat_|xox[baprs]-|AKIA)[A-Za-z0-9_\-]{16,}|AIza[0-9A-Za-z\-_]{20,}`,
    flags: "",
  },
  {
    kind: "secret",
    source: String.raw`(?:password|passwd|secret|api[_-]?key)\s*[:=]\s*[^\s,;]{4,}`,
    flags: "i",
  },
  {
    kind: "card",
    source: String.raw`(?<!\d)\d(?:[ -]?\d){12,18}(?!\d)`,
    flags: "",
  },
  {
    kind: "phone",
    source: String.raw`(?<!\d)(?:\+90[\s.-]?|0)5\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}(?!\d)`,
    flags: "",
  },
  {
    kind: "tckn",
    source: String.raw`(?<!\d)[1-9]\d{10}(?!\d)`,
    flags: "",
  },
  {
    kind: "email",
    source: String.raw`[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`,
    flags: "",
  },
];

export function createMaskState(): MaskState {
  return { email: 0, phone: 0, tckn: 0, card: 0, api_key: 0, token: 0, secret: 0 };
}

function earliest(text: string): { index: number; length: number; kind: SensitiveKind } | null {
  let best: { index: number; length: number; kind: SensitiveKind } | null = null;
  for (const pattern of PATTERNS) {
    const found = new RegExp(pattern.source, pattern.flags).exec(text);
    if (!found || found[0].length === 0) continue;
    const candidate = { index: found.index, length: found[0].length, kind: pattern.kind };
    if (
      !best ||
      candidate.index < best.index ||
      (candidate.index === best.index && candidate.length > best.length)
    ) {
      best = candidate;
    }
  }
  return best;
}

export function maskText(text: string, state: MaskState = createMaskState()): string {
  let rest = text;
  let out = "";
  while (rest.length > 0) {
    const match = earliest(rest);
    if (!match) {
      out += rest;
      break;
    }
    state[match.kind] += 1;
    out += rest.slice(0, match.index);
    out += `[${LABELS[match.kind]}_${state[match.kind]}]`;
    rest = rest.slice(match.index + match.length);
  }
  return out;
}
