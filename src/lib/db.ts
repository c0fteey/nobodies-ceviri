import { PrismaClient } from "@prisma/client";
import mysql from "mysql2/promise";
import { getConfig } from "./config";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __prismaUrl: string | undefined;
}

export function buildDatabaseUrl(input: {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}) {
  const user = encodeURIComponent(input.user);
  const password = encodeURIComponent(input.password);
  return `mysql://${user}:${password}@${input.host}:${input.port}/${input.database}`;
}

export async function testMysqlConnection(databaseUrl: string) {
  const connection = await mysql.createConnection(databaseUrl);
  await connection.query("SELECT 1");
  await connection.end();
}

export async function getPrisma() {
  const config = await getConfig();
  const url = config.databaseUrl || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL tanımlı değil");
  }

  if (global.__prisma && global.__prismaUrl !== url) {
    await global.__prisma.$disconnect().catch(() => undefined);
    global.__prisma = undefined;
  }

  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      datasources: { db: { url } },
    });
    global.__prismaUrl = url;
  }

  return global.__prisma;
}

/** Kurulumda Prisma yerine doğrudan mysql2 — stale connection sorununu önler. */
export async function syncSettingsToDatabase() {
  const config = await getConfig();
  if (!config.databaseUrl) return;

  const connection = await mysql.createConnection(config.databaseUrl);
  try {
    await connection.query(
      `
      INSERT INTO AppSettings (
        id, setupCompleted, siteUrl, discordClientId, discordClientSecret,
        adminDiscordId, adminUsername, adminAvatar, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))
      ON DUPLICATE KEY UPDATE
        setupCompleted = VALUES(setupCompleted),
        siteUrl = VALUES(siteUrl),
        discordClientId = VALUES(discordClientId),
        discordClientSecret = VALUES(discordClientSecret),
        adminDiscordId = VALUES(adminDiscordId),
        adminUsername = VALUES(adminUsername),
        adminAvatar = VALUES(adminAvatar),
        updatedAt = NOW(3)
      `,
      [
        1,
        config.setupCompleted ? 1 : 0,
        config.siteUrl,
        config.discordClientId,
        config.discordClientSecret,
        config.adminDiscordId,
        config.adminUsername,
        config.adminAvatar,
      ],
    );
  } finally {
    await connection.end();
  }
}
