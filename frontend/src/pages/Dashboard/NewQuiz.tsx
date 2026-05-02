// ==========================================================
// NewQuiz – Yeni Quiz Oluştur
// ROUTE: /dashboard/new  (PrivateRoute: User + Admin)
// ==========================================================
//
// AMAÇ:
//   Yeni bir quiz oluşturmak için çok adımlı form sihirbazı.
//   Oluşturma başarılı olunca /dashboard/quiz/:id/questions sayfasına yönlendirir.
//
// BAĞLI HOOKLAR:
//   - useCreateQuiz()  → @/hooks/useQuizzes → POST /api/quizzes
//                        mutate(dto), isPending: boolean
//                        onSuccess: (quiz) => navigate(`/dashboard/quiz/${quiz.id}/questions`)
//                        onError: toast.error
//
// FORM STATE (adım bazlı veya tek form):
//   Adım 1 – Temel Bilgiler:
//     - title: string (zorunlu)
//     - description: string (opsiyonel)
//     - durationMinutes: number (zorunlu, > 0)
//     - mode: "RealTime" | "FreeStyle"
//
//   Adım 2 – Anti-Cheat Seçenekleri:
//     - antiCheat.tabSwitch: boolean
//     - antiCheat.fullscreen: boolean
//     - antiCheat.clipboard: boolean
//
//   Adım 3 – Katılımcı Bilgi Formu Şeması:
//     - formFields: Array<{ label: string, type: "text"|"number", required: boolean }>
//     - Varsayılan alan: { label: "Ad Soyad", type: "text", required: true }
//     - Yeni alan ekle → dizi sonuna ekle
//     - Alan sil → diziden çıkar
//
// SUBMIT AKIŞI:
//   Son adımda [Oluştur] → createQuiz({ title, description, durationMinutes, mode, antiCheatOptions, formSchema })
//   isPending → buton loading
//   onSuccess → toast.success + navigate(`/dashboard/quiz/${quiz.id}/questions`)
//
// UI TASARIM:
//   DashboardLayout içinde tek sayfa form veya adım göstergeli sihirbaz.
//
//   ┌────────────────────────────────────────────────────┐
//   │  Yeni Quiz Oluştur       [← Geri Dön (dashboard)] │
//   ├────────────────────────────────────────────────────┤
//   │                                                    │
//   │  Adım göstergesi: [1 Temel] [2 Anti-Cheat] [3 Form]│
//   │                                                    │
//   │  ─── Adım 1: Temel Bilgiler ───                    │
//   │  Başlık:       [________________________]          │
//   │  Açıklama:     [________________________]          │
//   │                [___(textarea)___________]          │
//   │  Süre (dk):    [____]                              │
//   │  Mod:          ○ Gerçek Zamanlı  ○ Serbest         │
//   │                                                    │
//   │  ─── Adım 2: Anti-Cheat ───                        │
//   │  ☑ Sekme değiştirme izle                          │
//   │  ☑ Tam ekran zorunlu (çıkış = olay)               │
//   │  ☐ Pano erişimini engelle                          │
//   │                                                    │
//   │  ─── Adım 3: Katılımcı Formu ───                  │
//   │  Alan Adı         Tip     Zorunlu   [Sil]          │
//   │  [Ad Soyad     ] [text▾]  ☑         [×]            │
//   │  [Öğrenci No   ] [number▾]☐          [×]            │
//   │  [+ Alan Ekle]                                     │
//   │                                                    │
//   │                      [İptal]  [Oluştur →]          │
//   └────────────────────────────────────────────────────┘
//
//   Tasarım notları:
//     - Adım sihirbazı veya tek uzun form (tasarım tercihi)
//     - Adım göstergesi: aktif adım vurgulu, tamamlanan adımlar işaretli
//     - Katılımcı form alanları sürükle-bırak ile yeniden sıralanabilir (opsiyonel)
//     - Validasyon: başlık boş olmamalı, süre > 0 olmalı
//
// NAVIGASYON:
//   - [İptal] / geri ok → /dashboard
//   - Başarılı oluşturma → /dashboard/quiz/:id/questions
// ==========================================================

import { useCreateQuiz } from "@/hooks/useQuizzes";

export default function NewQuiz() {
  // const navigate = useNavigate();
  // const { mutate: createQuiz, isPending } = useCreateQuiz();

  // Adım 1
  // const [title, setTitle] = useState("");
  // const [description, setDescription] = useState("");
  // const [durationMinutes, setDurationMinutes] = useState(60);
  // const [mode, setMode] = useState<"RealTime" | "FreeStyle">("RealTime");

  // Adım 2
  // const [antiCheat, setAntiCheat] = useState({ tabSwitch: true, fullscreen: true, clipboard: false });

  // Adım 3
  // const [formFields, setFormFields] = useState([{ label: "Ad Soyad", type: "text", required: true }]);

  // const handleSubmit = () => {
  //   createQuiz(
  //     { title, description, durationMinutes, mode, antiCheatOptions: antiCheat, formSchema: formFields },
  //     { onSuccess: (quiz) => navigate(`/dashboard/quiz/${quiz.id}/questions`) }
  //   );
  // };

  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  void useCreateQuiz;
  return null;
}
