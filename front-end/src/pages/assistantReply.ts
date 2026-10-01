export const ASSISTANT_TIMEOUT_MS = 15_000;

export const ASSISTANT_TIMEOUT_MESSAGE =
  "Asistan zamanında yanıt veremedi. Lütfen tekrar deneyin.";

export const QUOTE_INTRO = "İlgili politikaya göre:";

const OTHER_SOURCES_MARK = "\n\nDiğer ilgili kaynaklar:";

export type QuotedAnswerParts = {
  intro: string;
  quote: string;
  remainder: string;
};

export function splitQuotedAnswer(text: string): QuotedAnswerParts {
  if (!text.startsWith(QUOTE_INTRO)) {
    return { intro: "", quote: text, remainder: "" };
  }
  const afterIntro = text.slice(QUOTE_INTRO.length).trimStart();
  const otherAt = afterIntro.indexOf(OTHER_SOURCES_MARK);
  const quotedChunk = (otherAt === -1 ? afterIntro : afterIntro.slice(0, otherAt)).trim();
  const remainder = otherAt === -1 ? "" : afterIntro.slice(otherAt).trim();
  const quote =
    quotedChunk.startsWith('"') && quotedChunk.endsWith('"') && quotedChunk.length >= 2
      ? quotedChunk.slice(1, -1)
      : quotedChunk;
  return { intro: QUOTE_INTRO, quote, remainder };
}

export async function withAssistantTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  timeoutMs = ASSISTANT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(ASSISTANT_TIMEOUT_MESSAGE));
    }, timeoutMs);
  });

  const work = run(controller.signal).then(
    (value) => value,
    (error: unknown) => {
      if (controller.signal.aborted) throw new Error(ASSISTANT_TIMEOUT_MESSAGE);
      throw error;
    },
  );

  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    void work.catch(() => undefined);
  }
}
