import { Shield } from "lucide-react";
import { recentModActions } from "@/lib/mock-data";

export function ModLogs() {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-xl bg-rose-500/15 p-2.5 text-rose-400">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Son Moderasyon İşlemleri</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Yakın zamanda uygulanan cezalar
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {recentModActions.map((log) => (
          <li
            key={`${log.staff}-${log.target}-${log.at}`}
            className="flex flex-col gap-1 rounded-xl border border-transparent px-2 py-2 transition hover:border-[var(--border)] hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">
                {log.staff}{" "}
                <span className="text-[var(--muted)]">→</span> {log.target}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {log.action} • {log.reason}
              </p>
            </div>
            <time className="shrink-0 text-xs text-[var(--muted)] sm:text-sm">
              {log.at}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
