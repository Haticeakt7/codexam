# CodExam – Active Context

## Şu Anki Durum (2026-05-16)

**Faz: Tam Uygulama — Backend + Frontend tamamen implement edildi ve entegre çalışıyor**

---

### Tüm Servisler Çalışıyor ✅

`make up` ile 6 servis sağlıklı ayağa kalkıyor:
- `codexam-postgres` → healthy
- `codexam-redis` → healthy
- `codexam-api` → healthy (`GET /api/health`, `GET /api/health/db`)
- `codexam-worker` → running
- `codexam-frontend` → running (Vite v8.0.10)
- `codexam-nginx` → running

> ⚠️ Schema değişikliği sonrası (ParticipationToken, StartsAt, EndsAt, PreferencesJson kolonları için) DB volume yeniden oluşturulmalı:
> `docker-compose down -v && docker-compose up --build`

---

### Backend – TAMAMEN İMPLEMENTE EDİLDİ ✅

| Servis | Durum | Notlar |
|--------|-------|--------|
| AuthService | ✅ Tamamlandı | Register, login, refresh, me — BCrypt + JWT |
| QuizService | ✅ Tamamlandı | CRUD, publish workflow, locking logic, GetByParticipationToken |
| QuestionService | ✅ Tamamlandı | CRUD + test case yönetimi |
| SessionService | ✅ Tamamlandı | Join (mod bazlı zaman penceresi), submit, event, results |
| ExecutionService | ✅ Tamamlandı | Hangfire enqueue, Docker runner |
| SubmissionService | ✅ Tamamlandı | Puanlama, replay |
| AdminService | ✅ Tamamlandı | Stats, user/quiz/session yönetimi |
| UserPreferencesService | ✅ Tamamlandı | GET/PUT /api/users/me/preferences (YENİ) |
| MonitorHub (SignalR) | ✅ Tamamlandı | Canlı izleme, warn/terminate — WarnParticipant artık IHubContext&lt;ParticipantHub&gt; kullanıyor |
| SessionTokenMiddleware | ✅ Tamamlandı | X-Session-Token header doğrulama |
| ExceptionHandlerMiddleware | ✅ Tamamlandı | 422 InvalidOperationException dahil |

**Çok Tipli Değerlendirme Sistemi (2026-05-16):**
- **MCQ kararlı ID'leri**: `choices: string[]` + `correctIndices: number[]` → `choices: [{id, text}]` + `correctIds: string[]`. Karıştırma sırasında ID'ler korunur, puanlama bozulmaz.
- **GradingWorker (YENİ)**: `worker/CodExam.Worker/GradingWorker.cs` — Coding/BugFix submission'larını Docker üzerinden her test case için çalıştırır, kısmi kredi (partial credit) ile puanlar.
- **SessionService**: `SubmitAsync` → `SubmitResponse` döndürüyor (Score, MaxScore, Status, IsGraded). Coding/BugFix için "grading" Hangfire queue'su kullanılıyor.
- **SubmitResponse**: `{submissionId, score, maxScore, status, isGraded}` — frontend anlık sonucu gösterebilir.
- **ShortAnswer array input**: Tek metin alanı → `acceptedAnswers: string[]` ile çoklu cevap ekle/sil editörü.
- **OutputPrediction matchMode**: `"trimmed"` (default), `"ignoreWhitespace"`, `"exact"` — backend GradeOutputPrediction ile eşleştirildi.
- **MCQ QuizTake shuffle**: `useMemo` ile question değişiminde choices karıştırılır; `selectedChoiceIds: string[]` ile submission.

**PRODUCTION BUILD FIX (Firefox TDZ) — 2026-05-16:**
- `vite.config.ts`'e `build.rollupOptions.output.minifyInternalExports: false` eklendi. Rolldown (Vite 8) production build'de aynı tek harfli (`r`) alias'ı farklı chunk'lardan gelen iki import'a atıyordu → Firefox duplicate binding → TDZ error. Full export adları tutularak çakışma ortadan kalktı.
- **QuizQuestions — MCQ seçenekleri**: Hardcoded A/B/C/D → `options.choices` (string[]), `options.correctIndices` (number[]), `options.multiSelect` (boolean) ile bağlı dinamik editör. Ekle/sil/düzenle + doğru işaretleme + tek/çoklu seçim toggle.
- **QuizQuestions — BugFix tipi**: Bağlantısız textarea'lar → Monaco editörler (`options.buggyCode` + `options.correctCode`). Test case bölümü de eklendi (BugFix da Coding gibi puanlanabilir test case'lere sahip).
- **QuizQuestions — Coding başlangıç kodu**: Bağlantısız textarea → Monaco editör (`options.starterCode`).
- **i18n**: `question.mcqMultiSelect`, `question.noChoicesYet`, `question.markAsCorrect`, `question.optionLabel`, `question.addOption`, `question.mcqHint` key'leri TR + EN locale dosyalarına eklendi.

