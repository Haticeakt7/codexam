using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using CodExam.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CodExam.Api.Authorization;

public class QuizOwnerHandler : AuthorizationHandler<QuizOwnerRequirement, Guid>
{
    private readonly AppDbContext _dbContext;

    public QuizOwnerHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, QuizOwnerRequirement requirement, Guid quizId)
    {
        if (context.User.IsInRole("Admin"))
        {
            context.Succeed(requirement);
            return;
        }

        var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim != null && Guid.TryParse(userIdClaim, out var userId))
        {
            var quiz = await _dbContext.Quizzes.FirstOrDefaultAsync(q => q.Id == quizId && q.OwnerId == userId);
            if (quiz != null)
            {
                context.Succeed(requirement);
                return;
            }
        }

        context.Fail();
    }
}
