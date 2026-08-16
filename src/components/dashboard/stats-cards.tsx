import type { DashboardStat } from "@/lib/nmonitor";
import { AlertCircle, Gavel, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
  active: Users,
  waiting: AlertCircle,
  total: Gavel,
  leader: TrendingUp,
};

const accents = {
  green: "from-emerald-400/30 via-emerald-400/5 to-transparent text-emerald-400 border-emerald-400/20",
  orange: "from-orange-400/30 via-orange-400/5 to-transparent text-orange-400 border-orange-400/20",
  pink: "from-pink-400/30 via-pink-400/5 to-transparent text-pink-400 border-pink-400/20",
  purple: "from-violet-400/30 via-violet-400/5 to-transparent text-violet-400 border-violet-400/20",
};

export function StatsCards({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = icons[stat.id];
        return (
          <article
            key={stat.id}
            className={cn(
              "relative overflow-hidden rounded-2xl border bg-[var(--card)] p-5",
              accents[stat.accent].split(" ").find((c) => c.startsWith("border-")),
            )}
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b",
                accents[stat.accent]
                  .split(" ")
                  .filter((c) => c.startsWith("from-") || c.startsWith("via-") || c.startsWith("to-"))
                  .join(" "),
              )}
            />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-sm  text-[var(--muted)]">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                  {stat.hint}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-xl border bg-black/20 p-2.5",
                  accents[stat.accent]
                    .split(" ")
                    .filter((c) => c.startsWith("text-") || c.startsWith("border-"))
                    .join(" "),
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
