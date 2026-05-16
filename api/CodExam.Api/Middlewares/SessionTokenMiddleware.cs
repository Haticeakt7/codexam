namespace CodExam.Api.Middlewares;

public class SessionTokenMiddleware
{
    private readonly RequestDelegate _next;

    public SessionTokenMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue("X-Session-Token", out var tokenValues))
        {
            var token = tokenValues.FirstOrDefault();
            if (!string.IsNullOrEmpty(token))
            {
                context.Items["SessionToken"] = token;
            }
        }

        await _next(context);
    }
}
