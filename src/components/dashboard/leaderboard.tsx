import { Activity } from "lucide-react";
import { weeklyLeaders } from "@/lib/mock-data";

export function Leaderboard() {
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

      <ul className="space-y-3">
        {weeklyLeaders.map((staff) => (
          <li
            key={staff.name}
            className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition hover:border-[var(--border)] hover:bg-white/[0.03]"
          >
            <span className="w-6 text-sm font-medium text-[var(--muted)]">
              {staff.rank}
            </span>
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
    </section>
  );
}
