import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
import { PageHeader } from "../components/PageHeader";
import type { Conversation, ConversationMessage } from "../types";
import { formatDateTime } from "../utils/date";

const SUGGESTIONS = [
  "Yıllık izin nasıl kullanılır?",
  "VPN bağlantısını nasıl kurarım?",
  "Bordroma nereden ulaşırım?",
  "Masraf belgesi nasıl yüklenir?",
];

export function AssistantPage({
  escalate,
}: {
  escalate: (context: string) => void;
}) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState(
    sessionStorage.getItem("assistant-question") || "",
  );
  const [conversationId, setConversationId] = useState<number>();
  const [sourceId, setSourceId] = useState<string>();

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

  const send = useMutation({
    mutationFn: async (question: string) => {
      let id = conversationId;
      if (!id) {
        const created = await createConversation();
        id = created.id;
      }
      const result = await sendConversationMessage(id, question);
      return { id, result };
    },
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
    feedback.error?.message;

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
                      onClick={() => submit(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <Message
                  key={message.id}
                  message={message}
                  onSource={(id) => setSourceId(id)}
                  onFeedback={(helpful) =>
                    feedback.mutate({ id: message.id, helpful })
                  }
                />
              ))
            )}
            {send.isPending && (
              <div className="chat-row assistant">
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
                const question = [...messages]
                  .reverse()
                  .find((message) => message.role === "user");
                escalate(
                  `${question?.text ?? ""}\n\n${last?.text ?? ""}${last?.source ? `\nKaynak: ${last.source.title}` : ""}`,
                );
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
            {[
              "İnsan Kaynakları",
              "Bilgi Teknolojileri",
              "Finans ve Masraflar",
              "İşyeri Hizmetleri",
            ].map((area) => (
              <p className="knowledge" key={area}>
                <CheckCircledIcon /> {area}
              </p>
            ))}
          </Card>
        </aside>
      </div>

      <Dialog.Root
        open={Boolean(sourceId)}
        onOpenChange={(open) => !open && setSourceId(undefined)}
      >
        <Dialog.Content maxWidth="560px">
          <Dialog.Title>{source.data?.title ?? "Kaynak"}</Dialog.Title>
          <Dialog.Description>
            {source.data?.section ?? "Kaynak bilgisi yükleniyor."}
          </Dialog.Description>
          <div className="source-body">
            <Badge>DEMO KAYNAK</Badge>
            {source.isPending ? (
              <p>Kaynak yükleniyor…</p>
            ) : (
              <blockquote>{source.data?.excerpt}</blockquote>
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
}: {
  message: ConversationMessage;
  onSource: (id: string) => void;
  onFeedback: (helpful: boolean) => void;
}) {
  return (
    <div className={`chat-row ${message.role}`}>
      <div className="bubble">
        <strong>{message.role === "user" ? "Siz" : "Bilgi Asistanı"}</strong>
        <p>{message.text}</p>
        <small>{formatDateTime(message.createdAt)}</small>
        {message.role === "assistant" && (
          <div className="message-tools">
            {message.source && (
              <Button
                size="1"
                variant="soft"
                onClick={() => onSource(message.source!.id)}
              >
                <FileIcon /> Kaynağı aç
              </Button>
            )}
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
