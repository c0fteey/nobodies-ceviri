import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { isDevBypassEnabled } from "@/lib/dev";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
    setupLocked?: string;
  }>;
}) {
  const config = await getConfig();
  if (!config.setupCompleted) {
    redirect("/setup");
  }

  const session = await auth();
  const params = await searchParams;
  if (session?.user) {
    redirect(params.callbackUrl || "/");
  }

  const devBypass = isDevBypassEnabled();
  const canReset = process.env.NODE_ENV !== "production";

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-2xl">
        <p className="text-sm font-medium text-[var(--accent)]">Giriş</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          <span className="text-[var(--accent)]">NBDS</span>xStaffTracker
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Panele yalnızca Discord ile giriş yapılabilir.
        </p>

        {params.setupLocked ? (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            Kurulum tamamlanmış; setup sayfası kilitli. Yeniden kurmak için
            aşağıdan sıfırla.
          </div>
        ) : null}

        {params.error ? (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {params.error === "AccessDenied" ? (
              <>
                Bu Discord hesabı admin değil. Vercel’deki{" "}
                <code className="text-rose-200">ADMIN_DISCORD_ID</code>, senin
                Discord <strong>kullanıcı</strong> ID’n olmalı (Application Client
                ID değil).
              </>
            ) : params.error === "Configuration" ? (
              <>
                Discord OAuth ayarı hatalı. Client ID/Secret veya{" "}
                <code className="text-rose-200">AUTH_URL</code> / Redirect URI
                kontrol et.
              </>
            ) : (
              <>
                Giriş başarısız ({params.error}). Discord Redirect URI:{" "}
                <code className="break-all text-rose-200">
                  https://nobodiesceviri.vercel.app/api/auth/callback/discord
                </code>
              </>
            )}
          </div>
        ) : null}

        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signIn("discord", {
              redirectTo: params.callbackUrl || "/",
            });
          }}
        >
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#5865F2] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Discord ile giriş yap
          </button>
        </form>

        {devBypass ? (
          <form
            className="mt-3"
            action={async () => {
              "use server";
              await signIn("dev", {
                unlock: "1",
                redirectTo: params.callbackUrl || "/",
              });
            }}
          >
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/25"
            >
              Dev olarak gir (local)
            </button>
          </form>
        ) : null}

        {canReset ? (
          <p className="mt-6 text-center text-xs text-[var(--muted)]">
            Kurulumu baştan yapmak için{" "}
            <Link
              href="/api/setup/reset"
              className="text-amber-300 hover:underline"
            >
              kurulumu sıfırla
            </Link>
          </p>
        ) : (
          <p className="mt-6 text-center text-xs text-[var(--muted)]">
            Kurulum tamamlandı.
          </p>
        )}
      </div>
    </main>
  );
}
