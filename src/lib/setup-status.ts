/** Edge/middleware güvenli — fs/mysql import etmez */

export function isUsableDatabaseUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  if (url.includes("user:password@")) return false;
  if (url.includes("PASSWORD") || url.includes("changeme")) return false;
  return url.startsWith("mysql://") || url.startsWith("mysqls://");
}

/**
 * Vercel / production: Environment Variables doluysa kurulum bitmiş sayılır.
 * Cookie'ye bağımlı değildir.
 */
export function isSetupCompleteSync(): boolean {
  if (
    process.env.SETUP_COMPLETED === "1" ||
    process.env.SETUP_COMPLETED === "true"
  ) {
    return true;
  }

  const discordId =
    process.env.AUTH_DISCORD_ID || process.env.DISCORD_CLIENT_ID || "";
  const discordSecret =
    process.env.AUTH_DISCORD_SECRET || process.env.DISCORD_CLIENT_SECRET || "";
  const adminId = process.env.ADMIN_DISCORD_ID || "";
  const db = process.env.DATABASE_URL || "";

  return Boolean(
    discordId && discordSecret && adminId && isUsableDatabaseUrl(db),
  );
}
