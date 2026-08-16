import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { z } from "zod";
import { getConfig, saveConfig, persistSetupToEnvLocal } from "@/lib/config";
import { buildDatabaseUrl, syncSettingsToDatabase, testMysqlConnection } from "@/lib/db";

const schema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().min(1).max(65535).default(3306),
  database: z.string().min(1),
  user: z.string().min(1),
  password: z.string(),
});

async function ensureDatabase(input: {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}) {
  const connection = await mysql.createConnection({
    host: input.host,
    port: input.port,
    user: input.user,
    password: input.password,
  });
  const db = input.database.replace(/[^a-zA-Z0-9_]/g, "");
  if (!db) throw new Error("Geçersiz veritabanı adı");
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.end();
}

async function ensureSchema(databaseUrl: string) {
  const connection = await mysql.createConnection(databaseUrl);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS AppSettings (
      id INT NOT NULL PRIMARY KEY,
      setupCompleted BOOLEAN NOT NULL DEFAULT false,
      siteUrl VARCHAR(512) NOT NULL,
      discordClientId VARCHAR(128) NOT NULL,
      discordClientSecret TEXT NOT NULL,
      adminDiscordId VARCHAR(64) NOT NULL,
      adminUsername VARCHAR(128) NOT NULL,
      adminAvatar VARCHAR(512) NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);
  await connection.end();
}

export async function POST(request: Request) {
  const config = await getConfig();
  if (config.setupCompleted) {
    return NextResponse.json({ error: "Kurulum zaten tamamlandı" }, { status: 400 });
  }
  if (!config.adminDiscordId) {
    return NextResponse.json(
      { error: "Önce admin Discord hesabını onaylayın" },
      { status: 400 },
    );
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Geçersiz MySQL bilgileri" },
      { status: 400 },
    );
  }

  const databaseUrl = buildDatabaseUrl(parsed.data);

  try {
    await ensureDatabase(parsed.data);
    await testMysqlConnection(databaseUrl);
    await ensureSchema(databaseUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "MySQL bağlantısı başarısız";
    return NextResponse.json(
      { error: `Bağlantı hatası: ${message}` },
      { status: 400 },
    );
  }

  await saveConfig({ databaseUrl, setupCompleted: true });

  try {
    await syncSettingsToDatabase();
  } catch (error) {
    await saveConfig({ setupCompleted: false });
    const message =
      error instanceof Error ? error.message : "Ayarlar veritabanına yazılamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const finalConfig = await getConfig();
  await persistSetupToEnvLocal(finalConfig);

  const response = NextResponse.json({
    ok: true,
    note: "Kurulum kaydedildi. Vercel için aynı değerleri Environment Variables olarak ekle.",
  });
  response.cookies.set("nbdsx_setup", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 5,
  });
  return response;
}
