# CodExam – Active Context

## Şu Anki Durum (2026-04-29)

**Faz: Sprint 1 — Frontend altyapısı tamamlandı, sayfa iskeletleri bağlantı noktalarıyla hazır; Backend Phase 1 bekliyor**

---

### Phase 0 – TAMAMLANDI ✅

`make up` ile 6 servis sağlıklı ayağa kalkıyor:
- `codexam-postgres` → healthy
- `codexam-redis` → healthy
- `codexam-api` → healthy (`GET /api/health`, `GET /api/health/db`)
- `codexam-worker` → running
- `codexam-frontend` → running (Vite v8.0.10)
- `codexam-nginx` → running

### Database Katmanı – TAMAMLANDI ✅

EF Core 8 + Npgsql + PostgreSQL 16 entegrasyonu tamamlandı.
12 tablo Docker üzerinde otomatik migration ile oluşturuldu.

---

### Frontend – ALTYAPI TAMAMLANDI, SAYFALAR İSKELET AŞAMASINDA

#### Katman Durumu

| Katman | Durum | Notlar |
|--------|-------|--------|
| Altyapı (stores, API client, hooks, layouts, UI bileşenler, routing) | ✅ 100% | Tüm altyapı tamamlandı, mock adapter dahil |
| Sayfa iskeletleri (21 sayfa) | ✅ 100% | Tüm sayfalar bağlantı noktaları belgelenmiş iskelet dosyaları |
| Layout bileşenleri (AppLayout, DashboardLayout, AdminLayout, ExamLayout) | ✅ 100% | Gerçek implementasyon mevcut |
| UI bileşen tasarım belgeleri | ✅ 100% | Her bileşene designer yorum satırları eklendi |
| Sayfa UI implementasyonu | ❌ 0% | Emir (designer) tarafından yapılacak |
| Demo modu (`VITE_DEMO_MODE=true`) | ✅ 100% | Seed data + mock adapter |
| Backend entegrasyonu | ❌ 0% | Backend Phase 1 bekleniyor |
| SignalR gerçek zamanlı | ⚠️ ~15% | Paket kurulu, bağlantı noktaları belgelenmiş |
| i18n tam kapsama | ⚠️ ~65% | TR/EN dosyaları var, eksik key'ler |
| Anti-cheat hookları | ⚠️ ~50% | examStore + event API hazır, QuizTake iskelet belgelenmiş |

#### Gerçek Dosya Durumu

