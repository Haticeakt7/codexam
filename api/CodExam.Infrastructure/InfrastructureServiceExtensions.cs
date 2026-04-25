using CodExam.Infrastructure.Persistence;
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
        services.AddDbContext<AppDbContext>(options =>
            options
                .UseNpgsql(
                    configuration.GetConnectionString("Postgres"),
                    npgsql => npgsql.MigrationsAssembly("CodExam.Infrastructure"))
                .UseSnakeCaseNamingConvention());

        return services;
    }
}
