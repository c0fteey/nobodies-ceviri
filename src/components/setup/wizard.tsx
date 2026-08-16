"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import * as Tabs from "@radix-ui/react-tabs";
import { Check, Database, Loader2, LogOut, Shield, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = {
  setupCompleted: boolean;
  hasDiscord: boolean;
  hasAdmin: boolean;
  hasDatabase: boolean;
  siteUrl: string;
  devBypass?: boolean;
  admin: { id: string; username: string; avatar: string | null } | null;
};

const steps = [
  { id: "1", label: "Discord OAuth", icon: Shield },
  { id: "2", label: "Admin hesabı", icon: UserRound },
  { id: "3", label: "MySQL", icon: Database },
];

export function SetupWizard() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [step, setStep] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  const [siteUrl, setSiteUrl] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState("");

  const [mysql, setMysql] = useState({
    host: "127.0.0.1",
    port: "3306",
    database: "nbdsx_staff",
    user: "",
    password: "",
  });

  async function refreshStatus() {
    const res = await fetch("/api/setup/status");
    const data = (await res.json()) as Status;
    setStatus(data);
    if (data.siteUrl) setSiteUrl(data.siteUrl);
    if (data.hasDiscord && !data.hasAdmin) setStep("2");
    if (data.hasAdmin && !data.setupCompleted) setStep("3");
    if (data.setupCompleted) {
      router.replace("/");
    }
  }

  useEffect(() => {
    const origin = window.location.origin;
    setSiteUrl((prev) => prev || origin);
    setRedirectUri(`${origin}/api/auth/callback/discord`);
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get("step");
    if (stepParam === "2" || stepParam === "3") {
      setStep(stepParam);
    }
    void refreshStatus();
  }, []);

  const confirmedAdmin = useMemo(() => {
    if (status?.admin) return status.admin;
    if (session?.user?.id) {
      return {
        id: session.user.id,
        username: session.user.name || "Discord User",
        avatar: session.user.image || null,
      };
    }
    return null;
  }, [session, status]);

  async function saveDiscord(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/setup/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteUrl,
          discordClientId: clientId,
          discordClientSecret: clientSecret,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kayıt başarısız");
      setRedirectUri(data.redirectUri);
      setStep("2");
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  async function confirmAdmin() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/setup/admin", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Admin kaydı başarısız");
      setStep("3");
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  async function runDevBypass() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/setup/dev-bypass", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dev bypass başarısız");
      await signIn("dev", { unlock: "1", callbackUrl: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
      setLoading(false);
    }
  }

  async function saveMysql(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/setup/mysql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mysql),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "MySQL kurulumu başarısız");
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8 text-center">
        <p className="text-sm font-medium text-[var(--accent)]">Kurulum</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          NBDSxStaffTracker
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Discord OAuth, admin hesabı ve MySQL ile paneli hazırla.
        </p>
      </div>

      {status?.devBypass ? (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-medium text-amber-200">Geliştirici modu</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Discord ve MySQL olmadan mock veriyle panele girebilirsin. Production’da
            `DEV_BYPASS` kapalı olmalı.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => void runDevBypass()}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-100 transition hover:bg-amber-500/30 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Kurulumu atla ve panele gir
          </button>
          {error ? (
            <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-3 gap-2">
        {steps.map((item, index) => {
          const Icon = item.icon;
          const active = step === item.id;
          const done = Number(step) > Number(item.id);
          return (
            <div
              key={item.id}
              className={cn(
                "rounded-xl border px-3 py-3 text-center",
                active
                  ? "border-[var(--accent)]/40 bg-[var(--accent)]/10"
                  : "border-[var(--border)] bg-[var(--card)]",
              )}
            >
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/20">
                {done ? (
                  <Check className="h-4 w-4 text-[var(--accent)]" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <p className="text-xs text-[var(--muted)]">Adım {index + 1}</p>
              <p className="text-sm font-medium">{item.label}</p>
            </div>
          );
        })}
      </div>

      <Tabs.Root value={step} onValueChange={setStep}>
        <Tabs.Content value="1" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <form onSubmit={saveDiscord} className="space-y-4">
            <Field label="Site URL" hint="Production domain'iniz (veya geliştirmede localhost)">
              <input
                required
                value={siteUrl}
                onChange={(e) => {
                  setSiteUrl(e.target.value);
                  setRedirectUri(
                    `${e.target.value.replace(/\/$/, "")}/api/auth/callback/discord`,
                  );
                }}
                className={inputClass}
                placeholder="https://panel.sunucun.com"
              />
            </Field>
            <Field label="Discord Client ID">
              <input
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Discord Client Secret">
              <input
                required
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className={inputClass}
              />
            </Field>
            <div className="rounded-xl border border-[var(--border)] bg-black/20 p-3 text-xs text-[var(--muted)]">
              Discord Developer Portal → OAuth2 → Redirects içine{" "}
              <strong className="text-[var(--foreground)]">birebir</strong> ekle
              (http/https, port, trailing slash aynı olmalı):
              <code className="mt-1 block break-all text-[var(--accent)]">
                {redirectUri || "http://localhost:3000/api/auth/callback/discord"}
              </code>
              <p className="mt-2">
                Local için Site URL:{" "}
                <code className="text-[var(--accent)]">http://localhost:3000</code>
                {" "}— Portal’da https yazıp burada http kullanma (
                <code>invalid_redirect_uri</code>).
              </p>
              <p className="mt-1">
                Ayrıca <code>.env.local</code> içinde{" "}
                <code>AUTH_URL</code> / <code>NEXTAUTH_URL</code> aynı adres
                olmalı.
              </p>
            </div>
            {error && step === "1" && <ErrorBox message={error} />}
            <button type="submit" disabled={loading} className={buttonClass}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Kaydet ve devam et
            </button>
          </form>
        </Tabs.Content>

        <Tabs.Content value="2" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Admin hesabı için Discord ile giriş yap. Yetkilendirince hesap burada görünecek.
            </p>

            {confirmedAdmin?.id && session?.user?.id ? (
              <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-black/20 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={confirmedAdmin.avatar || "/favicon.ico"}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{confirmedAdmin.username}</p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    {confirmedAdmin.id}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    void signOut({ callbackUrl: "/setup?step=2" })
                  }
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted)] transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Çıkış yap
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={loading || sessionStatus === "loading"}
                onClick={() =>
                  signIn("discord", { callbackUrl: "/setup?step=2" })
                }
                className={buttonClass}
              >
                Discord ile giriş yap
              </button>
            )}

            {error && step === "2" && <ErrorBox message={error} />}

            <div className="flex gap-2">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => setStep("1")}
              >
                Geri
              </button>
              <button
                type="button"
                disabled={loading || !session?.user?.id}
                onClick={() => void confirmAdmin()}
                className={buttonClass}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Admin olarak onayla
              </button>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="3" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <form onSubmit={saveMysql} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Host">
                <input
                  required
                  value={mysql.host}
                  onChange={(e) => setMysql({ ...mysql, host: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Port">
                <input
                  required
                  value={mysql.port}
                  onChange={(e) => setMysql({ ...mysql, port: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Database">
              <input
                required
                value={mysql.database}
                onChange={(e) => setMysql({ ...mysql, database: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Kullanıcı">
              <input
                required
                value={mysql.user}
                onChange={(e) => setMysql({ ...mysql, user: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Şifre">
              <input
                type="password"
                value={mysql.password}
                onChange={(e) => setMysql({ ...mysql, password: e.target.value })}
                className={inputClass}
              />
            </Field>
            {error && step === "3" && <ErrorBox message={error} />}
            <div className="flex gap-2">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => setStep("2")}
              >
                Geri
              </button>
              <button type="submit" disabled={loading} className={buttonClass}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Bağlan ve kurulumu bitir
              </button>
            </div>
          </form>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {hint ? <span className="block text-xs text-[var(--muted)]">{hint}</span> : null}
      {children}
    </label>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
      {message}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-black/20 px-3 py-2.5 text-sm outline-none ring-[var(--accent)] placeholder:text-[var(--muted)] focus:ring-2";

const buttonClass =
  "inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm font-medium transition hover:bg-white/5";
