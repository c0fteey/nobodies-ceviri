export const dashboardStats = [
  {
    id: "active",
    label: "Aktif",
    value: "2 / 4",
    hint: "Şu anda sunucuda aktif yetkili",
    accent: "green" as const,
  },
  {
    id: "waiting",
    label: "Bekliyor",
    value: "0",
    hint: "İncelenmeyi bekleyen şikayet",
    accent: "orange" as const,
  },
  {
    id: "total",
    label: "Toplam",
    value: "2",
    hint: "Uygulanan ceza işlemi",
    accent: "pink" as const,
  },
  {
    id: "leader",
    label: "Lider",
    value: "Cofteey",
    hint: "20s 0dk haftalık süre",
    accent: "purple" as const,
  },
];

export const weeklyLeaders = [
  {
    rank: 1,
    name: "Cofteey",
    role: "Rehber",
    time: "20s 0dk",
    uuid: "ec535825-9332-4a93-87b2-ae4e2bfcc487",
  },
  {
    rank: 2,
    name: "Nortap",
    role: "Moderator",
    time: "12s 40dk",
    uuid: "069a79f4-44e9-4726-a5be-fca90e38aaf5",
  },
  {
    rank: 3,
    name: "KaanTR",
    role: "Helper",
    time: "9s 15dk",
    uuid: "853c80ef-3c37-49fd-aa49-938b840570d4",
  },
  {
    rank: 4,
    name: "Mira",
    role: "Rehber",
    time: "7s 50dk",
    uuid: "fcea4f6d-1f1c-4d8a-9f3e-2d2b0d9f0a11",
  },
];

export const recentModActions = [
  {
    staff: "Nortap",
    target: "spamerOyuncu",
    action: "Mute",
    reason: "Sohbeti Kirletmek / Flood",
    at: "21/03/2026 22:12:00",
  },
  {
    staff: "Cofteey",
    target: "ToxicUser99",
    action: "Warn",
    reason: "Küfür / Hakaret",
    at: "21/03/2026 21:48:11",
  },
  {
    staff: "KaanTR",
    target: "HileciX",
    action: "Ban",
    reason: "Hile kullanımı",
    at: "21/03/2026 20:05:33",
  },
];

export const navItems = [
  { href: "/yetkililer", label: "Yetkililer" },
  { href: "/sohbet", label: "Sohbet" },
  { href: "/komutlar", label: "Komutlar" },
  { href: "/moderasyon", label: "Moderasyon" },
  { href: "/sikayetler", label: "Şikayetler" },
] as const;
