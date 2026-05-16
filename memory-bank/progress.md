# CodExam – Detaylı Progress Takibi

Durum etiketleri: `[x]` Tamamlandı · `[-]` Devam ediyor · `[ ]` Yapılmadı · `[!]` Bloklandı

**Son Güncelleme: 2026-05-16**

---

## Phase 0 – Teknik Hazırlık ✅ TAMAMLANDI

**Hedef:** Tüm ekip veya geliştirici `docker compose up` ile 10 dakikada çalışan local stack elde etsin.

### Altyapı
- [x] Monorepo dizin yapısı: `frontend/`, `api/`, `worker/`, `runners/`, `infra/`
- [x] `docker-compose.yml` – PostgreSQL 16 + Redis 7 + api + worker + frontend + nginx
- [x] `.env.example` oluşturuldu
- [x] `.gitignore` konfigure edildi
- [x] `Makefile` – `up`, `down`, `build`, `build-runners`, `logs`, `seed`, `clean`, `init`
- [x] nginx reverse proxy: `/api/` + `/hubs/` proxy + SPA routing + security headers
- [x] `docs/` – teknik dokümantasyon (FRONTEND, BACKEND, DATABASE, API, DEPLOYMENT)

### Frontend Scaffold
- [x] Vite 8 + React 19 + TypeScript 6
- [x] TailwindCSS v3 + PostCSS + CSS variable tema sistemi
- [x] ESLint + Prettier + TS strict mode
- [x] React Router v7, Zustand 5, TanStack Query v5
- [x] Monaco Editor, SignalR client, i18next
- [x] Dil dosyaları: `src/locales/tr.json` + `src/locales/en.json`
- [x] `authStore`, `editorStore`, `examStore`, `themeStore`, `i18nStore`, `toastStore`
- [x] **`preferencesStore`** (YENİ) — editorTheme, fontSize, layout + server sync
- [x] `src/api/client.ts` – Axios + JWT interceptor + refresh token retry
- [x] `src/api/types.ts` – tam TypeScript interface seti (güncel: SupportedLanguage, UserPreferences, Quiz +token/dates)
- [x] `src/App.tsx` – lazy routes + PrivateRoute/GuestRoute + PreferencesSync + DemoBanner

### Backend Scaffold
- [x] ASP.NET Core 8 Web API (Clean Architecture)
- [x] EF Core 8 + Npgsql + PostgreSQL 16 + EFCore.NamingConventions
- [x] Serilog, FluentValidation, JWT Bearer, BCrypt.Net-Next
- [x] Hangfire.Redis.StackExchange, AspNetCoreRateLimit, Swashbuckle
- [x] Docker.DotNet (execution için)
- [x] `GET /api/health` + `GET /api/health/db` endpoint
- [x] Authorization politikaları: `RequireAdmin`, `RequireUser`, `RequireQuizOwner`
- [x] CORS, RateLimit, JWT konfigürasyonu (`appsettings.json`)
- [x] **8 Controller**: Auth, Execute, Quizzes, Questions, Sessions, Submissions, Admin, **Users (YENİ)**
- [x] 8 Application Interface (IAuthService, IQuizService, IQuestionService, ISessionService, IExecutionService, ISubmissionService, IAdminService, **IUserPreferencesService (YENİ)**)
- [x] Tüm DTO sınıfları (Auth, Quiz, Question, Session, Execute, Submission, Admin, **User/UserPreferencesDto, Execute/SupportedLanguageDto (YENİ)**)

### Database Katmanı
- [x] 12 Entity (User, Quiz, Question, TestCase, QuizSession, Submission, SubmissionReplay, ExamEvent, CodeExecution, CompileJob, AuditLog, SystemErrorLog)
- [x] `AppDbContext` (12 DbSet, soft delete filter, auto-timestamp)
- [x] 13 EF Core konfigürasyon sınıfı (snake_case, jsonb, unique indexler, FK)
- [x] EnsureCreatedAsync startup — tablo otomatik oluşturulur (migration DEĞİL)
- [x] **Quiz tablosu yeni kolonlar**: `participation_token` (uuid unique), `starts_at`, `ends_at`
- [x] **Users tablosu yeni kolon**: `preferences_json` (text nullable)
- [x] **QuizStatus yeni değerler**: Published(3), Archived(4)

