# CodExam – Proje Yol Haritası

> Online coding sınav ve alıştırma platformu. 3 kişilik ekip · 24 Nisan – 18 Mayıs 2025

---

## İçindekiler

1. [Proje Tanımı](#1-proje-tanımı)
2. [Özgün Özellikler](#2-özgün-özellikler)
3. [Gereksinim Karşılama Tablosu](#3-gereksinim-karşılama-tablosu)
4. [Rol Yapısı ve Yetki Matrisi](#4-rol-yapısı-ve-yetki-matrisi)
5. [Kullanıcı Akışları](#5-kullanıcı-akışları)
6. [Ekran Planları](#6-ekran-planları)
7. [Veritabanı Modeli](#7-veritabanı-modeli)
8. [Sistem Mimarisi](#8-sistem-mimarisi)
9. [API Endpointleri](#9-api-endpointleri)
10. [Teknoloji Stack](#10-teknoloji-stack)
11. [Risk ve Çözüm Planı](#11-risk-ve-çözüm-planı)
12. [GitHub Çalışma Modeli](#12-github-çalışma-modeli)
13. [Kişi Bazlı Görev Dağılımı](#13-kişi-bazlı-görev-dağılımı)
14. [Faz Bazlı Geliştirme Planı](#14-faz-bazlı-geliştirme-planı)
15. [Gün Bazlı Takvim](#15-gün-bazlı-takvim)

---

## 1. Proje Tanımı

**CodExam**, kullanıcıların seçtikleri programlama dilinde kod yazıp çalıştırabildiği, sınav oluşturabildiği, katılımcıları canlı izleyebildiği ve sonuçları analiz edebildiği **Docker tabanlı online coding sınav platformudur**.

Platform iki ayrı kullanım moduna sahiptir:

- **Açık Kod Editörü (Ana Sayfa):** Kayıt gerektirmeden, herhangi bir kullanıcı dil seçip kod yazabilir, çalıştırabilir ve çıktı alabilir.
- **Sınav Platformu:** Quiz sahipleri sınav oluşturur, yayınlar ve katılımcıları izler. Katılımcılar hesap açmadan, quiz sahibinin belirlediği bilgi forumunu doldurarak sınava girebilir.

Bu tanım; README, sunum ve demo anlatımında sabit proje tanımı olarak kullanılacaktır.

---

## 2. Özgün Özellikler

### 2.1 Kayıt Gerektirmeyen Quiz Katılımı

Katılımcı hesap oluşturmak zorunda değildir. Quiz sahibi bir giriş formu şeması tanımlar (ad, soyad, öğrenci numarası gibi). Katılımcı bu formu doldurur ve sisteme girer. Backend bir `sessionToken` üretir; tüm sınav süreci bu token üzerinden yürür.

### 2.2 Güvenli Docker Sandbox ile Kod Çalıştırma

Kullanıcı kodu izole bir Docker container içinde, ağ erişimi ve dosya sistemi yazma hakkı olmadan çalışır. CPU, RAM ve timeout limitleri uygulanır. Hem ana sayfada (anonim) hem sınav içinde (sessionToken ile) çalışır.

### 2.3 Anti-Cheat Mekanizmaları

Sınav sırasında sekme değiştirme, tam ekrandan çıkma, pano erişimi ve şüpheli tuş desenleri izlenir. Tüm eventler zaman damgası ve bağlamla loglanır; quiz sahibi bu olayları sınav sonunda görebilir.

### 2.4 Gerçek Zamanlı Canlı İzleme (SignalR)

Quiz sahibi, aktif sınavı canlı izleyebilir: katılımcıların hangi soruyu çözdüğünü, son kod değişimini ve anti-cheat olaylarını görebilir. Uyarı gönderebilir ve katılımcıyı sınavdan düşürebilir.

### 2.5 Submission Replay

Her kod gönderimi diff-bazlı kaydedilir. Quiz sahibi, katılımcının kodu nasıl yazdığını adım adım geri oynatabilir; anlık snapshot yerine delta yaklaşımıyla storage maliyeti minimize edilir.

### 2.6 Çoklu Dil Arayüzü (i18n) ve Tema Sistemi

Arayüz Türkçe ve İngilizce olarak sunulur; kullanıcı her sayfada dil değiştirebilir. Hem UI (light/dark) hem Monaco editör temaları birbirine senkronize çalışır; tercihler tarayıcıda kalıcı saklanır.

---

## 3. Gereksinim Karşılama Tablosu

| Gereksinim | CodExam Karşılığı | Durum |
|------------|-------------------|-------|
| Anlamlı problem çözümü | Kod çalıştırma, quiz motoru, anti-cheat, replay | Planlandı |
| Belirli hedef kullanıcı | Admin, User (quiz sahibi), Anonim katılımcı | Karşılanıyor |
| Responsive arayüz | TailwindCSS, mobil uyumlu layout | Planlandı |
| Veritabanı | PostgreSQL + JSONB + Redis | Karşılanıyor |
| En az 2 kullanıcı rolü | Admin ve User (+ anonim) | Karşılanıyor |
| CRUD işlemleri | Quiz, soru, kullanıcı, session, submission yönetimi | Planlandı |
| Arama / filtreleme | Quiz listesi filtreleme, durum sıralama | Planlandı |
| En az 2 özgün özellik | Session token katılım + diff-based replay | Karşılanıyor |
| Çalışan proje bağlantısı | Docker Compose + Nginx ile deploy | Planlandı |
| Kısa rapor | İstenen başlıklara göre hazırlanacak | Planlandı |
| Bireysel katkı beyanı | GitHub commit ve PR geçmişi ile desteklenecek | Planlandı |
| Sunum ve canlı demo | 3 rol akışıyla (Admin, User, Anonim) hazırlanacak | Planlandı |

---

## 4. Rol Yapısı ve Yetki Matrisi

### 4.1 Sistem Rolleri

| Rol | Kim? | Nasıl edinilir? |
|-----|------|----------------|
| `Admin` | Kök sistem yöneticisi | Seed data ile oluşturulur |
| `User` | Kayıtlı kullanıcı (quiz sahibi) | Kayıt ile edinilir |
| Anonim | Kayıtsız quiz katılımcısı | Rol yoktur; sessionToken ile işlem yapar |

### 4.2 Yetki Matrisi

| İşlem | Admin | User (kendi quizi) | User (başkasının quizi) | Anonim |
|-------|:-----:|:-----------------:|:----------------------:|:------:|
| Kod editörü kullan | ✓ | ✓ | ✓ | ✓ |
| Quiz oluştur | ✓ | ✓ | ✗ | ✗ |
| Quiz düzenle / sil | ✓ | ✓ | ✗ | ✗ |
| Quiz yayınla / pasife al | ✓ | ✓ | ✗ | ✗ |
| Soru ekle / düzenle | ✓ | ✓ | ✗ | ✗ |
| Canlı monitor | ✓ | ✓ | ✗ | ✗ |
| Quiz sonuçları görüntüle | ✓ | ✓ | ✗ | ✗ |
| Replay izle | ✓ | ✓ | ✗ | ✗ |
| Quiz'e katıl | ✓ | ✓ | ✓ | ✓ |
| Tüm kullanıcıları yönet | ✓ | ✗ | ✗ | ✗ |
| Tüm quizleri yönet | ✓ | ✗ | ✗ | ✗ |
| Tüm sessionları yönet | ✓ | ✗ | ✗ | ✗ |
| Sistem loglarını görüntüle | ✓ | ✗ | ✗ | ✗ |

---

## 5. Kullanıcı Akışları

### 5.1 Anonim Kullanıcı – Kod Editörü

```
Ana sayfa açılır
  → Dil seçilir (Python / JavaScript / C++)
  → Kod yazılır
  → [Run] tıklanır
  → Sonuç ve execution bilgisi (süre, bellek) panelde gösterilir
  → Hata varsa stderr kırmızı panelde görünür
```

### 5.2 Anonim Kullanıcı – Quiz Katılımı

```
/q/:id adresine gidilir
  → Quiz başlığı, süresi, kuralları ve anti-cheat uyarıları gösterilir
  → Quiz sahibinin tanımladığı form doldurulur (ör: Ad, Soyad, Öğrenci No)
  → [Sınava Gir] tıklanır
  → Backend: formData doğrulanır → sessionToken üretilir → QuizSession oluşturulur
  → /q/:id/take sayfasına yönlendirilir (sessionToken localStorage'a kaydedilir)
  → Fullscreen modu istenir, anti-cheat devreye girer
  → Soru listesi ve Monaco editörü ile sınav başlar
  → Süre sayacı sunucu saatiyle senkron çalışır
  → Her soru için kod gönderilir; visible test case sonuçları gösterilir
  → [Sınavı Bitir] veya süre dolunca → tüm submission'lar kilitlenir
  → Özet ekranı: hangi sorular tamamlandı
```

### 5.3 User (Quiz Sahibi) Akışı

```
/register → kayıt ol (email, şifre, display name)
  → /login → giriş yap
  → /dashboard → quiz listem açılır
  → [Yeni Quiz Oluştur] tıklanır
  → Quiz başlığı, açıklaması, süresi, modu, anti-cheat seçenekleri girilir
  → Katılımcı bilgi formu şeması tanımlanır (dinamik alan ekle)
  → [Kaydet] → Quiz taslak olarak oluşturulur
  → /dashboard/quizzes/:id/questions
  → Soru ekle: Coding / Multiple Choice / Output Prediction / Bug Fix / Short Answer
  → Coding sorusu: başlangıç kodu, dil desteği, visible ve hidden test case'ler
  → Quiz önizlenir → [Yayınla]
  → Katılımcılara /q/:id linki paylaşılır
  → Sınav sırasında /dashboard/quizzes/:id/monitor → canlı izleme
  → Sınav biter → /dashboard/quizzes/:id/results → sonuçlar ve replay
```

### 5.4 Admin Akışı

```
/login → admin hesabıyla giriş
  → /admin → sistem dashboard (kullanıcı, quiz, session istatistikleri)
  → /admin/users → kullanıcı listesi
    → Kullanıcıyı pasifleştir / rol güncelle / sil
  → /admin/quizzes → tüm quizler
    → Herhangi bir quizi görüntüle / düzenle / sil
  → /admin/sessions → tüm aktif/geçmiş sessionlar
    → Session detayını gör / zorla sonlandır
  → /admin/system → sistem logları (API hataları, runner hataları)
    → Başarısız execution'ları incele
```

---

## 6. Ekran Planları

### 6.1 Ortak Ekranlar

**Ana Sayfa (`/`)**
Üst bar: logo, dil değiştirici (TR/EN), tema toggle (☀️/🌙), programlama dili dropdown, [Run] butonu, [Giriş Yap] linki.
İki panel: sol Monaco editörü (tema ile senkron), sağ çıktı/hata konsolu + execution istatistikleri (süre, bellek).

```
┌─────────────────────────────────────────────────────────────┐
│  CodExam  [🌐 TR▾]  [☀️▾]  [Python▾]  [▶ Run]  [Giriş]  │
├──────────────────────┬──────────────────────────────────────┤
│                      │  Output                              │
│   Monaco Editor      │  ──────────────────────────────────  │
│                      │  > Hello, World!                     │
│                      │                                      │
│                      │  Execution Info                      │
│                      │  Time: 42ms · Memory: 8 MB           │
└──────────────────────┴──────────────────────────────────────┘
```

**Giriş Ekranı (`/login`)**
Email, şifre, "Beni hatırla", "Şifremi unuttum" bileşenleri. Kayıt sayfasına link.

**Kayıt Ekranı (`/register`)**
Ad-soyad, email, şifre + onay. Giriş sayfasına link.

**Hata Ekranları**
404, 403 (yetkisiz erişim), 500 (işlem başarısızlığı) ve geri yönlendirme.

---

### 6.2 Quiz Katılım Ekranları (Anonim / Herkese Açık)

**Quiz Giriş Sayfası (`/q/:id`)**
Quiz başlığı, açıklaması, süresi, soru sayısı. Anti-cheat uyarıları. Quiz sahibinin tanımladığı dinamik form. [Sınava Gir] butonu.

**Sınav Ekranı (`/q/:id/take`)**
Fullscreen mod. Üst bar: kalan süre sayacı (sunucu senkronlu), quiz adı, soru navigasyonu.
Sol panel: soru metni, test case'ler (visible). Sağ panel: Monaco editörü, dil seçimi, [Çalıştır] ve [Gönder] butonları. Alt panel: execution sonucu.

**Sınav Özet Ekranı**
Tamamlanan / tamamlanmayan soru listesi. Toplam gönderim sayısı. Teşekkür mesajı.

---

### 6.3 User Dashboard Ekranları (Kayıtlı Kullanıcı)

**Dashboard Ana (`/dashboard`)**
Quiz sayısı, aktif sınav sayısı, toplam katılımcı. Son aktiviteler. [Yeni Quiz Oluştur] butonu.

**Quiz Listesi (`/dashboard/quizzes`)**
Taslak, yayınlandı, pasif durumları; başlık, tarih, katılımcı sayısı. Düzenle, sil, monitor, sonuçlar aksiyonları.

**Yeni Quiz Oluştur / Düzenle (`/dashboard/quizzes/new` · `/dashboard/quizzes/:id`)**
Başlık, açıklama, süre (dakika), mod (serbest / gerçek zamanlı). Anti-cheat seçenekleri (sekme izleme, fullscreen zorunluluğu, pano engeli). Katılımcı bilgi formu şema editörü (dinamik alan ekle/çıkar/sırala).

**Soru Yönetimi (`/dashboard/quizzes/:id/questions`)**
Soru listesi (sürükle-bırak sıralama). Yeni soru ekle: tip seç → tip bazlı form aç. Her soru için puan tanımı.

Soru tipleri ve formları:
- **Coding:** Başlık, açıklama, starter kod editörü, desteklenen diller, visible test case'ler (input / beklenen çıktı), hidden test case'ler.
- **Multiple Choice:** Soru metni, seçenekler (sürükle sırala), doğru cevap işaretleme, tek/çoklu seçim.
- **Output Prediction:** Kod bloğu (sadece okunur), beklenen çıktı alanı.
- **Bug Fix:** Hatalı kod editörü, doğru çözüm (gizli), ipucu (opsiyonel).
- **Short Answer:** Soru metni, kabul edilecek cevaplar listesi, eşleşme modu (tam / içerir / regex).

**Canlı Monitor (`/dashboard/quizzes/:id/monitor`)**
Katılımcı grid'i: her kart → display name (form verisi), aktif soru, son activity, event sayısı. Karta tıklayınca anlık kod görünümü. [Uyarı Gönder] ve [Sınavdan Düşür] butonları.

**Sonuçlar (`/dashboard/quizzes/:id/results`)**
Katılımcı bazlı sonuçlar tablosu. Soru bazlı başarı oranı grafikleri. Her katılımcı için [Replay İzle] linki.

**Replay Ekranı (`/dashboard/quizzes/:id/results/:sessionId/replay`)**
Timeline slider. Play/pause/hız kontrolü. Kod paneli diff animasyonu. Anti-cheat olayları zaman çizelgesinde işaretli.

**Profil (`/profile`)**
Hesap bilgileri, şifre güncelleme.

---

### 6.4 Admin Panel Ekranları

**Admin Dashboard (`/admin`)**
Kullanıcı sayısı, aktif quiz sayısı, günlük execution sayısı, sistem sağlık durumu. Son hata logları özeti.

**Kullanıcı Yönetimi (`/admin/users`)**
Arama ve filtreleme. Rol değiştirme, hesap pasifleştirme, silme. Kayıt tarihi, son giriş tarihi.

**Quiz Yönetimi (`/admin/quizzes`)**
Tüm quizler (sahibi, durumu, katılımcı sayısı). Düzenle, sil, detaya git.

**Session Yönetimi (`/admin/sessions`)**
Aktif ve geçmiş sessionlar. Zorla sonlandırma. SessionToken, başlangıç/bitiş zamanı, form verisi.

**Sistem Logları (`/admin/system`)**
Runner hataları, API hataları, Nginx kaynaklı hatalar. Kaynak servise göre filtreleme.

---

## 7. Veritabanı Modeli

### 7.1 Kimlik ve Yetki

```sql
users
  id uuid PK, email varchar UNIQUE, password_hash varchar,
  display_name varchar, role varchar CHECK('Admin','User'),
  status varchar DEFAULT 'active', created_at, updated_at, deleted_at

-- Not: Rol enum'u iki değer alır: Admin (kök yönetici) ve User (quiz sahibi)
```

### 7.2 Quiz Yönetimi

```sql
quizzes
  id uuid PK, owner_id uuid FK(users), title varchar, description text,
  duration_minutes int, mode varchar CHECK('RealTime','FreeStyle'),
  anti_cheat_options jsonb,   -- { tabSwitch, fullscreen, clipboard }
  form_schema jsonb,          -- katılımcıdan toplanacak alan şeması
  access_code varchar,        -- opsiyonel şifre
  status varchar CHECK('Draft','Active','Ended'),
  created_at, updated_at, published_at

questions
  id uuid PK, quiz_id uuid FK(quizzes), type varchar
    CHECK('Coding','MultipleChoice','OutputPrediction','BugFix','ShortAnswer'),
  title varchar, body text, points int, order_no int,
  options jsonb,              -- tip bazlı config (starter_code, choices, vs.)
  created_at, updated_at

test_cases
  id uuid PK, question_id uuid FK(questions),
  input text, expected_output text, is_visible bool,
  created_at

quiz_import_batches
  id uuid PK, owner_id uuid FK(users), file_name varchar,
  import_type varchar CHECK('CSV','JSON'), status varchar,
  total_count int, error_count int, created_at

quiz_import_errors
  id uuid PK, batch_id uuid FK(quiz_import_batches),
  row_no int, error_message text
```

### 7.3 Quiz Çözüm ve Oturum

```sql
quiz_sessions
  id uuid PK, quiz_id uuid FK(quizzes),
  user_id uuid FK(users) NULLABLE,   -- kayıtlı kullanıcı ise dolu, anonim ise null
  session_token uuid UNIQUE NOT NULL, -- anonim katılımcı kimliği
  form_data jsonb NOT NULL,           -- katılımcının doldurduğu form
  started_at timestamptz, ends_at timestamptz, finished_at timestamptz,
  is_active bool DEFAULT true, is_locked bool DEFAULT false

submissions
  id uuid PK, session_id uuid FK(quiz_sessions),
  question_id uuid FK(questions),
  language varchar, code text,
  status varchar CHECK('Pending','Running','Passed','Failed','Error','TLE'),
  execution_time_ms int, memory_used_kb int,
  submitted_at timestamptz, version int DEFAULT 1

submission_replays
  id uuid PK, submission_id uuid FK(submissions),
  diffs jsonb NOT NULL   -- [{time_ms: int, diff: string}]
```

### 7.4 Anti-Cheat Event Logları

```sql
exam_events
  id uuid PK, session_id uuid FK(quiz_sessions), quiz_id uuid,
  event_type varchar CHECK('TabSwitch','FullscreenExit','ClipboardAttempt','Keydown'),
  severity varchar CHECK('Low','Medium','High'),
  timestamp timestamptz NOT NULL,
  metadata jsonb   -- ek bağlam bilgisi
```

### 7.5 Kod Editörü (Ana Sayfa)

```sql
-- Anonim execution'lar için ayrı tablo (quiz dışı)
code_executions
  id uuid PK, language varchar, source_code text, stdin_text text,
  stdout_text text, stderr_text text,
  execution_time_ms int, memory_used_kb int,
  status varchar, created_at timestamptz

-- Runner container takibi
compile_jobs
  id uuid PK, execution_id uuid, runner_container_id varchar,
  job_status varchar, queued_at, started_at, finished_at
```

### 7.6 Sistem İzleme

```sql
audit_logs
  id uuid PK, actor_user_id uuid NULLABLE,
  action_type varchar, entity_type varchar, entity_id uuid,
  details jsonb, created_at

system_error_logs
  id uuid PK, source_service varchar CHECK('API','Runner','Nginx'),
  error_title varchar, error_message text, stack_trace text,
  created_at
```

### 7.7 Temel İlişkiler

- Bir kullanıcı birden çok quiz oluşturabilir
- Bir quiz birden çok soru içerir; bir soru birden çok test case içerir
- Bir quiz'e birden çok session açılabilir (her katılım = yeni session)
- Bir session birden çok submission içerir; her submission bir replay'e sahip
- Session anonim veya kayıtlı kullanıcıya ait olabilir (user_id nullable)

---

## 8. Sistem Mimarisi

### 8.1 Genel Bakış

```
Browser (React)
      │
      │  REST  ·  SignalR
      ▼
   Nginx  (reverse proxy, static, security headers)
      │
      ▼
ASP.NET Core API
      │
      ├── PostgreSQL  (EF Core – kalıcı veriler)
      ├── Redis       (Hangfire backend + cache + rate limit)
      ├── SignalR Hub (gerçek zamanlı monitor)
      │
      └── Hangfire ──→ Worker Service
                              │
                         Docker Engine
                              │
                    ┌─────────────────────┐
                    │   Runner Container  │
                    │  python / node / cpp│
                    │  --network none     │
                    │  --read-only        │
                    │  --cpus 0.5 --mem   │
                    └─────────────────────┘
```

### 8.2 Katman Sorumlulukları

| Katman | Sorumluluk |
|--------|-----------|
| **Frontend** | UI render, kullanıcı etkileşimi, i18n, tema, durum yönetimi |
| **Nginx** | Reverse proxy, statik dosya sunumu, güvenlik başlıkları, rate limiting |
| **ASP.NET Core API** | Auth, quiz CRUD, submission, puanlama, öneri üretimi, runner entegrasyonu |
| **Worker Service** | Hangfire job işleme, Docker container yönetimi, execution sonucu kaydetme |
| **PostgreSQL** | Kalıcı veri: kullanıcılar, quizler, sonuçlar, loglar, replay diff'leri |
| **Redis** | Hangfire backend, oturum cache, rate limit sayaçları |
| **Runner Container** | Kod alma, derleme/çalıştırma, stdout/stderr yakalama, timeout yönetimi |

### 8.3 Backend Klasör Yapısı (Clean Architecture Lite)

```
api/
├── Controllers/       HTTP endpoint'leri, input/output mapping
├── Application/       Use case'ler, DTO'lar, FluentValidation kuralları
├── Domain/            Entity'ler, değer nesneleri, domain logic
├── Infrastructure/    EF Core, Repository'ler, Docker.DotNet, Hangfire
└── Hubs/              SignalR hub tanımları
```

### 8.4 İstek Akışları

**Quiz çözüm akışı:**
```
Tarayıcı → Nginx → API → PostgreSQL → Tarayıcı
```

**Kod çalıştırma akışı:**
```
Tarayıcı → Nginx → API → Hangfire (enqueue) → Worker → Docker Engine
  → Runner Container → stdout/stderr → Worker → PostgreSQL → API → Tarayıcı
```

**Canlı izleme akışı:**
```
Katılımcı (sessionToken) → SignalR Hub → group quiz:{id}
Quiz Sahibi / Admin (JWT) → SignalR Hub → subscribe quiz:{id}
  ← session.codeChanged / session.heartbeat / session.event
  → monitor.warn / monitor.terminate
```

---

## 9. API Endpointleri

### Auth
| Method | Endpoint | Erişim | Açıklama |
|--------|----------|--------|---------|
| POST | `/api/auth/register` | Public | Kayıt |
| POST | `/api/auth/login` | Public | Giriş → JWT + refresh token |
| POST | `/api/auth/refresh` | Public | Token yenileme |
| GET | `/api/auth/me` | User/Admin | Oturum bilgisi |

### Kod Çalıştırma (Ana Sayfa)
| Method | Endpoint | Erişim | Açıklama |
|--------|----------|--------|---------|
| POST | `/api/execute` | Public | `{ language, code, stdin? }` → `{ stdout, stderr, status, timeMs, memKb }` |

### Quiz Yönetimi (Dashboard)
| Method | Endpoint | Erişim | Açıklama |
|--------|----------|--------|---------|
| GET | `/api/quizzes` | User | Kendi quizleri |
| POST | `/api/quizzes` | User | Quiz oluştur |
| GET | `/api/quizzes/:id` | Owner/Admin | Quiz detayı |
| PUT | `/api/quizzes/:id` | Owner/Admin | Güncelle |
| DELETE | `/api/quizzes/:id` | Owner/Admin | Sil |
| POST | `/api/quizzes/:id/publish` | Owner/Admin | Yayınla |
| GET | `/api/quizzes/:id/questions` | Owner/Admin | Soru listesi |
| POST | `/api/quizzes/:id/questions` | Owner/Admin | Soru ekle |
| PUT/DELETE | `/api/questions/:id` | Owner/Admin | Soru güncelle/sil |
| GET | `/api/quizzes/:id/sessions` | Owner/Admin | Session listesi |
| GET | `/api/quizzes/:id/results` | Owner/Admin | Sonuçlar |
| POST | `/api/quizzes/:id/import` | Owner/Admin | CSV/JSON toplu yükleme |

### Quiz Katılımı (Public – session token ile)
| Method | Endpoint | Erişim | Açıklama |
|--------|----------|--------|---------|
| GET | `/api/quizzes/:id/info` | Public | Katılım sayfası için quiz bilgisi |
| POST | `/api/quizzes/:id/join` | Public | Form data → `{ sessionToken, endsAt }` |
| POST | `/api/quizzes/:id/submit` | SessionToken | Cevap gönder |
| POST | `/api/quizzes/:id/event` | SessionToken | Anti-cheat event |
| GET | `/api/sessions/:id/replay` | Owner/Admin | Replay diff listesi |

### Admin (Sistem Yönetimi)
| Method | Endpoint | Erişim | Açıklama |
|--------|----------|--------|---------|
| GET | `/api/admin/stats` | Admin | KPI özeti |
| GET/PUT/DELETE | `/api/admin/users` | Admin | Kullanıcı yönetimi |
| GET/DELETE | `/api/admin/quizzes` | Admin | Tüm quizler |
| GET/DELETE | `/api/admin/sessions` | Admin | Tüm sessionlar |
| GET | `/api/admin/logs` | Admin | Sistem logları |

### Monitor (SignalR)
| Hub | Endpoint | Açıklama |
|-----|----------|---------|
| MonitorHub | `/hubs/monitor` | JWT veya `?token=` ile bağlanılır |

---

## 10. Teknoloji Stack

### Frontend

| Teknoloji | Kullanım |
|-----------|---------|
| React 18 + TypeScript 5 | UI framework |
| Vite 5 | Build tool |
| TailwindCSS 3 | Stil + CSS variable tema sistemi |
| Monaco Editor (`@monaco-editor/react`) | Kod editörü |
| Zustand | Global state (auth, editor, tema, dil) |
| TanStack Query v5 | Server state, cache |
| React Router v6 | Routing + korumalı rotalar |
| Axios | HTTP client + interceptor |
| `@microsoft/signalr` | Realtime bağlantı |
| `i18next` + `react-i18next` | Çoklu dil (TR/EN) |
| `i18next-browser-languagedetector` | Otomatik dil algılama |

**Zustand Store Yapısı:**
```
authStore      → user, token, role, login/logout
editorStore    → language, code, output, isRunning
examStore      → sessionToken, session, timeRemaining, antiCheatEvents
themeStore     → uiTheme (light/dark), monacoTheme, persist localStorage
i18nStore      → locale (tr/en), i18next sync, persist localStorage
```

### Backend

| Teknoloji | Kullanım |
|-----------|---------|
| ASP.NET Core 8 | Web API |
| Entity Framework Core 8 + Npgsql | ORM + PostgreSQL |
| FluentValidation | Input doğrulama |
| Serilog | Yapısal loglama |
| SignalR (built-in) | Realtime hub |
| JWT Bearer + BCrypt.Net | Auth + şifre |
| Hangfire + Redis | Background job queue |
| AspNetCoreRateLimit | Rate limiting |

### Altyapı

| Teknoloji | Kullanım |
|-----------|---------|
| PostgreSQL 16 | Ana veritabanı |
| Redis 7 | Hangfire + cache + rate limit |
| Docker Engine | Runner container'lar |
| Docker Compose | Lokal + staging deploy |
| Nginx | Reverse proxy, statik sunucu |

### Runner Container'lar

| Dil | Imaj | Timeout | RAM Limiti |
|-----|------|---------|-----------|
| Python | `python:3.12-slim` | 10 sn | 256 MB |
| JavaScript | `node:20-alpine` | 10 sn | 256 MB |
| C++ | `alpine + g++` | 15 sn | 256 MB |

Tüm container'lar: `--network none`, `--read-only`, `--cpus=0.5`, non-root user

---

## 11. Risk ve Çözüm Planı

| Risk | Çözüm |
|------|-------|
| **Zararlı kod çalıştırma** | Runner ayrı container; `--network none`, read-only fs, CPU/RAM/timeout limiti |
| **Sonsuz döngü / kaynak tüketimi** | Maksimum süre, bellek ve proses limiti; timeout'ta job iptal, durum kaydı |
| **Yetkisiz endpoint erişimi** | JWT + rol bazlı policy; her endpoint server-side kontrol; session token middleware |
| **SQL Injection** | EF Core parametrik sorgular; ham sorgu minimumda tutulur |
| **XSS / kullanıcı girdisi** | Output encoding, HTML sanitize, Content-Security-Policy başlığı |
| **Veri kaybı** | PostgreSQL volume + migration + seed data + düzenli dump |
| **Docker ortam farkı** | Tek docker-compose dosyası, sabit sürümler, `.env.example`, kurulum rehberi |
| **Frontend-backend entegrasyon sorunları** | Swagger ile erken API sözleşmesi; düzenli entegrasyon kontrolü |
| **Performans sorunu** | Pagination, DB index'leri, DTO projection, optimize sorgular |
| **Deploy riski** | Staging benzeri lokal ortam, health check, restart policy |
| **Demo günü hatası** | Seed data ile hazır demo kullanıcıları, örnek quiz ve kod senaryoları |
| **GitHub merge conflict** | main korunur; tüm geliştirme PR ile birleşir; feature branch zorunlu |
| **Zaman yetişmeme** | Faz bazlı önceliklendirme; çekirdek modüller önce bitirilir; replay/analitik kesilebilir |
| **Yapay zeka kullanımı** | AI kullanım günlüğü tutulur; kullanılan çıktılar nerede/nasıl kullanıldığı kayıt altına alınır |

---

## 12. GitHub Çalışma Modeli

### Branch Yapısı

| Branch | Açıklama |
|--------|---------|
| `main` | Stabil, teslime yakın sürüm. Doğrudan push yasak. |
| `develop` | Günlük entegre geliştirme hattı. Feature'lar buraya merge olur. |
| `feature/<kısa-isim>` | Özellik bazlı geliştirme dalları |
| `hotfix/<kısa-isim>` | Kritik hata düzeltmeleri; doğrudan develop'a merge |

### Kurallar

- `main` dalına doğrudan push yasaktır; tüm değişiklikler PR ile birleşir
- PR açmadan önce `develop` ile rebase yapılır
- Her PR en az 1 reviewer onayı gerektirir
- Commit mesajı: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` prefix'leri kullanılır
- Her faz sonunda `develop` → `main` merge PR açılır

### Commit Mesajı Örnekleri

```
feat: add quiz join endpoint with session token
fix: submission status not updating after TLE
docs: update API endpoint list in ROADMAP
chore: add python-runner Dockerfile
refactor: extract quiz ownership check to policy handler
```

---

## 13. Kişi Bazlı Görev Dağılımı

### Kişi 1 – Frontend ve UX

- Ortak layout, header, tema sistemi, i18n altyapısı
- Ana sayfa kod editörü (Monaco + execution panel)
- Login / Register sayfaları
- Quiz katılım akışı (`/q/:id`, `/q/:id/take`)
- User dashboard (quiz listesi, oluşturma, soru yönetimi)
- Canlı monitor ekranı (SignalR consumer)
- Replay ekranı
- Admin panel ekranları
- Responsive düzen ve bileşen kütüphanesi

### Kişi 2 – Backend, Veritabanı ve Quiz Motoru

- ASP.NET Core solution yapısı ve entity modelleri
- EF Core migration'ları ve PostgreSQL şeması
- JWT auth, rol bazlı yetki politikaları, session token middleware
- Quiz, soru, test case CRUD API'leri
- Quiz katılım ve submission endpointleri
- Otomatik puanlama (test case eşleştirme)
- Submission replay diff hesaplama ve kaydetme
- SignalR hub ve monitor event'leri
- Admin yönetim endpointleri
- Swagger dokümantasyonu

### Kişi 3 – Runner, Docker, Nginx ve Sistem

- Docker Compose altyapısı (tüm servisler)
- Nginx yönlendirme, güvenlik başlıkları, body limit
- Runner container Dockerfile'ları (Python, Node, C++)
- Worker service: Hangfire job işleme, Docker.DotNet entegrasyonu
- Kod derleme/çalıştırma akışı, timeout ve kaynak limitleri
- Loglama altyapısı (Serilog + system_error_logs)
- Health check ve restart policy mekanizmaları
- Seed data ve demo ortamı hazırlığı
- Deploy doğrulaması ve yedek lokal demo ortamı

---

## 14. Faz Bazlı Geliştirme Planı

### Faz 0 – Analiz ve Kararlar *(24–26 Nisan)*

Proje tanımı, kapsam, roller, ekran listesi, veritabanı taslağı, mimari taslak ve GitHub düzeni netleştirilecek. Bu ROADMAP.md hazırlanacak.

**Çıktı:** ROADMAP.md, GitHub repo + branch kuralları, klasör yapısı, `.env.example`

---

### Faz 1 – Altyapı ve İskelet *(27–29 Nisan)*

Repo yapısı, docker-compose, Nginx temeli, ASP.NET API iskeleti, PostgreSQL bağlantısı, Vite + React + TailwindCSS + i18n + tema altyapısı, temel frontend routing.

**Çıktı:** `docker compose up` ile tüm servisler ayağa kalkar. Temel API health check çalışır.

---

### Faz 2 – Auth ve Rol Sistemi *(28–30 Nisan)*

Kayıt, giriş, JWT, role-based yetkilendirme, korumalı route'lar, token refresh.

**Çıktı:** Admin ve User ayrı yetkilerle giriş yapabilir. Korumalı endpoint'ler çalışır.

---

### Faz 3 – Ana Sayfa Kod Editörü *(30 Nisan – 2 Mayıs)*

Monaco editörü, dil seçimi, `POST /api/execute` endpoint'i, Runner container (Python), Hangfire job akışı, çıktı paneli.

**Çıktı:** Anonim kullanıcı ana sayfada kod yazıp çalıştırabilir. Python çalışıyor.

---

### Faz 4 – Quiz Yönetimi *(1–4 Mayıs)*

Quiz CRUD, soru ekleme (tüm tipler), test case yönetimi, quiz yayınlama akışı, dashboard ekranları.

**Çıktı:** User quiz oluşturup yayınlayabilir. Admin tüm quizleri görebilir.

---

### Faz 5 – Quiz Katılımı ve Submission *(4–7 Mayıs)*

Session token akışı, `/q/:id` giriş formu, `/q/:id/take` sınav ekranı, submission endpoint'i, test case değerlendirme, otomatik puanlama, sınav timer.

**Çıktı:** Anonim kullanıcı sınava girip kod gönderebilir. Visible test case sonuçları görünür.

---

### Faz 6 – Canlı İzleme ve Anti-Cheat *(8–11 Mayıs)*

SignalR hub, monitor ekranı, katılımcı event stream, anti-cheat event loglama, uyarı ve terminate özellikleri.

**Çıktı:** Quiz sahibi sınavı canlı izleyebilir. Anti-cheat event'leri loglanır.

---

### Faz 7 – Submission Replay *(11–13 Mayıs)*

Diff-based kayıt, SubmissionReplay tablosu, replay ekranı, timeline slider, playback.

**Çıktı:** Quiz sahibi bir katılımcının kod yazma sürecini adım adım izleyebilir.

---

### Faz 8 – Admin Paneli *(13–15 Mayıs)*

Kullanıcı yönetimi, tüm quiz/session görüntüleme, sistem logları, KPI dashboard.

**Çıktı:** Admin tüm sistemi yönetebilir.

---

### Faz 9 – Responsive, Test ve Polish *(15–16 Mayıs)*

Mobil uyum, boş durumlar, hata mesajları, edge case'ler, API validasyon testleri, runner ikinci dil (Node.js).

**Çıktı:** Tüm ekranlar mobil uyumlu. Temel akışlar hatasız.

---

### Faz 10 – Teslim Hazırlığı *(17–18 Mayıs)*

Seed data, demo kullanıcıları, örnek quiz ve kod senaryoları, README son hali, bireysel katkı beyanı, sunum görselleri, deploy doğrulaması.

**Çıktı:** Canlı demo hazır. 3 rol akışı eksiksiz sunulabilir.

---

## 15. Gün Bazlı Takvim

> Başlangıç: 24 Nisan · Teslim: 18 Mayıs · Her gün için çıktı odaklı, detaylı görev listesi.

---

### 24 Nisan — Faz 0: Analiz ve Kararlar

**Hedef:** Proje tanımı, kapsam, roller ve ekran envanteri netleştirilir. GitHub hazır olur.

**Yapılacaklar**
- [ ] GitHub reposunu oluştur; `main`, `develop` branch'lerini kur
- [ ] Branch koruma kurallarını ayarla (`main`'e doğrudan push yasağı, PR zorunlu)
- [ ] Issue şablonu ve PR şablonu ekle (`.github/` klasörü)
- [ ] Monorepo klasör yapısını oluştur: `frontend/`, `api/`, `worker/`, `runners/`, `infra/`
- [ ] `.env.example` dosyasını hazırla (tüm servisler için gerekli değişkenler)
- [ ] `.gitignore` düzenle (node_modules, bin/obj, .env, *.user)
- [ ] ROADMAP.md'yi repoya ekle
- [ ] Ana ekran listesini ve rota haritasını çıkar (kağıt/figma wireframe)
- [ ] API ihtiyaçlarını ve temel endpoint listesini taslak olarak çıkar

---

### 25 Nisan — Faz 0: Veritabanı Taslağı ve Mimari

**Hedef:** ER modeli, kullanıcı akışları ve Docker servis haritası tamamlanır.

**Yapılacaklar**
- [ ] ER diyagramını çiz: tablo adları, ilişkiler, JSONB alanları
- [ ] Tablo ilişkilerini ve foreign key kısıtlamalarını netleştir
- [ ] Her kullanıcı rolü için ekran akışı wireframe'i hazırla (anonim, user, admin)
- [ ] Docker Compose servis haritasını çıkar: hangi servis hangi porta bağlanır
- [ ] Nginx yönlendirme kurallarını (`/api/*` → api, `/hubs/*` → api, `/` → frontend) belirle
- [ ] Runner container'ların hangi limitleri uygulayacağını netleştir

---

### 26 Nisan — Faz 0: Dokümantasyon

**Hedef:** README ve teknik karar dokümanı tamamlanır; ekip lokal ortamı kurabilir.

**Yapılacaklar**
- [ ] README.md: projeye giriş, lokal kurulum adımları (`docker compose up` ile 10 dakika)
- [ ] Teknoloji seçimlerinin gerekçelerini `docs/decisions.md`'ye yaz
- [ ] `docker-compose.yml`'e api, worker, frontend, nginx servislerini taslak olarak ekle
- [ ] Environment değişkenlerini kategorize et (DB, Redis, JWT, Runner limitleri)
- [ ] Swagger/OpenAPI anotasyonları için backend klasör yapısını belirle

---

### 27 Nisan — Faz 1: Frontend ve Backend İskeleti

**Hedef:** Hem frontend hem backend compile olan boş proje olarak ayağa kalkar.

**Frontend**
- [ ] `frontend/` – Vite + React 18 + TypeScript 5 kurulumu (`npm create vite`)
- [ ] TailwindCSS v3 + PostCSS kurulumu ve `tailwind.config.ts` düzenlenmesi
- [ ] CSS variable tabanlı tema sistemi: `--color-bg`, `--color-surface`, `--color-primary` tanımları
- [ ] `themeStore` (Zustand): `uiTheme`, `monacoTheme`, localStorage persist
- [ ] `i18next` + `react-i18next` + `i18next-browser-languagedetector` kurulumu
- [ ] `src/locales/tr.json` ve `src/locales/en.json` dosyalarını oluştur (boş şema)
- [ ] React Router v6 kurulumu; `routes/index.tsx` iskelet rotalar
- [ ] ESLint + Prettier + TypeScript strict mode konfigürasyonu

**Backend**
- [ ] `api/` – ASP.NET Core 8 Web API solution ve proje oluştur (`dotnet new`)
- [ ] Klasör yapısını kur: `Controllers/`, `Application/`, `Domain/`, `Infrastructure/`, `Hubs/`
- [ ] EF Core 8 + Npgsql paketlerini ekle
- [ ] `AppDbContext` sınıfını oluştur; `appsettings.json`'a connection string ekle
- [ ] Serilog kurulumu + request logging middleware
- [ ] CORS konfigürasyonu (frontend origin'e izin ver)
- [ ] `GET /api/health` endpoint'i (docker health check için)

**Altyapı**
- [ ] `docker-compose.yml`'e api ve frontend (dev) servislerini ekle
- [ ] Nginx `default.conf` ile `/api/*` ve `/` yönlendirmelerini yaz
- [ ] `docker compose up` çalıştır; tüm container'ların sağlıklı başladığını doğrula

---

### 28 Nisan — Faz 2: Auth – Veri Katmanı

**Hedef:** Kullanıcı tablosu ve şifreleme altyapısı hazır olur.

**Backend**
- [ ] `User` entity: `Id (uuid)`, `Email`, `PasswordHash`, `DisplayName`, `Role (Admin|User)`, `Status`, `CreatedAt`, `UpdatedAt`, `DeletedAt`
- [ ] `Role` enum tanımı (`Admin`, `User`)
- [ ] `AppDbContext`'e `Users` DbSet ekle
- [ ] İlk EF Core migration'ı oluştur ve uygula (`dotnet ef migrations add InitialCreate`)
- [ ] BCrypt.Net kurulumu; `PasswordService` sınıfı (hash + verify)
- [ ] `POST /api/auth/register` endpoint iskelet (FluentValidation kuralları dahil)

**Frontend**
- [ ] `authStore` (Zustand): `user`, `accessToken`, `role`, `isAuthenticated`, `login`, `logout` aksiyonları
- [ ] `/login` sayfası: email + şifre formu, validasyon mesajları
- [ ] `/register` sayfası: display name + email + şifre + onay formu
- [ ] Axios instance oluştur; base URL konfigürasyonu

**Altyapı**
- [ ] PostgreSQL container volume'unu ve kullanıcı/db ayarlarını doğrula
- [ ] Migration'ın container içinde çalıştığını test et

---

### 29 Nisan — Faz 2: Auth – JWT ve Oturum

**Hedef:** Login/register uçtan uca çalışır. Token tarayıcıya ulaşır.

**Backend**
- [ ] `POST /api/auth/login` endpoint: email + şifre doğrula → access token (15dk) + refresh token (7gün) dön
- [ ] `POST /api/auth/refresh` endpoint
- [ ] `GET /api/auth/me` endpoint
- [ ] JWT Bearer middleware konfigürasyonu (`AddAuthentication`, `AddJwtBearer`)
- [ ] Refresh token'ı DB'ye kaydet (`UserRefreshTokens` tablosu veya User entity'sinde alan)
- [ ] `RequireAdmin` ve `RequireUser` authorization policy'lerini tanımla

**Frontend**
- [ ] Axios response interceptor: 401 geldiğinde refresh token ile yeniden dene, başarısızsa logout
- [ ] `PrivateRoute` bileşeni: `<PrivateRoute roles={["Admin"]}> / <PrivateRoute roles={["User","Admin"]}>`
- [ ] Login sonrası role göre yönlendirme: Admin → `/admin`, User → `/dashboard`
- [ ] Header bileşeni: anonim (Giriş Yap linki) / User (Dashboard linki, çıkış) / Admin (Admin Panel linki)

**Altyapı**
- [ ] Nginx üzerinden API yönlendirmesini test et; `/api/auth/login` isteği frontend'den dönüyor mu?

---

### 30 Nisan — Faz 1+2: İskelet Ekranlar ve Monaco Entegrasyonu

**Hedef:** Dashboard ve admin iskelet ekranları çalışır. Monaco editörü ana sayfada görünür.

**Frontend**
- [ ] Ana sayfa layout'u: Header + iki panel (editör sol, output sağ)
- [ ] `@monaco-editor/react` kurulumu; dil seçimi dropdown (Python, JavaScript, C++)
- [ ] `editorStore` (Zustand): `language`, `code`, `output`, `isRunning`
- [ ] Monaco temasını `themeStore` ile senkronize et (`vs` ↔ `vs-dark`)
- [ ] `/dashboard` iskelet: "Quizlerim" başlığı, boş liste, "Yeni Quiz Oluştur" butonu
- [ ] `/admin` iskelet: KPI kartları (0 değerli), navigasyon sidebar
- [ ] `i18nStore`'u React context'e bağla; header'a dil değiştirici dropdown ekle (TR/EN)
- [ ] Tema toggle butonu (☀️/🌙) ekle; CSS variable'ları güncelle

**Backend**
- [ ] `RequireQuizOwner` policy handler'ını yaz (`quiz.OwnerId == userId || role == Admin`)
- [ ] Korumalı endpoint'leri test et (Postman / Swagger üzerinden)

---

### 1 Mayıs — Faz 3: Kod Çalıştırma – Backend

**Hedef:** `POST /api/execute` Hangfire üzerinden Python kodu çalıştırır.

**Backend**
- [ ] Hangfire + Redis backend kurulumu (`AddHangfire`, `AddHangfireServer`)
- [ ] `code_executions` tablosu ve migration
- [ ] `compile_jobs` tablosu ve migration
- [ ] `POST /api/execute` endpoint: `{ language, code, stdin? }` → job enqueue et → jobId dön
- [ ] `GET /api/execute/:jobId` endpoint: job durumunu ve sonucunu dön
- [ ] Rate limiting kurulumu (IP bazlı, Redis): execute için 10 istek/dk
- [ ] `ExecutionService`: job'ı işle, sonucu DB'ye yaz

**Worker**
- [ ] `worker/` – ASP.NET Core Worker Service projesi oluştur
- [ ] Docker.DotNet (C# Docker SDK) kurulumu
- [ ] `DockerRunnerService`: container başlat, stdin yaz, stdout/stderr oku, timeout uygula
- [ ] `docker compose`'a worker servisini ekle; Docker socket'ini mount et

**Altyapı**
- [ ] Python runner `Dockerfile` yaz: `python:3.12-slim`, non-root user (`uid=1000`), çalışma dizini
- [ ] `runners/python-runner/` imajını build et; `docker run` ile manuel test yap
- [ ] `--network none --read-only --cpus=0.5 --memory=256m` bayraklarını doğrula

---

### 2 Mayıs — Faz 3: Kod Çalıştırma – Frontend Entegrasyonu

**Hedef:** Ana sayfada Run tuşuna basınca çıktı panelinde sonuç görünür.

**Frontend**
- [ ] Run butonu: `isRunning` durumunda spinner + disabled
- [ ] `POST /api/execute` isteği gönder; polling veya long-poll ile sonucu al
- [ ] Output paneli: stdout (normal), stderr (kırmızı), execution time ve memory göster
- [ ] Hata durumu: TLE mesajı, derleme hatası, runtime error ayrıştır ve göster
- [ ] Dil değiştirildiğinde editördeki starter snippet'i güncelle (örnek "Hello World")

**Backend + Worker**
- [ ] Job tamamlandığında `compile_jobs.job_status`'ü güncelle
- [ ] Timeout aşıldığında container'ı `docker kill` ile sonlandır, `TLE` statüsü döndür
- [ ] Execution sonucunu `code_executions` tablosuna yaz
- [ ] `/api/execute` endpoint'ini Swagger'da dokümante et

---

### 3 Mayıs — Faz 4: Quiz CRUD

**Hedef:** Quiz oluşturma ve listeleme akışı çalışır.

**Backend**
- [ ] `Quiz` entity ve migration (`owner_id`, `form_schema jsonb`, `anti_cheat_options jsonb`, `status`)
- [ ] `GET /api/quizzes` endpoint: sadece sahip olduğu quizleri döndür
- [ ] `POST /api/quizzes` endpoint + FluentValidation (başlık zorunlu, süre > 0)
- [ ] `GET/PUT/DELETE /api/quizzes/:id` endpoint (RequireQuizOwner policy)
- [ ] `POST /api/quizzes/:id/publish` endpoint: status'ü `Active`'e çek
- [ ] `GET /api/admin/quizzes` endpoint: tüm quizleri döndür (RequireAdmin)
- [ ] Swagger anotasyonları ekle

**Frontend**
- [ ] `/dashboard/quizzes/new` – çok adımlı quiz oluşturma formu:
  - Adım 1: Başlık, açıklama, süre, mod (Serbest / Gerçek Zamanlı)
  - Adım 2: Anti-cheat seçenekleri (checkbox listesi)
  - Adım 3: Katılımcı bilgi formu şema editörü (alan ekle: isim, tip, zorunlu mu)
- [ ] `/dashboard` quiz listesi: kart grid, durum badge (Taslak/Aktif/Bitti), aksiyonlar

---

### 4 Mayıs — Faz 4: Soru ve Test Case Yönetimi

**Hedef:** Tüm soru tipleri oluşturulabilir ve test case'ler eklenebilir.

**Backend**
- [ ] `Question` entity ve migration: `type`, `title`, `body`, `points`, `order_no`, `options jsonb`
- [ ] `TestCase` entity ve migration: `input`, `expected_output`, `is_visible`
- [ ] `GET/POST /api/quizzes/:id/questions` endpoint
- [ ] `PUT/DELETE /api/questions/:id` endpoint
- [ ] `POST /api/questions/:id/test-cases` endpoint
- [ ] Soru tipine göre `options` JSONB şema doğrulaması (FluentValidation)
- [ ] Soru sırasını güncelleme endpoint'i (`PATCH /api/questions/:id/order`)

**Frontend**
- [ ] `/dashboard/quizzes/:id/questions` – soru listesi + "Soru Ekle" butonu
- [ ] Soru tipi seçim modal'ı (5 kart: Coding, Multiple Choice, Output Prediction, Bug Fix, Short Answer)
- [ ] **Coding soru formu:** başlık, açıklama, starter kod editörü (Monaco), desteklenen diller, test case listesi (input/beklenen çıktı, görünür/gizli toggle)
- [ ] **Multiple Choice formu:** soru metni, seçenek listesi (ekle/sil/sırala), doğru cevap işaretleme, tek/çoklu seçim toggle
- [ ] **Output Prediction formu:** okunur kod bloğu, beklenen çıktı alanı
- [ ] **Bug Fix formu:** hatalı kod editörü, doğru çözüm alanı (gizli)
- [ ] **Short Answer formu:** soru metni, kabul edilen cevaplar listesi, eşleşme modu dropdown
- [ ] Soru sıralama: sürükle-bırak

**Altyapı**
- [ ] Nginx'e upload body limit ayarı ekle (CSV import için `client_max_body_size 10m`)

---

### 5 Mayıs — Faz 5: Quiz Katılım Sayfası

**Hedef:** Anonim kullanıcı `/q/:id` adresine gidip formu doldurabilir. SessionToken döner.

**Backend**
- [ ] `QuizSession` entity ve migration: `session_token uuid`, `user_id nullable`, `form_data jsonb`, `started_at`, `ends_at`, `is_active`, `is_locked`
- [ ] `GET /api/quizzes/:id/info` endpoint: başlık, süre, soru sayısı, form_schema, anti_cheat_options, status
- [ ] `POST /api/quizzes/:id/join` endpoint:
  - formData'yı form_schema'ya göre doğrula
  - UUID session_token üret
  - QuizSession oluştur ve kaydet
  - `{ sessionToken, sessionId, endsAt }` dön
- [ ] Session token middleware: `X-Session-Token` header'ını oku, session'ı doğrula, context'e ekle
- [ ] Rate limiting: quiz katılım için IP bazlı 5 istek/dk

**Frontend**
- [ ] `/q/:id` sayfası:
  - Quiz başlığı, süresi, soru sayısı, kurallar kartı
  - Anti-cheat uyarı listesi (hangi davranışların izlendiği)
  - `form_schema`'ya göre dinamik form render: `string` → text input, `number` → number input, `required` → validasyon
  - [Sınava Gir] butonu → POST join → sessionToken'ı localStorage'a kaydet → `/q/:id/take`'e yönlendir

---

### 6 Mayıs — Faz 5: Sınav Alma Ekranı

**Hedef:** Katılımcı fullscreen modda sorular arasında gezebilir ve kod editörünü kullanabilir.

**Frontend**
- [ ] `/q/:id/take` sayfası – localStorage'da sessionToken yoksa `/q/:id`'ye yönlendir
- [ ] Fullscreen API: sayfa yüklenince `requestFullscreen()` çağır; çıkış algılandığında anti-cheat event gönder
- [ ] Header: quiz adı, kalan süre sayacı (sunucu `endsAt` ile senkron), soru navigasyonu (1/2/3...)
- [ ] Soru paneli: soru tipi badge, başlık, gövde, visible test case'ler (Coding için)
- [ ] Kod paneli (Coding soruları için): Monaco editörü, dil seçimi, [Çalıştır] ve [Gönder] butonları
- [ ] Cevap paneli (diğer tipler için): tip bazlı input bileşenleri
- [ ] `examStore` (Zustand): `sessionToken`, `sessionId`, `endsAt`, `activeQuestionIndex`, `answers`
- [ ] Süre dolduğunda tüm submit aksiyonlarını devre dışı bırak, "Süre Doldu" ekranı göster
- [ ] Sınav sırasında browser navigation'ı engelle (`beforeunload` uyarısı)

**Backend**
- [ ] `POST /api/quizzes/:id/submit` endpoint (X-Session-Token ile):
  - Session aktif ve kilitli değil mi kontrol et
  - `endsAt` geçmemiş mi kontrol et
  - Submission oluştur; Coding soruları için execution job'ı enqueue et; diğer tipler için anında değerlendir
  - Mevcut submission varsa `version` artır

---

### 7 Mayıs — Faz 5: Test Case Değerlendirme ve Puanlama

**Hedef:** Kod gönderilince test case sonuçları görünür, puan hesaplanır.

**Backend**
- [ ] `SubmissionEvaluationService`: submission status'ünü execution sonucuna göre güncelle
- [ ] Test case karşılaştırma: stdout'u expected_output ile karşılaştır (trim/normalize)
- [ ] Hidden test case'leri de çalıştır; sonuçları DB'ye yaz ama frontend'e gösterme
- [ ] Visible test case sonuçlarını submission response'una dahil et
- [ ] `quiz_sessions`'a `total_score` alanı ekle; her submission'dan sonra güncelle
- [ ] `GET /api/sessions/:sessionId/status` endpoint: anlık puan, tamamlanan soru sayısı

**Frontend**
- [ ] Submit sonrası visible test case sonuçlarını alt panelde göster:
  - Her satır: test no, input (kısaltılmış), beklenen, gerçek çıktı, geçti/kaldı badge
- [ ] Submission loading spinner (execution tamamlanana kadar)
- [ ] Sınav özet ekranı: kaç soru gönderildi, sınav bitti butonu

**Altyapı**
- [ ] Node.js runner `Dockerfile` yaz: `node:20-alpine`, non-root user, çalışma dizini
- [ ] Node.js runner'ı test et; Python ile aynı limit konfigürasyonunu uygula

---

### 8 Mayıs — Faz 6: SignalR Hub Kurulumu

**Hedef:** MonitorHub çalışır; katılımcı bağlandığında gruba katılır.

**Backend**
- [ ] `MonitorHub` sınıfı: `OnConnectedAsync`, `OnDisconnectedAsync`
- [ ] JWT ile bağlanan kayıtlı kullanıcılar için auth doğrulama
- [ ] `?token=` query param ile bağlanan anonim session'lar için session token doğrulama
- [ ] Group yönetimi: katılımcı → `quiz:{quizId}` ve `session:{sessionId}` gruplarına katıl
- [ ] Quiz sahibi / Admin → `quiz:{quizId}` grubuna katıl
- [ ] `hub/monitor` endpoint'ini `Program.cs`'de kaydet
- [ ] Hub bağlantısı için JWT ve session token'ı aynı middleware'den geçir

**Frontend**
- [ ] `@microsoft/signalr` kurulumu
- [ ] `/q/:id/take` sayfasında: sınav başlayınca SignalR bağlantısını kur
- [ ] Her kod değişiminde (Monaco `onChange`) debounce (2sn) ile `session.codeChanged` event'i gönder
- [ ] Heartbeat: 10 saniyede bir `session.heartbeat` gönder
- [ ] Bağlantı kesilirse otomatik yeniden bağlan (`withAutomaticReconnect`)

---

### 9 Mayıs — Faz 6: Anti-Cheat Event Loglama

**Hedef:** Anti-cheat event'leri hem loglanır hem canlı monitorda görünür.

**Backend**
- [ ] `ExamEvent` entity ve migration: `session_id`, `event_type`, `severity`, `timestamp`, `metadata jsonb`
- [ ] `POST /api/quizzes/:id/event` endpoint (X-Session-Token ile): event'i kaydet, severity'e göre SignalR broadcast yap
- [ ] Severity sınıflandırması: TabSwitch → High, FullscreenExit → High, ClipboardAttempt → Medium, Keydown pattern → Low
- [ ] Rate limiting: event endpoint için 60 istek/dk (abuse koruması)

**Frontend**
- [ ] Tab switch detection: `document.addEventListener('visibilitychange', ...)`
- [ ] Fullscreen exit detection: `document.addEventListener('fullscreenchange', ...)`
- [ ] Clipboard girişimi: `document.addEventListener('paste', ...)` ve `copy` eventi
- [ ] Her event tespit edildiğinde `POST /api/quizzes/:id/event` çağır
- [ ] `examStore.antiCheatEvents` listesine ekle (client-side log)
- [ ] `/dashboard/quizzes/:id/monitor` – monitor ekranı iskelet: katılımcı grid bileşeni

---

### 10 Mayıs — Faz 6: Canlı Monitor Ekranı

**Hedef:** Quiz sahibi monitor ekranından katılımcıları canlı izleyebilir.

**Frontend**
- [ ] `/dashboard/quizzes/:id/monitor` sayfası: JWT ile SignalR'a bağlan
- [ ] Katılımcı grid'i: her kart → form verisi (ad/numara), aktif soru, son aktivite zamanı, event sayısı (renk kodlu: yeşil/sarı/kırmızı)
- [ ] Karta tıklayınca: katılımcının anlık kod snapshot'ını yan panelde göster (Monaco readonly mode)
- [ ] Gerçek zamanlı güncelleme: `session.codeChanged` event'ini dinle → ilgili katılımcı kartını güncelle
- [ ] `session.event` geldiğinde: kart üzerinde badge sayısını artır, High severity event için kırmızı uyarı göster
- [ ] [Uyarı Gönder] butonu: `monitor.warn` SignalR mesajı gönder → katılımcı ekranında uyarı pop-up'ı göster
- [ ] [Sınavdan Düşür] butonu: `monitor.terminate` gönder → backend session'ı kilitle → katılımcı ekranı "Sınavınız sonlandırıldı" mesajı göster

**Backend**
- [ ] `monitor.warn` handler: ilgili session grubuna mesaj ilet
- [ ] `monitor.terminate` handler: session'ı `is_locked = true` yap, gruba broadcast et
- [ ] `GET /api/quizzes/:id/sessions/active` endpoint: aktif session listesini döndür (monitor sayfası ilk yükünde)

---

### 11 Mayıs — Faz 7: Submission Replay

**Hedef:** Diff-based replay kaydı ve oynatma çalışır.

**Backend**
- [ ] `SubmissionReplay` entity ve migration: `submission_id`, `diffs jsonb` (`[{time_ms, diff}]`)
- [ ] `PATCH /api/submissions/:id/replay` endpoint (X-Session-Token ile): diff array'e yeni entry ekle
- [ ] Snapshot stratejisi: her 50 diff'te bir tam kod snapshot'ı kaydet (`{type: "snapshot", code: "..."}`)
- [ ] `GET /api/sessions/:sessionId/replay` endpoint (Owner/Admin): replay diff listesini döndür

**Frontend**
- [ ] Monaco `onChange` callback'ine diff capture ekle: önceki değer ile fark hesapla, timestamp ile birlikte `examStore`'a ekle
- [ ] Her 5 saniyede bir toplu olarak `PATCH /api/submissions/:id/replay` gönder (batch)
- [ ] `/dashboard/quizzes/:id/results/:sessionId/replay` replay ekranı:
  - Monaco editörü (readonly)
  - Alt timeline slider (0 → toplam süre)
  - Play/Pause/Hız (0.5x/1x/2x) kontrolleri
  - Diff animasyonu: her diff adımında editörü güncelle
  - Zaman çizelgesinde anti-cheat event'leri kırmızı/sarı nokta olarak göster

---

### 12 Mayıs — Faz 7+: Sonuçlar Ekranı ve Quiz Özet

**Hedef:** Quiz sahibi tüm sonuçları görebilir; replay linklerine ulaşabilir.

**Backend**
- [ ] `GET /api/quizzes/:id/results` endpoint: session listesi + her session için soru bazlı submission özeti
- [ ] Her session için: formData'dan katılımcı adı, toplam puan, tamamlanan soru sayısı, gönderim zamanı
- [ ] Soru bazlı başarı oranı aggregation query

**Frontend**
- [ ] `/dashboard/quizzes/:id/results` ekranı:
  - Özet bar: toplam katılımcı, ortalama puan, en yüksek/düşük puan
  - Katılımcı tablosu: form verisi (ad), puan, tamamlanan soru, süre, aksiyonlar (detay, replay)
  - Soru bazlı başarı oranı çubuk grafiği (basit SVG veya `recharts`)
  - Her satırda [Replay İzle] butonu → `/results/:sessionId/replay`
- [ ] `/dashboard/quizzes/:id/results/:sessionId` – tek katılımcı detayı:
  - Soru soru submission listesi (kod snippet, test case sonuçları, puan)
  - Anti-cheat event listesi (zaman + tip + severity)

---

### 13 Mayıs — Faz 8: Admin Paneli

**Hedef:** Admin tüm sistemi yönetebilir.

**Backend**
- [ ] `GET /api/admin/stats` endpoint: toplam kullanıcı, aktif quiz, günlük execution, son 24 saat hata sayısı
- [ ] `GET /api/admin/users` endpoint: arama + filtreleme (role, status) + pagination
- [ ] `PUT /api/admin/users/:id` endpoint: rol güncelleme, pasifleştirme
- [ ] `DELETE /api/admin/users/:id` endpoint (soft delete)
- [ ] `GET /api/admin/quizzes` endpoint: tüm quizler, sahibi ve katılımcı sayısı ile birlikte
- [ ] `GET /api/admin/sessions` endpoint: aktif/geçmiş tüm sessionlar
- [ ] `DELETE /api/admin/sessions/:id` endpoint: session'ı zorla kilitle
- [ ] `system_error_logs` tablosu + migration; API exception handler'ına log yazma ekle
- [ ] `audit_logs` tablosu + migration; kullanıcı yönetimi aksiyonlarını logla

**Frontend**
- [ ] `/admin` dashboard: 4 KPI kartı (users, quizzes, sessions, errors), son hata logları listesi
- [ ] `/admin/users`: arama input'u, rol filtresi, kullanıcı tablosu, inline rol değiştirme dropdown, pasifleştir/sil butonları
- [ ] `/admin/quizzes`: tüm quizler tablosu (sahip, durum, katılımcı sayısı), silme aksiyonu
- [ ] `/admin/sessions`: aktif/geçmiş sekmeleri, session tablosu, zorla sonlandır butonu
- [ ] `/admin/system`: kaynak servise göre filtreli hata log tablosu

**Altyapı**
- [ ] C++ runner `Dockerfile` yaz: `alpine + g++`, non-root user, `--timeout` ayarlı derleme + çalıştırma scripti
- [ ] C++ runner'ı test et

---

### 14 Mayıs — Responsive, Boş Durumlar ve Polish

**Hedef:** Tüm ekranlar mobil uyumlu, boş durumlar ve hata ekranları tamamdır.

**Frontend**
- [ ] Tüm sayfalarda Tailwind breakpoint'lerine göre mobil layout düzenlemeleri (sm, md, lg)
- [ ] Ana sayfa editörü: mobilde dikey layout (editör üstte, output altta)
- [ ] `/q/:id/take` sınav ekranı: mobilde soru + editör stack layout
- [ ] Dashboard ve admin sayfalarında responsive tablo → mobilde kart görünümü
- [ ] Boş durum bileşenleri: "Henüz quiz yok", "Katılımcı bekleniyor", "Log bulunamadı"
- [ ] Global error boundary bileşeni
- [ ] 404 sayfası (bilinmeyen rota)
- [ ] 403 sayfası (yetkisiz erişim, PrivateRoute redirect'i)
- [ ] Form validasyon hata mesajları (tüm formlarda tutarlı stil)
- [ ] Toast notification sistemi (başarı, hata, uyarı mesajları)
- [ ] Localization: tüm UI metinlerini `t('key')` ile sardığını doğrula; eksik key'leri `tr.json` ve `en.json`'a ekle

**Backend**
- [ ] Tüm endpoint'lerde eksik validasyon kontrolü yap
- [ ] Edge case'ler: süresi dolmuş sınava submit, var olmayan quiz, kilitli session

---

### 15 Mayıs — Uçtan Uca Akış Testleri

**Hedef:** 3 temel akış (anonim, user, admin) hatasız çalışır.

**Test Senaryoları**
- [ ] **Anonim akış:** Ana sayfada Python kodu yaz → çalıştır → çıktı al; `/q/:id`'ye git → formu doldur → sınava gir → coding sorusu çöz → test case geç → sınavı bitir
- [ ] **User akışı:** Kayıt ol → giriş yap → quiz oluştur (tüm soru tipleri) → yayınla → `/q/:id` linkini test et → monitor ekranını aç → sınav bitince sonuçları görüntüle → replay izle
- [ ] **Admin akışı:** Admin girişi → dashboard stat'larını gör → kullanıcı listesi → User'ı Admin'e yükselt → tüm quizleri gör → aktif session'ı sonlandır → sistem loglarını incele
- [ ] **Hata durumları:** Süresi dolmuş session'a submit, yetkisiz endpoint erişimi (403), var olmayan kaynak (404), TLE (Python sonsuz döngü)
- [ ] SignalR: Monitor açık durumdayken anonim kullanıcı sınava girince kartın göründüğünü doğrula
- [ ] Anti-cheat: Sınav sırasında sekme değiştir → event'in loglandığını ve monitorda göründüğünü doğrula

**Altyapı**
- [ ] `docker compose up --build` ile sıfırdan ayağa kalkışı test et
- [ ] Tüm container health check'lerinin yeşil olduğunu doğrula
- [ ] Rate limiting kurallarını test et (execute için 10/dk limitini aş → 429 dön)

---

### 16 Mayıs — Performans ve Güvenlik Düzeltmeleri

**Hedef:** Bilinen performans ve güvenlik açıkları kapatılır.

**Backend**
- [ ] Sık kullanılan sorgulara DB index'leri ekle: `quiz_sessions(quiz_id)`, `submissions(session_id)`, `exam_events(session_id, timestamp)`
- [ ] Büyük listeler için pagination ekle (quizler, kullanıcılar, sessionlar, loglar): `?page=1&pageSize=20`
- [ ] Input validation: tüm JSONB alanları şema doğrulamasından geçiyor mu kontrol et
- [ ] Output encoding: tüm user-input kökenli string'ler API response'unda encode ediliyor mu?
- [ ] JWT secret'ı güçlü bir değere güncelle; `.env.example`'da minimum uzunluk belirt
- [ ] AspNetCoreRateLimit konfigürasyonunu son kez gözden geçir (login, execute, submit, event endpoint'leri)

**Frontend**
- [ ] React Query cache sürelerini optimize et (staleTime, gcTime)
- [ ] Monaco editörü büyük dosyalarda yavaş mı? Model dispose'u kontrol et
- [ ] Console'da kalan hata ve uyarıları temizle

**Altyapı**
- [ ] Nginx'e güvenlik başlıkları ekle: `X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy`
- [ ] Docker image'larında gereksiz paket var mı? İmaj boyutlarını kontrol et
- [ ] PostgreSQL dump/restore prosedürünü test et

---

### 17 Mayıs — Seed Data ve Demo Ortamı

**Hedef:** Demo için hazır veriler ve kullanıcılar mevcut; sunum materyalleri tamamdır.

**Backend**
- [ ] Seed data migration'ı veya `DbSeeder` servisi yaz:
  - 1 Admin hesabı (`admin@codexam.dev` / güçlü şifre)
  - 2 User hesabı (`demo1@codexam.dev`, `demo2@codexam.dev`)
  - 3 örnek quiz (biri aktif, biri taslak, biri bitmiş)
  - Her quizde en az 3 farklı tipte soru
  - Bitmiş quizde örnek session'lar + submission'lar + replay diff'leri
- [ ] Seed'i `docker compose up` ile otomatik çalıştır (sadece DB boşsa)
- [ ] README'ye "Demo Hesapları" bölümü ekle

**Frontend**
- [ ] Demo akışında kullanılacak örnek Python, JavaScript ve C++ kod snippet'lerini hazırla
- [ ] Tüm ekranların ekran görüntüsünü al (README ve sunum için)

**Dokümantasyon**
- [ ] README: son hali – kurulum, çalıştırma, demo hesapları, mimari özeti
- [ ] Bireysel katkı beyanları: her ekip üyesinin commit/PR geçmişine dayanan katkı özeti
- [ ] `docs/api.md` veya Swagger export: API endpoint dokümantasyonu son hali

---

### 18 Mayıs — Teslim ve Sunum

**Hedef:** Canlı demo hatasız sunulur.

**Sabah (Son Kontroller)**
- [ ] `git status` temiz; develop → main merge PR açılıp merge edilir
- [ ] `docker compose up --build` sıfırdan çalışıyor mu? Son kez doğrula
- [ ] Seed data yüklendi mi? Tüm demo hesapları giriş yapabiliyor mu?
- [ ] 3 temel akış hızlıca test et (anonim editör, user quiz oluştur, admin panel)
- [ ] SignalR bağlantısı kararlı mı? Monitor ekranı açık iken sınava giriş yapılırken kart belirginiyor mu?

**Sunum**
- [ ] **Demo 1 – Anonim Kod Editörü:** Ana sayfada Python kodu yaz, çalıştır, çıktı ve execution süresi göster; dil değiştir (JS, C++); tema toggle ve dil değiştiriciyi göster
- [ ] **Demo 2 – Quiz Oluşturma ve Yönetim:** User hesabıyla giriş → dashboard → quiz oluştur (anti-cheat seçenekleri ve form şemasıyla) → soru ekle (coding + multiple choice) → yayınla → linki kopyala
- [ ] **Demo 3 – Anonim Sınav Katılımı:** Yeni sekmede kopyalanan linke git → formu doldur → sınava gir (fullscreen) → coding sorusu çöz → test case geç; aynı anda monitor sekmesinde canlı güncelleme görün
- [ ] **Demo 4 – Anti-Cheat ve Replay:** Sınav sırasında sekme değiştir → monitorda event badge'i; sınav bitince results → replay → timeline'da diff animasyonu göster
- [ ] **Demo 5 – Admin Panel:** Admin hesabıyla giriş → tüm kullanıcılar, quizler, sessionlar → sistem logları

---

*Bu belge yaşayan bir dokümandır. Her faz sonunda tamamlanan maddeler işaretlenir, değişen kararlar güncellenir.*
