// ==========================================================
// AdminStats – Admin Dashboard (KPI Özeti)
// ROUTE: /admin  (Admin index sayfası)
// ==========================================================
//
// AMAÇ:
//   Admin panelinin ana sayfası. Sistem genelindeki temel metrikleri
//   ve son hata özetini gösterir.
//
// BAĞLI HOOKLAR:
//   - useAdminStats()    → @/hooks/useAdmin → GET /api/admin/stats
//                          data: {
//                            totalUsers: number,
//                            activeQuizzes: number,
//                            totalSessions: number,
//                            dailyExecutions: number,
//                            recentErrors: number  (son 24 saat)
//                          }
//                          isLoading: boolean
//
// UI TASARIM:
//   AdminLayout içinde KPI kartlar + son hata logları.
//
//   ┌─────────────────────────────────────────────────────────────┐
//   │  Sistem Dashboard                                           │
//   ├─────────────────────────────────────────────────────────────┤
//   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
//   │  │ 156      │  │ 3        │  │ 48       │  │ 1.2K     │   │
//   │  │ Kullanıcı│  │ Aktif    │  │ Session  │  │ Execution│   │
//   │  │          │  │ Quiz     │  │ (bugün)  │  │ (bugün)  │   │
//   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
//   │                                                             │
//   │  Son 24 Saat Hatalar: [5 hata] → /admin/system linki       │
//   │  ─────────────────────────────────────────────────────────  │
//   │  Son Hata Logları (özet liste, max 5 satır)                │
//   │  [!] API: "Null reference exception" – 14:32               │
//   │  [!] Runner: "Container timeout" – 13:15                   │
//   └─────────────────────────────────────────────────────────────┘
//
//   KPI kart tasarım notları:
//     - 4 sütun grid (sm: 2 sütun, lg: 4 sütun)
//     - Her kart: büyük sayı + etiket + ikon (opsiyonel)
//     - isLoading: tüm kartlar yerine skeleton/spinner
//     - "recentErrors > 0" ise hata sayısı danger renkte
//
//   Son hata logları:
//     - Max 5 satır; "Tümünü Gör" → /admin/system linki
//     - Kaynak (API/Runner/Nginx) badge ile gösterilir
//
// NAVIGASYON:
//   - "Tümünü Gör" → /admin/system
// ==========================================================

import { useAdminStats } from "@/hooks/useAdmin";

export default function AdminStats() {
  // const { data: stats, isLoading } = useAdminStats();

  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  void useAdminStats;
  return null;
}
