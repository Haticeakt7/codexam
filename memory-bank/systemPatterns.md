# CodExam – System Patterns

## Mimari Genel Bakış

```
Browser (React)
      │
      │  REST / SignalR
      ▼
ASP.NET Core API   ←──── JWT Auth ────
      │
      ├──── PostgreSQL (EF Core)
      ├──── Redis (cache / rate limit)
      ├──── SignalR Hub (realtime)
      │
      └──── Hangfire (enqueue jobs) ──→ Worker Service
                                              │
                                         Docker Engine
                                              │
                                    ┌─────────────────┐
                                    │ Runner Container │
                                    │ (python/node/cpp)│
                                    └─────────────────┘
```

## Backend Katman Yapısı (Clean Architecture Lite)

```
api/
├── Controllers/        # HTTP endpoints, input/output mapping
├── Application/        # Use cases, DTOs, validators
├── Domain/             # Entities, value objects, domain logic
├── Infrastructure/     # EF Core, Repositories, Docker SDK, Hangfire
└── Hubs/               # SignalR hubs
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
- Katılımcıya UUID session token verilir (tarayıcıda saklanır)

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

---

## Temel Domain Varlıkları

### User
- Id (uuid), Email, PasswordHash, Role (`Admin` | `User`)
- DisplayName, CreatedAt, UpdatedAt, DeletedAt (nullable)

### Quiz
- Id, Title, Description, **OwnerId** (User.Id – quiz sahibi)
- StartTime (nullable), DurationMinutes
- Mode (RealTime | FreeStyle)
- AntiCheatOptions (JSONB): { tabSwitch, fullscreen, clipboard }
- FormSchema (JSONB) – katılım formu şeması (owner tanımlar)
- Status (Draft | Active | Ended)
- AccessCode (nullable – şifreli quiz için)

### Question (ayrımcı tablo)
- Id, QuizId, Type (Coding | MultipleChoice | OutputPrediction | BugFix | ShortAnswer)
- Order, Points
- Type-spesifik alanlar veya JSONB

### TestCase
- Id, QuestionId, Input, ExpectedOutput
- IsVisible (görünür/gizli)

### Submission
- Id, UserId, QuestionId, QuizSessionId (nullable)
- Language, Code
- Status (Pending | Running | Passed | Failed | Error | TLE)
- ExecutionTime (ms), MemoryUsed (KB)
- SubmittedAt, Version (submission count)

### QuizSession
- Id, **UserId (nullable)** – kayıtlı kullanıcı girdiyse dolu, anonim ise null
- QuizId
- **FormData (JSONB)** – katılımcının doldurduğu form (kimlik bilgisi)
- **SessionToken (uuid)** – tarayıcıda saklanan anonim oturum tokeni
- StartedAt, EndsAt, FinishedAt (nullable)
- IsActive, IsLocked (admin terminate ettiğinde)

### ExamEvent
- Id, UserId, QuizId, SessionId
- EventType (TabSwitch | FullscreenExit | ClipboardAttempt | Keydown)
- Severity (Low | Medium | High)
- Timestamp, Metadata (JSONB)

### SubmissionReplay
- Id, SubmissionId
- Diffs: [{time: ms, diff: string}] (JSONB array)

## API Endpointleri (Planlanan)

### Auth
- POST /api/auth/register
- POST /api/auth/login → JWT + Refresh token
- POST /api/auth/refresh
- GET  /api/auth/me

### Code Execution (Public – no auth)
- POST /api/execute → { language, code } → { output, time, memory }

### Quizzes (User – kendi quizleri)
- GET/POST /api/quizzes
- GET/PUT/DELETE /api/quizzes/:id  (owner veya Admin)
- GET/POST /api/quizzes/:id/questions
- GET /api/quizzes/:id/sessions   (owner veya Admin)
- GET /api/quizzes/:id/results    (owner veya Admin)

### Quiz Katılımı (Public – no auth required)
- GET  /api/quizzes/:id/info → title, formSchema, status (katılım sayfası için)
- POST /api/quizzes/:id/join → formData → { sessionToken, sessionId, startsAt, endsAt }
- POST /api/quizzes/:id/submit → header: X-Session-Token → submission
- POST /api/quizzes/:id/event  → header: X-Session-Token → anti-cheat event

### Admin (sistem yönetimi)
- GET/PUT/DELETE /api/admin/users
- GET /api/admin/quizzes (tümü)
- DELETE /api/admin/quizzes/:id
- GET /api/admin/sessions (tümü)
- DELETE /api/admin/sessions/:id
- GET /api/admin/stats

### Monitor (Owner veya Admin – SignalR)
- Hub: /hubs/monitor
- Groups: `quiz:{id}`, `session:{sessionId}`

## Güvenlik Desenleri

1. **JWT**: HS256, 15dk access token, 7gün refresh token (kayıtlı kullanıcılar için)
2. **Session Token**: UUID v4 (anonim katılımcılar için, localStorage'da saklı, header ile gönderilir)
3. **Rate limiting**: Redis sliding window – login (5/dk), execute (10/dk), submit (30/dk)
4. **Authorization**:
   - Policy `RequireAdmin` → sadece `Role == Admin`
   - Policy `RequireUser` → `Role == User` veya `Admin`
   - Policy `RequireQuizOwner` → `quiz.OwnerId == currentUser.Id` veya `Admin`
   - Public endpoints: header `X-Session-Token` ile session doğrulama
5. **Execution isolation**: Docker `--network none --read-only --cpus --memory`

## Frontend State Yönetimi

```
Zustand stores:
├── authStore       → user, token, role (Admin|User), login/logout actions
├── editorStore     → language, code, output, theme (ana sayfa)
├── examStore       → sessionToken, activeSession, timeRemaining, antiCheatEvents
├── themeStore      → uiTheme, monacoTheme, setTheme actions
└── i18nStore       → locale (en|tr|...), setLocale (i18next ile sync)
```

React Query: Tüm server state (quizler, sorular, submission'lar, analitik)

## SignalR Akışı (Sınav İzleme)

```
Participant joins exam (anonim)
  → Client connects to /hubs/monitor?token={sessionToken}
  → Hub doğrular: SessionToken geçerli mi?
  → Joins group `quiz:{id}` ve `session:{sessionId}`
  → Her kod değişiminde event gönderir (throttled, 2s)

Quiz owner / Admin opens monitor
  → JWT ile /hubs/monitor bağlanır
  → Subscribes to `quiz:{id}`
  → Receives: session.codeChanged, session.heartbeat, session.event
  → Can send: monitor.warn, monitor.terminate
```
