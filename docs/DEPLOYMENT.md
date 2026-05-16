# CodExam – Deployment Dokümanı

> Docker Compose · Nginx · Runner Containers · Health Checks · Environment Variables

---

## İçindekiler

1. [Genel Mimari](#1-genel-mimari)
2. [Docker Compose Servisleri](#2-docker-compose-servisleri)
3. [Environment Variables](#3-environment-variables)
4. [Nginx Konfigürasyonu](#4-nginx-konfigürasyonu)
5. [Runner Container Dockerfile'ları](#5-runner-container-dockerfileları)
6. [Health Check Stratejisi](#6-health-check-stratejisi)
7. [Lokal Geliştirme Kurulumu](#7-lokal-geliştirme-kurulumu)
8. [Staging / Production Deploy](#8-staging--production-deploy)
9. [Monitoring ve Loglar](#9-monitoring-ve-loglar)
10. [Güvenlik Notları](#10-güvenlik-notları)

---

## 1. Genel Mimari

```
                     ┌─────────────────────────────────────────────────────┐
                     │                  Docker Network: codexam             │
                     │                                                       │
  Browser ──HTTPS──► Nginx :443 ──/api/*──► API :5000                      │
                     │       ──/hubs/*──►  API :5000 (SignalR)             │
                     │       ──/──────►    Frontend :5173 (dev)            │
                     │                     Frontend static (prod)          │
                     │                                                       │
                     │             API ──────────────► PostgreSQL :5432     │
                     │             API ──────────────► Redis :6379          │
                     │             API ──Hangfire──►   Worker               │
                     │                                                       │
                     │             Worker ─Docker Socket──► Runner Containers│
                     │                                       (geçici, izole) │
                     └─────────────────────────────────────────────────────┘
```

### Servis Listesi

| Servis | Image | Dahili Port | Dışarı Açık |
|--------|-------|-------------|------------|
| `nginx` | `nginx:1.25-alpine` | 80, 443 | 80, 443 |
| `api` | `codexam-api` (local build) | 5000 | — |
| `worker` | `codexam-worker` (local build) | — | — |
| `frontend` | `codexam-frontend` (local build) | 5173 (dev) | — |
| `postgres` | `postgres:16-alpine` | 5432 | — (prod) |
| `redis` | `redis:7-alpine` | 6379 | — (prod) |

---

## 2. Docker Compose Servisleri

### `docker-compose.yml` (Production / Staging)

```yaml
version: "3.9"

name: codexam

networks:
  codexam:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  nginx_logs:
  api_logs:

services:

  # ──────────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    container_name: codexam-postgres
    restart: unless-stopped
    networks: [codexam]
    environment:
      POSTGRES_DB:       ${POSTGRES_DB}
      POSTGRES_USER:     ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ──────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: codexam-redis
    restart: unless-stopped
    networks: [codexam]
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ──────────────────────────────────────────────
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: codexam-api
    restart: unless-stopped
    networks: [codexam]
    environment:
      ASPNETCORE_ENVIRONMENT:  ${ASPNETCORE_ENVIRONMENT:-Production}
      ASPNETCORE_URLS:         http://+:5000
      ConnectionStrings__Postgres: >
        Host=postgres;Port=5432;Database=${POSTGRES_DB};
        Username=${POSTGRES_USER};Password=${POSTGRES_PASSWORD}
      ConnectionStrings__Redis: >
        redis:6379,password=${REDIS_PASSWORD}
      Jwt__Secret:             ${JWT_SECRET}
      Jwt__ExpiresInMinutes:   ${JWT_EXPIRES_MINUTES:-15}
      Jwt__RefreshExpiresInDays: ${JWT_REFRESH_DAYS:-7}
    volumes:
      - api_logs:/app/logs
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_healthy }
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:5000/api/health || exit 1"]
      interval: 15s
      timeout: 10s
      retries: 3

  # ──────────────────────────────────────────────
  worker:
    build:
      context: ./worker
      dockerfile: Dockerfile
    container_name: codexam-worker
    restart: unless-stopped
    networks: [codexam]
    environment:
      ConnectionStrings__Postgres: >
        Host=postgres;Port=5432;Database=${POSTGRES_DB};
        Username=${POSTGRES_USER};Password=${POSTGRES_PASSWORD}
      ConnectionStrings__Redis: >
        redis:6379,password=${REDIS_PASSWORD}
      Runner__PythonImage:  codexam-python-runner
      Runner__NodeImage:    codexam-node-runner
      Runner__CppImage:     codexam-cpp-runner
      Runner__TempDir:      /tmp/runner-jobs
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock   # Docker Engine erişimi
      - /tmp/runner-jobs:/tmp/runner-jobs
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_healthy }

  # ──────────────────────────────────────────────
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: /api
    container_name: codexam-frontend
    restart: unless-stopped
    networks: [codexam]

  # ──────────────────────────────────────────────
  nginx:
    image: nginx:1.25-alpine
    container_name: codexam-nginx
    restart: unless-stopped
    networks: [codexam]
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./infra/nginx/conf.d:/etc/nginx/conf.d:ro
      - ./infra/nginx/ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      api:      { condition: service_healthy }
      frontend: { condition: service_started }
```

### `docker-compose.dev.yml` (Geliştirme Override)

```yaml
version: "3.9"

services:

  postgres:
    ports:
      - "5432:5432"   # Dev'de dışarı aç (pgAdmin, DBeaver için)

  redis:
    ports:
      - "6379:6379"   # Dev'de dışarı aç

  api:
    build:
      context: ./api
      dockerfile: Dockerfile.dev
    environment:
      ASPNETCORE_ENVIRONMENT: Development
    volumes:
      - ./api:/app                    # Hot reload
    ports:
      - "5000:5000"
      - "5001:5001"                   # HTTPS (opsiyonel)

  worker:
    build:
      context: ./worker
      dockerfile: Dockerfile.dev
    volumes:
      - ./worker:/app

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend/src:/app/src       # Vite HMR
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:5000/api
```

### `api/Dockerfile`

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY CodExam.sln .
COPY CodExam.Api/CodExam.Api.csproj             CodExam.Api/
COPY CodExam.Application/CodExam.Application.csproj CodExam.Application/
COPY CodExam.Domain/CodExam.Domain.csproj       CodExam.Domain/
COPY CodExam.Infrastructure/CodExam.Infrastructure.csproj CodExam.Infrastructure/
RUN dotnet restore

COPY . .
RUN dotnet publish CodExam.Api/CodExam.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser
COPY --from=build /app/publish .
EXPOSE 5000
ENTRYPOINT ["dotnet", "CodExam.Api.dll"]
```

### `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.25-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

`nginx-spa.conf` (SPA fallback):
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 3. Environment Variables

### `.env.example`

```env
# ─── PostgreSQL ──────────────────────────────
POSTGRES_DB=codeexam
POSTGRES_USER=codeexam_user
POSTGRES_PASSWORD=change_me_postgres_password_here

# ─── Redis ───────────────────────────────────
REDIS_PASSWORD=change_me_redis_password_here

# ─── JWT ─────────────────────────────────────
# En az 32 karakter, güçlü rastgele string
JWT_SECRET=change_me_super_secret_jwt_key_at_least_32_chars
JWT_EXPIRES_MINUTES=15
JWT_REFRESH_DAYS=7

# ─── ASP.NET Core ────────────────────────────
ASPNETCORE_ENVIRONMENT=Production

# ─── Runner ──────────────────────────────────
RUNNER_TEMP_DIR=/tmp/runner-jobs
RUNNER_PYTHON_TIMEOUT_SEC=10
RUNNER_NODE_TIMEOUT_SEC=10
RUNNER_CPP_TIMEOUT_SEC=15
RUNNER_MEMORY_MB=256
RUNNER_CPU_QUOTA=0.5

# ─── Frontend ────────────────────────────────
VITE_API_URL=/api
```

### Değişken Güvenlik Kuralları

- `.env` dosyası hiçbir zaman git'e commit edilmez (`.gitignore`'da)
- `JWT_SECRET` minimum 32 karakter, production'da rastgele üretilir
- `POSTGRES_PASSWORD` ve `REDIS_PASSWORD` production'da güçlü şifre
- Production'da Docker Secrets veya environment injection kullanılabilir

---

## 4. Nginx Konfigürasyonu

### `infra/nginx/conf.d/codexam.conf`

```nginx
upstream api_backend {
    server api:5000;
    keepalive 32;
}

upstream frontend_backend {
    server frontend:80;
}

server {
    listen 80;
    server_name _;

    # Güvenlik başlıkları
    add_header X-Frame-Options           "DENY"            always;
    add_header X-Content-Type-Options    "nosniff"         always;
    add_header X-XSS-Protection          "1; mode=block"   always;
    add_header Referrer-Policy           "strict-origin"   always;
    add_header Content-Security-Policy
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:"
        always;

    # Upload boyut limiti (CSV import)
    client_max_body_size 10m;

    # API yönlendirmesi
    location /api/ {
        proxy_pass         http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
        proxy_connect_timeout 5s;
    }

    # SignalR WebSocket yönlendirmesi
    location /hubs/ {
        proxy_pass         http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_read_timeout 3600s;    # WebSocket için uzun timeout
        proxy_send_timeout 3600s;
    }

    # Frontend (SPA)
    location / {
        proxy_pass         http://frontend_backend;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
    }

    # Health check endpoint (load balancer için)
    location /nginx-health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
```

### HTTPS (Production)

```nginx
server {
    listen 443 ssl http2;
    server_name codexam.example.com;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_session_cache   shared:SSL:10m;

    # ... (yukarıdaki location blokları)
}

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name codexam.example.com;
    return 301 https://$host$request_uri;
}
```

---

## 5. Runner Container Dockerfile'ları

### `runners/python/Dockerfile`

```dockerfile
FROM python:3.12-slim

RUN groupadd -r runner && useradd -r -g runner -u 1000 runner
RUN mkdir /runner && chown runner:runner /runner

WORKDIR /runner
USER runner

# Kaynak kod /runner/solution.py olarak mount edilir
ENTRYPOINT ["python3", "solution.py"]
```

**Çalıştırma komutu (Worker'dan):**
```bash
docker run \
  --rm \
  --network none \
  --read-only \
  --tmpfs /tmp:size=32m \
  --cpus=0.5 \
  --memory=256m \
  --memory-swap=256m \
  --pids-limit=64 \
  --security-opt=no-new-privileges \
  --user=1000:1000 \
  -v /tmp/runner-jobs/{jobId}/solution.py:/runner/solution.py:ro \
  codexam-python-runner
```

---

### `runners/node/Dockerfile`

```dockerfile
FROM node:20-alpine

RUN addgroup -S runner && adduser -S runner -G runner -u 1000
RUN mkdir /runner && chown runner:runner /runner

WORKDIR /runner
USER runner

ENTRYPOINT ["node", "solution.js"]
```

---

### `runners/cpp/Dockerfile`

```dockerfile
FROM alpine:3.19

RUN apk add --no-cache g++ && \
    addgroup -S runner && adduser -S runner -G runner -u 1000 && \
    mkdir /runner && chown runner:runner /runner

WORKDIR /runner

# compile.sh: derleme + çalıştırma
COPY --chown=runner:runner compile.sh /runner/compile.sh
RUN chmod +x /runner/compile.sh

USER runner
ENTRYPOINT ["/runner/compile.sh"]
```

`runners/cpp/compile.sh`:
```bash
#!/bin/sh
# g++ ile derle, sonra çalıştır
g++ -O2 -o /tmp/solution /runner/solution.cpp 2>&1
if [ $? -ne 0 ]; then
    echo "Compilation error" >&2
    exit 1
fi
exec /tmp/solution
```

---

### Runner Image Build

```bash
# Tüm runner image'larını build et
docker build -t codexam-python-runner ./runners/python
docker build -t codexam-node-runner   ./runners/node
docker build -t codexam-cpp-runner    ./runners/cpp

# Veya docker-compose ile (compose build kullanılmaz, worker doğrudan Docker Engine'e erişir)
make build-runners
```

---

### Runner Güvenlik Özeti

| Özellik | Değer | Amaç |
|---------|-------|------|
| `--network none` | Ağ yok | İnternet erişimini engelle |
| `--read-only` | FS read-only | Dosya sistemi yazma engeli |
| `--tmpfs /tmp:size=32m` | 32MB tmp | Geçici yazma için küçük alan |
| `--cpus=0.5` | %50 CPU | CPU tüketimini sınırla |
| `--memory=256m` | 256MB RAM | Bellek tüketimini sınırla |
| `--memory-swap=256m` | Swap yok | Swap kullanımını engelle |
| `--pids-limit=64` | Max 64 proses | Fork bomb önleme |
| `--security-opt=no-new-privileges` | Ayrıcalık yükseltme yok | Privilege escalation önleme |
| `--user=1000:1000` | Non-root | Root olmadan çalış |
| `--rm` | Otomatik temizlik | Container sonrası temizlik |

---

## 6. Health Check Stratejisi

### Servis Health Check Özeti

| Servis | Check | Interval | Retries |
|--------|-------|----------|--------|
| `postgres` | `pg_isready` | 10s | 5 |
| `redis` | `redis-cli ping` | 10s | 5 |
| `api` | `GET /api/health → 200` | 15s | 3 |
| `worker` | (depends_on postgres+redis) | — | — |
| `frontend` | (nginx static serve) | — | — |
| `nginx` | `GET /nginx-health → 200` | 30s | 3 |

### `GET /api/health` Response

```json
{
  "status": "Healthy",
  "checks": {
    "database": "Healthy",
    "redis": "Healthy",
    "hangfire": "Healthy"
  },
  "timestamp": "2025-05-10T14:00:00Z"
}
```

ASP.NET Core Health Checks paketi ile:

```csharp
builder.Services.AddHealthChecks()
    .AddNpgsql(connectionString, name: "database")
    .AddRedis(redisConnectionString, name: "redis")
    .AddHangfire(options => options.MinimumAvailableServers = 1, name: "hangfire");

app.MapHealthChecks("/api/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
```

---

## 7. Lokal Geliştirme Kurulumu

### Ön Koşullar

- Docker Engine 24+ ve Docker Compose v2
- .NET SDK 8.0 (`dotnet --version`)
- Node.js 20+ (`node --version`)
- `make` (opsiyonel, Makefile kullanımı için)

### Adım Adım

```bash
# 1. Repoyu klonla
git clone <repo-url> codexam
cd codexam

# 2. Environment dosyasını oluştur
cp .env.example .env
# .env içindeki şifreleri düzenle (geliştirme için varsayılanlar yeterli)

# 3. Runner image'larını build et
docker build -t codexam-python-runner ./runners/python
docker build -t codexam-node-runner   ./runners/node
docker build -t codexam-cpp-runner    ./runners/cpp

# 4. Tüm servisleri başlat (geliştirme modu)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# 5. Migration'ları uygula (API otomatik çalıştırır; manuel için:)
docker exec codexam-api dotnet ef database update

# 6. Seed data yükle (API ilk açılışta otomatik çalışır)
```

### Erişim Adresleri (Dev)

| Servis | URL |
|--------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:5000 |
| Swagger | http://localhost:5000/swagger |
| Hangfire Dashboard | http://localhost:5000/hangfire |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### Makefile Kısayolları

```makefile
.PHONY: up down build logs ps migrate seed

up:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

down:
	docker compose down

build:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml build

build-runners:
	docker build -t codexam-python-runner ./runners/python
	docker build -t codexam-node-runner   ./runners/node
	docker build -t codexam-cpp-runner    ./runners/cpp

logs:
	docker compose logs -f api worker

ps:
	docker compose ps

migrate:
	docker exec codexam-api dotnet ef database update \
	  --project CodExam.Infrastructure --startup-project CodExam.Api

seed:
	docker exec codexam-api dotnet run --project CodExam.Api -- seed
```

---

## 8. Staging / Production Deploy

### Deploy Adımları

```bash
# 1. Sunucuda repo güncelle
git pull origin main

# 2. Production .env dosyasını güncelle (şifreler, JWT secret)
# (sunucu üzerinde, git'e commit edilmez)

# 3. Runner image'larını build et
docker build -t codexam-python-runner ./runners/python
docker build -t codexam-node-runner   ./runners/node
docker build -t codexam-cpp-runner    ./runners/cpp

# 4. Servisleri sıfırdan build edip başlat
docker compose up --build -d

# 5. Health check'lerin yeşil olduğunu doğrula
docker compose ps
docker inspect codexam-api | grep -A5 '"Health"'

# 6. Migration'ların uygulandığını doğrula
docker logs codexam-api 2>&1 | grep -i migration
```

### Sıfır Kesintili Güncelleme (Temel)

```bash
# API'yi yeniden build edip yeniden başlat (DB migration varsa dikkat)
docker compose build api
docker compose up -d --no-deps api
```

### Rollback

```bash
# Bir önceki image'a dön
docker compose down
git checkout HEAD~1
docker compose up --build -d
```

---

## 9. Monitoring ve Loglar

### Log Konumları

| Servis | Container İçi | Host |
|--------|--------------|------|
| API | `/app/logs/api-*.log` | `./volumes/api_logs/` |
| Nginx | `/var/log/nginx/access.log` | `./volumes/nginx_logs/` |
| PostgreSQL | Standart PostgreSQL log | `docker logs codexam-postgres` |

### Log İzleme

```bash
# API logları canlı izle
docker compose logs -f api

# Tüm servisler
docker compose logs -f

# Son 100 satır
docker compose logs --tail=100 api

# Hata logları filtrele
docker compose logs api 2>&1 | grep -i error
```

### Disk Kullanımı İzleme

```bash
# Volume boyutları
docker system df

# PostgreSQL veri boyutu
docker exec codexam-postgres psql -U codeexam_user -d codeexam \
  -c "SELECT pg_size_pretty(pg_database_size('codeexam'));"

# Büyük tablolar
docker exec codexam-postgres psql -U codeexam_user -d codeexam \
  -c "SELECT relname, pg_size_pretty(pg_total_relation_size(oid)) FROM pg_class ORDER BY pg_total_relation_size(oid) DESC LIMIT 10;"
```

---

## 10. Güvenlik Notları

### Docker Socket Erişimi (Worker)

Worker servisi Docker socket'ine bağlanır (`/var/run/docker.sock`). Bu yüksek ayrıcalık gerektirir. Azaltma yöntemleri:

1. Worker container'ını `docker` grubuna ekle (tam root yerine)
2. Docker socket proxy kullanımı (`teknativa/docker-socket-proxy`) – gelecek optimizasyon

### Runner Container İzolasyonu

- Her execution için yeni, geçici container
- Container çalışma dizini: `/tmp/runner-jobs/{jobId}/`
- Execution bittikten sonra `--rm` ile otomatik silinir
- Kaynak kod temp directory'ye mount edilir, container'a yazma hakkı verilmez

### Network İzolasyonu

- Tüm servisler `codexam` bridge network'ünde; birbirlerine servis adıyla erişir
- PostgreSQL ve Redis dışarıya açılmaz (prod)
- Runner container'lar `--network none` ile tamamen izole

### .env Güvenliği

```bash
# .gitignore'a ekle
.env
.env.local
.env.production

# İzinleri sınırla
chmod 600 .env
```
