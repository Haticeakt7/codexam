# CodExam – Active Context

## Şu Anki Durum (2026-04-25)

**Faz: Sprint 1 devam ediyor — Database katmanı tamamlandı, Phase 1 başlıyor**

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

### Mevcut Altyapı (Gerçek Durum)

```
/
├── frontend/          # Vite 8 + React 19 + TS 6 + Tailwind 3 + Zustand 5 + TanStack Query v5
│   ├── src/
│   │   ├── stores/    # authStore, editorStore, examStore, themeStore, i18nStore
│   │   ├── api/       # client.ts (Axios + interceptor), types.ts
│   │   ├── pages/     # iskelet sayfalar (Home, Login, Register, Dashboard, Admin, ...)
│   │   ├── routes/    # PrivateRoute, GuestRoute
│   │   ├── locales/   # tr.json, en.json
│   │   └── styles/    # globals.css (CSS variables, dark mode)
│   ├── Dockerfile     # production (node:20 builder + nginx runtime)
│   └── Dockerfile.dev # dev (node:20 + npm install + Vite dev server)
├── api/               # ASP.NET Core 8, Clean Architecture (4 proje)
│   ├── CodExam.Api/
│   │   ├── Program.cs              # AddInfrastructure + MigrateAsync + health checks
│   │   ├── appsettings.json        # ConnectionStrings:Postgres/Redis, Jwt
│   │   └── appsettings.Development.json
│   ├── CodExam.Application/        # Henüz boş — use case'ler eklenecek
│   ├── CodExam.Domain/
│   │   ├── Entities/               # 12 entity (User, Quiz, Question, TestCase, ...)
│   │   └── Enums/                  # 7 enum (UserRole, QuizStatus, QuizMode, ...)
│   └── CodExam.Infrastructure/
│       ├── Persistence/
│       │   ├── AppDbContext.cs     # 12 DbSet, soft delete filter, auto-timestamp
│       │   ├── AppDbContextFactory.cs  # design-time factory (dotnet ef tools)
│       │   ├── Configurations/     # 13 IEntityTypeConfiguration (snake_case, jsonb, indexler)
│       │   └── Migrations/        # 20260425133644_InitialCreate
│       └── InfrastructureServiceExtensions.cs  # AddInfrastructure DI kaydı
├── worker/            # ASP.NET Core Worker Service — henüz boş loop
├── runners/           # python, node, cpp runner Dockerfile'ları
├── infra/nginx/       # reverse proxy config
├── docs/              # FRONTEND, BACKEND, DATABASE, API, DEPLOYMENT dokümantasyonu
└── memory-bank/       # Proje bağlamı
```

### Hemen Yapılacaklar (Phase 1.0 – Ana Sayfa + Execute)

**Backend (öncelik):**
- [ ] `Program.cs` genişletme: CORS, JWT auth, Hangfire, Swagger, Serilog, rate limit
- [ ] `POST /api/execute` – anonim endpoint (Hangfire job enqueue)
- [ ] `GET /api/execute/:jobId` – polling endpoint
- [ ] Application katmanı: `EnqueueExecutionCommand`, `ExecutionService`
- [ ] Execution sonuçlarını DB'ye kaydet

**Worker:**
- [ ] `DockerRunnerService` – Hangfire job processor
- [ ] Docker container spawn + stdout/stderr capture + timeout

**Frontend:**
- [ ] `/` Home sayfası — Header + Monaco Editor + Output panel
- [ ] `editorStore` bağlantısı (hazır, UI eklenecek)
- [ ] Run butonu → `POST /api/execute` → polling → sonuç göster

### Aktif Kararlar

- **Bağlantı adı**: `ConnectionStrings:Postgres` (docker-compose `ConnectionStrings__Postgres` env var ile eşleşiyor)
- **Snake_case**: `EFCore.NamingConventions` paketi ile `UseSnakeCaseNamingConvention()`
- **Auto-migration**: `Program.cs` startup'ta `db.Database.MigrateAsync()` çalışır
- **Health check**: `/api/health` (temel) + `/api/health/db` (EF Core DB check)
- **Design-time factory**: `AppDbContextFactory` — `dotnet ef migrations add` için

### Teknik Notlar (Önemli)

- Host: Node v25 / npm v11 → Docker: node:20 (npm v10) → `npm ci` uyumsuzluk
  - **Çözüm**: `Dockerfile.dev`'de `npm ci` yerine `npm install` + `network: host`
- Docker BUILD network: `network: host` hem api hem worker hem frontend build'e eklenmiş
- Vite 8 + rolldown: `node:20` (glibc) image kullanılmalı, Alpine (musl) DEĞİL
- API Dockerfile'da `curl` kurulu (healthcheck için)
- EF Core warning: `User` soft delete filter + `Quiz` required FK → tasarım gereği kabul edildi
