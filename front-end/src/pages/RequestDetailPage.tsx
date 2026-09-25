import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Avatar, Button, Card, TextArea } from "@radix-ui/themes";
import {
  ChatBubbleIcon,
  FileIcon,
  PaperPlaneIcon,
} from "@radix-ui/react-icons";
import { addRequestMessage, getRequest } from "../api/requests";
import { go } from "../app/navigation";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { formatDateTime } from "../utils/date";

export function RequestDetailPage({ id }: { id?: number }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const request = useQuery({
    queryKey: ["request", id],
    queryFn: () => getRequest(id!),
    enabled: Number.isInteger(id),
    retry: false,
  });
  const sendMessage = useMutation({
    mutationFn: (text: string) => addRequestMessage(id!, text),
    onSuccess: (updated) => {
      queryClient.setQueryData(["request", id], updated);
      void queryClient.invalidateQueries({ queryKey: ["requests"] });
      setMessage("");
    },
  });

  if (!Number.isInteger(id) || request.isError)
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

  if (request.isPending || !request.data)
    return <p className="muted">Talep yükleniyor…</p>;
  const item = request.data;

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
        description={`Son güncelleme: ${formatDateTime(item.updatedAt)}`}
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
                {item.attachments.map((attachment) => (
                  <span
                    className="file-chip"
                    key={attachment.id ?? attachment.name}
                  >
                    <FileIcon />
                    {attachment.name}
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
                    <small>{formatDateTime(entry.createdAt)}</small>
                    <p>{entry.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">Henüz bir yazışma yok.</p>
            )}
            {sendMessage.isError && (
              <div className="form-error" role="alert">
                {sendMessage.error.message}
              </div>
            )}
            <form
              className="reply-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (message.trim()) sendMessage.mutate(message.trim());
              }}
            >
              <TextArea
                maxLength={2000}
                placeholder="Mesajınızı yazın…"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <Button
                type="submit"
                disabled={!message.trim() || sendMessage.isPending}
              >
                <PaperPlaneIcon />{" "}
                {sendMessage.isPending ? "Gönderiliyor…" : "Mesaj gönder"}
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
                ["Oluşturulma", formatDateTime(item.createdAt)],
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
              {item.timeline.map((entry) => (
                <li key={entry.id}>
                  <span />
                  <div>
                    <strong>{entry.label}</strong>
                    <small>
                      {entry.actor} · {formatDateTime(entry.createdAt)}
                    </small>
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
