using CodExam.Api.Hubs;
using System.Security.Claims;
using System.Text;
using AspNetCoreRateLimit;
using CodExam.Infrastructure;
using CodExam.Infrastructure.Persistence;
using FluentValidation;
using FluentValidation.AspNetCore;
using Hangfire;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, services, cfg) =>
        cfg.ReadFrom.Configuration(ctx.Configuration)
           .ReadFrom.Services(services)
           .Enrich.FromLogContext()
           .WriteTo.Console()
           .WriteTo.File("logs/api-.txt", rollingInterval: RollingInterval.Day));

    // Controllers
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();

    // FluentValidation
    builder.Services.AddFluentValidationAutoValidation();
    builder.Services.AddValidatorsFromAssemblyContaining<Program>();

    // Swagger
    builder.Services.AddSwaggerGen();

    // JWT Authentication
    var jwtSecret = builder.Configuration["Jwt:Secret"]
        ?? throw new InvalidOperationException("Jwt:Secret is not configured.");

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer           = false,
                ValidateAudience         = false,
                ValidateLifetime         = true,
                ValidateIssuerSigningKey  = true,
                IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                ClockSkew                = TimeSpan.Zero,
            };
            options.Events = new JwtBearerEvents
            {
                // SignalR: allow token via query string for hub connections
                OnMessageReceived = ctx =>
                {
                    var token = ctx.Request.Query["access_token"];
                    if (!string.IsNullOrEmpty(token) &&
                        ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                        ctx.Token = token;
                    return Task.CompletedTask;
                },
                // Validate SecurityStamp to support immediate force-logout
                OnTokenValidated = async ctx =>
                {
                    var stampClaim  = ctx.Principal?.FindFirstValue("sec");
                    var userIdClaim = ctx.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (stampClaim == null || userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                    {
                        ctx.Fail("Missing security claims.");
                        return;
                    }

                    var cache    = ctx.HttpContext.RequestServices.GetRequiredService<IMemoryCache>();
                    var cacheKey = $"sec_stamp_{userId}";

                    if (!cache.TryGetValue(cacheKey, out Guid cachedStamp))
                    {
                        var db   = ctx.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                        var user = await db.Users.AsNoTracking()
                            .Where(u => u.Id == userId)
                            .Select(u => new { u.SecurityStamp })
                            .FirstOrDefaultAsync();
                        if (user == null) { ctx.Fail("User not found."); return; }
                        cachedStamp = user.SecurityStamp;
                        cache.Set(cacheKey, cachedStamp, TimeSpan.FromMinutes(2));
                    }

                    if (!Guid.TryParse(stampClaim, out var tokenStamp) || tokenStamp != cachedStamp)
                        ctx.Fail("Session revoked.");
                }
            };
        });

    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("RequireAdmin", p => p.RequireRole("Admin"));
        options.AddPolicy("RequireUser",  p => p.RequireRole("User", "Admin"));
        options.AddPolicy("QuizOwner", p => p.Requirements.Add(new CodExam.Api.Authorization.QuizOwnerRequirement()));
    });

    builder.Services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, CodExam.Api.Authorization.QuizOwnerHandler>();

    // CORS
    var allowedOrigins = builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>() ?? ["http://localhost:5173", "http://localhost"];

    builder.Services.AddCors(options =>
        options.AddPolicy("Frontend", policy =>
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials()));

    // Rate Limiting (AspNetCoreRateLimit)
    builder.Services.AddMemoryCache();
    builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
    builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
    builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
    builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
    builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
    builder.Services.AddInMemoryRateLimiting();

    // SignalR
    builder.Services.AddSignalR();

    // Infrastructure: DB + Redis + Hangfire + Services
    builder.Services.AddInfrastructure(builder.Configuration);

    // SignalR monitor notifier (bridges Api → Application layer)
    builder.Services.AddScoped<CodExam.Application.Interfaces.IMonitorNotifier, CodExam.Api.Services.SignalRMonitorNotifier>();

    // Health Checks
    builder.Services.AddHealthChecks()
        .AddDbContextCheck<AppDbContext>("postgres");

    var app = builder.Build();

    // Create schema on startup (no migrations exist yet)
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

        // Add security_stamp column if it does not exist yet (incremental schema update)
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS security_stamp uuid NOT NULL DEFAULT gen_random_uuid()");


        // Seed users if none exist
        var now = DateTime.UtcNow;
        var seedAdmins = new[]
        {
            ("hatice@codexam.dev",  "!hatice123!", "Hatice", CodExam.Domain.Enums.UserRole.Admin),
            ("emir@codexam.dev",    "!emir123!",   "Emir",   CodExam.Domain.Enums.UserRole.Admin),
            ("seymen@codexam.dev",  "!seymen123!", "Seymen", CodExam.Domain.Enums.UserRole.Admin),
            ("hatice@demo.com",     "!hatice123!", "Hatice", CodExam.Domain.Enums.UserRole.User),
            ("emir@demo.com",       "!emir123!",   "Emir",   CodExam.Domain.Enums.UserRole.User),
            ("seymen@demo.com",     "!seymen123!", "Seymen", CodExam.Domain.Enums.UserRole.User),
        };
        var existingEmails = await db.Users.Select(u => u.Email).ToListAsync();
        foreach (var (email, password, name, role) in seedAdmins)
        {
            if (existingEmails.Contains(email)) continue;
            db.Users.Add(new CodExam.Domain.Entities.User
            {
                Id           = Guid.NewGuid(),
                Email        = email,
                DisplayName  = name,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                Role         = role,
                Status       = "active",
                CreatedAt    = now,
                UpdatedAt    = now,
            });
        }
        await db.SaveChangesAsync();

        await CodExam.Api.Seeds.QuizSeeder.SeedAsync(db);
    }

    app.UseMiddleware<CodExam.Api.Middlewares.ExceptionHandlerMiddleware>();
    app.UseSerilogRequestLogging();

    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "CodExam API v1");
        c.RoutePrefix = "swagger";
    });

    app.UseIpRateLimiting();
    app.UseCors("Frontend");
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseMiddleware<CodExam.Api.Middlewares.SessionTokenMiddleware>();
    app.MapControllers();

    // Hangfire Dashboard (dev only)
    if (app.Environment.IsDevelopment())
        app.UseHangfireDashboard("/hangfire");

    app.MapGet("/api/health", () => Results.Ok(new { status = "healthy" }));
    app.MapHealthChecks("/api/health/db");

    app.MapHub<MonitorHub>("/hubs/monitor");
    app.MapHub<ParticipantHub>("/hubs/session");

    // Recurring job: auto-transition quiz statuses every minute
    var recurringJobs = app.Services.GetRequiredService<IRecurringJobManager>();
    recurringJobs.AddOrUpdate<CodExam.Infrastructure.Services.QuizStatusJob>(
        "quiz-status-tick",
        job => job.RunAsync(),
        "* * * * *");

    await app.RunAsync();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
