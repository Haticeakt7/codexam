using System.Net;
using System.Text.Json;
using CodExam.Domain.Entities;
using CodExam.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;

namespace CodExam.Api.Middlewares;

public class ExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlerMiddleware> _logger;
    private readonly IServiceProvider _serviceProvider;

    public ExceptionHandlerMiddleware(RequestDelegate next, ILogger<ExceptionHandlerMiddleware> logger, IServiceProvider serviceProvider)
    {
        _next = next;
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred.");

            var (statusCode, message) = ex switch
            {
                KeyNotFoundException knfe       => (StatusCodes.Status404NotFound,            knfe.Message),
                UnauthorizedAccessException uae => (StatusCodes.Status401Unauthorized,        uae.Message),
                InvalidOperationException ioe   => (StatusCodes.Status422UnprocessableEntity, ioe.Message),
                _                               => (StatusCodes.Status500InternalServerError, ex.Message)
            };

            // Only log non-client errors (4xx caused by caller are not system errors)
            if (statusCode >= StatusCodes.Status500InternalServerError)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                    dbContext.SystemErrorLogs.Add(new SystemErrorLog
                    {
                        Id = Guid.NewGuid(),
                        SourceService = "API",
                        ErrorTitle = ex.GetType().Name,
                        ErrorMessage = ex.Message,
                        StackTrace = ex.StackTrace,
                        CreatedAt = DateTime.UtcNow
                    });
                    await dbContext.SaveChangesAsync();
                }
                catch (Exception dbEx)
                {
                    _logger.LogError(dbEx, "Failed to log exception to database.");
                }
            }

            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";

            var result = JsonSerializer.Serialize(new { error = message });
            await context.Response.WriteAsync(result);
        }
    }
}
