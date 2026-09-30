export const QUOTE_INTRO = "İlgili politikaya göre:";
export const NO_SOURCE_TEXT =
  "Bu konuda doğrulanmış bir kaynak bulamadım. İstersen bir destek talebi oluşturabilirsin.";
export const OTHER_SOURCES_LABEL = "Diğer ilgili kaynaklar";

export type AnswerMode = "quote" | "no_source" | "generated" | "legacy";

type QuotedSection = {
  title: string;
  section: string;
  body: string;
};

export function composeAnswer(sections: readonly QuotedSection[]): {
  text: string;
  answerMode: "quote" | "no_source";
} {
  const best = sections[0];
  if (!best) return { text: NO_SOURCE_TEXT, answerMode: "no_source" };
  const quoted = `${QUOTE_INTRO} "${best.body}"`;
  const others = sections.slice(1);
  if (others.length === 0) return { text: quoted, answerMode: "quote" };
  const list = others.map((item) => `${item.title} — ${item.section}`).join("; ");
  return {
    text: `${quoted}\n\n${OTHER_SOURCES_LABEL}: ${list}`,
    answerMode: "quote",
  };
}

export function suggestCategory(
  sources: readonly { category: string; subcategory: string }[],
): { category: string; subcategory: string } | null {
  const first = sources[0];
  if (!first) return null;
  const same = sources.every(
    (item) => item.category === first.category && item.subcategory === first.subcategory,
  );
  if (!same) return null;
  return { category: first.category, subcategory: first.subcategory };
}
