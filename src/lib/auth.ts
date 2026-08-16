import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import type { Provider } from "next-auth/providers";
import { getConfig } from "./config";
import { DEV_ADMIN_ID, DEV_ADMIN_NAME, isDevBypassEnabled } from "./dev";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

const isProd =
  process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: isProd,
};

function cleanEnv(value: string | undefined) {
  return (value || "").trim().replace(/^["']|["']$/g, "");
}

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  // Vercel'e tırnaklı yapıştırılan env'leri temizle
  for (const key of [
    "AUTH_URL",
    "NEXTAUTH_URL",
    "AUTH_SECRET",
    "AUTH_DISCORD_ID",
    "AUTH_DISCORD_SECRET",
    "ADMIN_DISCORD_ID",
    "AUTH_TRUST_HOST",
  ] as const) {
    if (process.env[key]) {
      process.env[key] = cleanEnv(process.env[key]);
    }
  }

  // Vercel'de provider bilgisi önce env'den (getConfig DB hatası OAuth'u bozmasın)
  let fileOrDb = {
    discordClientId: "",
    discordClientSecret: "",
    adminDiscordId: "",
    setupCompleted: false,
  };
  try {
    const cfg = await getConfig();
    fileOrDb = {
      discordClientId: cfg.discordClientId,
      discordClientSecret: cfg.discordClientSecret,
      adminDiscordId: cfg.adminDiscordId,
      setupCompleted: cfg.setupCompleted,
    };
  } catch {
    // ignore — env yeterli
  }

  const clientId = cleanEnv(
    process.env.AUTH_DISCORD_ID ||
      process.env.DISCORD_CLIENT_ID ||
      fileOrDb.discordClientId,
  );
  const clientSecret = cleanEnv(
    process.env.AUTH_DISCORD_SECRET ||
      process.env.DISCORD_CLIENT_SECRET ||
      fileOrDb.discordClientSecret,
  );
  const adminId = cleanEnv(
    process.env.ADMIN_DISCORD_ID || fileOrDb.adminDiscordId,
  );

  if (!clientId || !clientSecret) {
    console.error(
      "[auth] Discord Client ID/Secret eksik. Vercel Environment Variables kontrol et.",
    );
  }

  const providers: Provider[] = [
    Discord({
      clientId: clientId || "missing-client-id",
      clientSecret: clientSecret || "missing-client-secret",
      authorization: {
        params: { scope: "identify email" },
      },
    }),
  ];

  if (isDevBypassEnabled()) {
    providers.push(
      Credentials({
        id: "dev",
        name: "Dev Bypass",
        credentials: {
          unlock: { label: "unlock", type: "text" },
        },
        async authorize() {
          if (!isDevBypassEnabled()) return null;
          return {
            id: DEV_ADMIN_ID,
            name: DEV_ADMIN_NAME,
            email: "dev@localhost",
            image: null,
          };
        },
      }),
    );
  }

  return {
    trustHost: true,
    secret: cleanEnv(process.env.AUTH_SECRET) || undefined,
    session: { strategy: "jwt" },
    useSecureCookies: isProd,
    cookies: {
      sessionToken: {
        name: isProd
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
        options: cookieOptions,
      },
      callbackUrl: {
        name: isProd
          ? "__Secure-authjs.callback-url"
          : "authjs.callback-url",
        options: cookieOptions,
      },
      csrfToken: {
        name: isProd ? "__Host-authjs.csrf-token" : "authjs.csrf-token",
        options: { ...cookieOptions, secure: isProd },
      },
    },
    providers,
    callbacks: {
      async signIn({ account, profile }) {
        if (account?.provider === "dev") {
          return isDevBypassEnabled();
        }

        const discordId = String(
          account?.providerAccountId ||
            (profile as { id?: string } | undefined)?.id ||
            "",
        ).trim();
        if (!discordId) return false;

        const setupDone =
          fileOrDb.setupCompleted ||
          process.env.SETUP_COMPLETED === "1" ||
          process.env.SETUP_COMPLETED === "true";

        if (!setupDone) {
          return Boolean(clientId && clientSecret);
        }

        return Boolean(adminId) && discordId === adminId;
      },
      async jwt({ token, profile, account, user }) {
        if (account?.provider === "discord") {
          const discordProfile = profile as
            | { id?: string; username?: string }
            | undefined;
          token.sub =
            account.providerAccountId || discordProfile?.id || token.sub;
          token.name = discordProfile?.username ?? token.name;
        }
        if (account?.provider === "dev" && user) {
          token.sub = user.id;
          token.name = user.name;
        }
        return token;
      },
      async session({ session, token }) {
        session.user.id = token.sub ?? "";
        if (typeof token.name === "string") {
          session.user.name = token.name;
        }
        return session;
      },
    },
    pages: {
      signIn: "/login",
      error: "/login",
    },
  };
});
