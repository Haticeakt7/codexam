# CodExam – Tech Context

## Frontend

| Teknoloji | Planlanan | Gerçek Versiyon | Kullanım Amacı |
|-----------|-----------|-----------------|----------------|
| React | 18+ | **19.2.5** | UI framework |
| TypeScript | 5+ | **6.0.2** | Tip güvenliği |
| Vite | 5+ | **8.0.10** | Build tool (rolldown tabanlı) |
| TailwindCSS | 3+ | **3.4.19** | Styling + CSS variable-based tema |
| Monaco Editor | latest | **@monaco-editor/react 4.7.0** | Kod editörü |
| Zustand | latest | **5.0.12** | Global state (6 store) |
| React Query (TanStack) | v5 | **5.100.1** | Server state, caching |
| React Router | v6 | **v7.14.2** | Routing + korumalı rotalar |
| @microsoft/signalr | latest | **10.0.0** | Realtime (sınav izleme) |
| Axios | latest | **1.15.2** | HTTP client + interceptor |
| i18next | latest | **26.0.7** | i18n çekirdek |
| react-i18next | latest | **17.0.4** | React bağlayıcı |
| i18next-browser-languagedetector | latest | **8.2.1** | Tarayıcı dili algılama |
| recharts | latest | **3.8.1** | Analitik grafikleri |

### Önemli Uyumluluk Notu
- **Host**: Node v25 / npm v11 (lockfileVersion 3, resolved alanları kısmi)
- **Docker**: `node:20` (glibc, Debian) — musl (Alpine) DEĞİL (rolldown native binding uyumluluğu)
- `Dockerfile.dev`: `npm install` kullanılıyor (`npm ci` yerine — npm v10/v11 lockfile uyumsuzluğu)
- `Dockerfile.dev` ve `Dockerfile` build'leri: `network: host` (npm registry erişimi)
- **Rolldown (Vite 8) Firefox TDZ bug workaround** (`vite.config.ts`): `build.rollupOptions.output.minifyInternalExports: false`
  - Rolldown aynı tek harfli alias'ı (ör. `r`) farklı chunk'lardan gelen iki farklı import'a atayabiliyor
  - Üretilen chunk'ta duplicate `import` binding → Firefox (SpiderMonkey) TDZ hatası, Chrome sessizce geçiştiriyor
  - `minifyInternalExports: false` ile export adları tam tutulur; alias çakışması imkansız hale gelir

### Frontend Store Listesi (Güncel)

```
src/stores/
├── authStore.ts         → user, accessToken, isAuthenticated, setAuth(), logout()
├── editorStore.ts       → language (string), code, stdin, output, isRunning
│                          FALLBACK_STARTERS: Record<string, string>
│                          setLanguage(langId, defaultCode?) → FALLBACK_STARTERS varsa starter kodu
├── examStore.ts         → sessionToken, sessionId, questions[], answers, antiCheatEvents, isLocked, endsAt
├── themeStore.ts        → uiTheme (light|dark), localStorage persist — monacoTheme KALDIRILDI
├── i18nStore.ts         → locale (tr|en), localStorage persist
├── toastStore.ts        → push(type, msg), toast.{success,error,warning,info} — import { toast }
└── preferencesStore.ts  → editorTheme (EditorThemeId), fontSize (8-32), layout ({leftWidth, rightTopHeight})
                           localStorage persist (Zustand persist middleware)
                           loadFromServer(), saveToServer() (debounced: 1200ms/2000ms)
                           EDITOR_THEMES constant: [{id, label}, ...] — export edilir
```

## Backend (API)

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| ASP.NET Core | 8.0 | Web API |
| Entity Framework Core | 8.0.* | ORM |
| Npgsql.EFCore.PostgreSQL | 8.0.* | PostgreSQL driver |
| EFCore.NamingConventions | latest | UseSnakeCaseNamingConvention() |
| FluentValidation.AspNetCore | 11.3.1 | Input validation |
| Serilog.AspNetCore | 10.0.0 | Structured logging |
| SignalR | built-in | Realtime hub (MonitorHub) |
| JWT Bearer | 8.0.* | Kayıtlı kullanıcı auth |
| BCrypt.Net-Next | 4.1.0 | Password hashing |
| Hangfire.AspNetCore | 1.8.23 | Background job API |
| Hangfire.Redis.StackExchange | 1.12.0 | Hangfire Redis backend |
| AspNetCoreRateLimit | 5.0.0 | IP/user bazlı rate limiting |
| Swashbuckle.AspNetCore | 10.1.7 | Swagger/OpenAPI |
| Docker.DotNet | 3.125.15 | Runner container yönetimi |

### Clean Architecture – Proje Yapısı

```
api/
├── CodExam.Api/            # Web API giriş noktası, Controllers, Program.cs, Middlewares
│   └── Controllers/
│       ├── AuthController.cs
│       ├── ExecuteController.cs      # POST /execute, GET /execute/:jobId, GET /execute/languages (YENİ)
│       ├── QuizzesController.cs      # CRUD, publish, join/{token} (YENİ)
│       ├── QuestionsController.cs
│       ├── SessionsController.cs
│       ├── SubmissionsController.cs
│       ├── AdminController.cs
│       └── UsersController.cs        # YENİ: GET/PUT /api/users/me/preferences
├── CodExam.Application/    # Use cases, DTOs, service interfaces
│   └── DTOs/
│       ├── User/UserPreferencesDto.cs            # YENİ
│       └── Execute/SupportedLanguageDto.cs       # YENİ
├── CodExam.Domain/         # Entities, value objects, domain logic
│   ├── Entities/Quiz.cs    # +ParticipationToken, +StartsAt, +EndsAt
│   ├── Entities/User.cs    # +PreferencesJson
│   └── Enums/QuizStatus.cs # Published(3), Archived(4) EKLENDİ
└── CodExam.Infrastructure/ # EF Core, Services, Docker SDK, Hangfire jobs
    └── Services/
        └── UserPreferencesService.cs  # YENİ
```

