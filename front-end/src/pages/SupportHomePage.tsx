import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Card } from "@radix-ui/themes";
import {
  ChevronRightIcon,
  PersonIcon,
  QuestionMarkCircledIcon,
  ReaderIcon,
} from "@radix-ui/react-icons";
import { getSupportSummary, listSupportRequests } from "../api/support";
import { go } from "../app/navigation";
import { PageHeader } from "../components/PageHeader";
import { SupportQueueTable } from "../components/SupportQueueTable";
import type { Employee } from "../types";

const previewFilters = { queue: "team" as const, scope: "open" as const };

export function SupportHomePage({ profile }: { profile: Employee }) {
  const summary = useQuery({
    queryKey: ["support", "summary"],
    queryFn: getSupportSummary,
  });
  const queue = useQuery({
    queryKey: ["support", "requests", previewFilters],
    queryFn: () => listSupportRequests(previewFilters),
  });
  const preview = (queue.data?.requests ?? []).slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow="DESTEK PERSONELİ"
        title={`Merhaba, ${profile.name.split(" ")[0]}`}
        description={`${profile.team ?? "Ekibiniz"} kuyruğundaki talepleri yönetin. Bu rol demo amaçlıdır; canlı bir destek hizmeti değildir.`}
        action={
          <Button onClick={() => go("queue")}>
            <ReaderIcon /> Ekip kuyruğu
          </Button>
        }
      />
      <Badge className="role-badge" variant="soft">
        Demo destek personeli
      </Badge>
      {summary.isError && (
        <div className="form-error" role="alert">
          {summary.error.message}
        </div>
      )}
      <section className="stats stats-four">
        <Card>
          <span className="stat-icon blue">
            <ReaderIcon />
          </span>
          <div>
            <span>Açık talepler</span>
            <strong>{summary.data?.open ?? "—"}</strong>
            <small>Ekip kuyruğunda</small>
          </div>
        </Card>
        <Card>
          <span className="stat-icon slate">
            <PersonIcon />
          </span>
          <div>
            <span>Atanmamış</span>
            <strong>{summary.data?.unassigned ?? "—"}</strong>
            <small>Üstlenilmeyi bekliyor</small>
          </div>
        </Card>
        <Card>
          <span className="stat-icon green">
            <PersonIcon />
          </span>
          <div>
            <span>Bana atanan</span>
            <strong>{summary.data?.mine ?? "—"}</strong>
            <small>Açık talepleriniz</small>
          </div>
        </Card>
        <Card>
          <span className="stat-icon amber">
            <QuestionMarkCircledIcon />
          </span>
          <div>
            <span>Bilgi bekleyen</span>
            <strong>{summary.data?.waiting ?? "—"}</strong>
            <small>Kullanıcıdan bilgi bekleniyor</small>
          </div>
        </Card>
      </section>
      <Card className="panel">
        <div className="panel-title">
          <div>
            <h2>En eski açık talepler</h2>
            <p>Ekip kuyruğu, en eski oluşturulan talep üstte</p>
          </div>
          <Button variant="ghost" onClick={() => go("queue")}>
            Tümünü gör <ChevronRightIcon />
          </Button>
        </div>
        {queue.isError && (
          <div className="form-error" role="alert">
            {queue.error.message}
          </div>
        )}
        {queue.isPending ? (
          <p className="muted">Talepler yükleniyor…</p>
        ) : (
          <SupportQueueTable items={preview} />
        )}
      </Card>
    </>
  );
}
