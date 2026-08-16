import { StatsCards } from "@/components/dashboard/stats-cards";
import { Leaderboard } from "@/components/dashboard/leaderboard";
import { ModLogs } from "@/components/dashboard/mod-logs";
import { PluginStatusBanner } from "@/components/dashboard/plugin-status-banner";
import { PanelShell } from "@/components/panel-shell";
import { getDashboardData } from "@/lib/nmonitor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <PanelShell>
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-[var(--hero-from)] to-[var(--hero-to)] px-6 py-8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--accent)]/10 blur-3xl" />
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--muted)] sm:text-base">
          Sunucu yetkili istatistikleri ve genel bakış.
        </p>
      </section>

      <PluginStatusBanner plugin={data.plugin} />
      <StatsCards stats={data.stats} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Leaderboard leaders={data.leaders} />
        <ModLogs actions={data.modActions} />
      </div>
    </PanelShell>
  );
}