**Düzeltmeler ve Eklemeler (2026-05-15):**
- **BUG FIX**: `MonitorHub.WarnParticipant` → artık `IHubContext<ParticipantHub>` üzerinden katılımcıya uyarı iletiliyor (önceden MonitorHub kendi hub context'i üzerinden gönderiyordu, hiç ulaşmıyordu)
- **Tek katılım**: `codexam_completed_${quizId}` localStorage flag — sınav bitişinde set edilir, QuizLanding bu flag varsa katılım formunu gizler
- **QuizTake header**: UI tema toggle (☀/🌙) + uygulama dil değiştirici (TR/EN) eklendi

**Yeni Backend Eklemeleri (2026-05-14):**
- `Quiz` entity: `ParticipationToken` (Guid, unique index), `StartsAt`, `EndsAt` (nullable timestamptz)
- `User` entity: `PreferencesJson` (nullable text — JSON serialize edilmiş tercihler)
- `QuizStatus` enum: Draft(0), Active(1), Ended(2), Published(3), Archived(4) — 5 durum
- `UsersController` (YENİ): GET/PUT `/api/users/me/preferences`
- `ExecuteController`: GET `/api/execute/languages` (appsettings'ten okur — 6 dil)
- `QuizzesController`: GET `/api/quizzes/join/{token}` (public — token ile quiz bul)
- `appsettings.json`: SupportedLanguages array (python, javascript, cpp, c, java, go)

---

### Frontend – TAMAMEN İMPLEMENTE EDİLDİ ✅

| Katman | Durum | Notlar |
|--------|-------|--------|
| Stores (6 adet) | ✅ Tamamlandı | authStore, editorStore, examStore, themeStore, i18nStore, toastStore + **preferencesStore (YENİ)** |
| API katmanı | ✅ Tamamlandı | types, quizzes, questions, sessions, execute, admin, auth, **preferences (YENİ)** |
| Hooks | ✅ Tamamlandı | useAuth, useQuizzes, useSessions, useExecute, useAdmin + **usePreferences, useLanguages (YENİ)** |
| Home (/) | ✅ Tamamlandı | Dinamik dil listesi, font size, tema picker, her zaman görünür stdin |
| Login/Register | ✅ Tamamlandı | Tam form implementasyonu |
| QuizLanding (/q/:id) | ✅ Tamamlandı | Tüm 5 durum (Draft/Published/Active/Ended/Archived), tarihleme gösterimi |
| QuizLandingByToken (/q/join/:token) | ✅ Tamamlandı | YENİ rota — paylaşılan QuizLandingView bileşeni |
| QuizTake (/q/:id/take) | ✅ Tamamlandı | Yeniden boyutlandırılabilir paneller (harici lib yok), her zaman görünür stdin, font/tema |
| Dashboard | ✅ Tamamlandı | Quiz listesi, oluştur/düzenle/sil, durum badge'leri |
| NewQuiz | ✅ Tamamlandı | Sadeleştirildi: başlık/açıklama/mod/süre → /settings'e yönlendir |
| QuizSettings | ✅ Tamamlandı | Katılım linki, tarih/saat, kilitleme mantığı, yayınlama akışı |
| QuizQuestions | ✅ Tamamlandı | Tüm soru tipleri (Coding, MCQ, OutputPrediction, BugFix, ShortAnswer) |
| QuizMonitor | ✅ Tamamlandı | Canlı izleme, SignalR, warn/terminate |
| QuizResults | ✅ Tamamlandı | Katılımcı listesi, puanlar, soru başarı oranları |
| SubmissionReplay | ✅ Tamamlandı | Diff bazlı replay oynatıcı |
| Profile | ✅ Tamamlandı | Hesap bilgisi, şifre değiştirme |
| Admin Panel | ✅ Tamamlandı | Stats, kullanıcılar, quizler, sessionlar |
| i18n (TR/EN) | ✅ Tamamlandı | Tüm key'ler her iki dilde mevcut |

**Yeni Frontend Eklemeleri (2026-05-14):**
- `preferencesStore`: editorTheme + fontSize + layout (panel boyutları), Zustand persist, debounced server sync (1200ms / 2000ms)
- `usePreferencesSync()`: login sonrası server tercihlerini yükleyen hook
- `useLanguages()`: `/execute/languages` — Infinity stale time, fallback verisi
- `useQuizByToken()`: `/quizzes/join/${token}` sorgulayan hook
- `/q/join/:token` rotası: App.tsx'de `/q/:id`'den ÖNCE tanımlanmalı (yönlendirme çakışması)
- QuizTake'de özel resize hook'ları: `useVerticalResize` + `useHorizontalResize` (sürükle-bırak, %)
- Her zaman görünür stdin (toggle butonu kaldırıldı)

---

### Aktif Kararlar

- **EnsureCreatedAsync**: Runtime'da migration çalışmaz. DB volume drop ile schema yenilenir.
- **ParticipationToken**: Oluşturma sırasında `Guid.NewGuid()` atanır, asla değişmez; DB'de de `gen_random_uuid()` default'u var (fallback).
- **Quiz durum makinesi**: Draft → Published (startsAt ile zamanlandıysa) veya Active (hemen) → Ended / Archived
- **Preferences senkronizasyonu**: localStorage her zaman güncellenir; server sync sadece auth kullanıcılar için, debounced 1200ms (tema/fontsize) / 2000ms (layout).
- **Dil listesi**: appsettings.json'dan okunur (`GET /api/execute/languages`); frontend fallback (python, javascript, cpp) ile graceful degradation.
- **Locking**: status Active/Ended veya katılımcı varsa Mode, Duration, FormSchema, StartsAt, EndsAt kilitleniyor.
