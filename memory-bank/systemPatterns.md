# CodExam – System Patterns

## Mimari Genel Bakış

```
Browser (React)
      │
      │  REST / SignalR
      ▼
ASP.NET Core API   ←──── JWT Auth ────
      │
      ├──── PostgreSQL (EF Core, EnsureCreatedAsync)
      ├──── Redis (Hangfire backend + rate limit)
      ├──── SignalR Hub (realtime izleme)
      │
      └──── Hangfire (enqueue jobs) ──→ Worker Service
                                              │
                                         Docker Engine
                                              │
                                    ┌─────────────────┐
                                    │ Runner Container │
                                    │ (python/js/cpp)  │
                                    └─────────────────┘
```

## Backend Katman Yapısı (Clean Architecture Lite)

```
api/
├── CodExam.Api/           # HTTP endpoints, Controllers, Middleware
├── CodExam.Application/   # Use cases, DTOs, service interfaces
├── CodExam.Domain/        # Entities, enums, domain logic
└── CodExam.Infrastructure/ # EF Core, Services, Docker SDK, Hangfire
```

## Yetkilendirme Modeli

### Sistem Düzeyinde Roller (2 rol)

| Rol | Açıklama |
|-----|----------|
| `Admin` | Kök/süper yönetici. Tüm kullanıcılar, quizler, sessionlar, sistemin tamamını yönetir. |
| `User` | Kayıtlı kullanıcı. Quiz oluşturabilir. Oluşturduğu quizin sahibidir. |

### Kaynak Düzeyinde Yetki (Quiz Ownership)

- `User` bir quiz oluşturduğunda → o quizin `OwnerId`'si olur
- Quiz sahibi: kendi quizini tam yönetir (sorular, ayarlar, monitor, sonuçlar)
- Başka kullanıcıların quizlerine erişemez (Admin hariç)
- `Admin`: sistemdeki tüm quizlere erişir

### Quiz Katılımı (Anonim)

- Quiz'e katılım için **kayıt/giriş gerekmez**
- Quiz sahibinin belirlediği form doldurulur (dynamic form)
- Form verisi katılımcının kimliğidir (QuizSession.FormData)
- Katılımcıya UUID session token verilir (tarayıcıda saklanır, X-Session-Token header ile gönderilir)

### Yetki Matrisi

| İşlem | Admin | User (kendi quizi) | User (başkasının quizi) | Anonim |
|-------|-------|-------------------|------------------------|--------|
| Quiz oluştur | ✓ | ✓ | ✗ | ✗ |
| Quiz düzenle/sil | ✓ | ✓ | ✗ | ✗ |
| Quiz monitor | ✓ | ✓ | ✗ | ✗ |
| Quiz sonuçları | ✓ | ✓ | ✗ | ✗ |
| Quiz'e katıl | ✓ | ✓ | ✓ | ✓ |
| Kullanıcı yönetimi | ✓ | ✗ | ✗ | ✗ |
| Tüm sessionlar | ✓ | ✗ | ✗ | ✗ |
| Tercihler (GET/PUT) | ✓ | ✓ | ✓ | ✗ |

---

## Temel Domain Varlıkları

### User
- Id (uuid), Email, PasswordHash, DisplayName, Role (`Admin` | `User`)
- Status (active/inactive), RefreshToken, RefreshTokenExpiresAt
- CreatedAt, UpdatedAt, DeletedAt (nullable — soft delete)
- **PreferencesJson** (nullable string — serialize edilmiş editor tercihleri)

### Quiz
- Id, Title, Description, **OwnerId** (User.Id)
- DurationMinutes, Mode (RealTime | FreeStyle)
- AntiCheatOptions (JSONB): { tabSwitch, fullscreen, clipboard }
- FormSchema (JSONB) – katılım formu şeması
- Status: **Draft(0) | Active(1) | Ended(2) | Published(3) | Archived(4)**
- AccessCode (nullable)
- **ParticipationToken** (Guid, unique index, gen_random_uuid() default, asla değişmez)
- **StartsAt** (nullable timestamptz UTC)
- **EndsAt** (nullable timestamptz UTC — FreeStyle için zorunlu, RealTime için StartsAt+Duration ile hesaplanır)

