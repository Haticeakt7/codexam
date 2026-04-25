# CodExam – Veritabanı Dokümanı

> PostgreSQL 16 · EF Core 8 · Redis 7 · JSONB · UUID primary keys

---

## İçindekiler

1. [Genel Bakış](#1-genel-bakış)
2. [Tam Tablo Şeması](#2-tam-tablo-şeması)
3. [JSONB Alan Şemaları](#3-jsonb-alan-şemaları)
4. [İlişki Diyagramı](#4-ilişki-diyagramı)
5. [Index Stratejisi](#5-index-stratejisi)
6. [EF Core Konfigürasyonu](#6-ef-core-konfigürasyonu)
7. [Migration Stratejisi](#7-migration-stratejisi)
8. [Redis Kullanım Desenleri](#8-redis-kullanım-desenleri)
9. [Seed Data](#9-seed-data)
10. [Backup ve Restore](#10-backup-ve-restore)

---

## 1. Genel Bakış

### Veritabanı Servisleri

| Servis | Sürüm | Bağlantı Noktası | Kullanım |
|--------|-------|-----------------|---------|
| PostgreSQL | 16 | 5432 | Tüm kalıcı veriler |
| Redis | 7 | 6379 | Hangfire job kuyruğu · session cache · rate limit sayaçları |

### Tasarım Prensipleri

- Her tabloda `uuid` primary key (güvenli, sıra bağımsız)
- Soft delete: `users` tablosunda `deleted_at` nullable
- `jsonb` alanlar dinamik ve schema-esnek yapılar için (form_schema, options, diffs)
- Saat dilimleri: tüm `timestamp` alanlar `timestamptz` (UTC)
- Adlandırma: snake_case tablo ve kolon isimleri

---

## 2. Tam Tablo Şeması

### 2.1 `users`

```sql
CREATE TABLE users (
    id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    email           varchar(254) NOT NULL UNIQUE,
    password_hash   varchar(72)  NOT NULL,
    display_name    varchar(100) NOT NULL,
    role            varchar(10)  NOT NULL CHECK (role IN ('Admin', 'User')),
    status          varchar(10)  NOT NULL DEFAULT 'active'
                                 CHECK (status IN ('active', 'inactive')),
    refresh_token           varchar(512),
    refresh_token_expires_at timestamptz,
    created_at      timestamptz  NOT NULL DEFAULT now(),
    updated_at      timestamptz  NOT NULL DEFAULT now(),
    deleted_at      timestamptz                              -- soft delete
);
```

### 2.2 `quizzes`

```sql
CREATE TABLE quizzes (
    id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id            uuid         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title               varchar(200) NOT NULL,
    description         text,
    duration_minutes    int          NOT NULL CHECK (duration_minutes > 0),
    mode                varchar(20)  NOT NULL DEFAULT 'RealTime'
                                     CHECK (mode IN ('RealTime', 'FreeStyle')),
    anti_cheat_options  jsonb        NOT NULL DEFAULT '{}',
    form_schema         jsonb        NOT NULL DEFAULT '[]',
    access_code         varchar(50),
    status              varchar(10)  NOT NULL DEFAULT 'Draft'
                                     CHECK (status IN ('Draft', 'Active', 'Ended')),
    created_at          timestamptz  NOT NULL DEFAULT now(),
    updated_at          timestamptz  NOT NULL DEFAULT now(),
    published_at        timestamptz
);
```

### 2.3 `questions`

```sql
CREATE TABLE questions (
    id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id     uuid         NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    type        varchar(30)  NOT NULL
                             CHECK (type IN (
                                 'Coding', 'MultipleChoice', 'OutputPrediction',
                                 'BugFix', 'ShortAnswer'
                             )),
    title       varchar(300) NOT NULL,
    body        text         NOT NULL,
    points      int          NOT NULL DEFAULT 10 CHECK (points >= 0),
    order_no    int          NOT NULL DEFAULT 0,
    options     jsonb        NOT NULL DEFAULT '{}',
    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now()
);
```

### 2.4 `test_cases`

```sql
CREATE TABLE test_cases (
    id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id     uuid    NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    input           text    NOT NULL DEFAULT '',
    expected_output text    NOT NULL,
    is_visible      bool    NOT NULL DEFAULT true,
    order_no        int     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now()
);
```

### 2.5 `quiz_sessions`

```sql
CREATE TABLE quiz_sessions (
    id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id         uuid    NOT NULL REFERENCES quizzes(id),
    user_id         uuid    REFERENCES users(id),          -- null = anonim katılımcı
    session_token   uuid    NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    form_data       jsonb   NOT NULL,                      -- katılımcının formu
    started_at      timestamptz NOT NULL DEFAULT now(),
    ends_at         timestamptz NOT NULL,
    finished_at     timestamptz,
    is_active       bool    NOT NULL DEFAULT true,
    is_locked       bool    NOT NULL DEFAULT false,
    total_score     int     NOT NULL DEFAULT 0
);
```

### 2.6 `submissions`

```sql
CREATE TABLE submissions (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          uuid        NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_id         uuid        NOT NULL REFERENCES questions(id),
    language            varchar(20) NOT NULL,
    code                text        NOT NULL,
    status              varchar(10) NOT NULL DEFAULT 'Pending'
                                    CHECK (status IN (
                                        'Pending', 'Running', 'Passed',
                                        'Failed', 'Error', 'TLE'
                                    )),
    execution_time_ms   int,
    memory_used_kb      int,
    score               int         NOT NULL DEFAULT 0,
    submitted_at        timestamptz NOT NULL DEFAULT now(),
    version             int         NOT NULL DEFAULT 1
);
```

### 2.7 `submission_replays`

```sql
CREATE TABLE submission_replays (
    id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id   uuid    NOT NULL UNIQUE REFERENCES submissions(id) ON DELETE CASCADE,
    diffs           jsonb   NOT NULL DEFAULT '[]'
    -- [{time_ms: 1200, type: "delta", diff: "..."}, {time_ms: 5000, type: "snapshot", code: "..."}]
);
```

### 2.8 `exam_events`

```sql
CREATE TABLE exam_events (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  uuid        NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    quiz_id     uuid        NOT NULL,
    event_type  varchar(30) NOT NULL
                            CHECK (event_type IN (
                                'TabSwitch', 'FullscreenExit',
                                'ClipboardAttempt', 'Keydown'
                            )),
    severity    varchar(10) NOT NULL
                            CHECK (severity IN ('Low', 'Medium', 'High')),
    timestamp   timestamptz NOT NULL,
    metadata    jsonb       DEFAULT '{}'
);
```

### 2.9 `code_executions`

```sql
CREATE TABLE code_executions (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    language            varchar(20) NOT NULL,
    source_code         text        NOT NULL,
    stdin_text          text        DEFAULT '',
    stdout_text         text,
    stderr_text         text,
    execution_time_ms   int,
    memory_used_kb      int,
    status              varchar(10) NOT NULL DEFAULT 'Pending'
                                    CHECK (status IN (
                                        'Pending', 'Running', 'Passed',
                                        'Failed', 'Error', 'TLE'
                                    )),
    created_at          timestamptz NOT NULL DEFAULT now()
);
```

### 2.10 `compile_jobs`

```sql
CREATE TABLE compile_jobs (
    id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id            uuid        NOT NULL REFERENCES code_executions(id),
    runner_container_id     varchar(64),
    job_status              varchar(20) NOT NULL DEFAULT 'Queued',
    queued_at               timestamptz NOT NULL DEFAULT now(),
    started_at              timestamptz,
    finished_at             timestamptz
);
```

### 2.11 `audit_logs`

```sql
CREATE TABLE audit_logs (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id   uuid        REFERENCES users(id),     -- null = sistem
    action_type     varchar(50) NOT NULL,
    -- 'UserCreated', 'UserRoleChanged', 'QuizDeleted', 'SessionTerminated', vb.
    entity_type     varchar(50) NOT NULL,
    entity_id       uuid,
    details         jsonb       DEFAULT '{}',
    created_at      timestamptz NOT NULL DEFAULT now()
);
```

### 2.12 `system_error_logs`

```sql
CREATE TABLE system_error_logs (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    source_service  varchar(20) NOT NULL
                                CHECK (source_service IN ('API', 'Worker', 'Nginx')),
    error_title     varchar(200) NOT NULL,
    error_message   text        NOT NULL,
    stack_trace     text,
    created_at      timestamptz NOT NULL DEFAULT now()
);
```

### 2.13 `quiz_import_batches` *(opsiyonel – faz sonrası)*

```sql
CREATE TABLE quiz_import_batches (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        uuid        NOT NULL REFERENCES users(id),
    file_name       varchar(255) NOT NULL,
    import_type     varchar(10) NOT NULL CHECK (import_type IN ('CSV', 'JSON')),
    status          varchar(20) NOT NULL DEFAULT 'Processing',
    total_count     int         NOT NULL DEFAULT 0,
    error_count     int         NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE quiz_import_errors (
    id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id        uuid    NOT NULL REFERENCES quiz_import_batches(id) ON DELETE CASCADE,
    row_no          int     NOT NULL,
    error_message   text    NOT NULL
);
```

---

## 3. JSONB Alan Şemaları

### 3.1 `quizzes.anti_cheat_options`

```json
{
  "tabSwitch": true,
  "fullscreen": true,
  "clipboard": true
}
```

### 3.2 `quizzes.form_schema`

```json
[
  { "key": "name",       "label": "Ad Soyad",      "type": "text",   "required": true  },
  { "key": "studentId",  "label": "Öğrenci Numarası", "type": "text", "required": true  },
  { "key": "classCode",  "label": "Sınıf Kodu",    "type": "text",   "required": false }
]
```

`type` değerleri: `"text"` | `"number"` | `"email"`

### 3.3 `questions.options` – Coding

```json
{
  "starterCode": "def solution(n):\n    pass",
  "supportedLanguages": ["python", "javascript", "cpp"]
}
```

### 3.4 `questions.options` – MultipleChoice

```json
{
  "choices": ["İstanbul", "Ankara", "İzmir", "Bursa"],
  "correctIndices": [1],
  "multiSelect": false
}
```

### 3.5 `questions.options` – OutputPrediction

```json
{
  "codeBlock": "x = [1, 2, 3]\nprint(x[1])"
}
```

### 3.6 `questions.options` – BugFix

```json
{
  "buggyCode": "def add(a, b):\n    return a - b",
  "solution": "def add(a, b):\n    return a + b",
  "hint": "Operatörü kontrol edin."
}
```

### 3.7 `questions.options` – ShortAnswer

```json
{
  "acceptedAnswers": ["İstanbul", "istanbul", "ISTANBUL"],
  "matchMode": "exact"
}
```

`matchMode` değerleri: `"exact"` | `"contains"` | `"regex"`

### 3.8 `quiz_sessions.form_data`

```json
{
  "name": "Ahmet Yılmaz",
  "studentId": "20230042",
  "classCode": "CS101"
}
```

### 3.9 `submission_replays.diffs`

```json
[
  { "time_ms": 0,    "type": "snapshot", "code": "def solution(n):\n    pass" },
  { "time_ms": 1500, "type": "delta",    "diff": "@@ -1,2 +1,3 @@\n def solution(n):\n-    pass\n+    result = 0\n+    pass" },
  { "time_ms": 3200, "type": "delta",    "diff": "@@ -1,3 +1,4 @@\n def solution(n):\n     result = 0\n+    for i in range(n):\n     pass" },
  { "time_ms": 5000, "type": "snapshot", "code": "def solution(n):\n    result = 0\n    for i in range(n):\n        result += i\n    return result" }
]
```

- `snapshot`: Tam kod metni; seek noktası olarak kullanılır
- `delta`: Unified diff formatı (Myers algorithm)
- Her 50 delta'da bir `snapshot` eklenir

### 3.10 `exam_events.metadata`

```json
// TabSwitch
{ "fromTitle": "CodExam", "toTitle": "Google" }

// ClipboardAttempt
{ "clipboardType": "paste", "targetElement": "editor" }

// Keydown pattern
{ "keySequence": "Ctrl+C", "count": 3, "intervalMs": 500 }
```

---

## 4. İlişki Diyagramı

```
users
  ├── quizzes (owner_id FK)
  │     ├── questions (quiz_id FK)
  │     │     └── test_cases (question_id FK)
  │     └── quiz_sessions (quiz_id FK)
  │           ├── submissions (session_id FK)
  │           │     └── submission_replays (submission_id FK)
  │           └── exam_events (session_id FK)
  └── quiz_sessions (user_id FK, nullable)

code_executions
  └── compile_jobs (execution_id FK)

audit_logs (actor_user_id FK, nullable)
system_error_logs
quiz_import_batches (owner_id FK)
  └── quiz_import_errors (batch_id FK)
```

### Kardinalite Özeti

| İlişki | Tür |
|--------|-----|
| User → Quiz | 1:N |
| Quiz → Question | 1:N |
| Question → TestCase | 1:N |
| Quiz → QuizSession | 1:N |
| User → QuizSession | 0..1:N (anonim = null) |
| QuizSession → Submission | 1:N |
| Submission → SubmissionReplay | 1:0..1 |
| QuizSession → ExamEvent | 1:N |
| CodeExecution → CompileJob | 1:1 |

---

## 5. Index Stratejisi

### Zorunlu Index'ler

```sql
-- Kullanıcı sorgular
CREATE INDEX idx_users_email         ON users(email);
CREATE INDEX idx_users_deleted_at    ON users(deleted_at) WHERE deleted_at IS NULL;

-- Quiz sorgular
CREATE INDEX idx_quizzes_owner_id    ON quizzes(owner_id);
CREATE INDEX idx_quizzes_status      ON quizzes(status);

-- Session sorgular
CREATE INDEX idx_sessions_quiz_id    ON quiz_sessions(quiz_id);
CREATE INDEX idx_sessions_token      ON quiz_sessions(session_token);   -- unique zaten
CREATE INDEX idx_sessions_is_active  ON quiz_sessions(is_active) WHERE is_active = true;

-- Submission sorgular
CREATE INDEX idx_submissions_session_id  ON submissions(session_id);
CREATE INDEX idx_submissions_question_id ON submissions(question_id);

-- Event log sorgular
CREATE INDEX idx_events_session_id       ON exam_events(session_id);
CREATE INDEX idx_events_session_ts       ON exam_events(session_id, timestamp DESC);

-- Execution sorgular
CREATE INDEX idx_executions_status   ON code_executions(status);
CREATE INDEX idx_compile_jobs_exec   ON compile_jobs(execution_id);

-- Log sorgular
CREATE INDEX idx_error_logs_created  ON system_error_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity   ON audit_logs(entity_type, entity_id);
```

### JSONB GIN Index'leri

```sql
-- form_data içinde katılımcı arama (admin/owner)
CREATE INDEX idx_sessions_form_data  ON quiz_sessions USING GIN (form_data);

-- event metadata arama (opsiyonel)
CREATE INDEX idx_events_metadata     ON exam_events USING GIN (metadata);
```

---

## 6. EF Core Konfigürasyonu

> **Durum: ✅ Tamamlandı** — Tüm entity'ler, configuration'lar ve migration uygulandı.

### Paket Gereksinimleri

| Paket | Proje | Amaç |
|-------|-------|------|
| `Npgsql.EntityFrameworkCore.PostgreSQL 8.0.*` | Infrastructure | PostgreSQL driver |
| `Microsoft.EntityFrameworkCore.Design 8.0.*` | Infrastructure + **Api** | Migration tooling |
| `EFCore.NamingConventions 8.0.3` | Infrastructure | `UseSnakeCaseNamingConvention()` |

### `AppDbContext`

```csharp
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User>             Users             => Set<User>();
    public DbSet<Quiz>             Quizzes           => Set<Quiz>();
    public DbSet<Question>         Questions         => Set<Question>();
    public DbSet<TestCase>         TestCases         => Set<TestCase>();
    public DbSet<QuizSession>      QuizSessions      => Set<QuizSession>();
    public DbSet<Submission>       Submissions       => Set<Submission>();
    public DbSet<SubmissionReplay> SubmissionReplays => Set<SubmissionReplay>();
    public DbSet<ExamEvent>        ExamEvents        => Set<ExamEvent>();
    public DbSet<CodeExecution>    CodeExecutions    => Set<CodeExecution>();
    public DbSet<CompileJob>       CompileJobs       => Set<CompileJob>();
    public DbSet<AuditLog>         AuditLogs         => Set<AuditLog>();
    public DbSet<SystemErrorLog>   SystemErrorLogs   => Set<SystemErrorLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // Global soft delete query filter
        modelBuilder.Entity<User>().HasQueryFilter(u => u.DeletedAt == null);
    }

    // CreatedAt / UpdatedAt otomatik set edilir
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Properties.Any(p => p.Metadata.Name == "CreatedAt"))
                    entry.Property("CreatedAt").CurrentValue = now;
                if (entry.Properties.Any(p => p.Metadata.Name == "UpdatedAt"))
                    entry.Property("UpdatedAt").CurrentValue = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                if (entry.Properties.Any(p => p.Metadata.Name == "UpdatedAt"))
                    entry.Property("UpdatedAt").CurrentValue = now;
            }
        }
        return await base.SaveChangesAsync(cancellationToken);
    }
}
```

### DI Kaydı (`InfrastructureServiceExtensions.cs`)

```csharp
// CodExam.Infrastructure/InfrastructureServiceExtensions.cs
public static IServiceCollection AddInfrastructure(
    this IServiceCollection services, IConfiguration configuration)
{
    services.AddDbContext<AppDbContext>(options =>
        options
            .UseNpgsql(
                configuration.GetConnectionString("Postgres"),   // ConnectionStrings:Postgres
                npgsql => npgsql.MigrationsAssembly("CodExam.Infrastructure"))
            .UseSnakeCaseNamingConvention());   // EFCore.NamingConventions paketi
    return services;
}

// Program.cs
builder.Services.AddInfrastructure(builder.Configuration);
```

> **Not:** Connection string anahtarı `"Postgres"` — `docker-compose.yml`'deki env var `ConnectionStrings__Postgres` ile doğrudan eşleşir.

### Design-Time Factory (`AppDbContextFactory.cs`)

`dotnet ef migrations add` komutunun çalışma zamanı olmadan DbContext oluşturabilmesi için:

```csharp
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder
            .UseNpgsql(
                "Host=localhost;Port=5432;Database=codeexam;Username=codeexam_user;Password=...",
                npgsql => npgsql.MigrationsAssembly("CodExam.Infrastructure"))
            .UseSnakeCaseNamingConvention();
        return new AppDbContext(optionsBuilder.Options);
    }
}
```

### Entity Configuration Örneği (`QuizConfiguration.cs`)

```csharp
public class QuizConfiguration : IEntityTypeConfiguration<Quiz>
{
    public void Configure(EntityTypeBuilder<Quiz> b)
    {
        b.HasKey(q => q.Id);
        b.Property(q => q.Id).HasDefaultValueSql("gen_random_uuid()");

        b.Property(q => q.Title).HasMaxLength(200).IsRequired();
        b.Property(q => q.Mode).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(q => q.Status).HasConversion<string>().HasMaxLength(10).IsRequired();

        // JSONB alanlar — Npgsql JsonDocument'i doğrudan jsonb'ye map eder
        b.Property(q => q.AntiCheatOptions).HasColumnType("jsonb").IsRequired();
        b.Property(q => q.FormSchema).HasColumnType("jsonb").IsRequired();

        b.Property(q => q.CreatedAt).HasColumnType("timestamp with time zone").IsRequired();
        b.Property(q => q.UpdatedAt).HasColumnType("timestamp with time zone").IsRequired();

        b.HasOne(q => q.Owner)
            .WithMany(u => u.Quizzes)
            .HasForeignKey(q => q.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(q => q.OwnerId);
        b.HasIndex(q => q.Status);
    }
}
```

### JSONB için `JsonDocument` Kullanımı

```csharp
// Okuma
var schema = quiz.FormSchema.RootElement
    .EnumerateArray()
    .Select(el => new FormField
    {
        Key      = el.GetProperty("key").GetString()!,
        Label    = el.GetProperty("label").GetString()!,
        Type     = el.GetProperty("type").GetString()!,
        Required = el.GetProperty("required").GetBoolean(),
    }).ToList();

// Yazma
quiz.FormSchema = JsonDocument.Parse(JsonSerializer.Serialize(fields));
```

### Naming Convention

`UseSnakeCaseNamingConvention()` otomatik dönüşüm yapar — explicit `HasColumnName()` gerekmez:

| C# Property | PostgreSQL kolon |
|-------------|-----------------|
| `DisplayName` | `display_name` |
| `CreatedAt` | `created_at` |
| `AntiCheatOptions` | `anti_cheat_options` |
| `SessionToken` | `session_token` |

---

## 7. Migration Stratejisi

> **Durum: ✅ İlk migration uygulandı** — 12 tablo PostgreSQL'de mevcut.

### Tool Kurulumu

```bash
dotnet tool install --global dotnet-ef
export PATH="$PATH:/home/<user>/.dotnet/tools"
```

### Komutlar

```bash
# Yeni migration oluştur
dotnet ef migrations add <MigrationName> \
  --project CodExam.Infrastructure \
  --startup-project CodExam.Api \
  --output-dir Persistence/Migrations

# Migration uygula (manuel — normalde startup auto-migrate kullanılır)
dotnet ef database update \
  --project CodExam.Infrastructure \
  --startup-project CodExam.Api

# Son migration'ı geri al
dotnet ef migrations remove \
  --project CodExam.Infrastructure \
  --startup-project CodExam.Api

# SQL script üret (production deploy için)
dotnet ef migrations script \
  --idempotent \
  --output migrations.sql
```

### Uygulanan Migration'lar

| Migration | Tarih | İçerik |
|-----------|-------|--------|
| `20260425133644_InitialCreate` | 2026-04-25 | Tüm 12 tablo + indexler tek seferde |

> Orijinal planda 8 ayrı migration planlanmıştı. Geliştirme aşamasında tüm şema tek `InitialCreate` migration'ında birleştirildi.

### Docker Compose'da Otomatik Migration

```csharp
// Program.cs
using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
await db.Database.MigrateAsync();   // pending migration varsa uygular
```

---

## 8. Redis Kullanım Desenleri

### 8.1 Hangfire Job Kuyruğu

```
Key pattern: hangfire:job:{jobId}
Type: Hash
TTL: 24 saat (tamamlanan job'lar otomatik temizlenir)
```

Hangfire, Redis'i kendi yönetir. `Hangfire.Redis.StackExchange` paketi kullanılır.

### 8.2 Rate Limit Sayaçları

```
Key pattern: rl:{IP}:{endpoint}
Type: String (counter)
TTL: pencere süresi (örn: 60 saniye)

Örnek:
  rl:192.168.1.1:POST/api/execute → "7" TTL: 43s
```

`AspNetCoreRateLimit` bu anahtarları otomatik yönetir.

### 8.3 Session Cache (İsteğe Bağlı)

```
Key pattern: session:{token}
Type: String (JSON)
TTL: session.ends_at - now()

Değer:
{
  "sessionId": "...",
  "quizId":    "...",
  "isLocked":  false,
  "endsAt":    "2025-05-10T14:30:00Z"
}
```

`SessionTokenMiddleware` önce Redis'e bakar; miss durumunda DB'den yükler ve cache'e yazar.

---

## 9. Seed Data

### `DbSeeder.cs` – Çalışma Mantığı

```csharp
public static async Task SeedAsync(AppDbContext db)
{
    if (await db.Users.AnyAsync()) return;   // Sadece boş DB'de çalış

    // 1. Admin kullanıcı
    var admin = new User
    {
        Email        = "admin@codexam.dev",
        PasswordHash = BCrypt.HashPassword("Admin@2025!"),
        DisplayName  = "Sistem Yöneticisi",
        Role         = UserRole.Admin,
    };

    // 2. Demo kullanıcılar
    var demo1 = new User
    {
        Email        = "demo1@codexam.dev",
        PasswordHash = BCrypt.HashPassword("Demo@2025!"),
        DisplayName  = "Demo Öğretmen 1",
        Role         = UserRole.User,
    };

    // 3. Örnek quizler
    var activeQuiz = new Quiz
    {
        Owner           = demo1,
        Title           = "Python Temelleri Sınavı",
        DurationMinutes = 60,
        Status          = QuizStatus.Active,
        FormSchema      = JsonDocument.Parse("""
            [
              {"key":"name","label":"Ad Soyad","type":"text","required":true},
              {"key":"studentId","label":"Öğrenci No","type":"text","required":true}
            ]
        """),
        AntiCheatOptions = JsonDocument.Parse("""
            {"tabSwitch":true,"fullscreen":true,"clipboard":false}
        """),
    };

    // 4. Sorular + test case'ler
    // 5. Bitmiş quiz için örnek session + submission + replay
    await db.SaveChangesAsync();
}
```

### Seed Hesapları

| Email | Şifre | Rol |
|-------|-------|-----|
| `admin@codexam.dev` | `Admin@2025!` | Admin |
| `demo1@codexam.dev` | `Demo@2025!` | User |
| `demo2@codexam.dev` | `Demo@2025!` | User |

### Demo Quiz Senaryoları

| Quiz | Durum | Soru Sayısı | Katılımcı |
|------|-------|-------------|----------|
| Python Temelleri | Active | 5 (2 Coding, 2 MC, 1 ShortAnswer) | 0 |
| Algoritma Taslağı | Draft | 3 (Coding, BugFix, OutputPred) | 0 |
| Geçmiş Sınav | Ended | 4 (karışık tip) | 3 örnek session |

---

## 10. Backup ve Restore

### Manuel Backup

```bash
# Tam dump (custom format, sıkıştırılmış)
docker exec codexam-postgres pg_dump \
  -U codeexam_user \
  -Fc \
  -f /tmp/codexam_backup_$(date +%Y%m%d_%H%M%S).dump \
  codeexam

# Container'dan host'a kopyala
docker cp codexam-postgres:/tmp/codexam_backup_*.dump ./backups/
```

### Restore

```bash
# Yeni/boş DB'ye restore
docker exec -i codexam-postgres pg_restore \
  -U codeexam_user \
  -d codeexam \
  --clean \
  --if-exists \
  /tmp/backup.dump
```

### Otomatik Yedekleme (Cron, Opsiyonel)

```yaml
# docker-compose.yml içinde ayrı backup servisi
backup:
  image: postgres:16-alpine
  environment:
    PGPASSWORD: ${POSTGRES_PASSWORD}
  volumes:
    - ./backups:/backups
  entrypoint: >
    sh -c "while true; do
      pg_dump -h postgres -U $POSTGRES_USER -Fc $POSTGRES_DB
        > /backups/backup_$$(date +%Y%m%d_%H%M%S).dump;
      sleep 86400;
    done"
```

### Önemli Tablolar ve Büyüme Tahmini

| Tablo | Beklenen Büyüme | Notlar |
|-------|----------------|--------|
| `code_executions` | Hızlı | Eski kayıtlar 30 gün sonra arşivlenebilir |
| `submission_replays.diffs` | Büyük (JSONB) | Her 50 delta'da snapshot; ~5KB/session |
| `exam_events` | Orta | High severity event'ler öncelikli saklanır |
| `system_error_logs` | Düşük | 90 gün sonra temizlenebilir |
