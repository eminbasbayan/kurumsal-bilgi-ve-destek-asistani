import type {
  Conversation,
  ConversationMessage,
  ConversationSummary,
  SourceDocumentDetail,
} from "../types";
import { api } from "./client";

export function listConversations(): Promise<{
  conversations: ConversationSummary[];
}> {
  return api<{ conversations: ConversationSummary[] }>("/api/conversations");
}

export function createConversation(
  title?: string,
  signal?: AbortSignal,
): Promise<ConversationSummary> {
  return api<ConversationSummary>("/api/conversations", {
    method: "POST",
    body: JSON.stringify(title ? { title } : {}),
    signal,
  });
}

export function getConversation(id: number): Promise<Conversation> {
  return api<Conversation>(`/api/conversations/${id}`);
}

export function sendConversationMessage(
  id: number,
  text: string,
  signal?: AbortSignal,
): Promise<{
  userMessage: ConversationMessage;
  assistantMessage: ConversationMessage;
}> {
  return api<{
    userMessage: ConversationMessage;
    assistantMessage: ConversationMessage;
  }>(`/api/conversations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
    signal,
  });
}

export function setAssistantFeedback(
  id: number,
  helpful: boolean,
): Promise<ConversationMessage> {
  return api<ConversationMessage>(`/api/assistant/messages/${id}/feedback`, {
    method: "PATCH",
    body: JSON.stringify({ helpful }),
  });
}

export function getSource(id: string): Promise<SourceDocumentDetail> {
  return api<SourceDocumentDetail>(`/api/sources/${encodeURIComponent(id)}`);
}
