import { NextResponse } from "next/server";
import { z } from "zod";
import { getConfig, saveConfig } from "@/lib/config";

const schema = z.object({
  siteUrl: z.string().url("Geçerli bir site URL girin"),
  discordClientId: z.string().min(5, "Client ID gerekli"),
  discordClientSecret: z.string().min(5, "Client Secret gerekli"),
});

export async function POST(request: Request) {
  const config = await getConfig();
  if (config.setupCompleted) {
    return NextResponse.json({ error: "Kurulum zaten tamamlandı" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Geçersiz veri" },
      { status: 400 },
    );
  }

  const siteUrl = parsed.data.siteUrl.replace(/\/$/, "");

  await saveConfig({
    siteUrl,
    discordClientId: parsed.data.discordClientId.trim(),
    discordClientSecret: parsed.data.discordClientSecret.trim(),
  });

  return NextResponse.json({
    ok: true,
    redirectUri: `${siteUrl}/api/auth/callback/discord`,
  });
}