```
frontend/src/
├── api/
│   ├── client.ts          # Axios + JWT interceptor + refresh queue + DEMO adapter
│   ├── types.ts           # Tüm TypeScript interface'leri (199 satır)
│   ├── auth.ts            # POST login/register/refresh, GET me
│   ├── quizzes.ts         # Quiz CRUD + publish + info
│   ├── questions.ts       # Soru ve test case yönetimi
│   ├── sessions.ts        # Join, submit, logEvent, sessions
│   ├── submissions.ts     # Results, replay, appendReplayDiff
│   ├── execute.ts         # POST /execute + GET /execute/:jobId
│   ├── admin.ts           # Stats, users, quizzes, sessions
│   └── mock/
│       ├── seed.ts        # Demo seed data (8 kullanıcı, 3 quiz, 8 session, sonuçlar)
│       └── adapter.ts     # Axios custom adapter — tüm endpoint'leri karşılar
├── hooks/
│   ├── useAuth.ts         # useLogin, useRegister, useMe, useLogout
│   ├── useQuizzes.ts      # Quiz + soru + test case CRUD hooks
│   ├── useSessions.ts     # Join, submit, event, results, replay
│   ├── useExecute.ts      # Run + polling (1s interval)
│   └── useAdmin.ts        # Admin stats, users, quizzes, sessions
├── stores/
│   ├── authStore.ts       # user, accessToken, isAuthenticated
│   ├── editorStore.ts     # language, code, stdin, output, STARTERS
│   ├── examStore.ts       # sessionToken, answers, antiCheatEvents, isLocked
│   ├── themeStore.ts      # uiTheme, monacoTheme, localStorage persist
│   ├── i18nStore.ts       # locale (tr/en), persist
│   └── toastStore.ts      # toast queue, push/dismiss
├── pages/                         (tüm dosyalar: iskelet + bağlantı noktası yorum satırları)
│   ├── Home/index.tsx          ⬜ İskelet — hooks: useEditorStore, useRunCode
│   ├── Auth/Login.tsx          ⬜ İskelet — hooks: useLogin
│   ├── Auth/Register.tsx       ⬜ İskelet — hooks: useRegister
│   ├── Quiz/QuizLanding.tsx    ⬜ İskelet — hooks: useQuizInfo, useJoinQuiz
│   ├── Quiz/QuizTake.tsx       ⬜ İskelet — hooks: useQuizInfo, useSubmit, useLogEvent, useRunCode
│   ├── Dashboard/index.tsx     ⬜ İskelet — hooks: useMyQuizzes, useDeleteQuiz
│   ├── Dashboard/NewQuiz.tsx   ⬜ İskelet — hooks: useCreateQuiz
│   ├── Dashboard/QuizSettings.tsx  ⬜ İskelet — hooks: useQuizInfo, useUpdateQuiz, usePublishQuiz
│   ├── Dashboard/QuizQuestions.tsx ⬜ İskelet — hooks: useQuestions, useCreateQuestion
│   ├── Dashboard/QuizMonitor.tsx   ⬜ İskelet — hooks: useActiveSessions + SignalR events
│   ├── Dashboard/QuizResults.tsx   ⬜ İskelet — hooks: useQuizResults
│   ├── Dashboard/SubmissionReplay.tsx ⬜ İskelet — hooks: useReplay
│   ├── Profile/index.tsx       ⬜ İskelet — store: useAuthStore
│   ├── Admin/index.tsx         ✅ Route container (Routes/Route JSX korundu)
│   ├── Admin/AdminStats.tsx    ⬜ İskelet — hooks: useAdminStats
│   ├── Admin/AdminUsers.tsx    ⬜ İskelet — hooks: useAdminUsers, useUpdateUserRole
│   ├── Admin/AdminQuizzes.tsx  ⬜ İskelet — hooks: useAdminQuizzes
│   ├── Admin/AdminSessions.tsx ⬜ İskelet — hooks: useAdminSessions, useTerminateSession
│   ├── Admin/AdminSystem.tsx   ⬜ İskelet — hooks: useAdminSystemLogs
│   └── Error/{NotFound,Forbidden}.tsx ⬜ İskelet — navigasyon yorum satırları
├── components/
│   ├── layouts/
│   │   ├── AppLayout.tsx      ✅ Public sayfalar için
│   │   ├── DashboardLayout.tsx ✅ User dashboard
│   │   ├── AdminLayout.tsx    ✅ Admin panel
│   │   └── ExamLayout.tsx     ✅ Sınav ekranı
│   └── ui/
│       ├── Button, Input, Select, Textarea ✅ (implementasyon + tasarım yorum satırları)
│       ├── Card, Badge, Modal, ConfirmDialog ✅ (implementasyon + tasarım yorum satırları)
│       ├── Table, Spinner, EmptyState, PageHeader ✅ (implementasyon + tasarım yorum satırları)
│       ├── Toaster.tsx        ✅ (implementasyon + tasarım yorum satırları)
│       └── DemoBanner.tsx     ✅ (implementasyon + tasarım yorum satırları)
├── locales/tr.json + en.json  ⚠️ Kısmi kapsama
├── routes/PrivateRoute.tsx + GuestRoute.tsx ✅
└── App.tsx                    ✅ Lazy routing + DemoBanner
```

#### Demo Modu (Yeni Eklendi)

