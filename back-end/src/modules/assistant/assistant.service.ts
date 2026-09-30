import type { DatabaseSync } from "node:sqlite";
import { DEFAULT_CONVERSATION_TITLE } from "../../config/constants.js";
import { insertedId, transaction } from "../../db/sql.js";
import { HttpError } from "../../shared/http.js";
import { parseInput } from "../../shared/validate.js";
import type { Now } from "../../shared/types.js";
import { sourceFromRow, type SourceRecord, type SourceRow } from "../sources/sources.service.js";
import { questionSchema } from "./assistant.schema.js";
import {
  isAbortError,
  limitSectionBodies,
  logAssistantFallback,
  ProviderFallback,
  type AnswerProvider,
  type FallbackCode,
  type GenerateResult,
  type ProviderSection,
} from "./provider.js";
import type { RateLimiter } from "./rateLimit.js";
import { composeAnswer, type AnswerMode } from "./reply.js";
import { searchSections, type RankedSection } from "./search.js";

export type AssistantRuntime = {
  provider: AnswerProvider | null;
  timeoutMs: number;
  rateLimiter: RateLimiter;
};

type AnswerPayload = {
  text: string;
  answerMode: "quote" | "no_source" | "generated";
  sources: SourceRecord[];
};

type ConversationMessageRow = {
  id: number;
  conversation_id: number;
  role: "user" | "assistant";
  text: string;
  source_id: string | null;
  helpful: number | null;
  created_at: string;
  answer_mode: AnswerMode | null;
};

const MESSAGE_COLUMNS = `id, conversation_id, role, text, source_id, helpful, created_at, answer_mode`;

function sourcesForMessage(db: DatabaseSync, messageId: number): SourceRecord[] {
  const rows = db
    .prepare(
      `SELECT s.id, s.title, s.section, s.excerpt, s.updated_at, s.document_id, s.category, s.subcategory
       FROM conversation_message_sources cms
       JOIN source_documents s ON s.id = cms.source_id
       WHERE cms.message_id = ?
       ORDER BY cms.rank`,
    )
    .all(messageId) as SourceRow[];
  return rows.map(sourceFromRow);
}

function messageView(db: DatabaseSync, row: ConversationMessageRow) {
  const sources = sourcesForMessage(db, row.id);
  return {
    id: row.id,
    role: row.role,
    text: row.text,
    createdAt: row.created_at,
    helpful: row.helpful === null ? null : row.helpful === 1,
    source: sources[0] ?? null,
    sources,
    answerMode: row.answer_mode,
  };
}

function publicSource(section: RankedSection): SourceRecord {
  const { body: _body, score: _score, ...source } = section;
  return source;
}

function quoteFromSearch(found: readonly RankedSection[]): AnswerPayload {
  const answer = composeAnswer(found);
  return {
    text: answer.text,
    answerMode: answer.answerMode,
    sources: found.map((section) => publicSource(section)),
  };
}

function acceptGenerated(
  found: readonly RankedSection[],
  sent: readonly ProviderSection[],
  generated: GenerateResult,
): { ok: true; value: AnswerPayload } | { ok: false; code: FallbackCode } {
  if (generated.insufficient) return { ok: false, code: "insufficient" };
  if (generated.citedSourceIds.length === 0) return { ok: false, code: "empty_citations" };
  const allowed = new Set(sent.map((section) => section.id));
  const byId = new Map(found.map((section) => [section.id, section]));
  const sources: SourceRecord[] = [];
  const seen = new Set<string>();
  for (const id of generated.citedSourceIds) {
    const section = byId.get(id);
    if (!section || !allowed.has(id)) return { ok: false, code: "unknown_source" };
    if (seen.has(id)) continue;
    seen.add(id);
    sources.push(publicSource(section));
  }
  if (sources.length === 0) return { ok: false, code: "empty_citations" };
  return {
    ok: true,
    value: { text: generated.text, answerMode: "generated", sources },
  };
}

export function answerQuestion(db: DatabaseSync, question: string): AnswerPayload {
  return quoteFromSearch(searchSections(db, question));
}

async function resolveAnswer(
  db: DatabaseSync,
  question: string,
  employeeId: number,
  now: Date,
  assistant: AssistantRuntime,
): Promise<AnswerPayload> {
  const found = searchSections(db, question);
  if (found.length === 0) return quoteFromSearch(found);
  if (!assistant.provider) {
    logAssistantFallback("no_key");
    return quoteFromSearch(found);
  }
  if (!assistant.rateLimiter.allow(employeeId, now)) {
    logAssistantFallback("rate_limit");
    return quoteFromSearch(found);
  }
  const sections = limitSectionBodies(found).map((section) => ({
    id: section.id,
    title: section.title,
    section: section.section,
    body: section.body,
  }));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), assistant.timeoutMs);
  try {
    const generated = await assistant.provider.generate({
      question,
      sections,
      signal: controller.signal,
    });
    const accepted = acceptGenerated(found, sections, generated);
    if (!accepted.ok) {
      logAssistantFallback(accepted.code);
      return quoteFromSearch(found);
    }
    return accepted.value;
  } catch (error) {
    const code: FallbackCode =
      error instanceof ProviderFallback
        ? error.code
        : isAbortError(error) || controller.signal.aborted
          ? "timeout"
          : "error";
    logAssistantFallback(code);
    return quoteFromSearch(found);
  } finally {
    clearTimeout(timer);
  }
}

