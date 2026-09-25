import { useEffect, useState } from "react";
import { Button, Card, Dialog, IconButton, TextArea, Tooltip, Badge } from "@radix-ui/themes";
import {
  ChatBubbleIcon,
  CheckCircledIcon,
  ClipboardCopyIcon,
  FileIcon,
  PaperPlaneIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { PageHeader } from "../components/PageHeader";
import type { SourceDocument } from "../types";
import { reply } from "./assistantReply";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
  source?: SourceDocument;
};

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
  const [input, setInput] = useState(
    sessionStorage.getItem("assistant-question") || "",
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [source, setSource] = useState<SourceDocument | null>(null);
  useEffect(() => {
    sessionStorage.removeItem("assistant-question");
  }, []);
  const send = (value?: string) => {
    const question = (value ?? input).trim();
    if (!question || typing) return;
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", text: question },
    ]);
    setInput("");
    setTyping(true);
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: "assistant", ...reply(question) },
      ]);
      setTyping(false);
    }, 600);
  };
  const last = [...messages].reverse().find((message) => message.role === "assistant");
  return (
    <>
      <PageHeader
        eyebrow="KURUMSAL BİLGİ"
        title="Bilgi Asistanı"
        description="Sorunuzu doğal biçimde yazın; kurumsal kaynaklara dayalı yanıt alın."
      />
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
            {!messages.length && (
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
                      onClick={() => send(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message) => (
              <div className={`chat-row ${message.role}`} key={message.id}>
                <div className="bubble">
                  <strong>
                    {message.role === "user" ? "Siz" : "Bilgi Asistanı"}
                  </strong>
                  <p>{message.text}</p>
                  {message.source && (
                    <div className="message-tools">
                      <Button
                        size="1"
                        variant="soft"
                        onClick={() => setSource(message.source || null)}
                      >
                        <FileIcon /> Kaynağı aç
                      </Button>
                      <Tooltip content="Yanıtı kopyala">
                        <IconButton
                          size="1"
                          variant="ghost"
                          aria-label="Yanıtı kopyala"
                          onClick={() =>
                            navigator.clipboard?.writeText(message.text)
                          }
                        >
                          <ClipboardCopyIcon />
                        </IconButton>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="chat-row assistant">
                <div className="bubble">Yanıt hazırlanıyor…</div>
              </div>
            )}
          </div>
          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <TextArea
              placeholder="Kurumsal süreçler hakkında bir soru yazın…"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <Button type="submit" disabled={!input.trim() || typing}>
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
              onClick={() =>
                escalate(
                  `${messages.filter((message) => message.role === "user").at(-1)?.text}\n\n${last?.text}\nKaynak: ${last?.source?.title}`,
                )
              }
            >
              <PlusIcon /> Talep oluştur
            </Button>
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
        open={!!source}
        onOpenChange={(open) => !open && setSource(null)}
      >
        <Dialog.Content maxWidth="560px">
          <Dialog.Title>{source?.title}</Dialog.Title>
          <Dialog.Description>{source?.section}</Dialog.Description>
          <div className="source-body">
            <Badge>DEMO KAYNAK</Badge>
            <blockquote>{source?.excerpt}</blockquote>
            <p>Son güncelleme: {source?.updatedAt}</p>
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
