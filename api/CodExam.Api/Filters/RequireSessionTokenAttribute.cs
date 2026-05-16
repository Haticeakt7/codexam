using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace CodExam.Api.Filters;

public class RequireSessionTokenAttribute : ActionFilterAttribute
{
    public const string ItemKey = "SessionToken";

    public override void OnActionExecuting(ActionExecutingContext context)
    {
        var token = context.HttpContext.Request.Headers["X-Session-Token"].FirstOrDefault();
        if (string.IsNullOrEmpty(token))
        {
            context.Result = new UnauthorizedObjectResult(new { title = "X-Session-Token header is required." });
            return;
        }
        context.HttpContext.Items[ItemKey] = token;
    }
}
