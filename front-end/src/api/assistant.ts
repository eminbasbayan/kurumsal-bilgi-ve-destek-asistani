import type {
  Conversation,
  ConversationMessage,
  ConversationSummary,
  SourceDocument,
} from "../types";
import { api } from "./client";

export function listConversations(): Promise<{
  conversations: ConversationSummary[];
}> {
  return api<{ conversations: ConversationSummary[] }>("/api/conversations");
}

export function createConversation(
  title?: string,
): Promise<ConversationSummary> {
  return api<ConversationSummary>("/api/conversations", {
    method: "POST",
    body: JSON.stringify(title ? { title } : {}),
  });
}

export function getConversation(id: number): Promise<Conversation> {
  return api<Conversation>(`/api/conversations/${id}`);
}

export function sendConversationMessage(
  id: number,
  text: string,
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

export function getSource(id: string): Promise<SourceDocument> {
  return api<SourceDocument>(`/api/sources/${encodeURIComponent(id)}`);
}
