# CodExam – Detaylı Progress Takibi

Durum etiketleri: `[x]` Tamamlandı · `[-]` Devam ediyor · `[ ]` Yapılmadı · `[!]` Bloklandı

---

## Phase 0 – Teknik Hazırlık

**Hedef:** Tüm ekip veya geliştirici `docker compose up` ile 10 dakikada çalışan local stack elde etsin.

**✅ DoD TAMAMLANDI** — `make up` komutu ile tüm 6 servis sağlıklı ayağa kalkıyor.

### Altyapı
- [x] Monorepo dizin yapısı: `frontend/`, `api/`, `worker/`, `runners/`, `infra/`
- [x] `docker-compose.yml` – PostgreSQL 16 + Redis 7
- [x] `docker-compose.yml` – api, worker, frontend (dev) servisleri
- [x] `docker-compose.dev.yml` – dev overrides (portlar, volume mount, network: host)
- [x] `.env.example` oluşturuldu (tüm servisler için)
- [x] `.env` aktif konfigürasyon dosyası
- [x] `.gitignore` konfigure edildi
- [x] `Makefile` – `up`, `down`, `build`, `build-runners`, `logs`, `migrate`, `seed`, `clean`, `init`
- [x] `infra/nginx/conf.d/codexam.conf` – reverse proxy + WebSocket + SPA routing + security headers
- [x] `docs/` – detaylı teknik dokümantasyon (FRONTEND, BACKEND, DATABASE, API, DEPLOYMENT)

### Frontend Scaffold
- [x] `frontend/` – Vite 8 + React 19 + TypeScript 6 *(planlanan: Vite 5, React 18, TS 5)*
- [x] TailwindCSS v3 + PostCSS + CSS variable tema sistemi
- [x] ESLint + Prettier + TS strict mode
- [x] React Router v7 kurulumu *(planlanan: v6)*
- [x] Zustand 5 + React Query (TanStack v5) kurulumu
- [x] Monaco Editor paketi: `@monaco-editor/react`
- [x] SignalR client: `@microsoft/signalr`
- [x] i18n: `i18next` + `react-i18next` + `i18next-browser-languagedetector`
- [x] Dil dosyaları: `src/locales/tr.json` + `src/locales/en.json`
- [x] `themeStore` (Zustand): uiTheme, monacoTheme, persist localStorage
- [x] `i18nStore` (Zustand): locale, persist localStorage
- [x] Tema token yapısı: TailwindCSS CSS variables (`--color-primary`, `--bg-base`, ...)
- [x] `authStore` – user, accessToken, isAuthenticated, setAuth/logout
- [x] `editorStore` – language, code, stdin, output, isRunning, STARTERS map
- [x] `examStore` – sessionToken, sessionId, answers, antiCheatEvents, isLocked
- [x] `src/api/client.ts` – Axios + JWT interceptor + refresh token retry queue
- [x] `src/api/types.ts` – tam TypeScript interface seti
- [x] `src/main.tsx` – i18n init + QueryClient + App render
- [x] `src/App.tsx` – BrowserRouter + lazy routes + Suspense + PrivateRoute/GuestRoute
- [x] `src/routes/PrivateRoute.tsx` + `GuestRoute.tsx`
- [x] `src/components/ui/Spinner.tsx`
- [x] Sayfa iskeletleri: Home, Login, Register, QuizLanding, QuizTake, Dashboard, AdminDashboard, NotFound, Forbidden
- [x] `nginx-spa.conf` (production SPA serving)
- [x] `Dockerfile` (production: node:20 builder + nginx:1.25-alpine runtime)
- [x] `Dockerfile.dev` (dev: node:20, npm install, Vite dev server)

### Backend Scaffold
- [x] `api/` – ASP.NET Core 8 Web API
  - `CodExam.Api` – Web API project
  - `CodExam.Application` – use cases, DTOs, validators
  - `CodExam.Domain` – entities, value objects
  - `CodExam.Infrastructure` – EF Core, repositories, Docker SDK, Hangfire
- [x] EF Core 8 + Npgsql kurulumu
- [x] Serilog + Console + File sinks
- [x] FluentValidation.AspNetCore
- [x] JWT Bearer auth paketi
- [x] BCrypt.Net-Next kurulumu
- [x] Hangfire.AspNetCore + Hangfire.Redis.StackExchange
- [x] AspNetCoreRateLimit kurulumu
- [x] Swashbuckle (Swagger)
- [x] Docker.DotNet (execution için)
- [x] `GET /api/health` endpoint (Docker healthcheck için)
- [x] `GET /api/health/db` endpoint (EF Core DB health check)
- [x] `api/Dockerfile` – multistage, non-root appuser, curl kurulu
- [ ] Authorization policies: `RequireAdmin`, `RequireUser`, `RequireQuizOwner`
- [ ] Session token middleware
- [ ] CORS konfigürasyonu

