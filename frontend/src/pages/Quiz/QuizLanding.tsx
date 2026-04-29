// ==========================================================
// QuizLanding – Quiz Katılım Sayfası
// ROUTE: /q/:id  (public, auth gerekmez)
// ==========================================================
//
// AMAÇ:
//   Katılımcının sınava girmeden önce quiz hakkında bilgi aldığı ve
//   quiz sahibinin tanımladığı formu doldurduğu sayfa.
//   Başarılı katılımda sessionToken localStorage'a kaydedilir ve
//   /q/:id/take sayfasına yönlendirilir.
//
// URL PARAMS:
//   - :id → quiz ID (public erişim)
//
// BAĞLI HOOKLAR:
//   - useQuizInfo(id)     → @/hooks/useSessions → GET /api/quizzes/:id/info
//                           data: { title, description, durationMinutes, questionCount,
//                                   formSchema, antiCheatOptions, status }
//                           isLoading: boolean
//   - useJoinQuiz()       → @/hooks/useSessions → POST /api/quizzes/:id/join
//                           mutate({ quizId, formData })
//                           onSuccess: ({ sessionToken, sessionId, endsAt }) →
//                             examStore güncellenir, localStorage'a token kaydedilir,
//                             navigate(`/q/${id}/take`)
//                           onError: toast.error
//
// BAĞLI STORE'LAR:
//   - useExamStore() → setSession({ sessionToken, sessionId, endsAt, quizId })
//
// LOCAL STATE:
//   - formData: Record<string, string | number> → form_schema alanlarına göre dinamik
//   - errors: Record<string, string> → alan bazlı validasyon hataları
//
// QUIZ DURUMU KONTROLÜ:
//   - quiz.status === "Draft" → "Quiz henüz yayınlanmadı" mesajı + katılım formu gizli
//   - quiz.status === "Ended" → "Bu sınav sona erdi" mesajı + katılım formu gizli
//   - quiz.status === "Active" → form gösterilir
//
// DİNAMİK FORM RENDER (form_schema'ya göre):
//   form_schema: Array<{ label: string, type: "text" | "number", required: boolean }>
//   Her alan için:
//     - type "text"   → <input type="text" />
//     - type "number" → <input type="number" />
//     - required=true → submit öncesi boş kontrolü
//
// SUBMIT AKIŞI:
//   form.onSubmit → validate(formData, formSchema) → hata yoksa
//   joinQuiz({ quizId: id, formData }) →
//   isPending → buton loading →
//   onSuccess → examStore.setSession + localStorage → navigate(`/q/${id}/take`)
//
// UI TASARIM:
//   AppLayout içinde orta hizalı iki bölümlü kart yapısı.
//
//   ┌──────────────────────────────────────────────────────┐
//   │  [AppLayout Header]                                  │
//   ├──────────────────────────────────────────────────────┤
//   │                                                      │
//   │  ┌────────────────────────────────────────────────┐  │
//   │  │  Quiz Bilgileri                                │  │
//   │  │  Başlık: [Quiz Başlığı]   [Status Badge]       │  │
//   │  │  Açıklama: ...                                 │  │
//   │  │  ─────────────────────────────────────────     │  │
//   │  │  ⏱ Süre: 60 dakika                            │  │
//   │  │  📋 Soru Sayısı: 5                             │  │
//   │  │                                                │  │
//   │  │  ⚠ Anti-Cheat Uyarıları (varsa)               │  │
//   │  │  • Sekme değiştirme izleniyor                  │  │
//   │  │  • Tam ekran modunda kalmanız gerekiyor        │  │
//   │  └────────────────────────────────────────────────┘  │
//   │                                                      │
//   │  ┌────────────────────────────────────────────────┐  │
//   │  │  Katılım Formu (quiz.status === "Active" ise)  │  │
//   │  │                                                │  │
//   │  │  [Ad Soyad]       [_____________________]      │  │
//   │  │  [Öğrenci No]     [_____________________]      │  │
//   │  │  ... (form_schema'ya göre dinamik alanlar)     │  │
//   │  │                                                │  │
//   │  │  [ Sınava Gir → ]                              │  │
//   │  └────────────────────────────────────────────────┘  │
//   │                                                      │
//   └──────────────────────────────────────────────────────┘
//
//   Tasarım notları:
//     - isLoading: iskelet yükleyici veya Spinner
//     - status "Draft"/"Ended": katılım kartı yerine açıklayıcı mesaj
//     - Anti-cheat uyarı listesi: sarı renk, ⚠ ikon ile
//     - Buton: full-width, primary renk, loading state destekli
//
// NAVIGASYON:
//   - Başarılı join → /q/:id/take
// ==========================================================

import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuizInfo } from "@/hooks/useQuizzes";
import { useJoinQuiz } from "@/hooks/useSessions";
import { useExamStore } from "@/stores/examStore";

export default function QuizLanding() {
  // const { id } = useParams<{ id: string }>();
  // const { data: quiz, isLoading } = useQuizInfo(id!);
  // const { mutate: joinQuiz, isPending } = useJoinQuiz();
  // const { setSession } = useExamStore();
  // const navigate = useNavigate();

  // const [formData, setFormData] = useState<Record<string, string | number>>({});
  // const [errors, setErrors] = useState<Record<string, string>>({});

  // Dinamik form validasyonu (form_schema'ya göre):
  // const validate = () => {
  //   const next: Record<string, string> = {};
  //   quiz?.formSchema?.forEach((field) => {
  //     if (field.required && !formData[field.label]) {
  //       next[field.label] = "Bu alan zorunludur";
  //     }
  //   });
  //   setErrors(next);
  //   return Object.keys(next).length === 0;
  // };

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!validate()) return;
  //   joinQuiz(
  //     { quizId: id!, formData },
  //     {
  //       onSuccess: ({ sessionToken, sessionId, endsAt }) => {
  //         setSession({ sessionToken, sessionId, endsAt, quizId: id! });
  //         localStorage.setItem(`codexam_session_${id}`, sessionToken);
  //         navigate(`/q/${id}/take`);
  //       },
  //     }
  //   );
  // };

  // TODO: Yukarıdaki tasarım notlarına göre UI implement edilecek
  void useState; void useParams; void useQuizInfo; void useJoinQuiz; void useExamStore;
  return null;
}
