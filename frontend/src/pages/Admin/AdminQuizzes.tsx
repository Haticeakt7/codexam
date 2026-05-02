// ==========================================================
// AdminQuizzes – Admin Quiz Yönetimi
// ROUTE: /admin/quizzes  (Admin only)
// ==========================================================
//
// AMAÇ:
//   Sistemdeki tüm quiz'leri (herhangi bir kullanıcıya ait) listeler.
//   Admin silme ve detay görüntüleme yetkisine sahiptir.
//
// BAĞLI HOOKLAR:
//   - useAdminQuizzes()   → @/hooks/useAdmin → GET /api/admin/quizzes
//                           data: AdminQuiz[], isLoading: boolean
//                           Her kayıt: { id, title, owner, status, questionCount, sessionCount, createdAt }
//   - useAdminDeleteQuiz() → DELETE /api/admin/quizzes/:id
//
// LOCAL STATE:
//   - statusFilter: "all" | "Draft" | "Active" | "Ended"
//   - deleteTarget: AdminQuiz | null
//
// UI TASARIM:
//   AdminLayout içinde filtre + tablo.
//
//   ┌──────────────────────────────────────────────────────────────┐
//   │  Quiz Yönetimi                                               │
//   │  [Tümü ▾] ← durum filtresi                                  │
//   ├──────────────────────────────────────────────────────────────┤
//   │  Başlık         Sahip       Durum    Soru  Session  İşlem   │
//   │  Veri Yapıları  Ahmet Y.   [Active]   12     48     [🗑️]    │
//   │  Algo Sınavı    Ayşe K.    [Draft]     5      0     [🗑️]    │
//   │  ...                                                         │
//   └──────────────────────────────────────────────────────────────┘
//
//   Tablo tasarım notları:
//     - Durum badge: Draft=muted, Active=yeşil, Ended=muted
//     - [🗑️] Sil → ConfirmDialog → useAdminDeleteQuiz
//     - Başlık tıklanabilir → /dashboard/quiz/:id/settings (opsiyonel, owner görmeden)
//     - isLoading: Spinner
//     - Boş: EmptyState
//
// NAVIGASYON:
//   - Herhangi bir ana navigasyon yok; AdminLayout sidebar üzerinden
// ==========================================================

import { useAdminQuizzes } from "@/hooks/useAdmin";

export default function AdminQuizzes() {
  // const { data: quizzes, isLoading } = useAdminQuizzes();
  // const [statusFilter, setStatusFilter] = useState<"all" | "Draft" | "Active" | "Ended">("all");
  // const [deleteTarget, setDeleteTarget] = useState(null);

  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  void useAdminQuizzes;
  return null;
}