### Quiz Durum Makinesi

```
Draft
  │  Publish (validasyon: ≥1 soru, StartsAt gelecekte veya null, FreeStyle→EndsAt zorunlu)
  ├──→ Published  (StartsAt ileriki bir tarihse — zamanlanmış)
  └──→ Active     (StartsAt null ise — hemen aktif)

Published/Active
  └──→ Ended      (süre dolunca otomatik)
       └──→ Archived (manuel arşivleme)
```

### Quiz Alan Kilitleme

Aşağıdaki durumlardan biri olduğunda Mode, DurationMinutes, FormSchema, StartsAt, EndsAt **immutable** (değiştirilemez):
- `status == Active || status == Ended`
- Herhangi bir katılımcı kaydı var (`participantCount > 0`)

### Question (ayrımcı alan)
- Id, QuizId, Type (Coding | MultipleChoice | OutputPrediction | BugFix | ShortAnswer)
- Order, Points
- Type'a özgü JSON alanlar

### TestCase
- Id, QuestionId, Input, ExpectedOutput, IsVisible

### Submission
- Id, UserId (nullable), QuestionId, QuizSessionId (nullable)
- Language, Code
- Status (Pending | Running | Passed | Failed | Error | TLE)
- ExecutionTimeMs, MemoryKb, SubmittedAt, Version

### QuizSession
- Id, **UserId (nullable)** — anonim katılım için null
- QuizId
- **FormData (JSONB)** — katılımcı kimlik formu
- **SessionToken (uuid)** — anonim oturum tokeni (X-Session-Token)
- StartedAt, EndsAt, FinishedAt (nullable), IsActive, IsLocked

### ExamEvent
- Id, UserId, QuizId, SessionId
- EventType (TabSwitch | FullscreenExit | ClipboardAttempt | Keydown)
- Severity (Low | Medium | High), Timestamp, Metadata (JSONB)

### SubmissionReplay
- Id, SubmissionId
- Diffs: [{time: ms, diff: string}] (JSONB array)

### UserPreferencesDto (transfer objesi)
- EditorTheme (string, default "vs-dark")
- FontSize (int, 8–32, default 14)
- LayoutJson (string, default "{}")

---

## API Endpointleri (Gerçekleşen)

### Auth
- POST /api/auth/register
- POST /api/auth/login → JWT + Refresh token
- POST /api/auth/refresh
- GET  /api/auth/me