### Database Katmanı
- [x] `CodExam.Domain/Enums/` – 7 enum: `UserRole`, `QuizStatus`, `QuizMode`, `QuestionType`, `ExecutionStatus`, `EventType`, `EventSeverity`
- [x] `CodExam.Domain/Entities/` – 12 entity: `User`, `Quiz`, `Question`, `TestCase`, `QuizSession`, `Submission`, `SubmissionReplay`, `ExamEvent`, `CodeExecution`, `CompileJob`, `AuditLog`, `SystemErrorLog`
- [x] `CodExam.Infrastructure/Persistence/AppDbContext.cs` – 12 DbSet, soft delete query filter, `SaveChangesAsync` auto-timestamp
- [x] `CodExam.Infrastructure/Persistence/AppDbContextFactory.cs` – design-time factory (`dotnet ef` için)
- [x] `CodExam.Infrastructure/Persistence/Configurations/` – 13 `IEntityTypeConfiguration<T>` (snake_case, jsonb, indexler, FK'lar)
- [x] `EFCore.NamingConventions` paketi – `UseSnakeCaseNamingConvention()` ile otomatik snake_case
- [x] `InfrastructureServiceExtensions.cs` – `services.AddInfrastructure(config)` DI extension
- [x] `appsettings.json` – `ConnectionStrings:Postgres`, `ConnectionStrings:Redis`, `Jwt` blokları
- [x] `Program.cs` – `AddInfrastructure` kaydı + startup `MigrateAsync()`
- [x] `Migrations/20260425133644_InitialCreate` – tüm 12 tablo, GIN indexler, partial indexler
- [x] PostgreSQL'de 12 tablo Docker container içinde otomatik oluşturuldu ve doğrulandı

### Worker Scaffold
- [x] `worker/` – ASP.NET Core Worker Service (`CodExam.Worker`)
- [x] Hangfire processor paketleri
- [x] Docker.DotNet SDK entegrasyonu
- [x] Npgsql + EF Core (submission güncelleme için)
- [x] Serilog
- [x] `worker/Dockerfile` – multistage, non-root

### Runner Images
- [x] `runners/python/Dockerfile` (python:3.12-slim, non-root uid=1000, no network)
- [x] `runners/node/Dockerfile` (node:20-alpine, non-root)
- [x] `runners/cpp/Dockerfile` (alpine + g++, non-root)
- [x] `runners/cpp/compile.sh`

### CI/CD
- [x] GitHub Actions: `frontend-ci.yml` (lint, typecheck, build) + `backend-ci.yml` (build api, worker, docker check)
- [ ] Branching stratejisi dokümantasyonu (`main`, `develop`, `feature/*`)
- [x] `.github/ISSUE_TEMPLATE/` – bug_report.md + feature_request.md + config.yml
- [x] `.github/PULL_REQUEST_TEMPLATE/pull_request_template.md`

---

## Phase 1 – MVP (Ana Sayfa + Auth + Temel Execution)

### 1.0 Ana Sayfa – Public Code Editor (ÖNCELİKLİ)

**Frontend**
- [ ] Layout: Header (logo, dil seçimi, tema değiştirici, dil seçici, run butonu, login linki) + Editor + Output paneli
- [ ] Monaco Editor entegrasyonu (tema UI teması ile sync)
- [ ] Dil seçimi: Python, JavaScript, C++ (dropdown)
- [ ] `editorStore` (Zustand): language, code, output, isRunning *(store hazır, sayfa bağlanacak)*
- [ ] Run butonu → `POST /api/execute` isteği → output panelinde göster
- [ ] Execution info (süre, bellek)
- [ ] Responsive (tablet/desktop)

**Backend**
- [ ] `POST /api/execute` – anonymous endpoint
  - Input: `{ language: string, code: string, stdin?: string }`
  - Output: `{ stdout: string, stderr: string, exitCode: int, executionTimeMs: int, memoryKb: int, status: string }`
- [ ] Hangfire job enqueue
- [ ] Rate limiting (IP bazlı, Redis): 10 request/dakika

**Worker/Execution**
- [ ] Docker container spawn: `docker run --rm --network none --cpus 0.5 --memory 256m`
- [ ] Stdout/stderr capture, timeout (10s) enforcement
- [ ] Execution sonucunu DB'ye kaydet (anonim submission)

**DoD:** Anonim kullanıcı ana sayfada kod yazar, çalıştırır, sonucu görür.

---

### 1.1 Authentication

**Backend**
- [ ] User entity + migration (Role: Admin | User)
- [ ] `POST /api/auth/register` (email, password, displayName) → default role: User
- [ ] `POST /api/auth/login` → access token (15dk) + refresh token (7gün)
- [ ] `POST /api/auth/refresh`
- [ ] `GET /api/auth/me`
- [ ] Password hashing (BCrypt)
- [ ] Authorization policies: RequireAdmin, RequireUser, RequireQuizOwner

**Frontend**
- [ ] `/login` – giriş formu + validasyon
- [ ] `/register` – kayıt formu
- [ ] `authStore` (Zustand): user, token, role (Admin|User|null), isAuthenticated *(store hazır, endpoint bağlanacak)*
- [ ] Token refresh interceptor (Axios) *(interceptor hazır, endpoint bağlanacak)*
- [ ] Protected route bileşeni: `<PrivateRoute roles={["Admin"]}>` *(hazır)*
- [ ] Header'da kullanıcı durumuna göre nav: anonim / User (Dashboard) / Admin (Admin Panel)

**DoD:** User ve Admin ayrı yetkilerle giriş yapabiliyor. Rol bazlı rotalar çalışıyor.

---

### 1.2 Quiz Yönetimi (User Dashboard + Admin)

**Backend**
- [ ] Quiz entity + migration (OwnerId foreign key)
- [ ] `GET/POST /api/quizzes` (User – kendi quizlerini listeler/oluşturur)
- [ ] `GET/PUT/DELETE /api/quizzes/:id` (Owner veya Admin)
- [ ] Quiz ayarları: startTime, durationMinutes, mode, antiCheatOptions (JSONB)
- [ ] FormSchema (JSONB) alanı (owner tanımlar)
- [ ] `GET /api/admin/quizzes` (Admin – tüm quizler)

**Frontend**
- [ ] `/dashboard` – kullanıcının quiz listesi, yeni oluştur butonu
- [ ] `/dashboard/quizzes/new` – oluşturma formu
- [ ] `/dashboard/quizzes/:id` – detay/ayar sayfası
- [ ] `/admin/quizzes` – tüm quizler (Admin only)
- [ ] Quiz status badge (Draft / Active / Ended)

**DoD:** User kendi quizini oluşturabilir/düzenleyebilir. Admin tüm quizleri görebilir/yönetebilir.

---

### 1.3 Coding Question + Test Case

**Backend**
- [ ] Question entity (discriminator veya type field)
- [ ] TestCase entity (visible/hidden)
- [ ] `GET/POST /api/admin/quizzes/:id/questions`
- [ ] `GET/PUT/DELETE /api/admin/questions/:id`
- [ ] Submission endpointi: `POST /api/exams/:id/submit`

**Frontend**
- [ ] `/admin/quizzes/:id/questions` – soru listesi + yeni soru ekleme
- [ ] Coding question form: başlık, açıklama, starter code, dil desteği, test case'ler
- [ ] Test case editörü (input/expected output, görünür/gizli)
- [ ] Sınav alma sayfasında soru listesi + Monaco editörü
- [ ] Submit + test case sonuçları (visible only)

**DoD:** Admin coding sorusu oluşturabilir. Katılımcı kodu gönderip visible test sonuçlarını görebilir.

---

## Phase 2 – Sınav Motoru

### 2.1 Exam Session & Zaman Yönetimi
- [ ] QuizSession entity + migration (UserId nullable, SessionToken field)
- [ ] Server-authoritative süre hesaplama (`endsAt = startedAt + durationMinutes`)
- [ ] Session başlatma: `POST /api/quizzes/:id/join` (no auth, formData body)
  - Cevap: `{ sessionToken, sessionId, endsAt }`
  - SessionToken localStorage'a kaydedilir
- [ ] Süre dolunca otomatik kilitleme (backend)
- [ ] Frontend: countdown timer, server sync

### 2.2 Dynamic Form Sistemi (Quiz Katılım)
- [ ] FormSchema (JSONB) – quiz sahibi tanımlar (ad, öğrenci no, vs.)
- [ ] `/q/:id` – quiz info + form render (katılımcıya gösterilir, no auth)
- [ ] Form validasyon (şema tipine göre: string, number, required)
- [ ] FormData (JSONB) – QuizSession'a kaydet (katılımcı kimliği)

### 2.3 Ek Soru Tipleri
- [ ] MultipleChoice (tek/çoklu seçim)
- [ ] OutputPrediction (kod gösterilir, çıktı tahmin edilir)
- [ ] BugFix (hatalı kod, kullanıcı düzeltir)
- [ ] ShortAnswer (serbest metin)

### 2.4 Submission Versiyonlama
- [ ] Her deneme versiyonlu saklanır (version field)
- [ ] `best_submission_id` + `last_submission_id` alanları Quiz'e
- [ ] Sınav bitiminde immutable snapshot

**DoD:** Katılımcı zaman sınırlı sınavda tüm soru tiplerini yanıtlayabilir.

---

## Phase 3 – Realtime İzleme (SignalR)

### 3.1 Hub Altyapısı
- [ ] `/hubs/monitor` SignalR hub
- [ ] JWT ile connection auth
- [ ] Group yönetimi: `quiz:{id}`, `participant:{userId}`
- [ ] Reconnection handling

### 3.2 Canlı İzleme
- [ ] Participant kod değişimi event'i (throttled 2s)
- [ ] Heartbeat / last seen timestamp
- [ ] Admin `/admin/quizzes/:id/monitor` – katılımcı grid
- [ ] Katılımcı başına: aktif soru, son kod satırı, event sayısı

### 3.3 Admin Müdahalesi
- [ ] Uyarı mesajı gönder
- [ ] Sınav oturumunu sonlandır (participant'ı kick et)

**DoD:** Admin sınav sırasında gerçek zamanlı katılımcı izleyebilir, < 3sn gecikme.

---

## Phase 4 – Anti-Cheat & Replay

### 4.1 Anti-Cheat Event Toplama
- [ ] Frontend event listener'lar: tab switch, fullscreen exit, clipboard, keydown pattern
- [ ] `POST /api/exams/:id/event` – event log
- [ ] ExamEvent entity + migration
- [ ] Severity sınıflandırması
- [ ] Rate limiting (abuse koruması)

### 4.2 Replay Sistemi
- [ ] SubmissionReplay entity: diff array (JSONB)
- [ ] Frontend'de editor değişimlerini diff olarak capture (debounced)
- [ ] Snapshot + delta hybrid (5dk'da bir snapshot)
- [ ] Admin `/admin/quizzes/:id/results/:submissionId/replay` – playback ekranı

**DoD:** Admin submission replay'i oynatabilir. Storage diff-based ile %70+ daha az.

---

## Phase 5 – Analitik & Raporlama

### 5.1 Veri
- [ ] Quiz bazlı başarı oranı aggregation
- [ ] Soru bazlı çözüm oranı
- [ ] Ortalama execution süresi (dil bazlı)
- [ ] Katılımcı performans sıralaması

### 5.2 Dashboard
- [ ] `/admin/analytics` – KPI kartları
- [ ] Filtreler: quiz, tarih aralığı, grup
- [ ] CSV / JSON export

**DoD:** Dashboard production yükünde < 2sn yükleniyor.

---

## Phase 6 – Operasyon (Tüm Aşamalara Paralel)

- [ ] JWT secret rotation
- [ ] API rate limiting (login/submission/event)
- [ ] Docker image hardening (non-root, read-only) *(kısmen tamamlandı – runner'lar için)*
- [ ] Unit testler (domain validation)
- [ ] Integration testler (API + DB)
- [ ] E2E: login → quiz join → submit → result
- [ ] Serilog request correlation (requestId, userId)
- [ ] Staging/Production environment ayrımı
- [ ] PostgreSQL backup prosedürü
- [x] GitHub Actions CI pipeline *(henüz workflow yazılmadı – templates hazır)*

---

## Sprint Takvimi (Önerilen)

| Sprint | Kapsam | Durum |
|--------|--------|-------|
| 1 | Phase 0 tamamı + Database katmanı + Ana sayfa public editor | Phase 0 ✅ + DB ✅ tamamlandı, editor devam ediyor |
| 2 | Auth + Quiz CRUD | - |
| 3 | Coding question + test case + execution (sınav modu) | - |
| 4 | Exam session + süre yönetimi + dynamic form | - |
| 5 | Ek soru tipleri + submission versiyonlama | - |
| 6 | SignalR hub + canlı izleme | - |
| 7 | Admin müdahale + anti-cheat events | - |
| 8 | Replay sistemi | - |
| 9 | Analitik dashboard | - |
| 10 | Perf, güvenlik, E2E testler, release hazırlığı | - |