### Worker Scaffold
- [x] Worker service + Hangfire Redis processor + Docker.DotNet + EF Core

### Runner Images
- [x] Python runner (python:3.12-slim, non-root, sh)
- [x] JavaScript runner (node:20-alpine, non-root, sh)
- [x] C++ runner (alpine + g++, non-root)
- [ ] C runner (planlı)
- [ ] Java runner (planlı)
- [ ] Go runner (planlı)

---

## Phase 1 – MVP (Ana Sayfa + Auth + Temel Execution) ✅ TAMAMLANDI

### 1.0 Ana Sayfa – Public Code Editor
- [x] Monaco Editor entegrasyonu
- [x] **Dinamik dil listesi** — GET /api/execute/languages, useLanguages hook, fallback
- [x] **Font size +/- kontrolü** — preferencesStore ile persist
- [x] **Monaco tema seçici** — EDITOR_THEMES, preferencesStore ile persist
- [x] **Her zaman görünür stdin** (toggle butonu kaldırıldı)
- [x] **Yeniden boyutlandırılabilir paneller** (useVerticalResize + useHorizontalResize)
- [x] Run butonu → POST /api/execute → polling → output panelinde göster
- [x] Execution info (süre, bellek), durum badge'leri

### 1.1 Authentication
- [x] POST /api/auth/register, login, refresh, GET me
- [x] BCrypt şifre hash, JWT üretimi (15dk access + 7gün refresh)
- [x] Login/Register sayfaları (tam implementasyon)
- [x] authStore, token refresh interceptor, PrivateRoute/GuestRoute

