import { ChevronRightIcon } from "@radix-ui/react-icons";
import type { SupportRequestListItem } from "../types";
import { formatDateTime } from "../utils/date";
import { EmptyState } from "./EmptyState";
import { StatusBadge } from "./StatusBadge";

export function SupportQueueTable({
  items,
}: {
  items: SupportRequestListItem[];
}) {
  if (!items.length)
    return (
      <EmptyState
        title="Talep bulunamadı"
        text="Arama veya süzgeçlerinizi değiştirerek tekrar deneyin."
      />
    );
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Talep</th>
            <th>Çalışan</th>
            <th>Durum</th>
            <th>Öncelik</th>
            <th>Atanan</th>
            <th>Oluşturulma</th>
            <th>
              <span className="sr-only">Aç</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <small className="request-no">{item.number}</small>
                <a className="request-link" href={`#/request/${item.id}`}>
                  {item.subject}
                </a>
              </td>
              <td>
                {item.employee.name}
                <small>{item.employee.department}</small>
              </td>
              <td>
                <StatusBadge value={item.status} />
              </td>
              <td>
                <span
                  className={`priority-${item.priority === "Yüksek" ? "high" : "other"}`}
                >
                  {item.priority}
                </span>
              </td>
              <td>{item.assignee?.name ?? "Atanmamış"}</td>
              <td className="numeric">{formatDateTime(item.createdAt)}</td>
              <td>
                <ChevronRightIcon />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