Backend olmadan standalone çalışan tam demo:
```bash
cd frontend && npm run dev:demo
# veya
VITE_DEMO_MODE=true npm run dev
```

Demo kimlik bilgileri:
- **Admin**: `admin@demo.com` / `demo1234`
- **Kullanıcı**: `user@demo.com` / `demo1234`

Seed verisi: 3 quiz (Draft/Active/Ended), 8 session, 5 katılımcı sonucu, replay diff'leri, 8 admin kullanıcısı.

---

### Backend – PHASE 1 İSKELETİ TAMAMLANDI, İMPLEMENTASYON BAŞLIYOR

**Tamamlanan Backend Altyapısı:**
- [x] `Program.cs` genişletildi: CORS, JWT auth, Hangfire Redis, Swagger, Serilog, rate limit, SignalR
- [x] Authorization politikaları: `RequireAdmin`, `RequireUser` (RequireQuizOwner planlandı)
- [x] 7 Controller: Auth, Execute, Quizzes, Questions, Sessions, Submissions, Admin — route'lar ve yetki attribute'ları hazır
- [x] 7 Application Interface: IAuthService, IQuizService, IQuestionService, ISessionService, IExecutionService, ISubmissionService, IAdminService
- [x] DTO sınıfları: tüm modüller için (Auth, Quiz, Question, Session, Execute, Submission, Admin)
- [x] 7 Infrastructure Service stub: kayıtlı, implement edilmemiş
- [x] `InfrastructureServiceExtensions`: EF Core + Hangfire Redis + tüm DI kayıtları
- [x] `appsettings.json`: DB, Redis, JWT, CORS, RateLimit konfigürasyonu

**Sıradaki Backend Görevleri (implementasyon):**
- [ ] `AuthService`: register (BCrypt), login (JWT üret), refresh (token rotation), me
- [ ] `QuizService`: CRUD + publish (status Draft→Active kontrolü)
- [ ] `QuestionService`: CRUD + test case yönetimi
- [ ] `SessionService`: join (sessionToken üret), submit, logEvent, results
- [ ] `ExecutionService`: Hangfire enqueue + polling
- [ ] Worker: `DockerRunnerService` — Docker SDK entegrasyonu
- [ ] `MonitorHub` (SignalR) + `SessionTokenMiddleware` + `ExceptionHandlerMiddleware`

### Worker – Henüz Stub

`worker/` dizini çalışan loop var ancak Hangfire job processor ve Docker integration yazılmadı.

---

### Aktif Kararlar

- **Bağlantı adı**: `ConnectionStrings:Postgres` (docker-compose `ConnectionStrings__Postgres` env var ile eşleşiyor)
- **Snake_case**: `EFCore.NamingConventions` paketi ile `UseSnakeCaseNamingConvention()`
- **Auto-migration**: `Program.cs` startup'ta `db.Database.MigrateAsync()` çalışır
- **Health check**: `/api/health` (temel) + `/api/health/db` (EF Core DB check)
- **Design-time factory**: `AppDbContextFactory` — `dotnet ef migrations add` için
- **Demo modu**: `VITE_DEMO_MODE=true` env değişkeni → `src/api/mock/adapter.ts` devreye girer, backend'e hiç istek gitmez

### Teknik Notlar (Önemli)

- Host: Node v25 / npm v11 → Docker: node:20 (npm v10) → `npm ci` uyumsuzluk
  - **Çözüm**: `Dockerfile.dev`'de `npm ci` yerine `npm install` + `network: host`
- Docker BUILD network: `network: host` hem api hem worker hem frontend build'e eklenmiş
- Vite 8 + rolldown: `node:20` (glibc) image kullanılmalı, Alpine (musl) DEĞİL
- API Dockerfile'da `curl` kurulu (healthcheck için)
- EF Core warning: `User` soft delete filter + `Quiz` required FK → tasarım gereği kabul edildi
- Demo adapter'ı 120ms yapay gecikme ekler (yükleme state'leri görünsün diye)
