import type { WeeklyLeader } from "@/lib/nmonitor";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

const rankStyles: Record<number, string> = {
  1: "bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/35 shadow-[0_0_12px_-4px_rgba(251,191,36,0.55)]",
  2: "bg-slate-300/15 text-slate-200 ring-1 ring-slate-300/30",
  3: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/30",
};

function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums tracking-tight",
        rankStyles[rank] ??
          "bg-white/[0.04] text-[var(--muted)] ring-1 ring-[var(--border)]",
      )}
      aria-label={`${rank}. sıra`}
    >
      {rank}
    </span>
  );
}

export function Leaderboard({ leaders }: { leaders: WeeklyLeader[] }) {
  const top5 = leaders.slice(0, 5);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-400">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Haftanın En Aktif Yetkilileri</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Bu hafta en çok oyunda kalan ilk 5 yetkili
          </p>
        </div>
      </div>

      {top5.length === 0 ? (
        <p className="rounded-xl px-2 py-8 text-center text-sm text-[var(--muted)]">
          Henüz yetkili süresi kaydı yok. Plugin online olunca burada görünecek.
        </p>
      ) : (
        <ul className="space-y-3">
          {top5.map((staff) => (
            <li
              key={staff.uuid}
              className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition hover:border-[var(--border)] hover:bg-white/[0.03]"
            >
              <RankBadge rank={staff.rank} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://mc-heads.net/avatar/${staff.name}/40`}
                alt={staff.name}
                width={40}
                height={40}
                className="rounded-lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{staff.name}</p>
                <p className="text-xs text-[var(--muted)]">{staff.role}</p>
              </div>
              <span className="text-sm font-semibold text-emerald-400">
                {staff.time}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
