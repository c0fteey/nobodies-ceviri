# NBDSxStaffTracker

Minecraft yetkili takip paneli — Next.js + Radix UI + Auth.js + MySQL.

## Local geliştirme

```bash
npm install
npm run dev
```

Wizard bir kez tamamlanınca ayarlar `data/config.json` + `.env.local` + MySQL'e yazılır.
Sonraki açılışlarda kurulum sayfasına **dönülmez**.

Sıfırlamak (sadece local): http://localhost:3000/api/setup/reset

## Vercel deploy

Vercel'de dosya sistemi kalıcı değildir. Wizard yerine **Environment Variables** kullan.

### 1) MySQL
XAMPP localhost Vercel'den erişilemez. Uzak MySQL kullan (ör. Railway, Aiven, PlanetScale, VPS).

### 2) Vercel → Settings → Environment Variables

| Değişken | Örnek |
|----------|--------|
| `AUTH_SECRET` | rastgele uzun string |
| `AUTH_URL` | `https://proje.vercel.app` |
| `NEXTAUTH_URL` | `https://proje.vercel.app` |
| `AUTH_TRUST_HOST` | `true` |
| `AUTH_DISCORD_ID` | Discord Client ID |
| `AUTH_DISCORD_SECRET` | Discord Client Secret |
| `ADMIN_DISCORD_ID` | senin Discord kullanıcı ID |
| `ADMIN_DISCORD_USERNAME` | görünen ad |
| `DATABASE_URL` | `mysql://user:pass@host:3306/nbdsx_staff` |
| `SETUP_COMPLETED` | `1` |

`DEV_BYPASS` production'da **ekleme**.

### 3) Discord Redirect URI

```
https://proje.vercel.app/api/auth/callback/discord
```

### 4) Deploy

```bash
npx vercel
```

veya GitHub bağla → otomatik deploy.

İlk deploy sonrası MySQL'de `AppSettings` tablosu yoksa bir kez local wizard ile oluştur veya phpMyAdmin/SQL ile şemayı çalıştır.
