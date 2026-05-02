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
- [x] Sayfa iskeletleri: 21 sayfa — bağlantı noktaları + tasarım ASCII yorum satırları + `return null`; layout bileşenleri gerçek implementasyon
- [x] `nginx-spa.conf` (production SPA serving)
- [x] `Dockerfile` (production: node:20 builder + nginx:1.25-alpine runtime)
- [x] `Dockerfile.dev` (dev: node:20, npm install, Vite dev server)

### Backend Scaffold
- [x] `api/` – ASP.NET Core 8 Web API (Clean Architecture: Api, Application, Domain, Infrastructure)
- [x] EF Core 8 + Npgsql kurulumu
- [x] Serilog + Console + File sinks
- [x] FluentValidation.AspNetCore
- [x] JWT Bearer auth paketi
- [x] BCrypt.Net-Next kurulumu
- [x] Hangfire.AspNetCore + Hangfire.Redis.StackExchange
- [x] AspNetCoreRateLimit kurulumu
- [x] Swashbuckle (Swagger)
- [x] Docker.DotNet (execution için)
- [x] `GET /api/health` + `GET /api/health/db` endpoint
- [x] `api/Dockerfile` – multistage, non-root appuser, curl kurulu
- [x] `Program.cs` genişletildi: JWT, Serilog, FluentValidation, Swagger, CORS, RateLimit, SignalR, Hangfire Redis
- [x] Authorization politikaları: `RequireAdmin`, `RequireUser`
- [x] CORS konfigürasyonu (`Cors:AllowedOrigins` appsettings'ten)
- [x] `appsettings.json` genişletildi: Serilog, JWT, CORS, IpRateLimiting blokları
- [x] 7 Controller: Auth, Execute, Quizzes, Questions, Sessions, Submissions, Admin
- [x] 7 Application Interface (IAuthService, IQuizService, IQuestionService, ISessionService, IExecutionService, ISubmissionService, IAdminService)
- [x] DTO sınıfları: 7 modül klasörü (Auth, Quiz, Question, Session, Execute, Submission, Admin)
- [x] 7 Infrastructure Service stub + DI kayıtları (InfrastructureServiceExtensions)
- [ ] Service implementasyonları: AuthService, QuizService, QuestionService, SessionService, ExecutionService, SubmissionService, AdminService
- [ ] `RequireQuizOwner` authorization policy + handler
- [ ] `SessionTokenMiddleware`
- [ ] `ExceptionHandlerMiddleware`
- [ ] `MonitorHub` (SignalR)
- [ ] FluentValidation validator sınıfları

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
- [x] Layout: Header (logo, dil seçimi, tema değiştirici, dil seçici, run butonu, login linki) + Editor + Output paneli
- [x] Monaco Editor entegrasyonu (tema UI teması ile sync)
- [x] Dil seçimi: Python, JavaScript, C++ (dropdown)
- [x] `editorStore` (Zustand): language, code, output, isRunning
- [x] Run butonu → `POST /api/execute` isteği → polling → output panelinde göster
- [x] Execution info (süre, bellek)
- [-] Responsive (tablet/desktop) *(kısmi)*

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

**DoD:** Anonim kullanıcı ana sayfada kod yazar, çalıştırır, sonucu görür. *(Frontend hazır; Backend bekleniyor)*

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
- [x] `/login` – giriş formu + validasyon
- [x] `/register` – kayıt formu
- [x] `authStore` (Zustand): user, token, role (Admin|User|null), isAuthenticated
- [x] Token refresh interceptor (Axios) — 401 → refresh → retry queue
- [x] Protected route bileşeni: `<PrivateRoute roles={["Admin"]}>`
- [x] Header'da kullanıcı durumuna göre nav: anonim / User (Dashboard) / Admin (Admin Panel)

**DoD:** User ve Admin ayrı yetkilerle giriş yapabiliyor. Rol bazlı rotalar çalışıyor. *(Frontend hazır; Backend bekleniyor)*

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
- [x] `/dashboard` – kullanıcının quiz listesi, yeni oluştur butonu, durum badge'leri
- [x] `/dashboard/new` – quiz oluşturma formu (çok adımlı)
- [x] `/dashboard/quiz/:id/settings` – quiz ayarları
- [x] `/admin/quizzes` – tüm quizler (Admin only)
- [x] Quiz status badge (Draft / Active / Ended)

**DoD:** User kendi quizini oluşturabilir/düzenleyebilir. Admin tüm quizleri görebilir/yönetebilir. *(Frontend hazır; Backend bekleniyor)*

---

### 1.3 Coding Question + Test Case

**Backend**
- [ ] Question entity (discriminator veya type field)
- [ ] TestCase entity (visible/hidden)
- [ ] `GET/POST /api/quizzes/:id/questions`
- [ ] `PUT/DELETE /api/questions/:id`
- [ ] Submission endpointi: `POST /api/quizzes/:id/submit`

**Frontend**
- [x] `/dashboard/quiz/:id/questions` – soru listesi + yeni soru ekleme (tüm tipler)
- [x] Coding question form: başlık, açıklama, starter code, dil desteği, test case'ler
- [x] Test case editörü (input/expected output, görünür/gizli)
- [x] Sınav alma sayfasında soru listesi + Monaco editörü + submit butonu
- [x] Submit + test case sonuçları (visible only)

**DoD:** Admin coding sorusu oluşturabilir. Katılımcı kodu gönderip visible test sonuçlarını görebilir. *(Frontend hazır; Backend bekleniyor)*

---

## Phase 2 – Sınav Motoru

### 2.1 Exam Session & Zaman Yönetimi
- [ ] QuizSession entity + migration (UserId nullable, SessionToken field) *(backend)*
- [ ] Server-authoritative süre hesaplama (`endsAt = startedAt + durationMinutes`) *(backend)*
- [ ] Session başlatma: `POST /api/quizzes/:id/join` *(backend)*
- [ ] Süre dolunca otomatik kilitleme *(backend)*
- [x] Frontend: countdown timer, server sync *(examStore.endsAt ile)*
- [x] `examStore`: sessionToken, sessionId, endsAt, isLocked

### 2.2 Dynamic Form Sistemi (Quiz Katılım)
- [ ] FormSchema (JSONB) – quiz sahibi tanımlar *(backend)*
- [x] `/q/:id` – quiz info + form render (katılımcıya gösterilir, no auth)
- [x] Form validasyon (şema tipine göre: string, number, required)
- [ ] FormData (JSONB) – QuizSession'a kaydet *(backend)*

### 2.3 Ek Soru Tipleri — Frontend UI
- [x] MultipleChoice (tek/çoklu seçim)
- [x] OutputPrediction (kod gösterilir, çıktı tahmin edilir)
- [x] BugFix (hatalı kod, kullanıcı düzeltir)
- [x] ShortAnswer (serbest metin)

### 2.4 Submission Versiyonlama
- [ ] Her deneme versiyonlu saklanır (version field) *(backend)*
- [x] Frontend: soru bazlı answer draft (examStore.answers)

**DoD:** Katılımcı zaman sınırlı sınavda tüm soru tiplerini yanıtlayabilir. *(Frontend hazır; Backend bekleniyor)*

---

## Phase 3 – Realtime İzleme (SignalR)

### 3.1 Hub Altyapısı
- [ ] `/hubs/monitor` SignalR hub *(backend)*
- [ ] JWT ile connection auth *(backend)*
- [ ] Group yönetimi: `quiz:{id}`, `participant:{userId}` *(backend)*
- [ ] Reconnection handling *(backend)*
- [x] `@microsoft/signalr` paketi frontend'de kurulu

### 3.2 Canlı İzleme
- [ ] Participant kod değişimi event'i (throttled 2s) *(backend)*
- [ ] Heartbeat / last seen timestamp *(backend)*
- [x] `/dashboard/quiz/:id/monitor` – katılımcı grid UI *(sayfa mevcut, stub)*
- [ ] Gerçek zamanlı SignalR event'leri bağlanacak

### 3.3 Admin Müdahalesi
- [x] Monitor sayfasında uyarı ve düşürme butonu UI'ları
- [ ] `monitor.warn` / `monitor.terminate` SignalR bağlantısı *(backend)*

**DoD:** Admin sınav sırasında gerçek zamanlı katılımcı izleyebilir, < 3sn gecikme. *(Yalnızca backend tamamlandıktan sonra)*

---

## Phase 4 – Anti-Cheat & Replay

### 4.1 Anti-Cheat Event Toplama
- [x] `examStore.antiCheatEvents` – client-side log
- [x] `POST /api/quizzes/:id/event` API tanımı + useLogEvent hook
- [ ] Frontend event listener'lar gerçek implementasyon *(kısmi — QuizTake'de stub)*
- [ ] ExamEvent entity + migration *(backend)*
- [ ] Severity sınıflandırması *(backend)*
- [ ] Rate limiting *(backend)*

