import { useMemo, useState } from "react";
import { Button, Card, Select, Tabs, TextField } from "@radix-ui/themes";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { OPEN_STATUSES, REQUEST_STATUSES, go } from "../app/navigation";
import { PageHeader } from "../components/PageHeader";
import { RequestTable } from "../components/RequestTable";
import { categories } from "../data";
import type { SupportRequest } from "../types";

export function RequestsPage({ items }: { items: SupportRequest[] }) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          `${item.number} ${item.subject}`
            .toLocaleLowerCase("tr-TR")
            .includes(query.toLocaleLowerCase("tr-TR")) &&
          (scope === "all" ||
            (scope === "open") === OPEN_STATUSES.includes(item.status)) &&
          (category === "all" || category === item.category) &&
          (status === "all" || status === item.status),
      ),
    [items, query, scope, category, status],
  );
  return (
    <>
      <PageHeader
        eyebrow="DESTEK"
        title="Taleplerim"
        description="Destek taleplerinizi arayın, filtreleyin ve güncel durumlarını görüntüleyin."
        action={
          <Button onClick={() => go("new")}>
            <PlusIcon /> Yeni talep
          </Button>
        }
      />
      <Card className="requests-card">
        <Tabs.Root value={scope} onValueChange={setScope}>
          <Tabs.List>
            <Tabs.Trigger value="all">Tümü ({items.length})</Tabs.Trigger>
            <Tabs.Trigger value="open">
              Açık ({items.filter((item) => OPEN_STATUSES.includes(item.status)).length})
            </Tabs.Trigger>
            <Tabs.Trigger value="closed">
              Tamamlanan (
              {items.filter((item) => !OPEN_STATUSES.includes(item.status)).length}
              )
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
        <div className="filters">
          <TextField.Root
            placeholder="Talep numarası veya konu ara"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon />
            </TextField.Slot>
          </TextField.Root>
          <Select.Root value={category} onValueChange={setCategory}>
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="all">Tüm kategoriler</Select.Item>
              {Object.keys(categories).map((name) => (
                <Select.Item key={name} value={name}>
                  {name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Select.Root value={status} onValueChange={setStatus}>
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="all">Tüm durumlar</Select.Item>
              {REQUEST_STATUSES.map((name) => (
                <Select.Item key={name} value={name}>
                  {name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Button
            variant="ghost"
            color="gray"
            onClick={() => {
              setQuery("");
              setScope("all");
              setCategory("all");
              setStatus("all");
            }}
          >
            <ReloadIcon /> Temizle
          </Button>
        </div>
        <p className="result-count">{filtered.length} talep gösteriliyor</p>
        <RequestTable items={filtered} />
      </Card>
    </>
  );
}
