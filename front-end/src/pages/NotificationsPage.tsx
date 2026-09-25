import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card } from "@radix-ui/themes";
import {
  BellIcon,
  CheckCircledIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";
import { go } from "../app/navigation";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { formatDateTime } from "../utils/date";

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const read = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => void refresh(),
  });
  const readAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => void refresh(),
  });
  const items = query.data?.notifications ?? [];

  return (
    <>
      <PageHeader
        eyebrow="HESAP"
        title="Bildirimler"
        description="Destek taleplerinizle ilgili son gelişmeleri takip edin."
        action={
          <Button
            variant="soft"
            disabled={!items.some((item) => !item.read) || readAll.isPending}
            onClick={() => readAll.mutate()}
          >
            <CheckCircledIcon /> Tümünü okundu işaretle
          </Button>
        }
      />
      {(query.isError || read.isError || readAll.isError) && (
        <div className="form-error" role="alert">
          {query.error?.message ||
            read.error?.message ||
            readAll.error?.message}
        </div>
      )}
      <Card className="notifications">
        {query.isPending ? (
          <p className="muted">Bildirimler yükleniyor…</p>
        ) : items.length ? (
          items.map((item) => (
            <button
              key={item.id}
              className={`notification ${item.read ? "" : "unread"}`}
              onClick={() => {
                if (!item.read) read.mutate(item.id);
                if (item.requestId) go(`request/${item.requestId}`);
              }}
            >
              <span className="notification-icon">
                <BellIcon />
              </span>
              <span>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
                <small>{formatDateTime(item.createdAt)}</small>
              </span>
              {!item.read && <i />}
              {item.requestId && <ChevronRightIcon />}
            </button>
          ))
        ) : (
          <EmptyState
            title="Bildirim yok"
            text="Yeni bildirimler burada görünecek."
          />
        )}
      </Card>
    </>
  );
}
