"use client";

export function VercelSetupGuide() {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://nobodiesceviri.vercel.app";

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
      <p className="text-sm font-medium text-[var(--accent)]">Vercel kurulumu</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Wizard burada çalışmaz
      </h1>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Vercel’de dosya sistemi kalıcı değil. Ayarları{" "}
        <strong className="text-[var(--foreground)]">
          Project → Settings → Environment Variables
        </strong>{" "}
        içine ekleyip Redeploy et.
      </p>

      <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm text-[var(--muted)]">
        <li>
          Discord Redirect URI:{" "}
          <code className="break-all text-[var(--accent)]">
            {origin}/api/auth/callback/discord
          </code>
        </li>
        <li>
          TiDB’de <code>nbdsx_staff</code> database’i oluştur, password generate et
        </li>
        <li>Aşağıdaki env’leri Vercel’e ekle (Production + Preview)</li>
        <li>
          <strong className="text-[var(--foreground)]">Redeploy</strong> — sonra{" "}
          <a href="/login" className="text-[var(--accent)] underline">
            /login
          </a>
        </li>
      </ol>

      <pre className="mt-6 overflow-x-auto rounded-xl border border-[var(--border)] bg-black/30 p-4 text-xs leading-relaxed text-[var(--foreground)]">
{`AUTH_SECRET=...
AUTH_URL=${origin}
NEXTAUTH_URL=${origin}
AUTH_TRUST_HOST=true
AUTH_DISCORD_ID=...
AUTH_DISCORD_SECRET=...
ADMIN_DISCORD_ID=...
ADMIN_DISCORD_USERNAME=...
DATABASE_URL=mysql://USER:PASS@HOST:4000/nbdsx_staff?sslaccept=strict
SETUP_COMPLETED=1`}
      </pre>

      <p className="mt-4 text-xs text-[var(--muted)]">
        `Failed to execute json` hatası: wizard API’si Vercel’de dosyaya yazamadığı
        için oluşuyordu. Env ile kurunca bu sayfa kaybolur.
      </p>
    </div>
  );
}
