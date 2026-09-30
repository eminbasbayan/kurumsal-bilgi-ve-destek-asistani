/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createConversation,
  getConversation,
  listConversations,
  sendConversationMessage,
} from "../api/assistant";
import { listCategories } from "../api/categories";
import type { Conversation, ConversationMessage, SourceDocument } from "../types";
import { AssistantPage } from "./AssistantPage";

vi.mock("../api/assistant", () => ({
  listConversations: vi.fn(),
  createConversation: vi.fn(),
  getConversation: vi.fn(),
  sendConversationMessage: vi.fn(),
  setAssistantFeedback: vi.fn(),
  getSource: vi.fn(),
}));

vi.mock("../api/categories", () => ({
  listCategories: vi.fn(),
}));

const stamp = "2026-09-30T09:00:00.000Z";
const question = "Yıllık izin nasıl kullanılır?";

function abortError(): Error {
  const error = new Error("The operation was aborted");
  error.name = "AbortError";
  return error;
}

function message(
  partial: Partial<ConversationMessage> & Pick<ConversationMessage, "id" | "role" | "text">,
): ConversationMessage {
  return {
    createdAt: stamp,
    helpful: null,
    source: null,
    sources: [],
    answerMode: null,
    ...partial,
  };
}

const source: SourceDocument = {
  id: "izin",
  title: "Yıllık İzin Politikası",
  section: "Başvuru",
  excerpt: "Yönetici onayı gerekir.",
  updatedAt: stamp,
  demo: true,
  documentId: "yillik-izin",
  category: "İnsan Kaynakları",
  subcategory: "İzin",
};

function renderPage(responseTimeoutMs?: number) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Theme>
        <AssistantPage
          escalate={() => undefined}
          responseTimeoutMs={responseTimeoutMs}
        />
      </Theme>
    </QueryClientProvider>,
  );
}

async function openConversation(conversation: Conversation) {
  vi.mocked(listConversations).mockResolvedValue({
    conversations: [
      {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    ],
  });
  vi.mocked(getConversation).mockResolvedValue(conversation);
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: conversation.title }));
}

beforeEach(() => {
  vi.mocked(listConversations).mockResolvedValue({ conversations: [] });
  vi.mocked(listCategories).mockResolvedValue({ categories: [] });
  vi.mocked(getConversation).mockReset();
  vi.mocked(createConversation).mockReset();
  vi.mocked(sendConversationMessage).mockReset();
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("Bilgi Asistanı", () => {
  it("yanıt beklenirken bekleme göstergesi görünür ve gönder düğmesi kilitlenir", async () => {
    let resolveCreate: (value: {
      id: number;
      title: string;
      createdAt: string;
      updatedAt: string;
    }) => void = () => undefined;
    vi.mocked(createConversation).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );
    let rejectSend: (error: Error) => void = () => undefined;
    vi.mocked(sendConversationMessage).mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectSend = reject;
        }),
    );

    renderPage();
    const input = await screen.findByPlaceholderText(
      "Kurumsal süreçler hakkında bir soru yazın…",
    );
    fireEvent.change(input, { target: { value: question } });
    fireEvent.click(screen.getByRole("button", { name: "Gönder" }));

    const status = await screen.findByRole("status");
    expect(status.textContent).toContain("Yanıt hazırlanıyor…");
    const sendButton = screen.getByRole("button", { name: "Gönder" });
    expect(sendButton.hasAttribute("disabled")).toBe(true);

    fireEvent.click(sendButton);
    expect(vi.mocked(createConversation)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendConversationMessage)).not.toHaveBeenCalled();

    resolveCreate({
      id: 1,
      title: "Yeni sohbet",
      createdAt: stamp,
      updatedAt: stamp,
    });
    await waitFor(() => {
      expect(vi.mocked(sendConversationMessage)).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("button", { name: "Gönder" }).hasAttribute("disabled")).toBe(
      true,
    );
    rejectSend(new Error("test sonu"));
    await screen.findByRole("alert");
  });

  it("zaman aşımında Türkçe hata gösterir ve aynı soruyu yeniden dener", async () => {
    vi.mocked(createConversation).mockResolvedValue({
      id: 1,
      title: "Yeni sohbet",
      createdAt: stamp,
      updatedAt: stamp,
    });
    let attempts = 0;
    vi.mocked(sendConversationMessage).mockImplementation((_id, text, signal) => {
      attempts += 1;
      if (attempts === 1) {
        return new Promise((_resolve, reject) => {
          if (signal?.aborted) {
            reject(abortError());
            return;
          }
          signal?.addEventListener("abort", () => reject(abortError()));
        });
      }
      return Promise.resolve({
        userMessage: message({ id: 10, role: "user", text }),
        assistantMessage: message({
          id: 11,
          role: "assistant",
          text: "Kısa yanıt",
          answerMode: "quote",
        }),
      });
    });

    renderPage(50);
    const input = await screen.findByPlaceholderText(
      "Kurumsal süreçler hakkında bir soru yazın…",
    );
    fireEvent.change(input, { target: { value: question } });
    fireEvent.click(screen.getByRole("button", { name: "Gönder" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(
      "Asistan zamanında yanıt veremedi. Lütfen tekrar deneyin.",
    );
    expect((input as HTMLTextAreaElement).value).toBe(question);
    expect(screen.getByRole("button", { name: "Gönder" }).hasAttribute("disabled")).toBe(
      false,
    );

    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    await waitFor(() => {
      expect(vi.mocked(sendConversationMessage)).toHaveBeenCalledTimes(2);
    });
    expect(vi.mocked(sendConversationMessage).mock.calls[1]?.[1]).toBe(question);
  });

  it("üretilmiş yanıtta rozet gösterir ve kaynak listesini korur", async () => {
    await openConversation({
      id: 4,
      title: "İzin sohbeti",
      createdAt: stamp,
      updatedAt: stamp,
      messages: [
        message({ id: 1, role: "user", text: "İzin nasıl kullanılır?" }),
        message({
          id: 2,
          role: "assistant",
          text: "Yıllık izin için yönetici onayı gerekir.",
          answerMode: "generated",
          source,
          sources: [source],
        }),
      ],
    });

    const badge = await screen.findByText("Üretilmiş yanıt");
    expect(badge.className).toContain("rt-Badge");
    expect(screen.getByRole("button", { name: "Kaynağı aç" })).toBeTruthy();
  });

  it("alıntı giriş cümlesini blockquote dışında tutar", async () => {
    const body = "Yıllık izin talebi yönetici onayından sonra kesinleşir.";
    await openConversation({
      id: 5,
      title: "Alıntı sohbeti",
      createdAt: stamp,
      updatedAt: stamp,
      messages: [
        message({ id: 1, role: "user", text: question }),
        message({
          id: 2,
          role: "assistant",
          text: `İlgili politikaya göre: "${body}"\n\nDiğer ilgili kaynaklar: Mazeret — Süre`,
          answerMode: "quote",
          source,
          sources: [source],
        }),
      ],
    });

    await screen.findByText(body);
    const quote = document.querySelector("blockquote.answer-quote");
    expect(quote?.textContent).toBe(body);
    const intro = screen.getByText("İlgili politikaya göre:");
    const remainder = screen.getByText("Diğer ilgili kaynaklar: Mazeret — Süre");
    expect(quote?.contains(intro)).toBe(false);
    expect(quote?.contains(remainder)).toBe(false);
    expect(screen.queryByText("Üretilmiş yanıt")).toBeNull();
  });
});
