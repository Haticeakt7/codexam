using CodExam.Application.Interfaces;
using CodExam.Infrastructure.Persistence;
using CodExam.Infrastructure.Services;
using Hangfire;
using Hangfire.Redis.StackExchange;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CodExam.Infrastructure;

public static class InfrastructureServiceExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // PostgreSQL + EF Core
        services.AddDbContext<AppDbContext>(options =>
            options
                .UseNpgsql(
                    configuration.GetConnectionString("Postgres"),
                    npgsql => npgsql.MigrationsAssembly("CodExam.Infrastructure"))
                .UseSnakeCaseNamingConvention());

        // Hangfire with Redis backend
        var redisConnection = configuration.GetConnectionString("Redis")
            ?? throw new InvalidOperationException("ConnectionStrings:Redis is not configured.");

        services.AddHangfire(cfg =>
            cfg.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
               .UseSimpleAssemblyNameTypeSerializer()
               .UseRecommendedSerializerSettings()
               .UseRedisStorage(redisConnection, new RedisStorageOptions
               {
                   Prefix = "codexam:hangfire:"
               }));

        services.AddHangfireServer(options =>
        {
            options.WorkerCount = 4;
            options.Queues = ["default", "execution"];
        });

        // Application service registrations (stub implementations)
        services.AddScoped<IAuthService,       AuthService>();
        services.AddScoped<IExecutionService,  ExecutionService>();
        services.AddScoped<IQuizService,       QuizService>();
        services.AddScoped<IQuestionService,   QuestionService>();
        services.AddScoped<ISessionService,    SessionService>();
        services.AddScoped<IAdminService,      AdminService>();
        services.AddScoped<ISubmissionService, SubmissionService>();

        return services;
    }
}
