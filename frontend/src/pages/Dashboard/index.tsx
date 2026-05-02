// ==========================================================
// Dashboard – Quiz Listesi (Ana Dashboard)
// ROUTE: /dashboard  (PrivateRoute: User + Admin)
// ==========================================================
//
// AMAÇ:
//   Kullanıcının sahip olduğu quiz'leri listeler; yeni quiz oluşturma,
//   düzenleme, izleme ve silme aksiyonlarını sunar.
//
// BAĞLI HOOKLAR:
//   - useMyQuizzes()   → @/hooks/useQuizzes → GET /api/quizzes
//                        data: Quiz[], isLoading: boolean
//   - useDeleteQuiz()  → @/hooks/useQuizzes → DELETE /api/quizzes/:id
//                        mutate(id), isPending: boolean
//                        onSuccess: toast.success + liste yenilenir
//                        onError: toast.error
//
// LOCAL STATE:
//   - deleteTarget: Quiz | null → silinecek quiz (confirm dialog için)
//
// UI TASARIM:
//   DashboardLayout içinde kart grid + üst başlık alanı.
//
//   ┌─────────────────────────────────────────────────────┐
//   │  Quizlerim                     [+ Yeni Quiz]        │
//   ├─────────────────────────────────────────────────────┤
//   │  [Yükleniyor Spinner - isLoading ise]               │
//   │                                                     │
//   │  [EmptyState - quiz yoksa]                          │
//   │    İkon + "Henüz quiz yok" + [+ Yeni Quiz] buton   │
//   │                                                     │
//   │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
//   │  │ Quiz Kartı│  │ Quiz Kartı│  │ Quiz Kartı│         │
//   │  │ Başlık    │  │ Başlık   │  │ Başlık   │          │
//   │  │ [Durum]   │  │ [Durum]  │  │ [Durum]  │          │
//   │  │ 30dk · 5s │  │ 45dk · 8s│  │ 60dk·12s │          │
//   │  │ [Düzenle] │  │[Düzenle] │  │[Düzenle] │          │
//   │  │ [İzle]    │  │[İzle]    │  │[İzle]    │          │
//   │  │ [Sil]     │  │[Sil]     │  │[Sil]     │          │
//   │  └──────────┘  └──────────┘  └──────────┘          │
//   │                                                     │
//   │  [ConfirmDialog - deleteTarget açıksa]              │
//   └─────────────────────────────────────────────────────┘
//
//   Quiz Kartı tasarım notları:
//     - Başlık: font-semibold, max 2 satır (line-clamp-2)
//     - Durum badge: Draft=default, Active=yeşil, Ended=muted
//     - Açıklama: max 2 satır, muted renk (varsa)
//     - Meta: süre (dk) · soru sayısı · küçük muted yazı
//     - Butonlar: Düzenle → /dashboard/quiz/:id/questions
//                 İzle    → /dashboard/quiz/:id/monitor
//                 Sil     → deleteTarget state'e set eder, ConfirmDialog açılır
//     - Hover: shadow artışı
//     - Grid: sm:2 kolon, lg:3 kolon
//
//   ConfirmDialog:
//     - "Quiz Sil" başlığı, "Bu işlem geri alınamaz." mesajı
//     - [İptal] ve [Sil] (danger) butonlar
//     - [Sil] → deleteQuiz(deleteTarget.id)
//
// NAVIGASYON:
//   - [+ Yeni Quiz] → /dashboard/new
//   - Kart [Düzenle] → /dashboard/quiz/:id/questions
//   - Kart [İzle]    → /dashboard/quiz/:id/monitor
// ==========================================================

import { useState } from "react";
import { useMyQuizzes, useDeleteQuiz } from "@/hooks/useQuizzes";
import type { Quiz } from "@/api/types";

export default function Dashboard() {
  // const { data: quizzes, isLoading } = useMyQuizzes();
  // const { mutate: deleteQuiz, isPending: deleting } = useDeleteQuiz();
  // const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null);
  // const navigate = useNavigate();

  // const handleDelete = () => {
  //   if (!deleteTarget) return;
  //   deleteQuiz(deleteTarget.id, {
  //     onSuccess: () => { toast.success("Quiz silindi"); setDeleteTarget(null); },
  //     onError: () => toast.error("Silinemedi"),
  //   });
  // };

  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  void useMyQuizzes; void useDeleteQuiz;
  const _: Quiz | null = null; void _;
  return null;
}
