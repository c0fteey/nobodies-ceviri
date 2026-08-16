package me.Cofteey.nMonitor.litebans;

import litebans.api.Entry;
import litebans.api.Events;
import me.Cofteey.nMonitor.NMonitor;
import me.Cofteey.nMonitor.config.ConfigManager;
import me.Cofteey.nMonitor.database.DatabaseManager;
import org.bukkit.Bukkit;
import org.bukkit.OfflinePlayer;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.logging.Level;

public final class LiteBansHook {

    private final NMonitor plugin;
    private final DatabaseManager db;
    private final ConfigManager config;
    private Events.Listener listener;

    public LiteBansHook(NMonitor plugin, DatabaseManager db, ConfigManager config) {
        this.plugin = plugin;
        this.db = db;
        this.config = config;
    }

    public void register() {
        if (!config.liteBansEnabled()) return;
        if (Bukkit.getPluginManager().getPlugin("LiteBans") == null) {
            plugin.getLogger().info("LiteBans yok — moderasyon log hook’u pasif.");
            return;
        }
        try {
            listener = new Events.Listener() {
                @Override
                public void entryAdded(Entry entry) {
                    handleEntry(entry);
                }
            };
            Events.get().register(listener);
            plugin.getLogger().info("LiteBans hook aktif.");
        } catch (Throwable t) {
            plugin.getLogger().log(Level.WARNING, "LiteBans API bağlanamadı: " + t.getMessage());
        }
    }

    public void unregister() {
        listener = null;
    }

    private void handleEntry(Entry entry) {
        try {
            String type = entry.getType() == null ? "" : entry.getType().toUpperCase(Locale.ROOT);
            if (!isTracked(type)) return;

            String executorName = entry.getExecutorName() == null ? "Console" : entry.getExecutorName();
            String executorUuid = entry.getExecutorUUID();
            String targetUuid = entry.getUuid();
            String targetName = resolveName(targetUuid);
            String reason = entry.getReason() == null || entry.getReason().isBlank() ? "Sebep belirtilmedi." : entry.getReason();

            insertAction(executorName, executorUuid, targetName, targetUuid, mapType(type), reason, entry.getId());
        } catch (Throwable t) {
            if (config.debug()) {
                plugin.getLogger().warning("LiteBans entry parse hata: " + t.getMessage());
            }
        }
    }

    private boolean isTracked(String type) {
        List<String> allowed = config.liteBansTypes();
        if (allowed == null || allowed.isEmpty()) return true;
        for (String a : allowed) {
            if (a != null && a.equalsIgnoreCase(type)) return true;
        }
        return false;
    }

    private static String mapType(String type) {
        return switch (type) {
            case "BAN" -> "Ban";
            case "MUTE" -> "Mute";
            case "WARN", "WARNING" -> "Warn";
            case "KICK" -> "Kick";
            default -> type.isEmpty() ? "Other"
                    : type.substring(0, 1).toUpperCase(Locale.ROOT) + type.substring(1).toLowerCase(Locale.ROOT);
        };
    }

    private static String resolveName(String uuidStr) {
        if (uuidStr == null || uuidStr.isBlank() || uuidStr.equals("#")) return "?";
        try {
            UUID uuid = UUID.fromString(uuidStr);
            OfflinePlayer op = Bukkit.getOfflinePlayer(uuid);
            String name = op.getName();
            return name == null || name.isBlank() ? "?" : name;
        } catch (Exception e) {
            return "?";
        }
    }

    public void insertAction(
            String staffName,
            String staffUuid,
            String targetName,
            String targetUuid,
            String action,
            String reason,
            long liteBansId
    ) {
        if (!db.isConnected()) return;
        db.runAsync(() -> {
            try (Connection c = db.getConnection();
                 PreparedStatement ps = c.prepareStatement("""
                     INSERT INTO nmonitor_mod_actions
                       (staff_name, staff_uuid, target_name, target_uuid, action, reason, created_at, litebans_id)
                     VALUES (?, ?, ?, ?, ?, ?, NOW(3), ?)
                     """)) {
                ps.setString(1, truncate(staffName == null ? "Console" : staffName, 16));
                ps.setString(2, normalizeUuid(staffUuid));
                ps.setString(3, truncate(targetName == null ? "?" : targetName, 16));
                ps.setString(4, normalizeUuid(targetUuid));
                ps.setString(5, truncate(action, 32));
                ps.setString(6, truncate(reason == null ? "Yok" : reason, 512));
                if (liteBansId > 0) {
                    ps.setLong(7, liteBansId);
                } else {
                    ps.setObject(7, null);
                }
                ps.executeUpdate();
            }
        });
    }

    private static String normalizeUuid(String raw) {
        if (raw == null || raw.isBlank() || raw.equalsIgnoreCase("null") || raw.equals("#")) {
            return null;
        }
        try {
            return UUID.fromString(raw).toString();
        } catch (Exception e) {
            return raw.length() > 36 ? raw.substring(0, 36) : raw;
        }
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max);
    }
}
