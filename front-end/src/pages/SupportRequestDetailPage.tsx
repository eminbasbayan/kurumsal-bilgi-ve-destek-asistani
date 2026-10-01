import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Avatar, Badge, Button, Card, Select, TextArea } from "@radix-ui/themes";
import { ChatBubbleIcon, FileIcon, PaperPlaneIcon } from "@radix-ui/react-icons";
import {
  addSupportMessage,
  addSupportNote,
  assignSupportRequest,
  changeSupportRequestStatus,
  claimSupportRequest,
  getSupportRequest,
  listSupportStaff,
} from "../api/support";
import { ApiError } from "../api/client";
import { go, STATUS_TRANSITIONS } from "../app/navigation";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import type {
  Employee,
  RequestStatus,
  SupportRequestDetail,
} from "../types";
import { formatDateTime } from "../utils/date";

const CLOSED_MESSAGE = "Kapatılmış talepte işlem yapılamaz.";

function rememberDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  id: number,
  updated: SupportRequestDetail,
) {
  queryClient.setQueryData(["support", "request", id], updated);
  void queryClient.invalidateQueries({ queryKey: ["support", "summary"] });
  void queryClient.invalidateQueries({ queryKey: ["support", "requests"] });
  void queryClient.invalidateQueries({ queryKey: ["support", "staff"] });
}

function visibleError(error: Error | null): string | null {
  if (!error || (error instanceof ApiError && error.status === 409)) return null;
  return error.message;
}

function refreshAfterConflict(
  queryClient: ReturnType<typeof useQueryClient>,
  id: number,
  error: Error,
) {
  if (!(error instanceof ApiError) || error.status !== 409) return;
  void queryClient.invalidateQueries({ queryKey: ["support", "request", id] });
  void queryClient.invalidateQueries({ queryKey: ["support", "summary"] });
  void queryClient.invalidateQueries({ queryKey: ["support", "requests"] });
  void queryClient.invalidateQueries({ queryKey: ["support", "staff"] });
}

