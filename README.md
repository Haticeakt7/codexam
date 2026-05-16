# CodExam

Docker tabanlı online coding sınav platformu. Kullanıcılar hesap açmadan kod yazıp çalıştırabilir; quiz sahipleri sınav oluşturup katılımcıları canlı izleyebilir.

---

## Özellikler

- **Anonim Kod Editörü** – Kayıt gerektirmeden Python, JavaScript, C++, C, Java veya Go kodu yaz ve çalıştır; dinamik dil listesi backend'den gelir
- **Benzersiz Katılım Linki** – Her quiz için otomatik oluşturulan `/q/join/:token` adresi; katılımcılarla paylaşım için tek tıkla kopyalanabilir
- **Quiz Zamanlama** – Başlangıç ve bitiş tarihleri; Gerçek Zamanlı mod (kesin pencere) ve Serbest Zamanlı mod (zaman aralığı) desteği
- **Quiz Yönetimi** – Kayıtlı kullanıcılar sınav oluşturabilir, soru ekleyebilir, yayınlayabilir; yayınlama öncesi validasyon (soru zorunlu, gelecek tarih vb.)
- **Kayıtsız Sınav Katılımı** – Katılımcılar hesap açmadan, quiz sahibinin tanımladığı formu doldurarak sınava girer; oturum `sessionToken` ile yürür
- **Güvenli Docker Sandbox** – Kod `--network none`, `--read-only`, CPU/RAM/timeout limitleri olan izole bir container içinde çalışır
- **Anti-Cheat** – Sekme değiştirme, fullscreen çıkışı ve pano girişimleri izlenir ve loglanır
- **Gerçek Zamanlı İzleme (SignalR)** – Quiz sahibi aktif sınavı canlı takip edebilir, uyarı gönderebilir veya katılımcıyı sınavdan düşürebilir
- **Submission Replay** – Her kod gönderimi diff-bazlı kaydedilir; quiz sahibi yazım sürecini adım adım oynatabilir
- **Kişiselleştirilebilir Editör** – Font boyutu (+/-), Monaco teması (dark/light/high contrast), yeniden boyutlandırılabilir paneller; tercihler otomatik kaydedilir
- **Çoklu Dil ve Tema** – Türkçe/İngilizce arayüz; light/dark UI teması; Monaco editörü bağımsız tema seçimi

---

## Ekip

| Kişi | Sorumluluk |
|------|------------|
| Seymen | Veritabanı, Nginx + genel destek |
| Hatice | Docker, Runner ve Backend |
| Emir | Frontend ve UI/UX |

---

## Teknoloji Stack

### Frontend

| Teknoloji | Versiyon | Kullanım |
|-----------|----------|----------|
| React | 19 | UI framework |
| TypeScript | 6 | Tip güvenliği |
| Vite | 8 | Build tool |
| TailwindCSS | 3 | Stil + CSS variable tema |
| Monaco Editor (`@monaco-editor/react`) | 4.7 | Kod editörü |
| Zustand | 5 | Global state (6 store: auth, editor, exam, theme, i18n, toast, **preferences**) |
| TanStack Query | v5 | Server state, cache |
| React Router | v7 | Routing + korumalı rotalar |
| Axios | 1.15 | HTTP client + interceptor |
| `@microsoft/signalr` | 10 | Gerçek zamanlı bağlantı |
| `i18next` + `react-i18next` | 26 / 17 | Çoklu dil (TR/EN) |

### Backend (API)

| Teknoloji | Versiyon | Kullanım |
|-----------|----------|----------|
| ASP.NET Core | 8.0 | Web API |
| Entity Framework Core + Npgsql | 8.0 | ORM + PostgreSQL |
| FluentValidation | 11.3 | Input doğrulama |
| Serilog | 10.0 | Yapısal loglama |
| SignalR | built-in | Gerçek zamanlı hub |
| JWT Bearer + BCrypt.Net | 8.0 / 4.1 | Auth + şifre |
| Hangfire + Redis backend | 1.8 | Background job queue |
| AspNetCoreRateLimit | 5.0 | Rate limiting |
| Swashbuckle (Swagger) | 10.1 | API dokümantasyonu |
| Docker.DotNet | 3.125 | Runner container yönetimi |

### Altyapı

| Teknoloji | Kullanım |
|-----------|----------|
| PostgreSQL 16 | Ana veritabanı |
| Redis 7 | Hangfire backend + cache + rate limit |
| Docker Engine | Runner container'lar |
| Docker Compose | Lokal + staging deploy |
| Nginx | Reverse proxy, statik sunucu, güvenlik başlıkları |

### Runner Container'lar

| Dil | Image | Timeout | RAM |
|-----|-------|---------|-----|
| Python | `python:3.12-slim` | 10s | 256MB |
| JavaScript | `node:20-alpine` | 10s | 256MB |
| C++ | `alpine + g++` | 15s | 256MB |

