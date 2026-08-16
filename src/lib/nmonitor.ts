import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/db";

export type DashboardStat = {
  id: "active" | "waiting" | "total" | "leader";
  label: string;
  value: string;
  hint: string;
  accent: "green" | "orange" | "pink" | "purple";
};

export type WeeklyLeader = {
  rank: number;
  name: string;
  role: string;
  time: string;
  uuid: string;
  weeklyMs: number;
};

export type ModAction = {
  id: number;
  staff: string;
  target: string;
  action: string;
  reason: string;
  at: string;
};

export type PluginStatus = {
  online: boolean;
  serverName: string | null;
  pluginVersion: string | null;
  lastSeen: string | null;
  onlineStaff: number;
  staleAfterSeconds: number;
};

export type DashboardData = {
  plugin: PluginStatus;
  stats: DashboardStat[];
  leaders: WeeklyLeader[];
  modActions: ModAction[];
};

const STALE_DEFAULT = 45;

function staleAfterSeconds() {
  const raw = process.env.NMONITOR_STALE_SECONDS;
  const n = raw ? Number(raw) : STALE_DEFAULT;
  return Number.isFinite(n) && n > 0 ? n : STALE_DEFAULT;
}

function formatDuration(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return `${hours}s ${mins}dk`;
}

function formatDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function currentWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

type HeartbeatRow = {
  server_name: string;
  plugin_version: string;
  last_seen: Date;
  online_staff: number;
  status: string;
};

type StaffRow = {
  uuid: string;
  name: string;
  role: string;
  weekly_ms: bigint | number;
};

type ModRow = {
  id: bigint | number;
  staff_name: string;
  target_name: string;
  action: string;
  reason: string;
  created_at: Date;
};

function emptyDashboard(plugin: PluginStatus): DashboardData {
  return {
    plugin,
    stats: [
      {
        id: "active",
        label: "Aktif",
        value: "0 / 0",
        hint: "Şu anda sunucuda aktif yetkili",
        accent: "green",
      },
      {
        id: "waiting",
        label: "Bekliyor",
        value: "0",
        hint: "İncelenmeyi bekleyen şikayet",
        accent: "orange",
      },
      {
        id: "total",
        label: "Toplam",
        value: "0",
        hint: "Uygulanan ceza işlemi",
        accent: "pink",
      },
      {
        id: "leader",
        label: "Lider",
        value: "—",
        hint: "Henüz veri yok",
        accent: "purple",
      },
    ],
    leaders: [],
    modActions: [],
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const stale = staleAfterSeconds();
  const offlinePlugin: PluginStatus = {
    online: false,
    serverName: null,
    pluginVersion: null,
    lastSeen: null,
    onlineStaff: 0,
    staleAfterSeconds: stale,
  };

  try {
    const prisma = await getPrisma();
    const weekKey = currentWeekKey();

    const [heartbeatRows, staffRows, onlineCountRows, modCountRows, modRows] =
      await Promise.all([
        prisma.$queryRaw<HeartbeatRow[]>`
          SELECT server_name, plugin_version, last_seen, online_staff, status
          FROM nmonitor_heartbeat WHERE id = 1 LIMIT 1
        `.catch(() => [] as HeartbeatRow[]),
        prisma.$queryRaw<StaffRow[]>`
          SELECT uuid, name, role, weekly_ms
          FROM nmonitor_staff
          WHERE week_key = ${weekKey}
          ORDER BY weekly_ms DESC
          LIMIT 5
        `.catch(() => [] as StaffRow[]),
        prisma.$queryRaw<{ c: bigint | number }[]>`
          SELECT COUNT(*) AS c FROM nmonitor_sessions WHERE is_staff = 1
        `.catch(() => [{ c: 0 }]),
        prisma.$queryRaw<{ c: bigint | number }[]>`
          SELECT COUNT(*) AS c FROM nmonitor_mod_actions
        `.catch(() => [{ c: 0 }]),
        prisma.$queryRaw<ModRow[]>`
          SELECT id, staff_name, target_name, action, reason, created_at
          FROM nmonitor_mod_actions
          ORDER BY created_at DESC
          LIMIT 200
        `.catch(() => [] as ModRow[]),
      ]);

    const hb = heartbeatRows[0];
    let plugin: PluginStatus = offlinePlugin;
    if (hb) {
      const ageSec = (Date.now() - new Date(hb.last_seen).getTime()) / 1000;
      const online =
        hb.status === "online" && ageSec <= stale;
      plugin = {
        online,
        serverName: hb.server_name,
        pluginVersion: hb.plugin_version,
        lastSeen: new Date(hb.last_seen).toISOString(),
        onlineStaff: Number(hb.online_staff) || 0,
        staleAfterSeconds: stale,
      };
    }

    const leaders: WeeklyLeader[] = staffRows.map((row, i) => {
      const weeklyMs = Number(row.weekly_ms) || 0;
      return {
        rank: i + 1,
        name: row.name,
        role: row.role,
        time: formatDuration(weeklyMs),
        uuid: row.uuid,
        weeklyMs,
      };
    });

    const knownStaff = await prisma
      .$queryRaw<{ c: bigint | number }[]>`
        SELECT COUNT(*) AS c FROM nmonitor_staff
      `
      .catch(() => [{ c: leaders.length }]);

    const onlineStaff = Number(onlineCountRows[0]?.c ?? plugin.onlineStaff) || 0;
    const totalStaff = Number(knownStaff[0]?.c ?? 0) || Math.max(onlineStaff, leaders.length);
    const totalMods = Number(modCountRows[0]?.c ?? 0) || 0;
    const leader = leaders[0];

    const modActions: ModAction[] = modRows.map((row) => ({
      id: Number(row.id),
      staff: row.staff_name,
      target: row.target_name,
      action: row.action,
      reason: row.reason,
      at: formatDate(new Date(row.created_at)),
    }));

    const stats: DashboardStat[] = [
      {
        id: "active",
        label: "Aktif",
        value: `${onlineStaff} / ${totalStaff}`,
        hint: "Şu anda sunucuda aktif yetkili",
        accent: "green",
      },
      {
        id: "waiting",
        label: "Bekliyor",
        value: "0",
        hint: "İncelenmeyi bekleyen şikayet",
        accent: "orange",
      },
      {
        id: "total",
        label: "Toplam",
        value: String(totalMods),
        hint: "Uygulanan ceza işlemi",
        accent: "pink",
      },
      {
        id: "leader",
        label: "Lider",
        value: leader?.name ?? "—",
        hint: leader ? `${leader.time} haftalık süre` : "Henüz veri yok",
        accent: "purple",
      },
    ];

    return { plugin, stats, leaders, modActions };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return emptyDashboard(offlinePlugin);
    }
    return emptyDashboard(offlinePlugin);
  }
}
