import { useState } from "react";
import { Badge, Button, TextField } from "@radix-ui/themes";
import { profile } from "../data";

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState(profile.email);
  return (
    <main className="login">
      <section className="login-brand">
        <div className="brand">
          <span className="brand-mark">K</span> Kurumsal Destek
        </div>
        <div>
          <Badge variant="soft">Çalışan deneyimi portalı · Demo</Badge>
          <h1>Bilgiye ulaşın, desteği tek yerden yönetin.</h1>
          <p>
            Kurumsal yanıtları kaynaklarıyla bulun, gerektiğinde destek talebi
            açın ve süreci takip edin.
          </p>
          <ul>
            <li>Kaynaklı kurumsal yanıtlar</li>
            <li>Şeffaf talep takibi</li>
            <li>Tek çalışan deneyimi</li>
          </ul>
        </div>
      </section>
      <section className="login-side">
        <form
          className="login-card"
          onSubmit={(event) => {
            event.preventDefault();
            onLogin();
          }}
        >
          <p className="eyebrow">ÇALIŞAN PORTALI</p>
          <h2>Tekrar hoş geldiniz</h2>
          <p className="muted">
            Demo hesaba devam etmek için bilgilerinizi kontrol edin.
          </p>
          <label className="field">
            E-posta adresi
            <TextField.Root
              size="3"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="field">
            Parola
            <TextField.Root
              size="3"
              type="password"
              defaultValue="kurumsaldemo"
              required
            />
          </label>
          <Button size="3" type="submit">
            Portala giriş yap
          </Button>
          <p className="note">
            Bu ekran demo amaçlıdır. Gerçek kimlik doğrulama servisine bağlı
            değildir.
          </p>
        </form>
      </section>
    </main>
  );
}
