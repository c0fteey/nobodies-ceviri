# NBDSxStaffTracker Design Spec

**Date:** 2026-08-09  
**Status:** Approved

## Goal

Minecraft sunucu yetkili takip paneli: kurulum wizard’ı, Discord-only login (admin), koyu varsayılan temalı dashboard. Production domain’e (cPanel) taşınabilir; localhost yalnızca geliştirme.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Radix UI primitives
- Auth.js (NextAuth v5) — Discord provider
- Prisma + MySQL/MariaDB
- next-themes (sun/moon toggle)

## Setup wizard (3 steps)

1. **Discord OAuth** — Client ID, Client Secret, Site URL (production URL). Redirect URI = `{siteUrl}/api/auth/callback/discord`
2. **Admin** — Discord ile giriş; avatar + username göster; admin Discord ID kaydedilir
3. **MySQL** — host, port, database, user, password; bağlantı testi; şema oluştur; kurulum tamamlanır

Kurulum bitince `/setup` kilitlenir. Kurulum yoksa korumalı rotalar `/setup`’a yönlendirir.

## Auth

- Sadece Discord OAuth
- JWT session
- Panel erişimi: yalnızca wizard’daki admin Discord ID (v1)
- `AUTH_URL` / Site URL production domain’e göre

## Data

- `AppSettings`: setupCompleted, discord credentials (secret encrypted), siteUrl, admin Discord profile
- Dashboard stats/leaderboard/mod logs: mock data (plugin API later)

## UI

- Brand: NBDSxStaffTracker
- Nav: Yetkililer, Sohbet, Komutlar, Moderasyon, Şikayetler (+ Dashboard ana)
- Default black theme; sun icon in dark → light; moon in light → dark
- Dashboard layout matching reference, more refined
- Placeholder pages for nav items

## Out of scope (v1)

Plugin API, staff roles, real moderation data, complaint workflow
