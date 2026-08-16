import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getConfig, saveConfig } from "@/lib/config";

export async function POST() {
  const config = await getConfig();
  if (config.setupCompleted) {
    return NextResponse.json({ error: "Kurulum zaten tamamlandı" }, { status: 400 });
  }
  if (!config.discordClientId || !config.discordClientSecret) {
    return NextResponse.json(
      { error: "Önce Discord OAuth bilgilerini kaydedin" },
      { status: 400 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Discord ile giriş yapmanız gerekiyor" },
      { status: 401 },
    );
  }

  await saveConfig({
    adminDiscordId: session.user.id,
    adminUsername: session.user.name || "Discord User",
    adminAvatar: session.user.image || null,
  });

  return NextResponse.json({
    ok: true,
    admin: {
      id: session.user.id,
      username: session.user.name,
      avatar: session.user.image,
    },
  });
}