### 1.2 Quiz Yönetimi
- [x] Quiz CRUD (GET/POST/PUT/DELETE /api/quizzes)
- [x] **Quiz Durum Makinesi**: Draft → Published/Active → Ended/Archived
- [x] **Yayınlama validasyonu**: ≥1 soru, StartsAt gelecekte, FreeStyle→EndsAt zorunlu
- [x] **Katılım linki sistemi**: ParticipationToken — her quizde benzersiz UUID
- [x] **GET /api/quizzes/join/{token}** — token ile quiz bulma
- [x] **/q/join/:token rotası** — QuizLandingByToken sayfası
- [x] **Tarih/saat zamanlama**: StartsAt, EndsAt — RealTime/FreeStyle modlarına göre farklı mantık
- [x] **Alan kilitleme**: Active/has-participants → Mode/Duration/FormSchema/StartsAt/EndsAt immutable
- [x] Dashboard sayfası (quiz listesi, durum badge'leri, CRUD aksiyonlar)
- [x] QuizSettings sayfası (katılım linki, tarih picker, locking, publish akışı)
- [x] NewQuiz sayfası (sadeleştirildi — başlık/açıklama/mod/süre → /settings yönlendirme)

### 1.3 Coding Question + Test Case
- [x] Question + TestCase CRUD (tüm tipler: Coding, MCQ, OutputPrediction, BugFix, ShortAnswer)
- [x] QuizQuestions sayfası (tam implementasyon)
- [x] **MCQ choices editörü (2026-05-16)**: options.choices/correctIndices/multiSelect ile bağlı dinamik seçenek editörü — ekle/sil/düzenle + doğru işaretleme + tek/çoklu seçim
- [x] **BugFix editörü (2026-05-16)**: options.buggyCode + options.correctCode Monaco editörlerine bağlandı; test case bölümü eklendi
- [x] **Coding başlangıç kodu (2026-05-16)**: options.starterCode Monaco editörüne bağlandı
- [x] **MCQ kararlı ID'leri (2026-05-16)**: choices[{id,text}] + correctIds[string] — karıştırma sırasında puanlama bozulmaz; QuizTake'de Fisher-Yates shuffle
- [x] **Coding/BugFix sunucu puanlama (2026-05-16)**: GradingWorker her test case'i Docker'da çalıştırır, kısmi kredi verir; SubmitResponse{score,maxScore,isGraded} ile anlık feedback
- [x] **ShortAnswer dizi editörü (2026-05-16)**: acceptedAnswers: string[] ile çoklu cevap ekle/sil
- [x] **OutputPrediction matchMode düzeltmesi (2026-05-16)**: trimmed/ignoreWhitespace/exact — backend ile eşleştirildi

---

## Phase 2 – Sınav Motoru ✅ TAMAMLANDI

### 2.1 Exam Session & Zaman Yönetimi
- [x] QuizSession entity (UserId nullable, SessionToken)
- [x] Server-authoritative süre hesaplama
- [x] POST /api/quizzes/:id/join (mod bazlı zaman penceresi doğrulama)
- [x] Süre dolunca otomatik kilitleme
- [x] Frontend: countdown timer, examStore.endsAt
- [x] **Tek katılım kontrolü (2026-05-15)**: Sınav bitişinde `codexam_completed_${quizId}` localStorage'a yazılır; QuizLanding bu flag'i görünce formu gizler ve "sınavı tamamladınız" banner'ı gösterir
- [x] **Mod bazlı join validasyonu**:
  - RealTime: StartsAt → StartsAt+Duration penceresi
  - FreeStyle: StartsAt → EndsAt penceresi

### 2.2 Dynamic Form Sistemi
- [x] FormSchema (JSONB) — quiz sahibi tanımlar
- [x] /q/:id + /q/join/:token — form render, validasyon
- [x] FormData (JSONB) — QuizSession'a kaydet

### 2.3 Soru Tipleri — Frontend UI
- [x] Coding (Monaco editörü + test case sonuçları)
- [x] MultipleChoice (tek/çoklu seçim)
- [x] OutputPrediction (kod gösterilir, çıktı tahmin edilir)
- [x] BugFix (hatalı kod, kullanıcı düzeltir)
- [x] ShortAnswer (serbest metin)

### 2.4 Yeniden Boyutlandırılabilir Paneller
- [x] useVerticalResize (sol-sağ panel genişliği, %)
- [x] useHorizontalResize (üst-alt panel yüksekliği, %)
- [x] Paneller preferencesStore.layout'ta persist
- [x] Harici kütüphane kullanılmadı (custom mouse event hooks)
- [x] **Test Cases paneli (2026-05-16)**: Coding/BugFix sorularında Output altında resizable TC paneli — visible (input/expected/actual grid) + hidden (pass/fail only) test case'ler; rightTopRef ile output%/TC% ayrı persist edilir; stdinOnLeft/Right'dan bağımsız çalışır

---

## Phase 3 – Realtime İzleme (SignalR) ✅ TAMAMLANDI

- [x] MonitorHub — JWT + SessionToken auth, group yönetimi
- [x] Katılımcı kod değişimi event'i (throttled)
- [x] Heartbeat / last seen
- [x] QuizMonitor sayfası — canlı katılımcı grid UI
- [x] Uyarı gönderme (warn) + sınavdan düşürme (terminate)
- [x] SignalR reconnection handling
- [x] **BUG FIX (2026-05-15)**: MonitorHub.WarnParticipant artık `IHubContext<ParticipantHub>` kullanıyor; önceden MonitorHub kendi grubuna gönderiyordu, katılımcıya ulaşmıyordu

---

## Phase 4 – Anti-Cheat & Replay ✅ TAMAMLANDI

### Anti-Cheat
- [x] Tab switch, fullscreen exit, clipboard, keydown event listener'lar
- [x] ExamEvent entity + kayıt
- [x] examStore.antiCheatEvents + POST /api/quizzes/:id/event
- [x] Monitor sayfasında violations gösterimi

### Replay
- [x] SubmissionReplay entity + diff-based kayıt
- [x] GET /sessions/:sessionId/replay + PATCH /submissions/:id/replay
- [x] SubmissionReplay sayfası — diff oynatıcı

---

## Phase 5 – Kullanıcı Tercihleri Sistemi ✅ TAMAMLANDI (YENİ)

- [x] `User.PreferencesJson` DB kolonu
- [x] `UserPreferencesService` (GET/PUT)
- [x] `UsersController` — /api/users/me/preferences
- [x] `preferencesStore` — Zustand persist + debounced server sync
- [x] `usePreferencesSync()` hook — login sonrası server yüklemesi
- [x] Font size kontrolleri (8-32, +/- butonlar, her sayfada)
- [x] Monaco tema seçici (vs-dark / vs / hc-black, her sayfada)
- [x] Panel layout persist (leftWidth%, rightTopHeight%, outputTopHeight%)
- [x] **QuizTake global ayarlar (2026-05-15)**: Header'a UI tema toggle (☀/🌙) ve uygulama dil değiştirici (TR/EN) eklendi — sınav ekranında da erişilebilir

---

## Phase 6 – Admin Panel ✅ TAMAMLANDI

- [x] /admin/stats — KPI kartları, son 24h hatalar
- [x] /admin/users — kullanıcı listesi, aktif/pasif, rol değiştir, sil
- [x] /admin/quizzes — tüm quizler, sil
- [x] /admin/sessions — tüm sessionlar, zorla sonlandır
- [x] /admin/logs — sistem hata logları
- [x] Pagination (tüm listeler)

---

## Phase 7 – Demo Modu ✅ TAMAMLANDI

- [x] `frontend/src/api/mock/seed.ts` — Seed verisi (8 kullanıcı, 3 quiz, 8 session, sonuçlar, replay)
- [x] `frontend/src/api/mock/adapter.ts` — Axios custom adapter
- [x] `frontend/src/components/ui/DemoBanner.tsx`
- [x] `frontend/.env.demo` — `VITE_DEMO_MODE=true`
- [x] `npm run dev:demo` ve `npm run build:demo` scriptleri

**Başlatma:**
```bash
cd frontend && npm run dev:demo
# Demo Admin: admin@demo.com / demo1234
# Demo User:  user@demo.com  / demo1234
```

---

---

## Production Build Düzeltmeleri ✅ TAMAMLANDI (2026-05-16)

- [x] **Firefox TDZ runtime hatası**: `vite.config.ts`'e `build.rollupOptions.output.minifyInternalExports: false` eklendi
  - Rolldown (Vite 8) QuizTake chunk'ında `r` identifier'ını hem JSX runtime'dan hem `toast` export'undan gelen import'a atıyordu
  - Firefox ES module parser duplicate binding → TDZ (Temporal Dead Zone) hatası
  - Full export isimleri korunarak çakışma ortadan kaldırıldı

---

## Bekleyen Görevler

### Runner Images
- [ ] C runner Dockerfile (`runners/c/Dockerfile`)
- [ ] Java runner Dockerfile (`runners/java/Dockerfile`)
- [ ] Go runner Dockerfile (`runners/go/Dockerfile`)
- [ ] `make build-runners` güncelleme

### Operasyon
- [ ] Unit testler (domain validation)
- [ ] Integration testler (API + DB)
- [ ] E2E: login → quiz join → submit → result
- [ ] JWT secret rotation prosedürü
- [ ] PostgreSQL backup prosedürü
- [ ] Staging/Production environment ayrımı

---

## Tamamlanma Özeti (2026-05-14)

| Katman | Tamamlanma | Notlar |
|--------|-----------|--------|
| Backend – Servis implementasyonları | **%100** | Tüm 8 servis tam çalışıyor |
| Backend – API endpointleri | **%100** | 40+ endpoint aktif |
| Frontend – Sayfa implementasyonları | **%100** | 21+ sayfa tam çalışıyor |
| Frontend – State management | **%100** | 6 Zustand store |
| Quiz yönetimi | **%100** | CRUD, tarih/saat, kilitleme, yayınlama |
| Katılım linki sistemi | **%100** | ParticipationToken + /q/join/:token |
| Kullanıcı tercihleri | **%100** | DB persist + localStorage + sync |
| Resizable panels | **%100** | Harici kütüphane yok |
| Desteklenen diller | **%100** | 6 dil appsettings'te, 3 runner hazır |
| i18n (TR/EN) | **%100** | Tüm key'ler her iki dilde |
| Realtime (SignalR) | **%100** | MonitorHub tam çalışıyor |
| Anti-cheat | **%100** | Event toplama + monitor gösterimi |
| Replay | **%100** | Diff-based kayıt + oynatıcı |
| Admin Panel | **%100** | Stats/Users/Quizzes/Sessions/Logs |
| Demo modu | **%100** | Seed + mock adapter |
| Runner images (c/java/go) | **%0** | Dockerfile'lar yazılmadı |
| Test coverage | **%0** | Henüz yazılmadı |
| **Genel Platform** | **~%95** | Runner images + testler kalan |