### 4.2 Replay Sistemi
- [ ] SubmissionReplay entity *(backend)*
- [x] `PATCH /api/submissions/:id/replay` API tanımı + useAppendReplayDiff hook
- [x] `GET /sessions/:sessionId/replay` API tanımı + useReplay hook
- [x] `/dashboard/quiz/:id/replay/:sessionId` – replay oynatıcı UI sayfası
- [ ] Diff capture + batch gönderim *(kısmi implementasyon)*

**DoD:** Admin submission replay'i oynatabilir. Storage diff-based ile %70+ daha az. *(Frontend UI hazır; Backend bekleniyor)*

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

## Phase 5 – Demo Modu (Backend'den Bağımsız)

> Teslim/sunum öncesi frontend'in bağımsız çalıştırılabilmesi için eklendi (2026-04-29).

- [x] `frontend/src/api/mock/seed.ts` – Tüm seed verisi (8 kullanıcı, 3 quiz, 8 session, sonuçlar, replay diff'leri)
- [x] `frontend/src/api/mock/adapter.ts` – Axios custom adapter (tüm 30+ endpoint karşılanıyor, in-memory mutasyonlar)
- [x] `frontend/src/components/ui/DemoBanner.tsx` – Demo bildirimi + kimlik bilgileri
- [x] `frontend/.env.demo` – `VITE_DEMO_MODE=true`
- [x] `frontend/src/api/client.ts` güncellendi – `VITE_DEMO_MODE=true` iken mock adapter devreye giriyor
- [x] `frontend/src/App.tsx` güncellendi – DemoBanner eklendi
- [x] `package.json` – `dev:demo` ve `build:demo` npm scriptleri
- [x] TypeScript type check başarılı (0 hata)

**Başlatma:**
```bash
cd frontend && npm run dev:demo
# Demo Admin: admin@demo.com / demo1234
# Demo User:  user@demo.com  / demo1234
```

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
- [x] GitHub Actions CI pipeline *(workflow templates hazır)*

---

## Frontend Tamamlanma Özeti (2026-04-29)

| Katman | Tamamlanma | Notlar |
|--------|-----------|--------|
| Altyapı (stores, API client, hooks, layouts, UI bileşenler, routing) | **%100** | Layout'lar + tüm reusable UI bileşenler gerçek implementasyon |
| Sayfa iskeletleri (21 sayfa) | **%100** | Tüm sayfalar: bağlantı noktaları, tasarım ASCII, yorum satırları — `return null` |
| UI bileşen tasarım belgeleri | **%100** | Button, Input, Select, Textarea, Badge, Card, Modal, Table, EmptyState, PageHeader, ConfirmDialog, DemoBanner, Spinner, Toaster — designer yorum satırları eklendi |
| Sayfa UI implementasyonu | **%0** | Emir (designer) tarafından yapılacak — iskeletler hazır |
| Demo modu (backend'den bağımsız) | **%100** | seed + adapter + banner |
| Backend entegrasyonu | **%0** | Backend Phase 1 bekleniyor |
| SignalR gerçek zamanlı | **%15** | Paket kurulu, bağlantı noktaları iskelet sayfalarında belgelenmiş |
| i18n tam kapsama | **%65** | TR/EN dosyaları var, eksik key'ler |
| Responsive/mobil | **%70** | Tailwind kullanılıyor; layout implementasyonlarda temel responsive var |
| **Genel Frontend** | **~%65** | Altyapı hazır; UI implementasyonu bekliyor |

---

## Sprint Takvimi (Önerilen)

| Sprint | Kapsam | Durum |
|--------|--------|-------|
| 1 | Phase 0 + Database katmanı + Frontend UI | Phase 0 ✅ + DB ✅ + Frontend UI ✅ |
| 2 | Backend Auth + Execute endpoints | - |
| 3 | Backend Quiz CRUD + Question/TestCase | - |
| 4 | Backend Session + Submit + Puanlama | - |
| 5 | Backend Admin endpoints + SignalR Hub | - |
| 6 | Frontend-Backend entegrasyonu + SignalR bağlantısı | - |
| 7 | Anti-cheat tam implementasyon + Replay diff capture | - |
| 8 | Perf, güvenlik, E2E testler, release hazırlığı | - |