export function listConversations(db: DatabaseSync, employeeId: number) {
  const rows = db
    .prepare(
      `SELECT id, title, created_at, updated_at
       FROM conversations WHERE employee_id = ?
       ORDER BY updated_at DESC, id DESC`,
    )
    .all(employeeId) as {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
  }[];
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function createConversation(
  db: DatabaseSync,
  employeeId: number,
  title: string | undefined,
  now: Now,
) {
  const stamp = now().toISOString();
  const name = title?.trim() || DEFAULT_CONVERSATION_TITLE;
  const inserted = db
    .prepare(
      `INSERT INTO conversations (employee_id, title, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
    )
    .run(employeeId, name, stamp, stamp);
  return {
    id: insertedId(inserted),
    title: name,
    createdAt: stamp,
    updatedAt: stamp,
  };
}

export function getConversation(db: DatabaseSync, employeeId: number, id: number) {
  const row = db
    .prepare(
      `SELECT id, title, created_at, updated_at
       FROM conversations WHERE id = ? AND employee_id = ?`,
    )
    .get(id, employeeId) as
    | { id: number; title: string; created_at: string; updated_at: string }
    | undefined;
  if (!row) throw new HttpError(404, "Sohbet bulunamadı.");
  const messages = (
    db
      .prepare(
        `SELECT ${MESSAGE_COLUMNS}
         FROM conversation_messages WHERE conversation_id = ? ORDER BY id`,
      )
      .all(row.id) as ConversationMessageRow[]
  ).map((item) => messageView(db, item));
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages,
  };
}

export async function addConversationMessage(
  db: DatabaseSync,
  employeeId: number,
  conversationId: number,
  body: unknown,
  now: Now,
  assistant: AssistantRuntime,
) {
  const { text: question } = parseInput(questionSchema, body, "Soru boş olamaz.");
  const stampDate = now();
  const stamp = stampDate.toISOString();
  // Commit the user row before search and generation so the network call stays outside a transaction.
  const userId = transaction(db, () => {
    const conversation = db
      .prepare("SELECT id, title FROM conversations WHERE id = ? AND employee_id = ?")
      .get(conversationId, employeeId) as { id: number; title: string } | undefined;
    if (!conversation) throw new HttpError(404, "Sohbet bulunamadı.");
    const userInsert = db
      .prepare(
        `INSERT INTO conversation_messages
          (conversation_id, role, text, source_id, helpful, created_at, answer_mode)
         VALUES (?, 'user', ?, NULL, NULL, ?, NULL)`,
      )
      .run(conversation.id, question, stamp);
    const title =
      conversation.title === DEFAULT_CONVERSATION_TITLE
        ? question.slice(0, 80)
        : conversation.title;
    db.prepare("UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?").run(
      title,
      stamp,
      conversation.id,
    );
    return insertedId(userInsert);
  });
  const reply = await resolveAnswer(db, question, employeeId, stampDate, assistant);
  return transaction(db, () => {
    const assistantInsert = db
      .prepare(
        `INSERT INTO conversation_messages
          (conversation_id, role, text, source_id, helpful, created_at, answer_mode)
         VALUES (?, 'assistant', ?, ?, NULL, ?, ?)`,
      )
      .run(conversationId, reply.text, reply.sources[0]?.id ?? null, stamp, reply.answerMode);
    const assistantId = insertedId(assistantInsert);
    const linkSource = db.prepare(
      `INSERT INTO conversation_message_sources (message_id, source_id, rank)
       VALUES (?, ?, ?)`,
    );
    reply.sources.forEach((source, index) => {
      linkSource.run(assistantId, source.id, index + 1);
    });
    const user = db
      .prepare(`SELECT ${MESSAGE_COLUMNS} FROM conversation_messages WHERE id = ?`)
      .get(userId) as ConversationMessageRow;
    const assistant = db
      .prepare(`SELECT ${MESSAGE_COLUMNS} FROM conversation_messages WHERE id = ?`)
      .get(assistantId) as ConversationMessageRow;
    return {
      userMessage: messageView(db, user),
      assistantMessage: messageView(db, assistant),
    };
  });
}

export function setMessageFeedback(
  db: DatabaseSync,
  employeeId: number,
  messageId: number,
  helpful: boolean,
) {
  const row = db
    .prepare(
      `SELECT m.id, m.role
       FROM conversation_messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE m.id = ? AND c.employee_id = ?`,
    )
    .get(messageId, employeeId) as { id: number; role: string } | undefined;
  if (!row) throw new HttpError(404, "Mesaj bulunamadı.");
  if (row.role !== "assistant") {
    throw new HttpError(400, "Yalnızca asistan yanıtı değerlendirilebilir.");
  }
  db.prepare("UPDATE conversation_messages SET helpful = ? WHERE id = ?").run(
    helpful ? 1 : 0,
    row.id,
  );
  const updated = db
    .prepare(`SELECT ${MESSAGE_COLUMNS} FROM conversation_messages WHERE id = ?`)
    .get(row.id) as ConversationMessageRow;
  return messageView(db, updated);
}
