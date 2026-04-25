# CodExam – Tech Context

## Frontend

| Teknoloji | Planlanan | Gerçek Versiyon | Kullanım Amacı |
|-----------|-----------|-----------------|----------------|
| React | 18+ | **19.2.5** | UI framework |
| TypeScript | 5+ | **6.0.2** | Tip güvenliği |
| Vite | 5+ | **8.0.10** | Build tool (rolldown tabanlı) |
| TailwindCSS | 3+ | **3.4.19** | Styling + CSS variable-based tema |
| Monaco Editor | latest | **@monaco-editor/react 4.7.0** | Kod editörü |
| Zustand | latest | **5.0.12** | Global state (5 store) |
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

## Backend (API)

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| ASP.NET Core | 8.0 | Web API |
| Entity Framework Core | 8.0.* | ORM |
| Npgsql.EFCore.PostgreSQL | 8.0.* | PostgreSQL driver |
| FluentValidation.AspNetCore | 11.3.1 | Input validation |
| Serilog.AspNetCore | 10.0.0 | Structured logging |
| Serilog.Sinks.Console | 6.1.1 | Console sink |
| Serilog.Sinks.File | 7.0.0 | File sink |
| SignalR | built-in | Realtime hub |
| JWT Bearer | 8.0.* | Kayıtlı kullanıcı auth |
| BCrypt.Net-Next | 4.1.0 | Password hashing |
| Hangfire.AspNetCore | 1.8.23 | Background job API |
| Hangfire.Redis.StackExchange | 1.12.0 | Hangfire Redis backend |
| AspNetCoreRateLimit | 5.0.0 | IP/user bazlı rate limiting |
| Swashbuckle.AspNetCore | 10.1.7 | Swagger/OpenAPI |
| Docker.DotNet | 3.125.15 | Runner container yönetimi |
| Microsoft.Extensions.Diagnostics.HealthChecks.EFCore | 8.0.* | DB health check |

### Clean Architecture – Proje Yapısı

```
api/
├── CodExam.Api/            # Web API giriş noktası, Controllers, Program.cs
├── CodExam.Application/    # Use cases, DTOs, validators, service interfaces
├── CodExam.Domain/         # Entities, value objects, domain logic
└── CodExam.Infrastructure/ # EF Core, Repositories, Docker SDK, Hangfire jobs
```

### Yetkilendirme Politikaları (ASP.NET Core)

```csharp
"RequireAdmin"     → Role == "Admin"
"RequireUser"      → Role == "User" || Role == "Admin"
"RequireQuizOwner" → custom: quiz.OwnerId == userId || Role == "Admin"
// Public endpoints: SessionToken header doğrulaması (middleware)
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

### Önemli PostgreSQL Desenleri
- `JSONB` alanlar: dynamic form schema, form data, replay diffs, exam events
- `uuid` primary key'ler
- Soft delete pattern (`deleted_at` nullable)

## Code Execution

```
API → POST /api/execute
  → Hangfire enqueue → Worker
      → Docker.DotNet → Runner Container
          (--network none --read-only --cpus=0.5 --memory=256m --pids-limit=64 --user=1000)
      → Stdout/Stderr/ExitCode → PostgreSQL
  → Response: { stdout, stderr, exitCode, executionTimeMs, memoryKb, status }
```

### Runner Container'lar

| Dil | Image | Timeout | RAM |
|-----|-------|---------|-----|
| Python | codexam-python-runner (python:3.12-slim) | 10s | 256MB |
| JavaScript | codexam-node-runner (node:20-alpine) | 10s | 256MB |
| C++ | codexam-cpp-runner (alpine + g++) | 15s | 256MB |

Güvenlik flags:
- `--network none` (internet erişimi yok)
- `--read-only` filesystem
- Non-root user (`uid=1000`)
- `--cpus=0.5 --memory=256m --pids-limit=64`

## Infra / DevOps

- Docker Compose (local dev + production)
- NGINX reverse proxy:
  - `/api/` → `api:5000` (REST)
  - `/hubs/` → `api:5000` WebSocket (SignalR, 3600s timeout)
  - `/` → `frontend:80` SPA (try_files → index.html)
- Security headers: X-Frame-Options DENY, CSP, X-Content-Type-Options, HSTS
- Makefile: `make up`, `make down`, `make build`, `make build-runners`, `make migrate`, `make seed`

## Docker Compose Servisleri

| Servis | Image | Port (dev) | Notes |
|--------|-------|------------|-------|
| postgres | postgres:16-alpine | 5432 | healthcheck |
| redis | redis:7-alpine | 6379 | AOF + password |
| api | codexam-api | 5000 | healthcheck `/api/health`, curl kurulu |
| worker | codexam-worker | - | /var/run/docker.sock mount |
| frontend | codexam-frontend | 5173 | Vite dev server |
| nginx | nginx:1.25-alpine | 80, 443 | reverse proxy |
