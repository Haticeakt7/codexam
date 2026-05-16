using CodExam.Application.DTOs.Execute;
using CodExam.Application.Interfaces;
using CodExam.Domain.Enums;
using CodExam.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CodExam.Infrastructure.Services;

public class GradingWorker(
    AppDbContext db,
    IExecutionService executionService,
    IMonitorNotifier monitor) : IGradingWorker
{
    private const int PollIntervalMs  = 500;
    private const int MaxPollAttempts = 120; // 60 seconds max per test case

    public async Task ProcessGradingJob(Guid submissionId)
    {
        var submission = await db.Submissions
            .Include(s => s.Question)
                .ThenInclude(q => q.TestCases)
            .Include(s => s.Session)
                .ThenInclude(s => s.Submissions)
            .FirstOrDefaultAsync(s => s.Id == submissionId);

        if (submission == null) return;

        var testCases = submission.Question.TestCases.OrderBy(tc => tc.OrderNo).ToList();
        if (testCases.Count == 0) return;

        int passed = 0;

        foreach (var tc in testCases)
        {
            var jobId = await executionService.EnqueueAsync(new ExecuteRequest
            {
                Language = submission.Language,
                Code     = submission.Code,
                Stdin    = tc.Input
            });

            if (!Guid.TryParse(jobId, out var compileJobId)) continue;

            string? actualOutput = null;

            for (int attempt = 0; attempt < MaxPollAttempts; attempt++)
            {
                await Task.Delay(PollIntervalMs);

                var result = await db.CompileJobs
                    .AsNoTracking()
                    .Include(cj => cj.Execution)
                    .FirstOrDefaultAsync(cj => cj.Id == compileJobId);

                if (result == null) break;

                var status = result.Execution.Status;

                if (status is ExecutionStatus.Passed or ExecutionStatus.Failed or ExecutionStatus.Error)
                {
                    actualOutput = result.Execution.StdoutText;
                    break;
                }

                if (status == ExecutionStatus.TLE)
                    break;
            }

            if (actualOutput != null &&
                actualOutput.Trim() == tc.ExpectedOutput.Trim())
            {
                passed++;
            }
        }

        int total = testCases.Count;
        int score = total > 0
            ? (int)Math.Floor((double)passed / total * submission.Question.Points)
            : 0;

        var finalStatus = passed == total ? ExecutionStatus.Passed : ExecutionStatus.Failed;

        submission.Score  = score;
        submission.Status = finalStatus;
        db.Submissions.Update(submission);

        // Recalculate session total — the in-memory collection already reflects the updated score
        var session = submission.Session;
        session.TotalScore = session.Submissions.Sum(s => s.Score);
        db.QuizSessions.Update(session);

        await db.SaveChangesAsync();

        await monitor.NotifySubmission(session.QuizId, new
        {
            sessionId    = session.Id,
            questionId   = submission.QuestionId,
            questionType = submission.Question.Type.ToString(),
            score,
            maxScore     = submission.Question.Points,
            status       = finalStatus.ToString()
        });
    }
}
