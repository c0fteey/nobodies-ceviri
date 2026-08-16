import { promises as fs } from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { decrypt, encrypt } from "./crypto";
import {
  isSetupCompleteSync,
  isUsableDatabaseUrl,
} from "./setup-status";

export type AppConfig = {
  setupCompleted: boolean;
  siteUrl: string;
  discordClientId: string;
  discordClientSecret: string;
  adminDiscordId: string;
  adminUsername: string;
  adminAvatar: string | null;
  databaseUrl: string;
};

export { isSetupCompleteSync, isUsableDatabaseUrl } from "./setup-status";

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_PATH = path.join(DATA_DIR, "config.json");

const emptyConfig = (): AppConfig => ({
  setupCompleted: false,
  siteUrl: "",
  discordClientId: "",
  discordClientSecret: "",
  adminDiscordId: "",
  adminUsername: "",
  adminAvatar: null,
  databaseUrl: "",
});

type StoredConfig = Omit<AppConfig, "discordClientSecret"> & {
  discordClientSecretEnc: string;
};

function configFromEnv(): AppConfig {
  const base = emptyConfig();
  return {
    ...base,
    siteUrl: (
      process.env.AUTH_URL ||
      process.env.NEXTAUTH_URL ||
      ""
    ).replace(/\/$/, ""),
    discordClientId:
      process.env.AUTH_DISCORD_ID || process.env.DISCORD_CLIENT_ID || "",
    discordClientSecret:
      process.env.AUTH_DISCORD_SECRET ||
      process.env.DISCORD_CLIENT_SECRET ||
      "",
    adminDiscordId: process.env.ADMIN_DISCORD_ID || "",
    adminUsername: process.env.ADMIN_DISCORD_USERNAME || "Admin",
    adminAvatar: process.env.ADMIN_DISCORD_AVATAR || null,
    databaseUrl: isUsableDatabaseUrl(process.env.DATABASE_URL)
      ? process.env.DATABASE_URL!
      : "",
    setupCompleted: isSetupCompleteSync(),
  };
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readFileConfig(): Promise<AppConfig | null> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    const stored = JSON.parse(raw) as StoredConfig;
    return {
      setupCompleted: Boolean(stored.setupCompleted),
      siteUrl: stored.siteUrl || "",
      discordClientId: stored.discordClientId || "",
      discordClientSecret: stored.discordClientSecretEnc
        ? decrypt(stored.discordClientSecretEnc)
        : "",
      adminDiscordId: stored.adminDiscordId || "",
      adminUsername: stored.adminUsername || "",
      adminAvatar: stored.adminAvatar ?? null,
      databaseUrl: stored.databaseUrl || "",
    };
  } catch {
    return null;
  }
}

async function readDbConfig(databaseUrl: string): Promise<AppConfig | null> {
  try {
    const connection = await mysql.createConnection(databaseUrl);
    try {
      const [rows] = await connection.query(
        `SELECT setupCompleted, siteUrl, discordClientId, discordClientSecret,
                adminDiscordId, adminUsername, adminAvatar
         FROM AppSettings WHERE id = 1 LIMIT 1`,
      );
      const row = (rows as Array<Record<string, unknown>>)[0];
      if (!row) return null;

      return {
        setupCompleted: Boolean(row.setupCompleted),
        siteUrl: String(row.siteUrl || ""),
        discordClientId: String(row.discordClientId || ""),
        discordClientSecret: String(row.discordClientSecret || ""),
        adminDiscordId: String(row.adminDiscordId || ""),
        adminUsername: String(row.adminUsername || ""),
        adminAvatar: row.adminAvatar ? String(row.adminAvatar) : null,
        databaseUrl,
      };
    } finally {
      await connection.end();
    }
  } catch {
    return null;
  }
}

