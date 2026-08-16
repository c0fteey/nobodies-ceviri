import { NextResponse } from "next/server";

/** Secret göstermeden Vercel env kontrolü */
export async function GET() {
  const present = (key: string) => {
    const v = (process.env[key] || "").trim().replace(/^["']|["']$/g, "");
    return Boolean(v);
  };

  const authUrl = (process.env.AUTH_URL || "")
    .trim()
    .replace(/^["']|["']$/g, "");
  const nextAuthUrl = (process.env.NEXTAUTH_URL || "")
    .trim()
    .replace(/^["']|["']$/g, "");

  return NextResponse.json({
    ok: true,
    vercel: Boolean(process.env.VERCEL),
    checks: {
      AUTH_SECRET: present("AUTH_SECRET"),
      AUTH_URL: present("AUTH_URL"),
      NEXTAUTH_URL: present("NEXTAUTH_URL"),
      AUTH_TRUST_HOST: present("AUTH_TRUST_HOST"),
      AUTH_DISCORD_ID: present("AUTH_DISCORD_ID"),
      AUTH_DISCORD_SECRET: present("AUTH_DISCORD_SECRET"),
      ADMIN_DISCORD_ID: present("ADMIN_DISCORD_ID"),
      DATABASE_URL: present("DATABASE_URL"),
      SETUP_COMPLETED: present("SETUP_COMPLETED"),
    },
    authUrl,
    nextAuthUrl,
    authUrlLooksCorrect:
      authUrl === "https://nobodiesceviri.vercel.app" ||
      nextAuthUrl === "https://nobodiesceviri.vercel.app",
    expectedRedirect:
      "https://nobodiesceviri.vercel.app/api/auth/callback/discord",
    discordClientIdLast4: clean(process.env.AUTH_DISCORD_ID).slice(-4),
    discordSecretLength: clean(process.env.AUTH_DISCORD_SECRET).length,
    adminIdLast4: clean(process.env.ADMIN_DISCORD_ID).slice(-4),
    tip: "Env tamam. Configuration hatası = Discord Portal Redirect URI veya Client Secret yanlış. Secret uzunluğu genelde 32 civarı.",
  });
}

function clean(value: string | undefined) {
  return (value || "").trim().replace(/^["']|["']$/g, "");
}
