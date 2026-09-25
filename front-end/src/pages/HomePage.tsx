import { useQuery } from "@tanstack/react-query";
import { Button, Card, Badge } from "@radix-ui/themes";
import {
  ChatBubbleIcon,
  CheckCircledIcon,
  ChevronRightIcon,
  PlusIcon,
  QuestionMarkCircledIcon,
  ReaderIcon,
} from "@radix-ui/react-icons";
import { getRequestSummary } from "../api/requests";
import { go } from "../app/navigation";
import { PageHeader } from "../components/PageHeader";
import { RequestTable } from "../components/RequestTable";
import type { Employee } from "../types";

const SAMPLE_QUESTIONS = [
  "Yıllık izin nasıl kullanılır?",
  "VPN bağlantısını nasıl kurarım?",
  "Masraf belgesi nasıl yüklenir?",
  "Bordroma nereden ulaşırım?",
];

export function HomePage({ profile }: { profile: Employee }) {
  const summary = useQuery({
    queryKey: ["requests", "summary"],
    queryFn: getRequestSummary,
  });

  return (
    <>
      <PageHeader
        eyebrow="ÇALIŞAN PORTALI"
        title={`Merhaba, ${profile.name.split(" ")[0]}`}
        description="Kurumsal bilgilere ulaşın, destek taleplerinizi oluşturun ve güncel durumlarını takip edin."
        action={
          <Button onClick={() => go("new")}>
            <PlusIcon /> Yeni talep
          </Button>
        }
      />
      <section className="hero">
        <div>
          <Badge variant="soft">Bilgi asistanı</Badge>
          <h2>Bugün size nasıl yardımcı olabiliriz?</h2>
          <p>
            İzin, bordro, uzaktan erişim ve şirket süreçleriyle ilgili sorunuzu
            yazın. Yanıtları kaynaklarıyla görün.
          </p>
          <Button onClick={() => go("assistant")}>
            <ChatBubbleIcon /> Asistana sor
          </Button>
        </div>
        <span className="hero-art">?</span>
      </section>
      {summary.isError && (
        <div className="form-error" role="alert">
          {summary.error.message}
        </div>
      )}
      <section className="stats">
        <Card>
          <span className="stat-icon blue">
            <ReaderIcon />
          </span>
          <div>
            <span>Açık talepler</span>
            <strong>{summary.data?.open ?? "—"}</strong>
            <small>Aktif iş akışında</small>
          </div>
        </Card>
        <Card>
          <span className="stat-icon amber">
            <QuestionMarkCircledIcon />
          </span>
          <div>
            <span>Yanıt bekleyen</span>
            <strong>{summary.data?.waiting ?? "—"}</strong>
            <small>Sizden bilgi bekliyor</small>
          </div>
        </Card>
        <Card>
          <span className="stat-icon green">
            <CheckCircledIcon />
          </span>
          <div>
            <span>Tamamlanan</span>
            <strong>{summary.data?.completed ?? "—"}</strong>
            <small>Çözüldü veya kapatıldı</small>
          </div>
        </Card>
      </section>
      <div className="dashboard">
        <Card className="panel">
          <div className="panel-title">
            <div>
              <h2>Son talepler</h2>
              <p>En son güncellenen destek kayıtlarınız</p>
            </div>
            <Button variant="ghost" onClick={() => go("requests")}>
              Tümünü gör <ChevronRightIcon />
            </Button>
          </div>
          {summary.isPending ? (
            <p className="muted">Talepler yükleniyor…</p>
          ) : (
            <RequestTable items={summary.data?.recent ?? []} />
          )}
        </Card>
        <Card className="panel quick">
          <div className="panel-title">
            <div>
              <h2>Sık kullanılanlar</h2>
              <p>Doğrudan bilgi asistanına sorun</p>
            </div>
          </div>
          {SAMPLE_QUESTIONS.map((question) => (
            <button
              key={question}
              onClick={() => {
                sessionStorage.setItem("assistant-question", question);
                go("assistant");
              }}
            >
              {question}
              <ChevronRightIcon />
            </button>
          ))}
        </Card>
      </div>
    </>
  );
}