export function SupportRequestDetailPage({
  id,
  profile,
}: {
  id?: number;
  profile: Employee;
}) {
  const queryClient = useQueryClient();
  const [assigneeId, setAssigneeId] = useState("");
  const [pickedStatus, setPickedStatus] = useState<RequestStatus | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [conflict, setConflict] = useState<string | null>(null);
  const request = useQuery({
    queryKey: ["support", "request", id],
    queryFn: () => getSupportRequest(id!),
    enabled: Number.isInteger(id),
    retry: false,
  });
  const staff = useQuery({
    queryKey: ["support", "staff"],
    queryFn: listSupportStaff,
    enabled: request.isSuccess && request.data.status !== "Kapatıldı",
  });
  const onError = (error: Error) => {
    if (error instanceof ApiError && error.status === 409) {
      setConflict(error.message);
      if (Number.isInteger(id)) refreshAfterConflict(queryClient, id!, error);
      return;
    }
    setConflict(null);
  };
  const saved = (updated: SupportRequestDetail) => {
    setConflict(null);
    rememberDetail(queryClient, id!, updated);
  };
  const claim = useMutation({
    mutationFn: () => claimSupportRequest(id!),
    onSuccess: saved,
    onError,
  });
  const assign = useMutation({
    mutationFn: (input: { assigneeId: number; expectedUpdatedAt: string }) =>
      assignSupportRequest(id!, input.assigneeId, input.expectedUpdatedAt),
    onSuccess: (updated) => {
      saved(updated);
      setAssigneeId("");
    },
    onError,
  });
  const changeStatus = useMutation({
    mutationFn: (input: {
      status: RequestStatus;
      reason?: string;
      expectedUpdatedAt: string;
    }) => changeSupportRequestStatus(id!, input),
    onSuccess: (updated) => {
      saved(updated);
      setPickedStatus(null);
      setReason("");
    },
    onError,
  });
  const sendMessage = useMutation({
    mutationFn: (text: string) => addSupportMessage(id!, text),
    onSuccess: (updated) => {
      saved(updated);
      setMessage("");
    },
    onError,
  });
  const saveNote = useMutation({
    mutationFn: (text: string) => addSupportNote(id!, text),
    onSuccess: (updated) => {
      saved(updated);
      setNote("");
    },
    onError,
  });

  if (!Number.isInteger(id) || request.isError)
    return (
      <>
        <PageHeader
          title="Talep bulunamadı"
          description="Aradığınız talep ekibinizin kuyruğunda yok."
        />
        <EmptyState
          title="Kayıt bulunamadı"
          text="Başka bir ekibin talebi bu ekranda görünmez."
          action={
            <Button onClick={() => go("queue")}>Ekip kuyruğuna dön</Button>
          }
        />
      </>
    );

  if (request.isPending || !request.data)
    return <p className="muted">Talep yükleniyor…</p>;

  const item = request.data;
  const closed = item.status === "Kapatıldı";
  const assignedToMe = item.assignee?.id === profile.id;
  const transitions = STATUS_TRANSITIONS[item.status];
  const nextStatus =
    pickedStatus && transitions.includes(pickedStatus)
      ? pickedStatus
      : transitions[0];
  const refreshing = request.isFetching;
  const assigneeHint = item.assignee
    ? "Durumu değiştirmek ve çalışana mesaj göndermek için talebin size atanmış olması gerekir. Başka bir personele atanmış talebi üstlenmek için atama işlemini kullanın."
    : "Durumu değiştirmek ve çalışana mesaj göndermek için talebi üstlenin veya kendinize atayın.";

  return (
    <>
      <Button
        className="back-link"
        variant="ghost"
        color="gray"
        onClick={() => go("queue")}
      >
        ← Ekip kuyruğuna dön
      </Button>
      <PageHeader
        eyebrow={item.number}
        title={item.subject}
        description={`Son güncelleme: ${formatDateTime(item.updatedAt)} · Demo destek kaydı`}
        action={<StatusBadge value={item.status} />}
      />
      <div className="detail-layout support-detail">
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
                <p className="note">
                  Dosya içeriği saklanmaz. Yalnızca ad, tür ve boyut bilgisi
                  tutulur.
                </p>
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
                <p>
                  Çalışana giden mesajlar demo kayıtlardır. Canlı bir destek
                  hizmeti değildir.
                </p>
              </div>
            </div>
            {item.messages.length ? (
              item.messages.map((entry) => (
                <div className="ticket-message" key={entry.id}>
                  <Avatar
                    fallback={entry.author.slice(0, 2).toLocaleUpperCase("tr-TR")}
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
            {visibleError(sendMessage.error) && (
              <div className="form-error" role="alert">
                {visibleError(sendMessage.error)}
              </div>
            )}
            {closed ? (
              <p className="note">{CLOSED_MESSAGE}</p>
            ) : assignedToMe ? (
              <form
                className="reply-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (message.trim()) sendMessage.mutate(message.trim());
                }}
              >
                <label className="field">
                  Çalışana mesaj
                  <TextArea
                    maxLength={2000}
                    placeholder="Çalışana görünecek mesajı yazın…"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                </label>
                <Button
                  type="submit"
                  disabled={
                    !message.trim() || sendMessage.isPending || refreshing
                  }
                >
                  <PaperPlaneIcon />{" "}
                  {sendMessage.isPending ? "Gönderiliyor…" : "Mesaj gönder"}
                </Button>
              </form>
            ) : (
              <p className="note">{assigneeHint}</p>
            )}
          </Card>
          <Card className="panel">
            <div className="panel-title">
              <div>
                <h2>İç notlar</h2>
                <p>
                  Yalnızca destek personeli görür. Çalışanın ekranına, bildirimlerine
                  ve sayaçlarına yansımaz.
                </p>
              </div>
              <Badge variant="soft" color="gray">
                İç kayıt
              </Badge>
            </div>
            {item.internalNotes.length ? (
              <div className="note-list">
                {item.internalNotes.map((entry) => (
                  <article key={entry.id}>
                    <strong>{entry.author.name}</strong>
                    <small>{formatDateTime(entry.createdAt)}</small>
                    <p>{entry.text}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">Henüz iç not yok.</p>
            )}
            {visibleError(saveNote.error) && (
              <div className="form-error" role="alert">
                {visibleError(saveNote.error)}
              </div>
            )}
            {closed ? (
              <p className="note">{CLOSED_MESSAGE}</p>
            ) : (
              <form
                className="reply-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (note.trim()) saveNote.mutate(note.trim());
                }}
              >
                <label className="field">
                  İç not
                  <TextArea
                    maxLength={2000}
                    placeholder="Yalnızca ekibin göreceği notu yazın…"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </label>
                <Button
                  type="submit"
                  variant="soft"
                  disabled={!note.trim() || saveNote.isPending || refreshing}
                >
                  {saveNote.isPending ? "Kaydediliyor…" : "İç not ekle"}
                </Button>
              </form>
            )}
          </Card>
        </div>
        <aside className="detail-aside">
          {conflict && (
            <div className="form-error" role="alert">
              {conflict}
            </div>
          )}
          <Card>
            <h3>Talep özeti</h3>
            <dl>
              {[
                ["Çalışan", item.employee.name],
                ["Departman", item.employee.department],
                ["Görev", item.employee.title],
                ["E-posta", item.employee.email],
                ["Kategori", item.category],
                ["Alt kategori", item.subcategory],
                ["Öncelik", item.priority],
                ["Atanan ekip", item.team],
                ["Atanan personel", item.assignee?.name ?? "Atanmamış"],
                ["Oluşturulma", formatDateTime(item.createdAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          {closed ? (
            <Card>
              <p className="note">{CLOSED_MESSAGE}</p>
            </Card>
          ) : (
            <>
              <Card>
                <h3>Atama</h3>
                <p className="note">
                  {item.assignee
                    ? `Atanan: ${item.assignee.name}`
                    : "Bu talep henüz atanmamış."}
                </p>
                {!item.assignee && (
                  <div className="support-action">
                    {visibleError(claim.error) && (
                      <div className="form-error" role="alert">
                        {visibleError(claim.error)}
                      </div>
                    )}
                    <Button
                      onClick={() => claim.mutate()}
                      disabled={claim.isPending || refreshing}
                    >
                      {claim.isPending ? "Üstleniliyor…" : "Üstlen"}
                    </Button>
                  </div>
                )}
                <form
                  className="support-action"
                  onSubmit={(event) => {
                    event.preventDefault();
                    assign.mutate({
                      assigneeId: Number(assigneeId),
                      expectedUpdatedAt: item.updatedAt,
                    });
                  }}
                >
                  <label className="field">
                    Personel
                    <Select.Root
                      value={assigneeId}
                      onValueChange={setAssigneeId}
                    >
                      <Select.Trigger placeholder="Personel seçin" />
                      <Select.Content>
                        {(staff.data?.staff ?? []).map((member) => (
                          <Select.Item key={member.id} value={String(member.id)}>
                            {member.name} ({member.openAssigned} açık talep)
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </label>
                  {staff.isError && (
                    <div className="form-error" role="alert">
                      {staff.error.message}
                    </div>
                  )}
                  {visibleError(assign.error) && (
                    <div className="form-error" role="alert">
                      {visibleError(assign.error)}
                    </div>
                  )}
                  <Button
                    type="submit"
                    variant="soft"
                    disabled={
                      !assigneeId ||
                      Number(assigneeId) === item.assignee?.id ||
                      assign.isPending ||
                      refreshing
                    }
                  >
                    {assign.isPending ? "Atanıyor…" : "Ata"}
                  </Button>
                </form>
              </Card>
              <Card>
                <h3>Durum</h3>
                {assignedToMe && nextStatus ? (
                  <form
                    className="support-action"
                    onSubmit={(event) => {
                      event.preventDefault();
                      changeStatus.mutate({
                        status: nextStatus,
                        expectedUpdatedAt: item.updatedAt,
                        ...(nextStatus === "Kapatıldı"
                          ? { reason: reason.trim() }
                          : {}),
                      });
                    }}
                  >
                    <label className="field">
                      Yeni durum
                      <Select.Root
                        value={nextStatus}
                        onValueChange={(value) =>
                          setPickedStatus(value as RequestStatus)
                        }
                      >
                        <Select.Trigger />
                        <Select.Content>
                          {transitions.map((status) => (
                            <Select.Item key={status} value={status}>
                              {status}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </label>
                    {nextStatus === "Kapatıldı" && (
                      <label className="field">
                        Kapatma gerekçesi
                        <TextArea
                          maxLength={500}
                          required
                          placeholder="Kapatma gerekçesini yazın…"
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                        />
                        <small>
                          Gerekçe çalışana talep geçmişinde görünür.
                        </small>
                      </label>
                    )}
                    {visibleError(changeStatus.error) && (
                      <div className="form-error" role="alert">
                        {visibleError(changeStatus.error)}
                      </div>
                    )}
                    <Button
                      type="submit"
                      disabled={
                        changeStatus.isPending ||
                        refreshing ||
                        (nextStatus === "Kapatıldı" && !reason.trim())
                      }
                    >
                      {changeStatus.isPending
                        ? "Güncelleniyor…"
                        : "Durumu güncelle"}
                    </Button>
                  </form>
                ) : (
                  <p className="note">{assigneeHint}</p>
                )}
              </Card>
            </>
          )}
          <Card>
            <h3>Talep geçmişi</h3>
            <p className="note">İç kayıtlar çalışana gösterilmez.</p>
            <ol className="timeline">
              {item.timeline.map((entry) => (
                <li key={entry.id}>
                  <span />
                  <div>
                    <strong>{entry.label}</strong>
                    {entry.visibility === "internal" && (
                      <Badge variant="soft" color="gray">
                        İç kayıt
                      </Badge>
                    )}
                    {entry.fromStatus && entry.toStatus && (
                      <small>
                        {entry.fromStatus} → {entry.toStatus}
                      </small>
                    )}
                    {entry.detail && (
                      <p className="timeline-detail">
                        {entry.toStatus === "Kapatıldı"
                          ? `Gerekçe: ${entry.detail}`
                          : entry.detail}
                      </p>
                    )}
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
              Demo destek personeli kaydıdır. Canlı bir destek hizmeti değildir.
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}
