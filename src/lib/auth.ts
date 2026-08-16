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

function cleanEnv(value: string | undefined) {
  return (value || "").trim().replace(/^["']|["']$/g, "");
}

function sanitizeAuthEnv() {
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
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  sanitizeAuthEnv();

  const clientId = cleanEnv(
    process.env.AUTH_DISCORD_ID || process.env.DISCORD_CLIENT_ID,
  );
  const clientSecret = cleanEnv(
    process.env.AUTH_DISCORD_SECRET || process.env.DISCORD_CLIENT_SECRET,
  );
  const adminId = cleanEnv(process.env.ADMIN_DISCORD_ID);
  const setupDone =
    process.env.SETUP_COMPLETED === "1" ||
    process.env.SETUP_COMPLETED === "true";

  const providers: Provider[] = [];

  if (clientId && clientSecret) {
    providers.push(
      Discord({
        clientId,
        clientSecret,
        // Vercel'de PKCE cookie kaybolunca Configuration hatası oluşuyor
        checks: ["state"],
        authorization: {
          params: { scope: "identify" },
        },
      }),
    );
  }

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

        if (!setupDone) {
          try {
            const cfg = await getConfig();
            return Boolean(cfg.discordClientId && cfg.discordClientSecret);
          } catch {
            return Boolean(clientId && clientSecret);
          }
        }

        const allowed = adminId || cleanEnv(process.env.ADMIN_DISCORD_ID);
        return Boolean(allowed) && discordId === allowed;
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
    debug: process.env.AUTH_DEBUG === "1",
    logger: {
      error(error) {
        console.error("[auth][error]", error);
      },
    },
  };
});
