using CodExam.Application.Interfaces;
using CodExam.Infrastructure.Persistence;
using CodExam.Worker;
using Docker.DotNet;
using Hangfire;
using Hangfire.Redis.StackExchange;
using Microsoft.EntityFrameworkCore;

var builder = Host.CreateApplicationBuilder(args);

// DbContext — must use the same naming convention as the API to resolve column names
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Postgres"))
           .UseSnakeCaseNamingConvention());

// Docker Client
builder.Services.AddSingleton<IDockerClient>(provider =>
{
    var dockerUri = Environment.OSVersion.Platform == PlatformID.Win32NT
        ? "npipe://./pipe/docker_engine"
        : "unix:///var/run/docker.sock";

    var envUri = Environment.GetEnvironmentVariable("DOCKER_HOST");
    if (!string.IsNullOrEmpty(envUri))
        dockerUri = envUri;

    return new DockerClientConfiguration(new Uri(dockerUri)).CreateClient();
});

// Hangfire Server — must use the same Redis backend as the API so it picks up enqueued jobs
var redisConnection = builder.Configuration.GetConnectionString("Redis")
    ?? throw new InvalidOperationException("ConnectionStrings:Redis is not configured.");

builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseRedisStorage(redisConnection, new RedisStorageOptions
    {
        Prefix = "codexam:hangfire:"
    }));

builder.Services.AddHangfireServer(options => {
    options.WorkerCount = Environment.ProcessorCount * 2;
    options.Queues = ["grading", "execution", "default"];
});

// Register workers
builder.Services.AddTransient<IExecutionWorker, ExecutionWorker>();
builder.Services.AddTransient<IGradingWorker, GradingWorker>();

var host = builder.Build();

using (var scope = host.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // Optional: await dbContext.Database.MigrateAsync();
}

host.Run();
