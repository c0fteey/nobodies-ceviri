import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { cookies } from "next/headers";
import { Providers } from "@/components/providers";
import { getConfig } from "@/lib/config";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NBDSxStaffTracker",
  description: "Minecraft sunucu yetkili istatistikleri ve yönetim paneli",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Kurulum tamam ama cookie yoksa (yeni cihaz / cookie silinmiş) cookie'yi yenile
  const config = await getConfig();
  const cookieStore = await cookies();
  const setupCookie = cookieStore.get("nbdsx_setup")?.value === "1";

  if (config.setupCompleted && !setupCookie) {
    // Cookie set middleware tarafında bir sonraki istekte okunur;
    // login/setup sayfaları da config'e bakar.
  }

  return (
    <html lang="tr" className={`${outfit.variable} h-full`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
