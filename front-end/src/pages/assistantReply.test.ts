import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ASSISTANT_TIMEOUT_MESSAGE,
  ASSISTANT_TIMEOUT_MS,
  splitQuotedAnswer,
  withAssistantTimeout,
} from "./assistantReply";

function abortError(): Error {
  const error = new Error("The operation was aborted");
  error.name = "AbortError";
  return error;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("asistan zaman aşımı", () => {
  it("15 saniye dolunca isteği iptal eder ve Türkçe mesaj verir", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const pending = withAssistantTimeout((next) => {
      signal = next;
      return new Promise((_resolve, reject) => {
        next.addEventListener("abort", () => reject(abortError()));
      });
    });
    const settled = pending.then(
      () => undefined,
      (error: unknown) => error,
    );

    await vi.advanceTimersByTimeAsync(ASSISTANT_TIMEOUT_MS - 1);
    expect(signal?.aborted).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    const error = await settled;
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe(
      "Asistan zamanında yanıt veremedi. Lütfen tekrar deneyin.",
    );
    expect(ASSISTANT_TIMEOUT_MESSAGE).toBe(
      "Asistan zamanında yanıt veremedi. Lütfen tekrar deneyin.",
    );
    expect(ASSISTANT_TIMEOUT_MS).toBe(15_000);
    expect(signal?.aborted).toBe(true);
  });

  it("süre dolmadan gelen yanıtı ve iptal dışı hatayı olduğu gibi bırakır", async () => {
    vi.useFakeTimers();
    await expect(withAssistantTimeout(async () => "tamam")).resolves.toBe("tamam");
    await expect(
      withAssistantTimeout(async () => {
        throw new Error("Sohbet bulunamadı.");
      }),
    ).rejects.toThrow("Sohbet bulunamadı.");
  });
});

describe("alıntı ayrıştırma", () => {
  it("giriş cümlesini bölüm metninden ve diğer kaynaklardan ayırır", () => {
    const body = 'Yıllık izin "özel" durumları kapsar.';
    const parts = splitQuotedAnswer(
      `İlgili politikaya göre: "${body}"\n\nDiğer ilgili kaynaklar: Mazeret — Süre`,
    );
    expect(parts.intro).toBe("İlgili politikaya göre:");
    expect(parts.quote).toBe(body);
    expect(parts.remainder).toBe("Diğer ilgili kaynaklar: Mazeret — Süre");
  });
});
