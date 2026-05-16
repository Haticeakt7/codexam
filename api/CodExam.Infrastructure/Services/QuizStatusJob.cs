using CodExam.Domain.Enums;
using CodExam.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CodExam.Infrastructure.Services;

public class QuizStatusJob(AppDbContext db, ILogger<QuizStatusJob> logger)
{
    public async Task RunAsync()
    {
        var now = DateTime.UtcNow;

        // Published → Active  (StartsAt has arrived)
        var toActivate = await db.Quizzes
            .Where(q => q.Status == QuizStatus.Published && q.StartsAt.HasValue && q.StartsAt.Value <= now)
            .ToListAsync();

        foreach (var q in toActivate)
        {
            q.Status    = QuizStatus.Active;
            q.UpdatedAt = now;
            logger.LogInformation("Quiz {Id} transitioned Published → Active", q.Id);
        }

        // Active → Ended
        //   RealTime: StartsAt + DurationMinutes has passed
        //   FreeStyle: EndsAt has passed
        var activeQuizzes = await db.Quizzes
            .Where(q => q.Status == QuizStatus.Active)
            .ToListAsync();

        foreach (var q in activeQuizzes)
        {
            var ended = q.Mode == QuizMode.FreeStyle
                ? q.EndsAt.HasValue && q.EndsAt.Value <= now
                : (q.StartsAt ?? q.PublishedAt ?? now).AddMinutes(q.DurationMinutes) <= now;

            if (ended)
            {
                q.Status    = QuizStatus.Ended;
                q.UpdatedAt = now;
                logger.LogInformation("Quiz {Id} transitioned Active → Ended", q.Id);
            }
        }

        if (toActivate.Count > 0 || activeQuizzes.Any(q => q.Status == QuizStatus.Ended))
            await db.SaveChangesAsync();
    }
}
