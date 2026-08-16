import type { PluginStatus } from "@/lib/nmonitor";
import { WifiOff } from "lucide-react";

export function PluginStatusBanner({ plugin }: { plugin: PluginStatus }) {
  if (plugin.online) return null;

  return (
    <div
      role="alert"
      className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 sm:px-5"
    >
      <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
      <div>
        <p className="font-semibold text-rose-200">nMonitor çevrimdışı</p>
        <p className="mt-1 text-rose-100/80">
          Plugin heartbeat alınamıyor
          {plugin.lastSeen
            ? ` (son: ${new Date(plugin.lastSeen).toLocaleString("tr-TR")})`
            : ""}
          . Sunucuda nMonitor çalıştığından ve aynı veritabanına bağlandığından emin ol.
          Eşik: {plugin.staleAfterSeconds}s.
        </p>
      </div>
    </div>
  );
}
