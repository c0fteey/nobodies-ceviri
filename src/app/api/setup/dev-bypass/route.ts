import { NextResponse } from "next/server";
import { saveConfig, persistSetupToEnvLocal } from "@/lib/config";
import { DEV_ADMIN_ID, DEV_ADMIN_NAME, isDevBypassEnabled } from "@/lib/dev";

export async function POST(request: Request) {
  if (!isDevBypassEnabled()) {
    return NextResponse.json(
      { error: "Dev bypass kapalı (DEV_BYPASS=1 ve development gerekli)" },
      { status: 403 },
    );
  }

  const origin = new URL(request.url).origin;

  // Local demo: gerçek DB olmadan panel — env'ye SETUP_COMPLETED yazılmaz
  // (Vercel'de kullanılmaz). Cookie + data/config.json yeterli.
  const config = await saveConfig({
    setupCompleted: true,
    siteUrl: origin,
    discordClientId: "dev-client-id",
    discordClientSecret: "dev-client-secret",
    adminDiscordId: DEV_ADMIN_ID,
    adminUsername: DEV_ADMIN_NAME,
    adminAvatar: null,
    databaseUrl: process.env.DATABASE_URL?.includes("user:password")
      ? ""
      : process.env.DATABASE_URL || "",
  });

  // Sadece gerçek DB varsa env persist
  if (config.databaseUrl && config.discordClientId !== "dev-client-id") {
    await persistSetupToEnvLocal(config);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("nbdsx_setup", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 5,
  });
  return response;
}
