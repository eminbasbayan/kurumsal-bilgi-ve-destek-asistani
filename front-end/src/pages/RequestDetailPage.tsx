import { useState } from "react";
import { Avatar, Button, Card, TextArea } from "@radix-ui/themes";
import { ChatBubbleIcon, FileIcon, PaperPlaneIcon } from "@radix-ui/react-icons";
import { go } from "../app/navigation";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import type { SupportRequest } from "../types";

export function RequestDetailPage({
  item,
  addMessage,
}: {
  item?: SupportRequest;
  addMessage: (id: number, text: string) => void;
}) {
  const [message, setMessage] = useState("");
  if (!item)
    return (
      <>
        <PageHeader
          title="Talep bulunamadı"
          description="Aradığınız talep mevcut değil."
        />
        <EmptyState
          title="Kayıt bulunamadı"
          text="Diğer taleplerinizi görüntüleyebilirsiniz."
          action={
            <Button onClick={() => go("requests")}>Taleplerime dön</Button>
          }
        />
      </>
    );
  return (
    <>
      <Button
        className="back-link"
        variant="ghost"
        color="gray"
        onClick={() => go("requests")}
      >
        ← Taleplerime dön
      </Button>
      <PageHeader
        eyebrow={item.number}
        title={item.subject}
        description={`Son güncelleme: ${item.updatedAt}`}
        action={<StatusBadge value={item.status} />}
      />
      <div className="detail-layout">
        <div className="detail-main">
          <Card className="panel">
            <h2>Talep açıklaması</h2>
            <p className="long-text">{item.description}</p>
            {item.assistantContext && (
              <div className="context">
                <ChatBubbleIcon />
                <div>
                  <strong>Asistan bağlamı</strong>
                  <p>{item.assistantContext}</p>
                </div>
              </div>
            )}
            {item.attachments.length > 0 && (
              <div className="attachments">
                <h3>Ekler</h3>
                {item.attachments.map((name) => (
                  <span className="file-chip" key={name}>
                    <FileIcon />
                    {name}
                  </span>
                ))}
              </div>
            )}
          </Card>
          <Card className="panel">
            <div className="panel-title">
              <div>
                <h2>Yazışmalar</h2>
                <p>Destek ekibiyle bu talep üzerinden iletişim kurun.</p>
              </div>
            </div>
            {item.messages.length ? (
              item.messages.map((entry) => (
                <div className="ticket-message" key={entry.id}>
                  <Avatar
                    fallback={entry.author.slice(0, 2).toUpperCase()}
                    size="2"
                  />
                  <div>
                    <strong>{entry.author}</strong>
                    <small>{entry.date}</small>
                    <p>{entry.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">Henüz bir yazışma yok.</p>
            )}
            <form
              className="reply-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (message.trim()) {
                  addMessage(item.id, message.trim());
                  setMessage("");
                }
              }}
            >
              <TextArea
                placeholder="Mesajınızı yazın…"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <Button type="submit" disabled={!message.trim()}>
                <PaperPlaneIcon /> Mesaj gönder
              </Button>
            </form>
          </Card>
        </div>
        <aside className="detail-aside">
          <Card>
            <h3>Talep özeti</h3>
            <dl>
              {[
                ["Kategori", item.category],
                ["Alt kategori", item.subcategory],
                ["Öncelik", item.priority],
                ["Atanan ekip", item.team],
                ["Oluşturulma", item.createdAt],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card>
            <h3>Talep geçmişi</h3>
            <ol className="timeline">
              {item.timeline.map((entry, index) => (
                <li key={index}>
                  <span />
                  <div>
                    <strong>{entry.label}</strong>
                    <small>{entry.date}</small>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
          <Card>
            <p className="note">
              Talep durumu destek ekibi tarafından güncellenir.
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}
