import { Button, Card } from "@radix-ui/themes";
import { BellIcon, CheckCircledIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import type { NotificationItem } from "../types";

export function NotificationsPage({
  items,
  read,
  readAll,
}: {
  items: NotificationItem[];
  read: (id: number, requestId?: number) => void;
  readAll: () => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="HESAP"
        title="Bildirimler"
        description="Destek taleplerinizle ilgili son gelişmeleri takip edin."
        action={
          <Button
            variant="soft"
            disabled={!items.some((item) => !item.read)}
            onClick={readAll}
          >
            <CheckCircledIcon /> Tümünü okundu işaretle
          </Button>
        }
      />
      <Card className="notifications">
        {items.length ? (
          items.map((item) => (
            <button
              key={item.id}
              className={`notification ${item.read ? "" : "unread"}`}
              onClick={() => read(item.id, item.requestId)}
            >
              <span className="notification-icon">
                <BellIcon />
              </span>
              <span>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
                <small>{item.date}</small>
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
