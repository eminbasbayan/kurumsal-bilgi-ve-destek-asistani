import type { RequestDraft } from "../types";

export type AssistantSource = {
  id: string;
  title: string;
  section: string;
  category?: string;
  subcategory?: string;
};

export type AssistantHandoff = {
  question: string;
  answer: string;
  sources: AssistantSource[];
};

const SUBJECT_LIMIT = 100;
const DESCRIPTION_LIMIT = 2000;

export function suggestedCategory(
  sources: readonly AssistantSource[],
): [string, string] {
  const first = sources[0];
  if (!first?.category || !first.subcategory) return ["", ""];
  const same = sources.every(
    (source) =>
      source.category === first.category &&
      source.subcategory === first.subcategory,
  );
  if (!same) return ["", ""];
  return [first.category, first.subcategory];
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
