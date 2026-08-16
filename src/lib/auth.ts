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

const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: isProd,
};

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const config = await getConfig();

  const authUrl = (
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    config.siteUrl ||
    ""
  ).replace(/\/$/, "");

  if (authUrl) {
    process.env.AUTH_URL = authUrl;
    process.env.NEXTAUTH_URL = authUrl;
  }

  const providers: Provider[] = [
    Discord({
      clientId:
        config.discordClientId ||
        process.env.AUTH_DISCORD_ID ||
        process.env.DISCORD_CLIENT_ID ||
        "pending",
      clientSecret:
        config.discordClientSecret ||
        process.env.AUTH_DISCORD_SECRET ||
        process.env.DISCORD_CLIENT_SECRET ||
        "pending",
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
    secret: process.env.AUTH_SECRET,
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

        const latest = await getConfig();
        // Discord kullanıcı ID — profile.id bazen gelmez; providerAccountId güvenilir
        const discordId = String(
          account?.providerAccountId ||
            (profile as { id?: string } | undefined)?.id ||
            "",
        ).trim();
        if (!discordId) return false;

        if (!latest.setupCompleted) {
          return Boolean(latest.discordClientId && latest.discordClientSecret);
        }

        const adminId = String(
          latest.adminDiscordId || process.env.ADMIN_DISCORD_ID || "",
        ).trim();

        return Boolean(adminId) && discordId === adminId;
      },
      async jwt({ token, profile, account, user }) {
        if (account?.provider === "discord") {
          const discordProfile = profile as
            | { id?: string; username?: string }
            | undefined;
          token.sub =
            account.providerAccountId ||
            discordProfile?.id ||
            token.sub;
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
