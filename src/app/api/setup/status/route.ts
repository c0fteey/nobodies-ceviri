import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { isDevBypassEnabled } from "@/lib/dev";

export async function GET() {
  const config = await getConfig();
  return NextResponse.json({
    setupCompleted: config.setupCompleted,
    hasDiscord: Boolean(config.discordClientId && config.discordClientSecret),
    hasAdmin: Boolean(config.adminDiscordId),
    hasDatabase: Boolean(config.databaseUrl),
    siteUrl: config.siteUrl,
    devBypass: isDevBypassEnabled(),
    admin: config.adminDiscordId
      ? {
          id: config.adminDiscordId,
          username: config.adminUsername,
          avatar: config.adminAvatar,
        }
      : null,
  });
}
