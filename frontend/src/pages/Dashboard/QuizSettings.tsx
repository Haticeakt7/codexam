// ==========================================================
// QuizSettings – Quiz Ayarları
// ROUTE: /dashboard/quiz/:id/settings  (PrivateRoute: User + Admin)
// ==========================================================
//
// AMAÇ:
//   Mevcut bir quiz'in temel ayarlarını (başlık, süre, mod, anti-cheat,
//   katılımcı formu şeması) düzenleme ve quiz'i yayınlama.
//
// URL PARAMS:
//   - :id → quiz ID (useParams ile alınır)
//
// BAĞLI HOOKLAR:
//   - useQuizInfo(id)      → @/hooks/useQuizzes → GET /api/quizzes/:id
//                            data: Quiz, isLoading: boolean
//   - useUpdateQuiz()      → @/hooks/useQuizzes → PUT /api/quizzes/:id
//                            mutate({ id, ...dto }), isPending
//                            onSuccess: toast.success
//   - usePublishQuiz()     → @/hooks/useQuizzes → POST /api/quizzes/:id/publish
//                            mutate(id)
//                            onSuccess: toast.success + veri yenilenir
//
// FORM STATE (quiz verisiyle pre-fill edilir):
//   - title: string
//   - description: string
//   - durationMinutes: number
//   - mode: "RealTime" | "FreeStyle"
//   - antiCheat: { tabSwitch, fullscreen, clipboard }
//   - formFields: Array<{ label, type, required }>
//
// UI TASARIM:
//   DashboardLayout içinde kayıt formu + yayınlama bölümü.
//
//   ┌──────────────────────────────────────────────────────┐
//   │  Quiz Ayarları: [Quiz Başlığı]    [Durum Badge]      │
//   │  ← Geri (/dashboard)                                 │
//   ├──────────────────────────────────────────────────────┤
//   │  Temel Bilgiler                                      │
//   │  Başlık:        [________________________]           │
//   │  Açıklama:      [________________________]           │
//   │  Süre (dk):     [____]                               │
//   │  Mod:           ○ Gerçek Zamanlı  ○ Serbest          │
//   │                                                      │
//   │  Anti-Cheat Seçenekleri                              │
//   │  ☑ Sekme değiştirme izle                            │
//   │  ☑ Tam ekran zorunlu                                 │
//   │  ☐ Pano erişim engeli                                │
//   │                                                      │
//   │  Katılımcı Bilgi Formu                               │
//   │  Alan Adı    Tip      Zorunlu  [Sil]                 │
//   │  [________] [text▾]   ☑        [×]                   │
//   │  [+ Alan Ekle]                                       │
//   │                                                      │
//   │  [Değişiklikleri Kaydet]                             │
//   │                                                      │
//   │  ──────────────────────────────                      │
//   │  Yayınlama                                           │
//   │  Quiz durumu: Draft / Active / Ended                 │
//   │  [Yayınla] ← Draft → Active yapar (geri alınamaz)   │
//   └──────────────────────────────────────────────────────┘
//
//   Tasarım notları:
//     - Sayfa açılınca form alanları quiz verisiyle doldurulur (useEffect + data)
//     - Yayınlama butonu: sadece status "Draft" iken aktif
//     - Yayınlama öncesi ConfirmDialog gösterilebilir ("Bu işlem geri alınamaz")
//     - Durum badge: Draft=muted, Active=yeşil, Ended=muted
//
// NAVIGASYON:
//   - ← Geri → /dashboard
//   - Başarılı kayıt → toast + aynı sayfada kalır
//   - Başarılı yayın → toast + durum badge güncellenir
// ==========================================================

import { useParams } from "react-router-dom";
import { useQuizInfo, useUpdateQuiz, usePublishQuiz } from "@/hooks/useQuizzes";

export default function QuizSettings() {
  // const { id } = useParams<{ id: string }>();
  // const { data: quiz, isLoading } = useQuizInfo(id!);
  // const { mutate: updateQuiz, isPending: saving } = useUpdateQuiz();
  // const { mutate: publishQuiz, isPending: publishing } = usePublishQuiz();

  // Form state (quiz verisiyle pre-fill):
  // const [title, setTitle] = useState("");
  // const [description, setDescription] = useState("");
  // const [durationMinutes, setDurationMinutes] = useState(60);
  // const [mode, setMode] = useState<"RealTime" | "FreeStyle">("RealTime");
  // const [antiCheat, setAntiCheat] = useState({ tabSwitch: true, fullscreen: true, clipboard: false });
  // const [formFields, setFormFields] = useState([]);

  // useEffect: quiz verisi gelince form alanlarını doldur
  // useEffect(() => { if (quiz) { setTitle(quiz.title); ... } }, [quiz]);

  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  void useParams; void useQuizInfo; void useUpdateQuiz; void usePublishQuiz;
  return null;
}
