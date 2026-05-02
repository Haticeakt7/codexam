// ==========================================================
// QuizResults – Sınav Sonuçları
// ROUTE: /dashboard/quiz/:id/results  (PrivateRoute: User + Admin)
// ==========================================================
//
// AMAÇ:
//   Tamamlanmış bir quiz'in katılımcı bazlı sonuçlarını, puan dağılımını
//   ve soru bazlı başarı oranlarını gösterir.
//
// URL PARAMS:
//   - :id → quiz ID
//
// BAĞLI HOOKLAR:
//   - useQuizResults(id)    → @/hooks/useSessions → GET /api/quizzes/:id/results
//                             data: { sessions: SessionResult[], questionStats: QuestionStat[] }
//                             isLoading: boolean
//
//   SessionResult içerdiği bilgiler:
//     - sessionId, formData (katılımcı ad/bilgisi), totalScore, completedCount,
//       totalQuestions, submittedAt, duration
//
//   QuestionStat:
//     - questionId, title, type, successRate (%) → grafik için
//
// UI TASARIM:
//   DashboardLayout içinde özet + tablo + grafik.
//
//   ┌─────────────────────────────────────────────────────────────┐
//   │  Sonuçlar: [Quiz Başlığı]         ← Geri (/dashboard)      │
//   ├─────────────────────────────────────────────────────────────┤
//   │  Özet Çubukları                                             │
//   │  ┌───────────┐  ┌────────────┐  ┌────────────┐             │
//   │  │ 12        │  │ 7.3 / 10   │  │ 85%        │             │
//   │  │ Katılımcı │  │ Ort. Puan  │  │ Tamamlama  │             │
//   │  └───────────┘  └────────────┘  └────────────┘             │
//   ├─────────────────────────────────────────────────────────────┤
//   │  Katılımcı Tablosu                                          │
//   │  Ad           Puan   Tamamlanan  Süre    [Replay] [Detay]  │
//   │  Ahmet Y.     8/10   4/5         28dk    [▶]      [→]      │
//   │  Ayşe K.      6/10   3/5         35dk    [▶]      [→]      │
//   │  ...                                                        │
//   ├─────────────────────────────────────────────────────────────┤
//   │  Soru Bazlı Başarı Oranı (çubuk grafik)                    │
//   │  Soru 1 ████████░░ 80%                                     │
//   │  Soru 2 ████░░░░░░ 40%                                     │
//   │  Soru 3 ██████████ 100%                                     │
//   └─────────────────────────────────────────────────────────────┘
//
//   Tasarım notları:
//     - Özet kartlar: büyük sayı, küçük etiket, border, rounded
//     - Tablo: sıralanabilir (puana göre) (opsiyonel)
//     - [▶ Replay] → /dashboard/quiz/:id/replay/:sessionId
//     - [→ Detay] → ileride session detay sayfası (opsiyonel)
//     - Grafik: recharts BarChart veya basit custom CSS bar
//     - isLoading: tüm içerik yerine Spinner göster
//     - Boş: "Henüz sonuç yok" EmptyState
//
// NAVIGASYON:
//   - ← Geri → /dashboard
//   - [▶ Replay] → /dashboard/quiz/:id/replay/:sessionId
// ==========================================================

import { useParams } from "react-router-dom";
import { useQuizResults } from "@/hooks/useSessions";

export default function QuizResults() {
  // const { id } = useParams<{ id: string }>();
  // const { data, isLoading } = useQuizResults(id!);

  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  void useParams; void useQuizResults;
  return null;
}
