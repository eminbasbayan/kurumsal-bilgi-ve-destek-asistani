import type { RequestDraft } from "../types";

export type AssistantSource = {
  id: string;
  title: string;
  section: string;
};

export type AssistantHandoff = {
  question: string;
  answer: string;
  sources: AssistantSource[];
};

const SUBJECT_LIMIT = 100;
const DESCRIPTION_LIMIT = 2000;

// Mirrors back-end/src/config/constants.ts CATEGORIES.
const CATEGORIES: Record<string, readonly string[]> = {
  "Bilgi Teknolojileri": [
    "VPN ve Uzaktan Erişim",
    "Donanım",
    "Yazılım",
    "Hesap ve Yetki",
  ],
  "İnsan Kaynakları": ["İzinler", "Yan Haklar", "Özlük İşlemleri", "Bordro"],
  "Finans ve İdari İşler": ["Masraf Bildirimi", "Satın Alma", "Seyahat"],
  "İşyeri Hizmetleri": ["Ofis ve Ekipman", "Ulaşım", "Yemek"],
};

// Seeded source document ids (back-end/src/db/seed.ts). The sources API
// returns these ids with title and section, not a category field.
const SOURCE_CATEGORIES: Record<
  string,
  { category: string; subcategory: string }
> = {
  izin: { category: "İnsan Kaynakları", subcategory: "İzinler" },
  vpn: {
    category: "Bilgi Teknolojileri",
    subcategory: "VPN ve Uzaktan Erişim",
  },
  bordro: { category: "İnsan Kaynakları", subcategory: "Bordro" },
  masraf: {
    category: "Finans ve İdari İşler",
    subcategory: "Masraf Bildirimi",
  },
};

export function suggestedCategory(
  sources: readonly AssistantSource[],
): [string, string] {
  const sourceId = sources[0]?.id;
  if (!sourceId) return ["", ""];
  const match = SOURCE_CATEGORIES[sourceId];
  if (!match) return ["", ""];
  if (!CATEGORIES[match.category]?.includes(match.subcategory)) return ["", ""];
  return [match.category, match.subcategory];
}

export function requestFields(handoff: AssistantHandoff | null): Pick<
  RequestDraft,
  "category" | "subcategory" | "subject" | "description" | "assistantContext"
> {
  const question = handoff?.question.trim() ?? "";
  const sources = handoff?.sources ?? [];
  const [category, subcategory] = suggestedCategory(sources);
  const contextLines = [handoff?.answer.trim() ?? ""];
  for (const source of sources) {
    const label = [source.title.trim(), source.section.trim()]
      .filter(Boolean)
      .join(" · ");
    if (label) contextLines.push(`Kaynak: ${label}`);
  }
  return {
    category,
    subcategory,
    subject: question.replace(/\s+/g, " ").slice(0, SUBJECT_LIMIT),
    description: question.slice(0, DESCRIPTION_LIMIT),
    assistantContext: contextLines.filter(Boolean).join("\n"),
  };
}

export function withoutAssistantContext<T extends { assistantContext: string }>(
  draft: T,
): T {
  return { ...draft, assistantContext: "" };
}
