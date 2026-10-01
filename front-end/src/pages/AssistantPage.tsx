import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Dialog,
  IconButton,
  TextArea,
  Tooltip,
  Badge,
} from "@radix-ui/themes";
import {
  ChatBubbleIcon,
  CheckCircledIcon,
  ClipboardCopyIcon,
  CrossCircledIcon,
  FileIcon,
  PaperPlaneIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import {
  createConversation,
  getConversation,
  getSource,
  listConversations,
  sendConversationMessage,
  setAssistantFeedback,
} from "../api/assistant";
import { listCategories } from "../api/categories";
import { PageHeader } from "../components/PageHeader";
import type { Conversation, ConversationMessage, SourceDocument } from "../types";
import { formatDateTime } from "../utils/date";
import {
  ASSISTANT_TIMEOUT_MS,
  splitQuotedAnswer,
  withAssistantTimeout,
} from "./assistantReply";
import type { AssistantHandoff, AssistantSource } from "./requestHandoff";

export type { AssistantHandoff } from "./requestHandoff";

const SUGGESTIONS = [
  "Yıllık izin nasıl kullanılır?",
  "VPN bağlantısını nasıl kurarım?",
  "Bordroma nereden ulaşırım?",
  "Masraf belgesi nasıl yüklenir?",
];

function visibleSources(message: ConversationMessage): SourceDocument[] {
  if (message.sources.length > 0) return message.sources;
  return message.source ? [message.source] : [];
}

function toHandoffSource(source: SourceDocument): AssistantSource {
  return {
    id: source.id,
    title: source.title,
    section: source.section,
    category: source.category,
    subcategory: source.subcategory,
  };
}

function handoffFor(
  messages: readonly ConversationMessage[],
  assistantIndex: number,
): AssistantHandoff | null {
  const assistant = messages[assistantIndex];
  if (!assistant || assistant.role !== "assistant") return null;
  const question =
    messages
      .slice(0, assistantIndex)
      .findLast((message) => message.role === "user")?.text ?? "";
  return {
    question,
    answer: assistant.text,
    sources: visibleSources(assistant).map(toHandoffSource),
  };
}

export function AssistantPage({
  escalate,
  responseTimeoutMs = ASSISTANT_TIMEOUT_MS,
}: {
  escalate: (handoff: AssistantHandoff) => void;
  responseTimeoutMs?: number;
}) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState(
    sessionStorage.getItem("assistant-question") || "",
  );
  const [conversationId, setConversationId] = useState<number>();
  const [sourceId, setSourceId] = useState<string>();
  const sourceTrigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    sessionStorage.removeItem("assistant-question");
  }, []);

  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
  });

  const conversation = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversation(conversationId!),
    enabled: Number.isInteger(conversationId),
  });

  const source = useQuery({
    queryKey: ["source", sourceId],
    queryFn: () => getSource(sourceId!),
    enabled: Boolean(sourceId),
  });

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const send = useMutation({
    mutationFn: (question: string) =>
      withAssistantTimeout(async (signal) => {
        let id = conversationId;
        if (!id) {
          const created = await createConversation(undefined, signal);
          id = created.id;
        }
        const result = await sendConversationMessage(id, question, signal);
        return { id, result };
      }, responseTimeoutMs),
    onSuccess: ({ id, result }) => {
      setConversationId(id);
      setInput("");
      queryClient.setQueryData<Conversation>(["conversation", id], (current) =>
        current
          ? {
              ...current,
              updatedAt: result.assistantMessage.createdAt,
              messages: [
                ...current.messages,
                result.userMessage,
                result.assistantMessage,
              ],
            }
          : current,
      );
      void queryClient.invalidateQueries({ queryKey: ["conversation", id] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const feedback = useMutation({
    mutationFn: ({ id, helpful }: { id: number; helpful: boolean }) =>
      setAssistantFeedback(id, helpful),
    onSuccess: (updated) => {
      if (!conversationId) return;
      queryClient.setQueryData<Conversation>(
        ["conversation", conversationId],
        (current) =>
          current
            ? {
                ...current,
                messages: current.messages.map((message) =>
                  message.id === updated.id ? updated : message,
                ),
              }
            : current,
      );
    },
  });

  const messages = conversation.data?.messages ?? [];
  const last = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const submit = (value?: string) => {
    const question = (value ?? input).trim();
    if (!question || send.isPending) return;
    send.mutate(question);
  };

  const error =
    conversations.error?.message ||
    conversation.error?.message ||
    send.error?.message ||
    source.error?.message ||
    feedback.error?.message ||
    categories.error?.message;

  return (
    <>
      <PageHeader
        eyebrow="KURUMSAL BİLGİ"
        title="Bilgi Asistanı"
        description="Sorunuzu doğal biçimde yazın; kurumsal kaynaklara dayalı yanıt alın."
      />
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <div className="assistant-layout">
        <Card className="chat-card">
          <div className="chat-head">
            <span className="chat-icon">
              <ChatBubbleIcon />
            </span>
            <div>
              <h2>Kurumsal Bilgi Asistanı</h2>
              <p>Kaynaklı yanıtlar · Demo</p>
            </div>
            <span className="online">● Hazır</span>
          </div>
          <div className="chat-stream" aria-live="polite">
            {conversation.isPending && conversationId ? (
              <div className="chat-welcome">
                <p>Konuşma yükleniyor…</p>
              </div>
            ) : !messages.length ? (
              <div className="chat-welcome">
                <span className="chat-icon">
                  <ChatBubbleIcon />
                </span>
                <h2>Size nasıl yardımcı olabilirim?</h2>
                <p>
                  Kurumsal süreçler hakkında sorunuzu yazın veya önerilerden
                  birini seçin.
                </p>
                <div className="suggestions">
                  {SUGGESTIONS.map((question) => (
                    <Button
                      key={question}
                      variant="soft"
                      color="gray"
                      disabled={send.isPending}
                      onClick={() => submit(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <Message
                  key={message.id}
                  message={message}
                  onSource={(id, trigger) => {
                    sourceTrigger.current = trigger;
                    setSourceId(id);
                  }}
                  onFeedback={(helpful) =>
                    feedback.mutate({ id: message.id, helpful })
                  }
                  onRequest={
                    message.answerMode === "no_source"
                      ? () => {
                          const handoff = handoffFor(messages, index);
                          if (handoff) escalate(handoff);
                        }
                      : undefined
                  }
                />
              ))
            )}
            {send.isPending && (
              <div className="chat-row assistant" role="status">
                <div className="bubble">Yanıt hazırlanıyor…</div>
              </div>
            )}
          </div>
          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <TextArea
              maxLength={1000}
              placeholder="Kurumsal süreçler hakkında bir soru yazın…"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            {send.isError && (
              <Button
                type="button"
                variant="soft"
                color="gray"
                disabled={send.isPending || !input.trim()}
                onClick={() => submit()}
              >
                Tekrar dene
              </Button>
            )}
            <Button type="submit" disabled={!input.trim() || send.isPending}>
              <PaperPlaneIcon /> Gönder
            </Button>
          </form>
          <p className="chat-disclaimer">
            Yanıtlar örnek dokümanlara dayanır. Kritik işlemlerde ilgili
            birimden doğrulama alın.
          </p>
        </Card>

        <aside className="assistant-aside">
          <Card>
            <p className="eyebrow">DESTEK GEREKİYOR MU?</p>
            <h2>Yanıt yeterli olmadıysa</h2>
            <p>
              Sorunuzu ve asistan yanıtını destek talebine aktarabilirsiniz.
            </p>
            <Button
              variant="soft"
              disabled={!last}
              onClick={() => {
                const assistantIndex = messages.findLastIndex(
                  (message) => message.role === "assistant",
                );
                const handoff = handoffFor(messages, assistantIndex);
                if (handoff) escalate(handoff);
              }}
            >
              <PlusIcon /> Talep oluştur
            </Button>
          </Card>

          <Card>
            <div className="panel-title">
              <div>
                <h3>Önceki sohbetler</h3>
                <p>Demo API’de kayıtlı konuşmalar</p>
              </div>
              <Button
                size="1"
                variant="ghost"
                onClick={() => setConversationId(undefined)}
              >
                Yeni
              </Button>
            </div>
            {conversations.isPending ? (
              <p className="muted">Sohbetler yükleniyor…</p>
            ) : (conversations.data?.conversations ?? []).length ? (
              (conversations.data?.conversations ?? []).map((item) => (
                <Button
                  key={item.id}
                  variant={item.id === conversationId ? "soft" : "ghost"}
                  color="gray"
                  onClick={() => setConversationId(item.id)}
                >
                  {item.title}
                </Button>
              ))
            ) : (
              <p className="muted">Henüz kayıtlı sohbet yok.</p>
            )}
          </Card>

          <Card>
            <h3>Bilgi alanları</h3>
            {categories.isPending ? (
              <p className="muted">Bilgi alanları yükleniyor…</p>
            ) : (
              (categories.data?.categories ?? []).map((area) => (
                <p className="knowledge" key={area.name}>
                  <CheckCircledIcon /> {area.name}
                </p>
              ))
            )}
          </Card>
        </aside>
      </div>

      <Dialog.Root
        open={Boolean(sourceId)}
        onOpenChange={(open) => !open && setSourceId(undefined)}
      >
        <Dialog.Content
          maxWidth="560px"
          onCloseAutoFocus={(event) => {
            if (sourceTrigger.current?.isConnected) {
              event.preventDefault();
              sourceTrigger.current.focus();
            }
          }}
        >
          <Dialog.Title>{source.data?.title ?? "Kaynak"}</Dialog.Title>
          <Dialog.Description>
            {source.data?.section ?? "Kaynak bilgisi yükleniyor."}
          </Dialog.Description>
          <div className="source-body">
            <Badge>DEMO KAYNAK</Badge>
            {source.isPending ? (
              <p>Kaynak yükleniyor…</p>
            ) : (
              <blockquote>{source.data?.body}</blockquote>
            )}
            {source.data && (
              <p>Son güncelleme: {formatDateTime(source.data.updatedAt)}</p>
            )}
          </div>
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Kapat
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}

function Message({
  message,
  onSource,
  onFeedback,
  onRequest,
}: {
  message: ConversationMessage;
  onSource: (id: string, trigger: HTMLButtonElement) => void;
  onFeedback: (helpful: boolean) => void;
  onRequest?: () => void;
}) {
  const sources = visibleSources(message);
  return (
    <div className={`chat-row ${message.role}`}>
      <div className="bubble">
        <div className="bubble-head">
          <strong>{message.role === "user" ? "Siz" : "Bilgi Asistanı"}</strong>
          {message.role === "assistant" && message.answerMode === "generated" && (
            <Badge variant="soft" color="gray">
              Üretilmiş yanıt
            </Badge>
          )}
        </div>
        <AnswerBody message={message} onRequest={onRequest} />
        <small>{formatDateTime(message.createdAt)}</small>
        {message.role === "assistant" && (
          <div className="message-tools">
            {sources.map((source) => (
              <Button
                key={source.id}
                size="1"
                variant="soft"
                className="source-chip"
                title={`${source.title} · ${source.section}`}
                onClick={(event) => onSource(source.id, event.currentTarget)}
              >
                <FileIcon />
                <span className="source-chip-label">
                  {sources.length === 1
                    ? "Kaynağı aç"
                    : `${source.title} · ${source.section}`}
                </span>
              </Button>
            ))}
            <Tooltip content="Yanıtı kopyala">
              <IconButton
                size="1"
                variant="ghost"
                aria-label="Yanıtı kopyala"
                onClick={() => navigator.clipboard?.writeText(message.text)}
              >
                <ClipboardCopyIcon />
              </IconButton>
            </Tooltip>
            <Tooltip content="Faydalı">
              <IconButton
                size="1"
                variant={message.helpful === true ? "soft" : "ghost"}
                aria-label="Faydalı"
                aria-pressed={message.helpful === true}
                onClick={() => onFeedback(true)}
              >
                <CheckCircledIcon />
              </IconButton>
            </Tooltip>
            <Tooltip content="Faydalı değil">
              <IconButton
                size="1"
                variant={message.helpful === false ? "soft" : "ghost"}
                aria-label="Faydalı değil"
                aria-pressed={message.helpful === false}
                onClick={() => onFeedback(false)}
              >
                <CrossCircledIcon />
              </IconButton>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}

function AnswerBody({
  message,
  onRequest,
}: {
  message: ConversationMessage;
  onRequest?: () => void;
}) {
  if (message.role === "assistant" && message.answerMode === "quote") {
    const parts = splitQuotedAnswer(message.text);
    return (
      <>
        {parts.intro ? <p>{parts.intro}</p> : null}
        <blockquote className="answer-quote">{parts.quote}</blockquote>
        {parts.remainder ? <p>{parts.remainder}</p> : null}
      </>
    );
  }
  if (message.role === "assistant" && message.answerMode === "no_source") {
    return (
      <div className="answer-missing">
        <p className="eyebrow">Kaynak bulunamadı</p>
        <p>{message.text}</p>
        {onRequest && (
          <Button size="1" variant="soft" onClick={onRequest}>
            <PlusIcon /> Destek talebi oluştur
          </Button>
        )}
      </div>
    );
  }
  return <p>{message.text}</p>;
}
