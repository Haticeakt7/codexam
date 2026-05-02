// ==========================================================
// QuizQuestions – Quiz Soru Yönetimi
// ROUTE: /dashboard/quiz/:id/questions  (PrivateRoute: User + Admin)
// ==========================================================
//
// AMAÇ:
//   Bir quiz'in sorularını listeler, yeni soru ekler, düzenler ve siler.
//   Her soru tipinin kendine özgü form alanları vardır.
//
// URL PARAMS:
//   - :id → quiz ID
//
// BAĞLI HOOKLAR:
//   - useQuizInfo(id)          → GET /api/quizzes/:id → quiz başlığı ve genel bilgi
//   - useQuestions(id)         → GET /api/quizzes/:id/questions → soru listesi
//   - useCreateQuestion()      → POST /api/quizzes/:id/questions → yeni soru
//   - useUpdateQuestion()      → PUT /api/questions/:questionId → soru güncelle
//   - useDeleteQuestion()      → DELETE /api/questions/:questionId → soru sil
//   - useCreateTestCase()      → POST /api/questions/:questionId/test-cases → test case ekle
//   - useDeleteTestCase()      → DELETE /api/test-cases/:testCaseId → test case sil
//   (tümü @/hooks/useQuizzes'den)
//
// LOCAL STATE:
//   - selectedQuestion: Question | null → düzenleme panelinde gösterilecek soru
//   - showTypeModal: boolean → soru tipi seçim modalı
//   - deleteTarget: Question | null → silme onayı için
//
// SORU TİPLERİ VE FORMLARI:
//   Coding:
//     - başlık, açıklama, starter kod (Monaco editörü, readonly=false)
//     - desteklenen diller: python, javascript, cpp (multi-select)
//     - test case'ler: input / beklenen çıktı / görünür mü (toggle)
//
//   MultipleChoice:
//     - soru metni (textarea)
//     - seçenekler listesi (ekle/sil/sırala)
//     - doğru cevap seçimi (radio veya checkbox → tek/çoklu seçim modu)
//
//   OutputPrediction:
//     - gösterilecek kod (Monaco readonly)
//     - beklenen çıktı alanı (textarea)
//
//   BugFix:
//     - hatalı başlangıç kodu (Monaco editörü)
//     - doğru çözüm (gizli, sadece backend görür)
//     - ipucu (opsiyonel textarea)
//
//   ShortAnswer:
//     - soru metni
//     - kabul edilen cevaplar listesi
//     - eşleşme modu: "exact" | "contains" | "regex"
//
// UI TASARIM:
//   DashboardLayout içinde sol soru listesi + sağ düzenleme paneli.
//
//   ┌────────────────────────────────────────────────────────────┐
//   │  Soru Yönetimi: [Quiz Başlığı]    ← Geri (/dashboard)    │
//   ├──────────────────┬─────────────────────────────────────────┤
//   │  Soru Listesi    │  Soru Düzenleme Paneli                  │
//   │  ─────────────   │  ─────────────────────────────────────  │
//   │  1. [Coding] ... │  (Seçili soru formu buraya gelir)       │
//   │  2. [MCQ]  ...   │                                         │
//   │  3. [Short] ...  │  Tip bazlı form alanları                │
//   │                  │                                         │
//   │  [+ Soru Ekle]   │  [Kaydet]  [Sil]                       │
//   └──────────────────┴─────────────────────────────────────────┘
//
//   Soru tipi seçim modalı ([+ Soru Ekle] tıklanınca):
//   ┌──────────────────────────────────────────┐
//   │  Soru Tipi Seçin                         │
//   │  ┌────────┐ ┌────────┐ ┌─────────────┐  │
//   │  │Coding  │ │MCQ     │ │OutputPred.. │  │
//   │  └────────┘ └────────┘ └─────────────┘  │
//   │  ┌────────┐ ┌────────┐                  │
//   │  │BugFix  │ │Short..  │                  │
//   │  └────────┘ └────────┘                  │
//   └──────────────────────────────────────────┘
//
//   Tasarım notları:
//     - Soru listesi: sürükle-bırak sıralama (opsiyonel, order_no alanı)
//     - Her soru liste öğesi: numara, tip badge, başlık (kısaltılmış)
//     - Seçili soru sol listede vurgulu (bg-surface2)
//     - Coding sorusu test case'leri tablo formatında: Input | Beklenen | Görünür | [Sil]
//     - Düzenleme paneli kaydırılabilir (overflow-y-auto)
//
// NAVIGASYON:
//   - ← Geri → /dashboard
//   - Quiz ayarları için → /dashboard/quiz/:id/settings (opsiyonel link)
// ==========================================================

import { useParams } from "react-router-dom";
import {
  useQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
} from "@/hooks/useQuizzes";
import type { Question } from "@/api/types";

export default function QuizQuestions() {
  // const { id } = useParams<{ id: string }>();
  // const { data: questions, isLoading } = useQuestions(id!);
  // const { mutate: createQuestion } = useCreateQuestion();
  // const { mutate: updateQuestion } = useUpdateQuestion();
  // const { mutate: deleteQuestion } = useDeleteQuestion();

  // const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  // const [showTypeModal, setShowTypeModal] = useState(false);
  // const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  void useParams; void useQuestions; void useCreateQuestion;
  void useUpdateQuestion; void useDeleteQuestion;
  const _: Question | null = null; void _;
  return null;
}
