# CodExam – Backend Dokümanı

> ASP.NET Core 8 · Clean Architecture · EF Core 8 · Hangfire · SignalR · JWT

---

## İçindekiler

1. [Tech Stack](#1-tech-stack)
2. [Solution ve Klasör Yapısı](#2-solution-ve-klasör-yapısı)
3. [Clean Architecture Katmanları](#3-clean-architecture-katmanları)
4. [Domain Modelleri](#4-domain-modelleri)
5. [Auth Sistemi](#5-auth-sistemi)
6. [Yetkilendirme Politikaları](#6-yetkilendirme-politikaları)
7. [Session Token Middleware](#7-session-token-middleware)
8. [Servisler](#8-servisler)
9. [SignalR Hub](#9-signalr-hub)
10. [Hangfire ve Worker](#10-hangfire-ve-worker)
11. [Validation (FluentValidation)](#11-validation-fluentvalidation)
12. [Loglama (Serilog)](#12-loglama-serilog)
13. [Rate Limiting](#13-rate-limiting)
14. [Hata Yönetimi](#14-hata-yönetimi)
15. [Swagger / OpenAPI](#15-swagger--openapi)

---

## 1. Tech Stack

| Paket | Kullanım |
|-------|---------|
| `ASP.NET Core 8` | Web API çerçevesi |
| `Entity Framework Core 8` | ORM |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | PostgreSQL sürücüsü |
| `FluentValidation.AspNetCore` | Input doğrulama |
| `Serilog.AspNetCore` | Yapısal loglama |
| `Serilog.Sinks.Console` + `Serilog.Sinks.File` | Log hedefleri |
| `Microsoft.AspNetCore.SignalR` | Realtime WebSocket hub |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | JWT kimlik doğrulama |
| `BCrypt.Net-Next` | Şifre hash / verify |
| `Hangfire` + `Hangfire.Redis.StackExchange` | Background job kuyruğu |
| `AspNetCoreRateLimit` | IP/kullanıcı bazlı oran sınırlama |
| `Swashbuckle.AspNetCore` | Swagger / OpenAPI |
| `Docker.DotNet` | (Worker) Docker Engine SDK |

---

## 2. Solution ve Klasör Yapısı

```
api/
├── CodExam.sln
│
├── CodExam.Api/                       # Sunum katmanı
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── ExecuteController.cs
│   │   ├── QuizController.cs
│   │   ├── QuestionController.cs
│   │   ├── SessionController.cs
│   │   ├── SubmissionController.cs
│   │   └── AdminController.cs
│   ├── Hubs/
│   │   └── MonitorHub.cs
│   ├── Middleware/
│   │   ├── SessionTokenMiddleware.cs
│   │   └── ExceptionHandlerMiddleware.cs
│   ├── Filters/
│   │   └── ValidationFilter.cs
│   ├── Program.cs
│   └── appsettings.json
│
├── CodExam.Application/               # Uygulama katmanı
│   ├── UseCases/
│   │   ├── Auth/
│   │   │   ├── RegisterCommand.cs
│   │   │   ├── LoginCommand.cs
│   │   │   └── RefreshTokenCommand.cs
│   │   ├── Quiz/
│   │   │   ├── CreateQuizCommand.cs
│   │   │   ├── UpdateQuizCommand.cs
│   │   │   ├── PublishQuizCommand.cs
│   │   │   ├── JoinQuizCommand.cs
│   │   │   └── SubmitAnswerCommand.cs
│   │   ├── Execute/
│   │   │   └── EnqueueExecutionCommand.cs
│   │   └── Admin/
│   │       ├── UpdateUserRoleCommand.cs
│   │       └── TerminateSessionCommand.cs
│   ├── DTOs/
│   │   ├── Auth/
│   │   ├── Quiz/
│   │   ├── Question/
│   │   ├── Session/
│   │   └── Admin/
│   ├── Validators/
│   │   ├── RegisterValidator.cs
│   │   ├── LoginValidator.cs
│   │   ├── CreateQuizValidator.cs
│   │   ├── JoinQuizValidator.cs
│   │   └── SubmitAnswerValidator.cs
│   ├── Interfaces/
│   │   ├── IQuizRepository.cs
│   │   ├── ISessionRepository.cs
│   │   ├── IExecutionService.cs
│   │   └── ISignalRNotifier.cs
│   └── Mappings/
│       └── MappingProfile.cs          # AutoMapper veya manuel mapping
│
├── CodExam.Domain/                    # Domain katmanı
│   ├── Entities/
│   │   ├── User.cs
│   │   ├── Quiz.cs
│   │   ├── Question.cs
│   │   ├── TestCase.cs
│   │   ├── QuizSession.cs
│   │   ├── Submission.cs
│   │   ├── SubmissionReplay.cs
│   │   ├── ExamEvent.cs
│   │   ├── CodeExecution.cs
│   │   ├── CompileJob.cs
│   │   ├── AuditLog.cs
│   │   └── SystemErrorLog.cs
│   ├── Enums/
│   │   ├── UserRole.cs
│   │   ├── QuizStatus.cs
│   │   ├── QuestionType.cs
│   │   ├── ExecutionStatus.cs
│   │   ├── EventType.cs
│   │   └── EventSeverity.cs
│   └── ValueObjects/
│       └── FormSchema.cs
│
├── CodExam.Infrastructure/            # Altyapı katmanı
│   ├── Persistence/
│   │   ├── AppDbContext.cs
│   │   ├── Migrations/
│   │   └── Repositories/
│   │       ├── QuizRepository.cs
│   │       ├── SessionRepository.cs
│   │       └── UserRepository.cs
│   ├── Services/
│   │   ├── JwtService.cs
│   │   ├── PasswordService.cs
│   │   ├── ExecutionService.cs
│   │   ├── SubmissionEvaluationService.cs
│   │   ├── ReplayDiffService.cs
│   │   └── SignalRNotifier.cs
│   └── Workers/
│       └── DockerRunnerService.cs     # (worker/ projesine taşınabilir)
│
└── CodExam.Worker/                    # Ayrı Worker Service projesi
    ├── Program.cs
    ├── Workers/
    │   └── HangfireWorker.cs
    ├── Services/
    │   └── DockerRunnerService.cs
    └── appsettings.json
```

---

## 3. Clean Architecture Katmanları

### Katman Bağımlılık Kuralı

```
Api → Application → Domain
Infrastructure → Application (interface implementation)
Worker → Application (job handler)
```

- `Domain`: Hiçbir katmana bağımlı değil. Entity, enum, value object.
- `Application`: Yalnızca `Domain`'e bağımlı. Use case, DTO, interface, validator.
- `Infrastructure`: `Application` interface'lerini implement eder. EF Core, JWT, Docker.
- `Api`: Controller, hub, middleware. `Application` use case'lerini çağırır.

### Dependency Injection

```csharp
// Program.cs
builder.Services.AddScoped<IQuizRepository, QuizRepository>();
builder.Services.AddScoped<IExecutionService, ExecutionService>();
builder.Services.AddScoped<ISignalRNotifier, SignalRNotifier>();
builder.Services.AddSingleton<IPasswordService, PasswordService>();
builder.Services.AddSingleton<IJwtService, JwtService>();
```

---

## 4. Domain Modelleri

### User

```csharp
public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string DisplayName { get; set; } = null!;
    public UserRole Role { get; set; }                 // Admin | User
    public string Status { get; set; } = "active";    // active | inactive
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }           // soft delete
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }

    public ICollection<Quiz> Quizzes { get; set; } = [];
}
```

### Quiz

```csharp
public class Quiz
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public int DurationMinutes { get; set; }
    public QuizMode Mode { get; set; }                 // RealTime | FreeStyle
    public JsonDocument AntiCheatOptions { get; set; } = null!;
    // { "tabSwitch": true, "fullscreen": true, "clipboard": true }
    public JsonDocument FormSchema { get; set; } = null!;
    // [{ "key": "name", "label": "Ad Soyad", "type": "text", "required": true }]
    public string? AccessCode { get; set; }
    public QuizStatus Status { get; set; }             // Draft | Active | Ended
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }

    public User Owner { get; set; } = null!;
    public ICollection<Question> Questions { get; set; } = [];
    public ICollection<QuizSession> Sessions { get; set; } = [];
}
```

### Question

```csharp
public class Question
{
    public Guid Id { get; set; }
    public Guid QuizId { get; set; }
    public QuestionType Type { get; set; }
    // Coding | MultipleChoice | OutputPrediction | BugFix | ShortAnswer
    public string Title { get; set; } = null!;
    public string Body { get; set; } = null!;
    public int Points { get; set; }
    public int OrderNo { get; set; }
    public JsonDocument Options { get; set; } = null!;
    // Coding: { "starterCode": "...", "supportedLanguages": ["python", "javascript"] }
    // MultipleChoice: { "choices": ["A", "B", "C"], "correctIndex": 1, "multiSelect": false }
    // OutputPrediction: { "codeBlock": "..." }
    // BugFix: { "buggyCode": "...", "solution": "...", "hint": "..." }
    // ShortAnswer: { "acceptedAnswers": ["..."], "matchMode": "exact|contains|regex" }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Quiz Quiz { get; set; } = null!;
    public ICollection<TestCase> TestCases { get; set; } = [];
}
```

### QuizSession

```csharp
public class QuizSession
{
    public Guid Id { get; set; }
    public Guid QuizId { get; set; }
    public Guid? UserId { get; set; }              // null = anonim
    public Guid SessionToken { get; set; }
    public JsonDocument FormData { get; set; } = null!;
    public DateTime StartedAt { get; set; }
    public DateTime EndsAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsLocked { get; set; } = false;
    public int TotalScore { get; set; } = 0;

    public Quiz Quiz { get; set; } = null!;
    public User? User { get; set; }
    public ICollection<Submission> Submissions { get; set; } = [];
    public ICollection<ExamEvent> ExamEvents { get; set; } = [];
}
```

### Submission

```csharp
public class Submission
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public Guid QuestionId { get; set; }
    public string Language { get; set; } = null!;
    public string Code { get; set; } = null!;
    public ExecutionStatus Status { get; set; }
    // Pending | Running | Passed | Failed | Error | TLE
    public int? ExecutionTimeMs { get; set; }
    public int? MemoryUsedKb { get; set; }
    public int Score { get; set; } = 0;
    public DateTime SubmittedAt { get; set; }
    public int Version { get; set; } = 1;

    public QuizSession Session { get; set; } = null!;
    public Question Question { get; set; } = null!;
    public SubmissionReplay? Replay { get; set; }
}
```

### Enum Tanımları

```csharp
public enum UserRole { Admin, User }

public enum QuizStatus { Draft, Active, Ended }

public enum QuizMode { RealTime, FreeStyle }

public enum QuestionType
{
    Coding, MultipleChoice, OutputPrediction, BugFix, ShortAnswer
}

public enum ExecutionStatus
{
    Pending, Running, Passed, Failed, Error, TLE
}

public enum EventType
{
    TabSwitch, FullscreenExit, ClipboardAttempt, Keydown
}

public enum EventSeverity { Low, Medium, High }
```

---

## 5. Auth Sistemi

### Kayıt (Register)

1. `POST /api/auth/register` → `RegisterCommand` alır
2. Email benzersizliği kontrol edilir (case-insensitive)
3. `BCrypt.HashPassword(password)` ile şifre hashlenir
4. `User` entity oluşturulur, `Role = User`, `Status = active`
5. `AuditLog` kaydedilir
6. 201 Created döner

### Giriş (Login)

1. `POST /api/auth/login` → email + şifre
2. `BCrypt.Verify(password, hash)` ile doğrulama
3. Access token (15 dakika) ve refresh token (7 gün) üretilir
4. Refresh token DB'ye kaydedilir (`User.RefreshToken`, `User.RefreshTokenExpiresAt`)
5. Response: `{ accessToken, refreshToken, expiresIn, user }`

### JWT Yapısı

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "User",
  "jti": "unique-token-id",
  "iat": 1714000000,
  "exp": 1714000900
}
```

### Token Yenileme

```
POST /api/auth/refresh
Body: { "refreshToken": "..." }
→ Eski refresh token DB'de var ve süresi geçmemiş mi kontrol
→ Yeni access + refresh token üret
→ Eski refresh token'ı invalidate et (rotation)
```

### JWT Middleware (`Program.cs`)

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(config["Jwt:Secret"]!)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero,
        };

        // SignalR için query param token desteği
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) &&
                    ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                    ctx.Token = token;
                return Task.CompletedTask;
            }
        };
    });
```

---

## 6. Yetkilendirme Politikaları

```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", p =>
        p.RequireRole("Admin"));

    options.AddPolicy("RequireUser", p =>
        p.RequireRole("User", "Admin"));

    options.AddPolicy("RequireQuizOwner", p =>
        p.AddRequirements(new QuizOwnerRequirement()));
});
```

### `QuizOwnerRequirement` Handler

```csharp
public class QuizOwnerHandler : AuthorizationHandler<QuizOwnerRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext ctx,
        QuizOwnerRequirement req)
    {
        var userId = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var quizId = httpCtx.GetRouteValue("id")?.ToString();

        if (ctx.User.IsInRole("Admin"))
        {
            ctx.Succeed(req);
            return;
        }

        var quiz = await quizRepo.FindAsync(Guid.Parse(quizId!));
        if (quiz?.OwnerId.ToString() == userId)
            ctx.Succeed(req);
    }
}
```

### Controller Kullanımı

```csharp
[Authorize(Policy = "RequireQuizOwner")]
[HttpGet("{id}/results")]
public async Task<IActionResult> GetResults(Guid id) { ... }

[Authorize(Policy = "RequireAdmin")]
[HttpGet("/api/admin/users")]
public async Task<IActionResult> GetUsers() { ... }
```

---

## 7. Session Token Middleware

Anonim katılımcıların sınav endpoint'lerine `X-Session-Token` header ile erişimini sağlar.

```csharp
public class SessionTokenMiddleware
{
    public async Task InvokeAsync(HttpContext ctx, ISessionRepository repo)
    {
        var token = ctx.Request.Headers["X-Session-Token"].FirstOrDefault();

        if (!string.IsNullOrEmpty(token) &&
            Guid.TryParse(token, out var sessionToken))
        {
            var session = await repo.FindByTokenAsync(sessionToken);

            if (session is { IsActive: true, IsLocked: false } &&
                session.EndsAt > DateTime.UtcNow)
            {
                ctx.Items["CurrentSession"] = session;
            }
        }

        await _next(ctx);
    }
}
```

Controller'da kullanım:

```csharp
var session = HttpContext.Items["CurrentSession"] as QuizSession
    ?? throw new ForbiddenException("Geçersiz veya süresi dolmuş oturum.");
```

---

## 8. Servisler

### `JwtService`

```csharp
public interface IJwtService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateToken(string token);
}
```

### `PasswordService`

```csharp
public interface IPasswordService
{
    string Hash(string password);
    bool Verify(string password, string hash);
}
// BCrypt work factor: 12
```

### `ExecutionService`

```csharp
public interface IExecutionService
{
    Task<Guid> EnqueueAsync(string language, string code, string? stdin);
    Task<ExecutionResultDto?> GetResultAsync(Guid jobId);
}
```

1. `CodeExecution` kaydı oluşturur (status: `Pending`)
2. Hangfire job enqueue eder → Worker bu job'ı işler
3. `GetResultAsync`: DB'den sonucu döndürür

### `SubmissionEvaluationService`

```csharp
public interface ISubmissionEvaluationService
{
    Task EvaluateAsync(Guid submissionId, ExecutionResult result);
}
```

1. Test case'leri yükler (visible + hidden)
2. Her test case için `stdout.Trim() == expectedOutput.Trim()` kontrol
3. Tüm hidden test case'ler geçtiyse `Passed`, aksi `Failed`
4. `Submission.Score` ve `QuizSession.TotalScore` günceller

### `ReplayDiffService`

```csharp
public interface IReplayDiffService
{
    JsonDocument ComputeDiff(string previousCode, string currentCode, long timeMs);
    string ApplyDiff(string baseCode, JsonDocument diff);
}
```

Diff formatı (Myers diff algorithm benzeri):

```json
[
  { "time_ms": 1200, "type": "delta", "diff": "..." },
  { "time_ms": 5000, "type": "snapshot", "code": "print('hello')" }
]
```

Her 50 delta'da bir `snapshot` eklenir; replay'de bu noktalara hızlıca seek edilebilir.

### `SignalRNotifier`

```csharp
public interface ISignalRNotifier
{
    Task NotifyCodeChangedAsync(string quizId, string sessionId, string questionId, string code);
    Task NotifyEventAsync(string quizId, string sessionId, string eventType, string severity);
    Task NotifySessionJoinedAsync(string quizId, string sessionId, JsonDocument formData);
    Task SendWarningAsync(string sessionId, string message);
    Task TerminateSessionAsync(string sessionId);
}
```

`IHubContext<MonitorHub>` üzerinden çağrılır.

---

## 9. SignalR Hub

```csharp
[Authorize]   // JWT veya session token ile
public class MonitorHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var sessionId = Context.Items["SessionId"]?.ToString();
        var quizId    = Context.Items["QuizId"]?.ToString();

        if (sessionId != null)
        {
            // Anonim katılımcı
            await Groups.AddToGroupAsync(Context.ConnectionId, $"session:{sessionId}");
            await Groups.AddToGroupAsync(Context.ConnectionId, $"quiz:{quizId}");
            await Clients.Group($"quiz:{quizId}").SendAsync("session.joined", new { sessionId });
        }
        else
        {
            // Quiz sahibi / Admin → izleme grubu
            await Groups.AddToGroupAsync(Context.ConnectionId, $"quiz:{quizId}:monitor");
        }
    }

    // Client → Server
    public async Task CodeChanged(string questionId, string code)
    {
        var sessionId = Context.Items["SessionId"]!.ToString()!;
        var quizId    = Context.Items["QuizId"]!.ToString()!;
        await Clients.Group($"quiz:{quizId}:monitor")
            .SendAsync("session.codeChanged", new { sessionId, questionId, code });
    }

    public async Task Heartbeat()
    {
        var sessionId = Context.Items["SessionId"]!.ToString()!;
        var quizId    = Context.Items["QuizId"]!.ToString()!;
        await Clients.Group($"quiz:{quizId}:monitor")
            .SendAsync("session.heartbeat", new { sessionId, timestamp = DateTime.UtcNow });
    }

    // Monitor → Client
    public async Task WarnParticipant(string targetSessionId, string message)
    {
        await Clients.Group($"session:{targetSessionId}")
            .SendAsync("monitor.warn", new { message });
    }

    public async Task TerminateParticipant(string targetSessionId)
    {
        await sessionRepo.LockAsync(Guid.Parse(targetSessionId));
        await Clients.Group($"session:{targetSessionId}")
            .SendAsync("monitor.terminate");
    }
}
```

### Hub Kaydı (`Program.cs`)

```csharp
app.MapHub<MonitorHub>("/hubs/monitor");
```

---

## 10. Hangfire ve Worker

### Hangfire Kurulumu (`Program.cs`)

```csharp
builder.Services.AddHangfire(config => config
    .UseRedisStorage(builder.Configuration["Redis:ConnectionString"]));

builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = 5;
    options.Queues = ["execution", "default"];
});
```

### Job Tanımı

```csharp
// ExecutionService.cs
public async Task<Guid> EnqueueAsync(string language, string code, string? stdin)
{
    var execution = new CodeExecution { Language = language, SourceCode = code, ... };
    await dbContext.SaveChangesAsync();

    BackgroundJob.Enqueue<DockerRunnerService>(
        s => s.RunAsync(execution.Id),
        queue: "execution");

    return execution.Id;
}
```

### `DockerRunnerService` (Worker)

```csharp
public class DockerRunnerService
{
    public async Task RunAsync(Guid executionId)
    {
        var execution = await db.FindAsync(executionId);
        var job = new CompileJob { ExecutionId = executionId, QueuedAt = DateTime.UtcNow };
        await db.SaveChangesAsync();

        var containerId = await docker.Containers.CreateContainerAsync(new CreateContainerParameters
        {
            Image = GetImage(execution.Language),        // "codexam-python-runner"
            Cmd = ["python3", "/runner/solution.py"],
            HostConfig = new HostConfig
            {
                NetworkMode = "none",
                ReadonlyRootfs = true,
                Memory = 256 * 1024 * 1024,             // 256MB
                CpuPeriod = 100_000,
                CpuQuota  = 50_000,                     // 0.5 CPU
                Binds = [$"{tempDir}:/runner:ro"],
            },
        });

        await docker.Containers.StartContainerAsync(containerId.ID, null);

        // Timeout: Python/JS 10s, C++ 15s
        var cts = new CancellationTokenSource(TimeSpan.FromSeconds(GetTimeout(execution.Language)));

        try
        {
            await docker.Containers.WaitContainerAsync(containerId.ID, cts.Token);
            // stdout/stderr oku → DB'ye yaz
        }
        catch (OperationCanceledException)
        {
            await docker.Containers.KillContainerAsync(containerId.ID, null);
            execution.Status = ExecutionStatus.TLE;
        }
        finally
        {
            await docker.Containers.RemoveContainerAsync(containerId.ID, new ContainerRemoveParameters { Force = true });
        }
    }
}
```

---

## 11. Validation (FluentValidation)

### Örnek: `CreateQuizValidator`

```csharp
public class CreateQuizValidator : AbstractValidator<CreateQuizDto>
{
    public CreateQuizValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Başlık zorunludur.")
            .MaximumLength(200);

        RuleFor(x => x.DurationMinutes)
            .GreaterThan(0).WithMessage("Süre 0'dan büyük olmalıdır.")
            .LessThanOrEqualTo(480).WithMessage("Süre en fazla 8 saat olabilir.");

        RuleFor(x => x.FormSchema)
            .NotNull()
            .Must(schema => schema.Count > 0).WithMessage("En az bir form alanı tanımlanmalıdır.");
    }
}
```

### Global Validation Filter

```csharp
builder.Services.AddFluentValidationAutoValidation();
// 400 Bad Request otomatik döner; ModelState'ten hataları okur
```

### Hata Response Formatı

```json
{
  "type": "validation_error",
  "errors": {
    "title": ["Başlık zorunludur."],
    "durationMinutes": ["Süre 0'dan büyük olmalıdır."]
  }
}
```

---

## 12. Loglama (Serilog)

### Konfigürasyon (`Program.cs`)

```csharp
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "CodExam.Api")
    .WriteTo.Console(new RenderedCompactJsonFormatter())
    .WriteTo.File("logs/api-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();
```

### Request Logging

```csharp
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "{RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
});
```

### `system_error_logs` Entegrasyonu

```csharp
// ExceptionHandlerMiddleware.cs
catch (Exception ex)
{
    Log.Error(ex, "Unhandled exception");

    await db.SystemErrorLogs.AddAsync(new SystemErrorLog
    {
        SourceService = "API",
        ErrorTitle = ex.GetType().Name,
        ErrorMessage = ex.Message,
        StackTrace = ex.StackTrace,
    });
    await db.SaveChangesAsync();
}
```

---

## 13. Rate Limiting

`AspNetCoreRateLimit` kullanılır, Redis backend ile.

### Kurallar

| Endpoint | Limit | Pencere |
|----------|-------|--------|
| `POST /api/auth/login` | 10 istek | 1 dakika |
| `POST /api/auth/register` | 5 istek | 1 dakika |
| `POST /api/execute` | 10 istek | 1 dakika |
| `POST /api/quizzes/:id/submit` | 30 istek | 1 dakika |
| `POST /api/quizzes/:id/event` | 60 istek | 1 dakika |
| `POST /api/quizzes/:id/join` | 5 istek | 1 dakika |

### Konfigürasyon (`appsettings.json`)

```json
{
  "IpRateLimiting": {
    "EnableEndpointRateLimiting": true,
    "StackBlockedRequests": false,
    "HttpStatusCode": 429,
    "GeneralRules": [
      {
        "Endpoint": "POST:/api/execute",
        "Period": "1m",
        "Limit": 10
      }
    ]
  }
}
```

429 yanıtı şablonu:

```json
{
  "type": "rate_limit_exceeded",
  "message": "Çok fazla istek gönderildi. Lütfen 1 dakika bekleyin.",
  "retryAfter": 60
}
```

---

## 14. Hata Yönetimi

### Problem Details Standardı (RFC 7807)

Tüm hata yanıtları `ProblemDetails` formatında döner:

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Quiz bulunamadı: 3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "traceId": "0HMVD6CPCE1IT:00000001"
}
```

### Custom Exception Hiyerarşisi

```csharp
public class AppException : Exception { public int StatusCode; }
public class NotFoundException : AppException { StatusCode = 404; }
public class ForbiddenException : AppException { StatusCode = 403; }
public class ValidationException : AppException { StatusCode = 400; }
public class ConflictException : AppException { StatusCode = 409; }
```

### `ExceptionHandlerMiddleware`

```csharp
catch (NotFoundException ex) => Results.NotFound(new { detail = ex.Message });
catch (ForbiddenException ex) => Results.Forbid();
catch (ValidationException ex) => Results.BadRequest(new { errors = ex.Errors });
catch (Exception ex) => Results.Problem(statusCode: 500);
```

---

## 15. Swagger / OpenAPI

```csharp
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "CodExam API", Version = "v1" });

    // JWT auth butonu
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference
            { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, [] }
    });
});
```

Swagger UI: `http://localhost:5000/swagger` (yalnızca `Development` ortamında)

Controller'larda XML dokümantasyon:

```csharp
/// <summary>Quiz'e anonim katılım. Form verisini doğrular ve sessionToken döner.</summary>
/// <response code="200">SessionToken ve bitiş zamanı</response>
/// <response code="400">Form validasyon hatası</response>
/// <response code="404">Quiz bulunamadı</response>
[HttpPost("{id}/join")]
[ProducesResponseType(typeof(JoinQuizResponseDto), 200)]
public async Task<IActionResult> JoinQuiz(Guid id, JoinQuizDto dto) { ... }
```