function mergeConfig(parts: Array<AppConfig | null>): AppConfig {
  const result = emptyConfig();
  for (const part of parts) {
    if (!part) continue;
    if (part.siteUrl) result.siteUrl = part.siteUrl;
    if (part.discordClientId) result.discordClientId = part.discordClientId;
    if (part.discordClientSecret)
      result.discordClientSecret = part.discordClientSecret;
    if (part.adminDiscordId) result.adminDiscordId = part.adminDiscordId;
    if (part.adminUsername) result.adminUsername = part.adminUsername;
    if (part.adminAvatar) result.adminAvatar = part.adminAvatar;
    if (part.databaseUrl && isUsableDatabaseUrl(part.databaseUrl)) {
      result.databaseUrl = part.databaseUrl;
    }
    if (part.setupCompleted) result.setupCompleted = true;
  }

  // Env ile tüm zorunlu alanlar doluysa yine tamam say
  if (isSetupCompleteSync()) result.setupCompleted = true;

  // Dosya/DB'de kayıtlı tam kurulum
  if (
    result.discordClientId &&
    result.discordClientSecret &&
    result.adminDiscordId &&
    isUsableDatabaseUrl(result.databaseUrl)
  ) {
    result.setupCompleted = true;
  }

  return result;
}

export async function getConfig(): Promise<AppConfig> {
  const env = configFromEnv();
  const file = await readFileConfig();
  const dbUrl =
    (isUsableDatabaseUrl(env.databaseUrl) && env.databaseUrl) ||
    (file && isUsableDatabaseUrl(file.databaseUrl) ? file.databaseUrl : "") ||
    "";

  const db = dbUrl ? await readDbConfig(dbUrl) : null;
  return mergeConfig([file, db, env]);
}

export async function saveConfig(
  partial: Partial<AppConfig>,
): Promise<AppConfig> {
  await ensureDataDir();
  const current = await getConfig();
  const next: AppConfig = { ...current, ...partial };

  const stored: StoredConfig = {
    setupCompleted: next.setupCompleted,
    siteUrl: next.siteUrl,
    discordClientId: next.discordClientId,
    discordClientSecretEnc: next.discordClientSecret
      ? encrypt(next.discordClientSecret)
      : "",
    adminDiscordId: next.adminDiscordId,
    adminUsername: next.adminUsername,
    adminAvatar: next.adminAvatar,
    databaseUrl: next.databaseUrl,
  };

  await fs.writeFile(CONFIG_PATH, JSON.stringify(stored, null, 2), "utf8");
  return next;
}

export async function isSetupComplete(): Promise<boolean> {
  if (isSetupCompleteSync()) return true;
  const config = await getConfig();
  return config.setupCompleted;
}

export async function resetConfig(): Promise<void> {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    throw new Error("Production / Vercel üzerinde kurulum sıfırlanamaz");
  }
  await ensureDataDir();
  const stored: StoredConfig = {
    setupCompleted: false,
    siteUrl: "",
    discordClientId: "",
    discordClientSecretEnc: "",
    adminDiscordId: "",
    adminUsername: "",
    adminAvatar: null,
    databaseUrl: "",
  };
  await fs.writeFile(CONFIG_PATH, JSON.stringify(stored, null, 2), "utf8");
}

/** Wizard sonrası .env.local'e yazar — restart sonrası da kurulum kalır (Vercel'de no-op). */
export async function persistSetupToEnvLocal(config: AppConfig): Promise<void> {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") return;

  const envPath = path.join(process.cwd(), ".env.local");
  let existing = "";
  try {
    existing = await fs.readFile(envPath, "utf8");
  } catch {
    existing = "";
  }

  const upsert = (content: string, key: string, value: string) => {
    const line = `${key}="${value.replace(/"/g, '\\"')}"`;
    const re = new RegExp(`^${key}=.*$`, "m");
    if (re.test(content)) return content.replace(re, line);
    return `${content.trimEnd()}\n${line}\n`;
  };

  let next = existing;
  next = upsert(next, "SETUP_COMPLETED", "1");
  next = upsert(next, "AUTH_TRUST_HOST", "true");
  if (config.siteUrl) {
    next = upsert(next, "AUTH_URL", config.siteUrl);
    next = upsert(next, "NEXTAUTH_URL", config.siteUrl);
  }
  if (config.discordClientId) {
    next = upsert(next, "AUTH_DISCORD_ID", config.discordClientId);
  }
  if (config.discordClientSecret) {
    next = upsert(next, "AUTH_DISCORD_SECRET", config.discordClientSecret);
  }
  if (config.adminDiscordId) {
    next = upsert(next, "ADMIN_DISCORD_ID", config.adminDiscordId);
  }
  if (config.adminUsername) {
    next = upsert(next, "ADMIN_DISCORD_USERNAME", config.adminUsername);
  }
  if (config.databaseUrl) {
    next = upsert(next, "DATABASE_URL", config.databaseUrl);
  }

  await fs.writeFile(envPath, next, "utf8");
}
