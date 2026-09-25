import { ChevronRightIcon } from "@radix-ui/react-icons";
import type { RequestListItem } from "../types";
import { formatDateTime } from "../utils/date";
import { EmptyState } from "./EmptyState";
import { StatusBadge } from "./StatusBadge";

export function RequestTable({ items }: { items: RequestListItem[] }) {
  if (!items.length)
    return (
      <EmptyState
        title="Talep bulunamadı"
        text="Arama veya filtrelerinizi değiştirerek tekrar deneyin."
      />
    );
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Talep</th><th>Kategori</th><th>Durum</th><th>Öncelik</th><th>Güncelleme</th>
            <th><span className="sr-only">Aç</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <small className="request-no">{item.number}</small>
                <a className="request-link" href={`#/request/${item.id}`}>{item.subject}</a>
              </td>
              <td>{item.category}<small>{item.subcategory}</small></td>
              <td><StatusBadge value={item.status} /></td>
              <td><span className={`priority-${item.priority === "Yüksek" ? "high" : "other"}`}>{item.priority}</span></td>
              <td className="numeric">{formatDateTime(item.updatedAt)}</td>
              <td><ChevronRightIcon /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
