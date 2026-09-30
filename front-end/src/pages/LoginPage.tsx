import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Badge, Button, TextField } from "@radix-ui/themes";
import { login } from "../api/auth";
import type { Employee } from "../types";

const DEMO_PASSWORD = "kurumsaldemo";
const DEMO_ACCOUNTS = [
  {
    name: "Deniz Yılmaz",
    email: "deniz.yilmaz@ornek-kurum.com",
    hint: "Çalışan",
  },
  {
    name: "Ahmet Kaya",
    email: "ahmet.kaya@ornek-kurum.com",
    hint: "BT Destek Ekibi",
  },
  {
    name: "Elif Demir",
    email: "elif.demir@ornek-kurum.com",
    hint: "BT Destek Ekibi",
  },
  {
    name: "Zeynep Arslan",
    email: "zeynep.arslan@ornek-kurum.com",
    hint: "İnsan Kaynakları Ekibi",
  },
] as const;

export function LoginPage({
  onLogin,
}: {
  onLogin: (employee: Employee) => void;
}) {
  const [email, setEmail] = useState<string>(DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (result) => onLogin(result.employee),
  });

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
            mutation.mutate();
          }}
        >
          <p className="eyebrow">DEMO GİRİŞ</p>
          <h2>Tekrar hoş geldiniz</h2>
          <p className="muted">
            Demo hesaplardan birini seçin. Gerçek kimlik doğrulama yoktur.
          </p>
          {mutation.isError && (
            <div className="form-error" role="alert">
              {mutation.error.message}
            </div>
          )}
          <div className="demo-accounts">
            <p className="eyebrow">DEMO HESAPLAR</p>
            {DEMO_ACCOUNTS.map((account) => (
              <Button
                key={account.email}
                type="button"
                variant={email === account.email ? "solid" : "soft"}
                color={email === account.email ? undefined : "gray"}
                aria-pressed={email === account.email}
                onClick={() => {
                  setEmail(account.email);
                  setPassword(DEMO_PASSWORD);
                }}
              >
                <span>{account.name}</span>
                <small>{account.hint}</small>
              </Button>
            ))}
            <p className="note">Parola tüm hesaplarda {DEMO_PASSWORD}.</p>
          </div>
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
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <Button size="3" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Giriş yapılıyor…" : "Portala giriş yap"}
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
