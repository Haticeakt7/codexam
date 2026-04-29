// ==========================================================
// AdminSessions – Session Yönetimi
// ROUTE: /admin/sessions  (Admin only)
// ==========================================================
//
// AMAÇ:
//   Tüm aktif ve geçmiş sınav oturumlarını listeler.
//   Admin zorla sonlandırma yetkisine sahiptir.
//
// BAĞLI HOOKLAR:
//   - useAdminSessions()     → @/hooks/useAdmin → GET /api/admin/sessions
//                              data: AdminSession[], isLoading: boolean
//                              Her kayıt: { sessionId, quizTitle, participantName,
//                                          startedAt, endsAt, isActive, isLocked }
//   - useTerminateSession()  → DELETE /api/admin/sessions/:id (zorla kilitle)
//
// LOCAL STATE:
//   - activeFilter: "all" | "active" | "ended"
//   - terminateTarget: AdminSession | null
//
// UI TASARIM:
//   AdminLayout içinde sekme filtresi + tablo.
//
//   ┌──────────────────────────────────────────────────────────────┐
//   │  Session Yönetimi                                            │
//   │  [Tümü] [Aktif] [Bitti] ← sekme filtresi                   │
//   ├──────────────────────────────────────────────────────────────┤
//   │  Katılımcı     Quiz           Başlangıç   Bitiş     İşlem   │
//   │  Ahmet Y.      Veri Yapıları  14:00       15:00     [⏹]     │
//   │  Ayşe K.       Algo Sınavı    13:30       Bitti     —       │
//   │  ...                                                         │
//   └──────────────────────────────────────────────────────────────┘
//
//   Tablo tasarım notları:
//     - Aktif session: satır yeşil kenarlı veya "Canlı" badge
//     - [⏹] Sonlandır: sadece aktif sessionlarda görünür → ConfirmDialog → terminateSession
//     - isLocked: "Kilitli" badge ile gösterilir
//     - SessionToken bilgisi görünebilir (kopyalanabilir - opsiyonel)
//     - isLoading: Spinner
//     - Boş: EmptyState
//
// NAVIGASYON:
//   - Herhangi bir özel navigasyon yok
// ==========================================================

import { useAdminSessions, useForceEndSession } from "@/hooks/useAdmin";

export default function AdminSessions() {
  // const { data: sessions, isLoading } = useAdminSessions();
  // const { mutate: terminateSession } = useTerminateSession();
  // const [activeFilter, setActiveFilter] = useState<"all" | "active" | "ended">("all");
  // const [terminateTarget, setTerminateTarget] = useState(null);

  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  void useAdminSessions; void useForceEndSession;
  return null;
}
