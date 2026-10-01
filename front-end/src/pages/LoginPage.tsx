import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge, Button, IconButton, TextField } from "@radix-ui/themes";
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import { listDemoAccounts, login } from "../api/auth";
import type { Employee } from "../types";

const DEMO_PASSWORD = "kurumsaldemo";

export function LoginPage({
  onLogin,
}: {
  onLogin: (employee: Employee) => void;
}) {
  const demoAccounts = useQuery({
    queryKey: ["demo-accounts"],
    queryFn: listDemoAccounts,
  });
  const accounts = demoAccounts.data?.accounts ?? [];
  const [email, setEmail] = useState<string | undefined>();
  const selectedEmail = email ?? accounts[0]?.email ?? "";
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const mutation = useMutation({
    mutationFn: () => login(selectedEmail, password),
    onSuccess: (result) => onLogin(result.employee),
  });
  const error = mutation.error?.message || demoAccounts.error?.message;

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
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <div className="demo-accounts">
            <p className="eyebrow">DEMO HESAPLAR</p>
            {demoAccounts.isPending && (
              <p className="note">Demo hesaplar yükleniyor…</p>
            )}
            {accounts.map((account) => (
              <Button
                key={account.email}
                type="button"
                variant={selectedEmail === account.email ? "solid" : "soft"}
                color={selectedEmail === account.email ? undefined : "gray"}
                aria-pressed={selectedEmail === account.email}
                onClick={() => {
                  setEmail(account.email);
                  setPassword(DEMO_PASSWORD);
                  setShowPassword(false);
                }}
              >
                <span>{account.name}</span>
                <small>
                  {account.role === "support" ? account.team : "Çalışan"}
                </small>
              </Button>
            ))}
            <p className="note">Parola tüm hesaplarda {DEMO_PASSWORD}.</p>
          </div>
          <label className="field">
            E-posta adresi
            <TextField.Root
              size="3"
              type="email"
              value={selectedEmail}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <div className="field">
            <label htmlFor="login-password">Parola</label>
            <TextField.Root
              id="login-password"
              size="3"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            >
              <TextField.Slot side="right">
                <IconButton
                  type="button"
                  variant="ghost"
                  aria-label={
                    showPassword ? "Parolayı gizle" : "Parolayı göster"
                  }
                  aria-controls="login-password"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </IconButton>
              </TextField.Slot>
            </TextField.Root>
          </div>
          <Button
            size="3"
            type="submit"
            disabled={!selectedEmail.trim() || !password || mutation.isPending}
          >
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
