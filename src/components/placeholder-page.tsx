import { PanelShell } from "@/components/panel-shell";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <PanelShell>
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] px-6 py-16 text-center">
        <p className="text-sm font-medium text-[var(--accent)]">Yakında</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--muted)]">
          {description}
        </p>
      </section>
    </PanelShell>
  );
}