### Code Execution (Public)
- POST /api/execute → { language, code, stdin? } → jobId → polling
- GET  /api/execute/:jobId → { stdout, stderr, status, timeMs, memKb }
- **GET  /api/execute/languages → SupportedLanguage[] (appsettings'ten)**

### Quizzes (User — kendi quizleri)
- GET  /api/quizzes → kullanıcının quizleri
- POST /api/quizzes → yeni quiz oluştur (ParticipationToken otomatik atanır)
- GET  /api/quizzes/:id → quiz detayı (owner endpoint — participationToken dahil)
- PUT  /api/quizzes/:id → quiz güncelle (locking logic geçerli)
- DELETE /api/quizzes/:id → quiz sil
- POST /api/quizzes/:id/publish → Draft→Published veya Active (validasyon ile)

### Quiz Katılımı (Public — auth gerekmez)
- GET  /api/quizzes/:id/info → title, formSchema, status, mode, startsAt, endsAt
- **GET  /api/quizzes/join/{token} → Quiz by ParticipationToken (YENİ)**
- POST /api/quizzes/:id/join → formData → { sessionToken, sessionId, startsAt, endsAt, questions }
- POST /api/quizzes/:id/submit → X-Session-Token → submission
- POST /api/quizzes/:id/event → X-Session-Token → anti-cheat event

### Sorular (Owner veya Admin)
- GET  /api/quizzes/:id/questions
- POST /api/quizzes/:id/questions
- GET/PUT/DELETE /api/questions/:id
- GET/POST/DELETE /api/questions/:id/test-cases/:tcId

### Sessionlar
- GET  /api/quizzes/:id/sessions
- GET  /api/sessions/:id/replay

### Sonuçlar
- GET  /api/quizzes/:id/results

### Kullanıcı Tercihleri (Auth gerekli — YENİ)
- GET  /api/users/me/preferences
- PUT  /api/users/me/preferences

### Admin (sistem yönetimi)
- GET/PUT/DELETE /api/admin/users/:id
- GET /api/admin/quizzes, DELETE /api/admin/quizzes/:id
- GET /api/admin/sessions, DELETE /api/admin/sessions/:id
- GET /api/admin/stats
- GET /api/admin/logs

---

## Frontend State Yönetimi (Zustand Stores)

```
Zustand stores:
├── authStore        → user, accessToken, isAuthenticated, login/logout
├── editorStore      → language (string), code, stdin, output, isRunning, FALLBACK_STARTERS
├── examStore        → sessionToken, sessionId, questions, answers, antiCheatEvents, isLocked, endsAt
├── themeStore       → uiTheme (light|dark), localStorage persist
├── i18nStore        → locale (en|tr), localStorage persist
├── toastStore       → toast queue, push(type, msg), toast.{success,error,warning,info} helper
└── preferencesStore → editorTheme (EditorThemeId), fontSize (8-32), layout (leftWidth%, rightTopHeight%), 
                       localStorage persist, debounced server sync, loadFromServer(), saveToServer()
```

React Query: Tüm server state (quizler, sorular, submission'lar, sonuçlar, replay)

## Resizable Panel Pattern (QuizTake + Home)

```
useVerticalResize(containerRef, initialPct, onChangeEnd):
  → document.addEventListener('mousemove') while dragging
  → containerRef.current.getBoundingClientRect() for % calculation
  → cleanup on mouseup

useHorizontalResize(panelRef, initialPct, onChangeEnd):
  → same pattern, vertical axis
  → saves to preferencesStore.setLayout() with 2000ms debounce
```

## Dil/Tema Devamlılığı Deseni

```
Anonim kullanıcı:
  localStorage (preferencesStore persist) → anında güncelleme, sayfa yenileme sonrası da korunur

Auth kullanıcı:
  localStorage (hızlı) + debounced PUT /api/users/me/preferences (güvenilir)
  
Login sonrası:
  usePreferencesSync() → loadFromServer() → server kazanır → localStorage güncellenir
```

## SignalR Akışı (Sınav İzleme)

```
Katılımcı sınava girer:
  → X-Session-Token header ile hub'a bağlanır
  → MonitorHub: SessionToken doğrular
  → quiz:{id} ve session:{sessionId} gruplarına katılır
  → Kod değişiminde event gönderir (throttled)
  → heartbeat gönderir (30s)

Quiz sahibi / Admin monitor açar:
  → JWT ile /hubs/monitor bağlanır
  → quiz:{id} grubunu dinler
  → session.codeChanged, session.heartbeat, session.event alır
  → monitor.warn, monitor.terminate gönderebilir
```

## Güvenlik Desenleri

1. **JWT**: HS256, 15dk access token, 7gün refresh token (kayıtlı kullanıcılar)
2. **Session Token**: UUID v4 (anonim katılımcılar, localStorage, header ile gönderilir)
3. **Rate limiting**: Redis sliding window — login (5/dk), execute (10/dk), submit (30/dk)
4. **Execution isolation**: Docker `--network none --read-only --cpus=0.5 --memory=256m --pids-limit=64 --user=1000`
5. **ParticipationToken**: Cryptographically unique Guid, never reused, never exposed in predictable way