### Kritik Backend Notu: EnsureCreatedAsync

```
Program.cs: await db.Database.EnsureCreatedAsync()
```

- `MigrateAsync()` DEĞİL — runtime'da migration çalışmaz
- Schema değişiklikleri için: `docker-compose down -v && docker-compose up --build`
- Migration dosyaları (`Migrations/`) mevcut ama production'da kullanılmıyor

### Yetkilendirme Politikaları

```csharp
"RequireAdmin"     → Role == "Admin"
"RequireUser"      → Role == "User" || Role == "Admin"
"RequireQuizOwner" → quiz.OwnerId == userId || Role == "Admin"
// Public endpoints: X-Session-Token header doğrulaması (SessionTokenMiddleware)
```

## Worker (Ayrı Servis)

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| Microsoft.Extensions.Hosting | 8.0.1 | Worker service host |
| Hangfire.Core | 1.8.23 | Job processor |
| Hangfire.Redis.StackExchange | 1.12.0 | Redis backend |
| Docker.DotNet | 3.125.15 | Runner container spawn |
| Npgsql.EFCore.PostgreSQL | 8.0.* | Submission güncelleme |
| Serilog.Extensions.Hosting | 10.0.0 | Structured logging |

## Database

| Servis | Versiyon | Kullanım |
|--------|----------|----------|
| PostgreSQL | 16-alpine | Ana veritabanı |
| Redis | 7-alpine | Hangfire backend + cache + rate limit |

### PostgreSQL Desenleri
- `JSONB` alanlar: dynamic form schema, form data, replay diffs, exam events, anti-cheat options
- `uuid` primary key'ler (gen_random_uuid())
- Soft delete pattern (`deleted_at` nullable — sadece users tablosunda)
- snake_case kolon isimleri (UseSnakeCaseNamingConvention)
- `timestamptz` (UTC) — tüm zaman damgaları

## Code Execution

```
API → POST /api/execute
  → Hangfire enqueue (queue: "execution") → Worker
      → Docker.DotNet → Runner Container
          (--network none --read-only --cpus=0.5 --memory=256m --pids-limit=64 --user=1000)
      → Stdout/Stderr/ExitCode → PostgreSQL (code_executions table)
  → Poll GET /api/execute/:jobId (1s interval)
  → Response: { stdout, stderr, exitCode, executionTimeMs, memoryKb, status }
```

### Runner Container'lar (Mevcut + Planlanan)

| Dil | Image | Durum |
|-----|-------|-------|
| Python | codexam-runner-python (python:3.12-slim) | ✅ Mevcut |
| JavaScript | codexam-runner-javascript (node:20-alpine) | ✅ Mevcut |
| C++ | codexam-runner-cpp (alpine + g++) | ✅ Mevcut |
| C | codexam-runner-c (alpine + gcc) | ⬜ Planlandı (appsettings'te tanımlı) |
| Java | codexam-runner-java | ⬜ Planlandı (appsettings'te tanımlı) |
| Go | codexam-runner-go (golang:alpine) | ⬜ Planlandı (appsettings'te tanımlı) |

Güvenlik flags:
- `--network none` (internet erişimi yok)
- `--read-only` filesystem
- Non-root user (`uid=1000`)
- `--cpus=0.5 --memory=256m --pids-limit=64`

## Desteklenen Diller (appsettings.json)

```json
SupportedLanguages: [
  { id: "python",     label: "Python 3",   monacoLanguage: "python",     defaultCode: "..." },
  { id: "javascript", label: "Node.js",    monacoLanguage: "javascript", defaultCode: "..." },
  { id: "cpp",        label: "C++",        monacoLanguage: "cpp",        defaultCode: "..." },
  { id: "c",          label: "C",          monacoLanguage: "c",          defaultCode: "..." },
  { id: "java",       label: "Java",       monacoLanguage: "java",       defaultCode: "..." },
  { id: "go",         label: "Go",         monacoLanguage: "go",         defaultCode: "..." }
]
```

Frontend: `useLanguages()` hook → `GET /api/execute/languages` → staleTime: Infinity
Fallback: python, javascript, cpp (API unavailable olsa bile editör çalışır)

## Infra / DevOps

- Docker Compose (local dev + production)
- NGINX reverse proxy:
  - `/api/` → `api:8080` (REST)
  - `/hubs/` → `api:8080` WebSocket (SignalR, 3600s timeout)
  - `/` → `frontend:80` SPA (try_files → index.html)
- Security headers: X-Frame-Options DENY, CSP, X-Content-Type-Options, HSTS
- Makefile: `make up`, `make down`, `make build`, `make build-runners`, `make seed`

## Docker Compose Servisleri

| Servis | Image | Port (dev) | Notes |
|--------|-------|------------|-------|
| postgres | postgres:16-alpine | 5432 | healthcheck |
| redis | redis:7-alpine | 6379 | AOF + password |
| api | codexam-api | 8080 | healthcheck `/api/health`, curl kurulu |
| worker | codexam-worker | - | /var/run/docker.sock mount |
| frontend | codexam-frontend | 5173 | Vite dev server |
| nginx | nginx:1.25-alpine | 80, 443 | reverse proxy |
