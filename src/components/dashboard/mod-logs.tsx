"use client";

import { useMemo, useState } from "react";
import type { ModAction } from "@/lib/nmonitor";
import { Search, Shield } from "lucide-react";

export function ModLogs({ actions }: { actions: ModAction[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((log) => {
      const haystack = [log.staff, log.target, log.action, log.reason, log.at]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, actions]);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
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

        <label className="relative w-full sm:max-w-xs">
          <span className="sr-only">Moderasyon ara</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Yetkili, oyuncu, ceza..."
            className="w-full rounded-xl border border-[var(--border)] bg-black/20 py-2 pl-9 pr-3 text-sm outline-none ring-[var(--accent)] placeholder:text-[var(--muted)] focus:ring-2"
          />
        </label>
      </div>

      <ul className="space-y-3">
        {filtered.length === 0 ? (
          <li className="rounded-xl px-2 py-6 text-center text-sm text-[var(--muted)]">
            {query
              ? `“${query}” için sonuç yok.`
              : "Henüz moderasyon kaydı yok."}
          </li>
        ) : (
          filtered.map((log) => (
            <li
              key={log.id}
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
          ))
        )}
      </ul>
    </section>
  );
}
