import { useState, type FormEvent } from "react";
import { Button, Card, IconButton, Select, TextArea, TextField } from "@radix-ui/themes";
import {
  ChatBubbleIcon,
  Cross2Icon,
  FileIcon,
  PaperPlaneIcon,
} from "@radix-ui/react-icons";
import { go } from "../app/navigation";
import { PageHeader } from "../components/PageHeader";
import { categories } from "../data";
import type { Priority, RequestDraft } from "../types";

function suggestedCategory(context: string): [string, string] {
  const normalized = context.toLocaleLowerCase("tr-TR");
  if (normalized.includes("vpn"))
    return ["Bilgi Teknolojileri", "VPN ve Uzaktan Erişim"];
  if (normalized.includes("bordro")) return ["İnsan Kaynakları", "Bordro"];
  if (normalized.includes("masraf"))
    return ["Finans ve İdari İşler", "Masraf Bildirimi"];
  if (context) return ["İnsan Kaynakları", "İzinler"];
  return ["", ""];
}

export function NewRequestPage({
  context,
  create,
}: {
  context: string;
  create: (draft: RequestDraft) => void;
}) {
  const suggested = suggestedCategory(context);
  const [draft, setDraft] = useState<RequestDraft>({
    category: suggested[0],
    subcategory: suggested[1],
    subject: "",
    description: "",
    priority: "Normal",
    attachments: [],
    assistantContext: context,
  });
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !draft.category ||
      !draft.subcategory ||
      !draft.subject.trim() ||
      !draft.description.trim()
    ) {
      setError(
        "Kategori, alt kategori, konu ve açıklama alanlarını tamamlayın.",
      );
      return;
    }
    setError("");
    create(draft);
  };
  const files = (list: FileList | null) => {
    const selected = Array.from(list || []);
    if (
      selected.some(
        (file) =>
          file.size > 5 * 1024 * 1024 ||
          !["application/pdf", "image/png", "image/jpeg"].includes(file.type),
      )
    ) {
      setError(
        "Dosyalar PDF, PNG veya JPG olmalı ve 5 MB sınırını aşmamalıdır.",
      );
      return;
    }
    setError("");
    setDraft((current) => ({
      ...current,
      attachments: selected.map((file) => file.name),
    }));
  };
  return (
    <>
      <PageHeader
        eyebrow="DESTEK"
        title="Yeni Destek Talebi"
        description="Talebinizi doğru ekibe yönlendirebilmemiz için ayrıntıları paylaşın."
      />
      <form className="form-layout" onSubmit={submit}>
        <Card className="form-card">
          <div className="panel-title">
            <div>
              <h2>Talep bilgileri</h2>
              <p>Zorunlu alanlar * ile işaretlenmiştir.</p>
            </div>
          </div>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <div className="form-grid">
            <label className="field">
              Kategori *
              <Select.Root
                value={draft.category}
                onValueChange={(value) =>
                  setDraft({ ...draft, category: value, subcategory: "" })
                }
              >
                <Select.Trigger placeholder="Kategori seçin" />
                <Select.Content>
                  {Object.keys(categories).map((name) => (
                    <Select.Item key={name} value={name}>
                      {name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>
            <label className="field">
              Alt kategori *
              <Select.Root
                value={draft.subcategory}
                onValueChange={(value) =>
                  setDraft({ ...draft, subcategory: value })
                }
                disabled={!draft.category}
              >
                <Select.Trigger placeholder="Alt kategori seçin" />
                <Select.Content>
                  {(categories[draft.category] || []).map((name) => (
                    <Select.Item key={name} value={name}>
                      {name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>
          </div>
          <label className="field">
            Konu *
            <TextField.Root
              size="3"
              maxLength={100}
              placeholder="Talebinizi kısa ve açık biçimde özetleyin"
              value={draft.subject}
              onChange={(event) =>
                setDraft({ ...draft, subject: event.target.value })
              }
            />
            <small>{draft.subject.length}/100</small>
          </label>
          <label className="field">
            Açıklama *
            <TextArea
              rows={7}
              placeholder="Sorunu, beklediğiniz sonucu ve varsa aldığınız hata mesajını açıklayın."
              value={draft.description}
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
            />
          </label>
          <fieldset className="field">
            <legend>Öncelik</legend>
            <div className="priority-options">
              {(["Düşük", "Normal", "Yüksek"] as Priority[]).map((priority) => (
                <label
                  className={draft.priority === priority ? "selected" : ""}
                  key={priority}
                >
                  <input
                    type="radio"
                    name="priority"
                    checked={draft.priority === priority}
                    onChange={() => setDraft({ ...draft, priority })}
                  />
                  <span>
                    <strong>{priority}</strong>
                    <small>
                      {priority === "Yüksek"
                        ? "İş akışını engelliyor"
                        : priority === "Normal"
                          ? "Günlük çalışmayı etkiliyor"
                          : "Acil olmayan istek"}
                    </small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="field">
            Ek dosyalar
            <div className="file-picker">
              <FileIcon />
              <span>Dosyaları seçmek için tıklayın</span>
              <small>PDF, PNG veya JPG · En fazla 5 MB</small>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                multiple
                onChange={(event) => files(event.target.files)}
              />
            </div>
            {draft.attachments.map((name) => (
              <span className="file-chip" key={name}>
                <FileIcon />
                {name}
              </span>
            ))}
          </label>
          {draft.assistantContext && (
            <div className="context">
              <ChatBubbleIcon />
              <div>
                <strong>Bilgi asistanı bağlamı</strong>
                <p>{draft.assistantContext}</p>
              </div>
              <IconButton
                type="button"
                variant="ghost"
                aria-label="Asistan bağlamını kaldır"
                onClick={() => setDraft({ ...draft, assistantContext: "" })}
              >
                <Cross2Icon />
              </IconButton>
            </div>
          )}
          <div className="form-actions">
            <Button
              type="button"
              variant="soft"
              color="gray"
              onClick={() => go("home")}
            >
              Vazgeç
            </Button>
            <Button type="submit">
              <PaperPlaneIcon /> Talebi gönder
            </Button>
          </div>
        </Card>
        <aside className="form-aside">
          <Card>
            <h3>İyi bir talep için</h3>
            <ul>
              <li>Sorunu net bir başlıkla özetleyin.</li>
              <li>Ne zaman başladığını belirtin.</li>
              <li>Aldığınız hata mesajını ekleyin.</li>
              <li>Kişisel veya hassas veri paylaşmayın.</li>
            </ul>
          </Card>
          <Card>
            <p className="note">
              Dosyalar bu demoda yalnızca adlarıyla saklanır; sunucuya
              yüklenmez.
            </p>
          </Card>
        </aside>
      </form>
    </>
  );
}
