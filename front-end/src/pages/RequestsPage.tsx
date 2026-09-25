import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { Button, Card, Select, Tabs, TextField } from "@radix-ui/themes";
import { MagnifyingGlassIcon, PlusIcon, ReloadIcon } from "@radix-ui/react-icons";
import { listCategories } from "../api/categories";
import { listRequests } from "../api/requests";
import { OPEN_STATUSES, REQUEST_STATUSES, go } from "../app/navigation";
import { PageHeader } from "../components/PageHeader";
import { RequestTable } from "../components/RequestTable";
import type { RequestStatus } from "../types";

export function RequestsPage() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [scope, setScope] = useState<"all" | "open" | "closed">("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<RequestStatus | "all">("all");

  const requests = useQuery({
    queryKey: ["requests", { q: deferredQuery, scope, category, status }],
    queryFn: () => listRequests({ q: deferredQuery, scope, category, status }),
  });
  const categories = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const items = requests.data?.requests ?? [];

  const counts = useQuery({
    queryKey: ["requests", "counts"],
    queryFn: () => listRequests(),
  });
  const all = counts.data?.requests ?? [];

  return (
    <>
      <PageHeader
        eyebrow="DESTEK"
        title="Taleplerim"
        description="Destek taleplerinizi arayın, filtreleyin ve güncel durumlarını görüntüleyin."
        action={<Button onClick={() => go("new")}><PlusIcon /> Yeni talep</Button>}
      />
      <Card className="requests-card">
        <Tabs.Root value={scope} onValueChange={(value) => setScope(value as typeof scope)}>
          <Tabs.List>
            <Tabs.Trigger value="all">Tümü ({all.length})</Tabs.Trigger>
            <Tabs.Trigger value="open">Açık ({all.filter((item) => OPEN_STATUSES.includes(item.status)).length})</Tabs.Trigger>
            <Tabs.Trigger value="closed">Tamamlanan ({all.filter((item) => !OPEN_STATUSES.includes(item.status)).length})</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
        <div className="filters">
          <TextField.Root placeholder="Talep numarası veya konu ara" value={query} onChange={(event) => setQuery(event.target.value)}>
            <TextField.Slot><MagnifyingGlassIcon /></TextField.Slot>
          </TextField.Root>
          <Select.Root value={category} onValueChange={setCategory}>
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="all">Tüm kategoriler</Select.Item>
              {(categories.data?.categories ?? []).map((item) => <Select.Item key={item.name} value={item.name}>{item.name}</Select.Item>)}
            </Select.Content>
          </Select.Root>
          <Select.Root value={status} onValueChange={(value) => setStatus(value as RequestStatus | "all")}>
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="all">Tüm durumlar</Select.Item>
              {REQUEST_STATUSES.map((name) => <Select.Item key={name} value={name}>{name}</Select.Item>)}
            </Select.Content>
          </Select.Root>
          <Button variant="ghost" color="gray" onClick={() => { setQuery(""); setScope("all"); setCategory("all"); setStatus("all"); }}>
            <ReloadIcon /> Temizle
          </Button>
        </div>
        {requests.isError && <div className="form-error" role="alert">{requests.error.message}</div>}
        <p className="result-count">{requests.isPending ? "Talepler yükleniyor…" : `${items.length} talep gösteriliyor`}</p>
        {!requests.isPending && <RequestTable items={items} />}
      </Card>
    </>
  );
}
