import type { DatabaseSync } from "node:sqlite";
import { DEFAULT_CONVERSATION_TITLE, MAX_QUESTION_LENGTH } from "../../config/constants.js";
import { insertedId, transaction } from "../../db/sql.js";
import { HttpError, limitText } from "../../shared/http.js";
import type { Now } from "../../shared/types.js";
import { getSource, listSources } from "../sources/sources.service.js";
import { replyToQuestion } from "./reply.js";

type ConversationMessageRow = {
  id: number;
  conversation_id: number;
  role: "user" | "assistant";
  text: string;
  source_id: string | null;
  helpful: number | null;
  created_at: string;
};

function messageView(db: DatabaseSync, row: ConversationMessageRow) {
  return {
    id: row.id,
    role: row.role,
    text: row.text,
    createdAt: row.created_at,
    helpful: row.helpful === null ? null : row.helpful === 1,
    source: row.source_id ? getSource(db, row.source_id) : null,
  };
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
        `SELECT id, conversation_id, role, text, source_id, helpful, created_at
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

export function addConversationMessage(
  db: DatabaseSync,
  employeeId: number,
  conversationId: number,
  text: string,
  now: Now,
) {
  const question = text.trim();
  if (!question) throw new HttpError(400, "Soru boş olamaz.");
  limitText(question, MAX_QUESTION_LENGTH, "Soru");
  return transaction(db, () => {
    const conversation = db
      .prepare("SELECT id, title FROM conversations WHERE id = ? AND employee_id = ?")
      .get(conversationId, employeeId) as { id: number; title: string } | undefined;
    if (!conversation) throw new HttpError(404, "Sohbet bulunamadı.");
    const stamp = now().toISOString();
    const userInsert = db
      .prepare(
        `INSERT INTO conversation_messages
          (conversation_id, role, text, source_id, helpful, created_at)
         VALUES (?, 'user', ?, NULL, NULL, ?)`,
      )
      .run(conversation.id, question, stamp);
    const reply = replyToQuestion(question, listSources(db));
    const assistantInsert = db
      .prepare(
        `INSERT INTO conversation_messages
          (conversation_id, role, text, source_id, helpful, created_at)
         VALUES (?, 'assistant', ?, ?, NULL, ?)`,
      )
      .run(conversation.id, reply.text, reply.source?.id ?? null, stamp);
    const title =
      conversation.title === DEFAULT_CONVERSATION_TITLE
        ? question.slice(0, 80)
        : conversation.title;
    db.prepare("UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?").run(
      title,
      stamp,
      conversation.id,
    );
    const user = db
      .prepare(
        `SELECT id, conversation_id, role, text, source_id, helpful, created_at
         FROM conversation_messages WHERE id = ?`,
      )
      .get(insertedId(userInsert)) as ConversationMessageRow;
    const assistant = db
      .prepare(
        `SELECT id, conversation_id, role, text, source_id, helpful, created_at
         FROM conversation_messages WHERE id = ?`,
      )
      .get(insertedId(assistantInsert)) as ConversationMessageRow;
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
    .prepare(
      `SELECT id, conversation_id, role, text, source_id, helpful, created_at
       FROM conversation_messages WHERE id = ?`,
    )
    .get(row.id) as ConversationMessageRow;
  return messageView(db, updated);
}
