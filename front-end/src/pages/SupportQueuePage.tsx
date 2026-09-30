import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { Button, Card, Checkbox, Select, Tabs, TextField } from "@radix-ui/themes";
import { MagnifyingGlassIcon, ReloadIcon } from "@radix-ui/react-icons";
import {
  getSupportSummary,
  listSupportRequests,
  type SupportQueue,
} from "../api/support";
import { OPEN_STATUSES, PRIORITIES, REQUEST_STATUSES } from "../app/navigation";
import { PageHeader } from "../components/PageHeader";
import { SupportQueueTable } from "../components/SupportQueueTable";
import type { Priority, RequestStatus } from "../types";

export function SupportQueuePage() {
  const [queue, setQueue] = useState<SupportQueue>("team");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [scope, setScope] = useState<"all" | "open" | "closed">("open");
  const [status, setStatus] = useState<RequestStatus | "all">("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [unassigned, setUnassigned] = useState(false);
  const summary = useQuery({
    queryKey: ["support", "summary"],
    queryFn: getSupportSummary,
  });
  const requests = useQuery({
    queryKey: [
      "support",
      "requests",
      { queue, q: deferredQuery, scope, status, priority, unassigned },
    ],
    queryFn: () =>
      listSupportRequests({
        queue,
        q: deferredQuery,
        scope,
        status,
        priority,
        unassigned: queue === "team" && unassigned,
      }),
  });
  const items = requests.data?.requests ?? [];

  return (
    <>
      <PageHeader
        eyebrow="DESTEK PERSONELİ"
        title="Ekip Kuyruğu"
        description={
          summary.data
            ? `${summary.data.team} talepleri. Açık talepler en eski oluşturulan üstte listelenir. Demo kayıtlardır.`
            : "Ekibinizin taleplerini süzün. Açık talepler en eski oluşturulan üstte listelenir."
        }
      />
      <Card className="requests-card">
        <Tabs.Root
          value={queue}
          onValueChange={(value) => {
            const next = value as SupportQueue;
            setQueue(next);
            if (next === "mine") setUnassigned(false);
          }}
        >
          <Tabs.List>
            <Tabs.Trigger value="team">Ekip kuyruğu</Tabs.Trigger>
            <Tabs.Trigger value="mine">Bana atananlar</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
        <div className="filters">
          <TextField.Root
            placeholder="Talep numarası, konu veya çalışan ara"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon />
            </TextField.Slot>
          </TextField.Root>
          <Select.Root
            value={scope}
            onValueChange={(value) => {
              setScope(value as typeof scope);
              setStatus("all");
            }}
          >
            <Select.Trigger aria-label="Kapsam" />
            <Select.Content>
              <Select.Item value="open">Açık talepler</Select.Item>
              <Select.Item value="closed">Tamamlanan</Select.Item>
              <Select.Item value="all">Tümü</Select.Item>
            </Select.Content>
          </Select.Root>
          <Select.Root
            value={status}
            onValueChange={(value) => {
              const next = value as RequestStatus | "all";
              setStatus(next);
              if (next === "all") return;
              setScope(OPEN_STATUSES.includes(next) ? "open" : "closed");
            }}
          >
            <Select.Trigger aria-label="Durum" />
            <Select.Content>
              <Select.Item value="all">Tüm durumlar</Select.Item>
              {REQUEST_STATUSES.map((name) => (
                <Select.Item key={name} value={name}>
                  {name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Select.Root
            value={priority}
            onValueChange={(value) => setPriority(value as Priority | "all")}
          >
            <Select.Trigger aria-label="Öncelik" />
            <Select.Content>
              <Select.Item value="all">Tüm öncelikler</Select.Item>
              {PRIORITIES.map((name) => (
                <Select.Item key={name} value={name}>
                  {name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          {queue === "team" && (
            <label className="filter-check">
              <Checkbox
                checked={unassigned}
                onCheckedChange={(checked) => setUnassigned(checked === true)}
              />
              Yalnızca atanmamış
            </label>
          )}
          <Button
            variant="ghost"
            color="gray"
            onClick={() => {
              setQueue("team");
              setQuery("");
              setScope("open");
              setStatus("all");
              setPriority("all");
              setUnassigned(false);
            }}
          >
            <ReloadIcon /> Temizle
          </Button>
        </div>
        {requests.isError && (
          <div className="form-error" role="alert">
            {requests.error.message}
          </div>
        )}
        <p className="result-count">
          {requests.isPending
            ? "Talepler yükleniyor…"
            : `${items.length} talep gösteriliyor`}
        </p>
        {!requests.isPending && <SupportQueueTable items={items} />}
      </Card>
    </>
  );
}
