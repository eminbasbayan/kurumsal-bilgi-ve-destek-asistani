import { Avatar, Badge, Button, Card } from "@radix-ui/themes";
import { ExitIcon } from "@radix-ui/react-icons";
import { PageHeader } from "../components/PageHeader";
import { profile } from "../data";

export function ProfilePage({ logout }: { logout: () => void }) {
  return (
    <>
      <PageHeader
        eyebrow="HESAP"
        title="Profil"
        description="Çalışan hesabınıza ait kurumsal bilgileri görüntüleyin."
      />
      <div className="profile-grid">
        <Card className="profile-card">
          <Avatar fallback={profile.initials} size="7" radius="full" />
          <h2>{profile.name}</h2>
          <p>{profile.title}</p>
          <Badge variant="soft">DEMO ÇALIŞAN</Badge>
        </Card>
        <Card className="profile-details">
          <div className="panel-title">
            <div>
              <h2>Çalışan bilgileri</h2>
              <p>Bu bilgiler kurum dizininden gelir ve salt okunurdur.</p>
            </div>
          </div>
          <dl>
            {[
              ["E-posta", profile.email],
              ["Sicil numarası", profile.employeeNo],
              ["Departman", profile.department],
              ["Görev", profile.title],
              ["Lokasyon", profile.location],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <Button color="red" variant="soft" onClick={logout}>
            <ExitIcon /> Çıkış yap
          </Button>
        </Card>
      </div>
    </>
  );
}