Tüm container'lar: `--network none`, `--read-only`, `--cpus=0.5`, `--memory=256m`, non-root user

---

## Repo Yapısı

```
/
├── frontend/          # React + TypeScript + Vite
├── api/               # ASP.NET Core 8, Clean Architecture
│   ├── CodExam.Api/
│   ├── CodExam.Application/
│   ├── CodExam.Domain/
│   └── CodExam.Infrastructure/
├── worker/            # Hangfire background job processor
├── runners/           # Dil bazlı Docker imajları
│   ├── python/
│   ├── javascript/
│   └── cpp/
├── infra/nginx/       # Nginx reverse proxy konfigürasyonu
├── docs/              # Teknik dokümantasyon
├── memory-bank/       # Proje bağlamı ve kararlar
├── docker-compose.yml
├── docker-compose.dev.yml
└── Makefile
```

---

## Yerel Kurulum

### Gereksinimler

- Docker Engine
- Docker Compose v2
- Make

### Çalıştırma

```bash
# Repoyu klonla
git clone <repo-url>
cd codexam

# Ortam değişkenlerini hazırla
cp .env.example .env
# .env dosyasını düzenle (DB şifresi, JWT secret, vb.)

# Tüm servisleri ayağa kaldır (ilk kez ~5 dakika)
make up
```

`make up` sonrası çalışan servisler:

| Servis | Adres | Açıklama |
|--------|-------|----------|
| Frontend (dev) | http://localhost | Nginx üzerinden |
| API | http://localhost/api | REST endpointleri |
| Swagger | http://localhost/api/swagger | API dokümantasyonu |
| SignalR | ws://localhost/hubs | Gerçek zamanlı hub |

### Diğer Make Komutları

```bash
make down          # Servisleri durdur
make build         # Image'ları yeniden derle
make build-runners # Runner container image'larını derle
make migrate       # EF Core migration uygula
make seed          # Demo verilerini yükle
make logs          # Servis loglarını izle
make clean         # Container + volume temizle
```

---

## Roller

| Rol | Nasıl edinilir? | Ne yapabilir? |
|-----|-----------------|---------------|
| `Admin` | Seed data ile | Tüm kullanıcılar, quizler ve sessionları yönetir |
| `User` | Kayıt ile | Quiz oluşturur, kendi quizini yönetir |
| Anonim | Hesap gerekmez | Ana sayfa editörünü kullanır, form doldurup quiz'e katılır |

---

## Branch Modeli

| Branch | Açıklama |
|--------|----------|
| `main` | Stabil, teslime hazır sürüm. Doğrudan push yasak. |
| `develop` | Entegrasyon branch'i. Kişisel branch'ler buraya merge olur. |
| `develop-seymen` | Seymen'in geliştirme branch'i |
| `develop-hatice` | Hatice'nin geliştirme branch'i |
| `develop-emir` | Emir'in geliştirme branch'i |

### Merge Akışı

```
develop-seymen ─┐
develop-hatice ─┼──→ develop ──→ main
develop-emir   ─┘
```

- Kişisel branch'ten `develop`'a PR açılır (en az 1 onay gerekir)
- Her faz sonunda `develop` → `main` PR açılır
- `main`'e doğrudan push yasaktır

---

## Commit Mesajı Kuralları

```
<prefix>: <kısa açıklama>
```

| Prefix | Kullanım |
|--------|----------|
| `feat` | Yeni özellik |
| `fix` | Hata düzeltmesi |
| `add` | Dosya veya bağımlılık ekleme |
| `update` | Mevcut bir şeyi güncelleme |
| `delete` | Dosya veya kod silme |
| `docs` | Dokümantasyon değişikliği |
| `chore` | Build, config, altyapı değişiklikleri |
| `refactor` | Davranış değiştirmeden kod yeniden düzenleme |

**Örnekler:**

```
feat: add quiz join endpoint with session token
fix: submission status not updating after TLE
add: python runner Dockerfile
update: nginx body size limit for CSV import
delete: unused migration files
docs: update API endpoint list
chore: add GitHub Actions CI pipeline
refactor: extract quiz ownership check to policy handler
```

---

## Dokümantasyon

| Dosya | İçerik |
|-------|--------|
| [docs/FRONTEND.md](docs/FRONTEND.md) | Frontend mimarisi, store yapısı, routing |
| [docs/BACKEND.md](docs/BACKEND.md) | API katman yapısı, auth, yetkilendirme |
| [docs/DATABASE.md](docs/DATABASE.md) | ER modeli, tablolar, indexler |
| [docs/API.md](docs/API.md) | Endpoint listesi ve açıklamaları |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Docker Compose, Nginx, deploy adımları |
| [ROADMAP.md](ROADMAP.md) | Faz bazlı geliştirme planı ve takvim |
