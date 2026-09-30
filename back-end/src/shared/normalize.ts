const TURKISH_FOLDS: readonly [string, string][] = [
  ["ç", "c"],
  ["ğ", "g"],
  ["ı", "i"],
  ["ö", "o"],
  ["ş", "s"],
  ["ü", "u"],
];

/** Short list. Applied to both the question and the indexed text. */
const STOP_WORDS = new Set([
  "nasil",
  "ne",
  "nedir",
  "mi",
  "mu",
  "ben",
  "sen",
  "biz",
  "siz",
  "bir",
  "bu",
  "su",
  "ve",
  "veya",
  "ile",
  "icin",
  "da",
  "de",
  "ki",
  "olan",
  "olarak",
  "daha",
  "cok",
  "var",
  "yok",
  "nerede",
  "nereden",
  "nereye",
  "kadar",
  "gibi",
  "ama",
  "her",
  "sonra",
  "once",
  "diye",
  "gore",
  "hakkinda",
  "lutfen",
  "miyim",
  "musun",
  "misin",
  "midir",
  "mudur",
  "hangi",
  "istiyorum",
  "istiyor",
  "lazim",
  "gerekir",
  "yapilir",
  "yaparim",
  "ederim",
  "edilir",
]);

const TOKEN_SYNONYMS: readonly [string, string][] = [
  ["maas", "bordro"],
  ["tatil", "izin"],
  ["sifre", "parola"],
];

const PHRASE_SYNONYMS: readonly [string, string][] = [
  ["uzaktan baglanti", "vpn"],
  ["masraf belgesi", "fis"],
  ["masraf belgesi", "fatura"],
];

/** ünsüz yumuşaması / ünlü düşmesi için küçük istisna tablosu. */
const SOFTENING: readonly [string, string][] = [
  ["izn", "izin"],
  ["maas", "maas"],
];

export function foldTurkish(value: string): string {
  let folded = value.toLocaleLowerCase("tr-TR");
  for (const [from, to] of TURKISH_FOLDS) folded = folded.replaceAll(from, to);
  return folded;
}

export function normalizeText(value: string): string {
  const cleaned = foldTurkish(value)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!cleaned) return "";
  return cleaned
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
    .join(" ");
}

function phrasePresent(normalized: string, tokens: readonly string[], phrase: string): boolean {
  if (phrase.includes(" ")) return ` ${normalized} `.includes(` ${phrase} `);
  return tokens.some((token) => token === phrase || token.startsWith(phrase));
}

function addTokens(target: Set<string>, phrase: string): void {
  for (const token of phrase.split(" ")) {
    if (token) target.add(token);
  }
}

/** Query-side synonym and softening expansion. The index stores only normalizeText. */
export function expandQueryTokens(normalized: string): string[] {
  const base = normalized.split(" ").filter(Boolean);
  const tokens = new Set(base);
  for (const [left, right] of TOKEN_SYNONYMS) {
    if (phrasePresent(normalized, base, left)) addTokens(tokens, right);
    if (phrasePresent(normalized, base, right)) addTokens(tokens, left);
  }
  for (const [left, right] of PHRASE_SYNONYMS) {
    if (phrasePresent(normalized, base, left)) addTokens(tokens, right);
    if (phrasePresent(normalized, base, right)) addTokens(tokens, left);
  }
  for (const token of base) {
    for (const [prefix, replacement] of SOFTENING) {
      if (token.startsWith(prefix)) tokens.add(replacement);
    }
  }
  return [...tokens];
}

// "kurulu*" is a prefix of "kurulum". "olusu*" only repeats the verb "oluşur" and doubles its score.
const BROAD_TOKENS = new Set(["kurulu"]);
const BROAD_STEMS = new Set(["kurul", "olusu"]);

function prefixClauses(term: string): string[] {
  if (!/^[a-z0-9]+$/.test(term)) return [];
  const clauses: string[] = [];
  if (!BROAD_TOKENS.has(term)) clauses.push(`${term}*`);
  if (term.length >= 5) {
    const stem = term.slice(0, 5);
    if (stem !== term && !BROAD_STEMS.has(stem)) clauses.push(`${stem}*`);
  }
  // "izin" is a 4-letter root; the 5-letter stem of "izinli" is "izinl" and misses it.
  if (term.startsWith("izin") && term !== "izin") clauses.push("izin*");
  return clauses;
}

export function buildFtsQuery(question: string): string | null {
  const normalized = normalizeText(question);
  if (!normalized) return null;
  const clauses = new Set<string>();
  for (const token of expandQueryTokens(normalized)) {
    for (const clause of prefixClauses(token)) clauses.add(clause);
  }
  const originalTokens = normalized.split(" ");
  if (normalized.includes("uzaktan baglanti") || originalTokens.includes("vpn")) {
    clauses.add('"uzaktan baglanti"');
  }
  if (normalized.includes("masraf belgesi")) clauses.add('"masraf belgesi"');
  if (clauses.size === 0) return null;
  return [...clauses].join(" OR ");
}
