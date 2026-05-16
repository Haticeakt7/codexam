using CodExam.Application.Interfaces;
using CodExam.Domain.Enums;
using CodExam.Infrastructure.Persistence;
using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace CodExam.Worker;

public class GradingWorker : IGradingWorker
{
    private readonly ILogger<GradingWorker> _logger;
    private readonly AppDbContext _db;
    private readonly IDockerClient _docker;

    public GradingWorker(ILogger<GradingWorker> logger, AppDbContext db, IDockerClient docker)
    {
        _logger = logger;
        _db     = db;
        _docker = docker;
    }

    public async Task ProcessGradingJob(Guid submissionId)
    {
        _logger.LogInformation("Grading submission {Id}", submissionId);

        var submission = await _db.Submissions
            .Include(s => s.Question)
                .ThenInclude(q => q.TestCases)
            .Include(s => s.Session)
            .FirstOrDefaultAsync(s => s.Id == submissionId);

        if (submission == null)
        {
            _logger.LogWarning("Submission {Id} not found", submissionId);
            return;
        }

        var testCases = submission.Question.TestCases
            .OrderBy(tc => tc.Id)
            .ToList();

        if (testCases.Count == 0)
        {
            // No test cases — mark Pending, no score change
            _logger.LogInformation("Submission {Id} has no test cases, skipping", submissionId);
            return;
        }

        int passed = 0;

        foreach (var tc in testCases)
        {
            var ok = await RunTestCase(submission.Language, submission.Code, tc.Input, tc.ExpectedOutput);
            if (ok) passed++;
        }

        int total = testCases.Count;
        submission.Score  = (int)Math.Round((double)passed / total * submission.Question.Points);
        submission.Status = passed == total ? ExecutionStatus.Passed
                          : passed > 0      ? ExecutionStatus.Passed  // partial credit → still Passed with lower score
                          : ExecutionStatus.Failed;

        // Recompute session total
        submission.Session.TotalScore = await _db.Submissions
            .Where(s => s.SessionId == submission.SessionId && s.Id != submissionId)
            .SumAsync(s => s.Score) + submission.Score;

        _db.Submissions.Update(submission);
        _db.QuizSessions.Update(submission.Session);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Submission {Id} graded: {Passed}/{Total} tests passed, score={Score}",
            submissionId, passed, total, submission.Score);
    }

    private async Task<bool> RunTestCase(string language, string code, string stdin, string expectedOutput)
    {
        var imageTag = $"codexam-runner-{language.ToLower()}";
        string? containerId = null;

        try
        {
            var containerConfig = new CreateContainerParameters
            {
                Image = imageTag,
                Env = new List<string>
                {
                    $"SOURCE_CODE={Convert.ToBase64String(Encoding.UTF8.GetBytes(code))}",
                    $"STDIN={Convert.ToBase64String(Encoding.UTF8.GetBytes(stdin))}"
                },
                HostConfig = new HostConfig
                {
                    AutoRemove = false,
                    Memory = 256 * 1024 * 1024,
                    CPUQuota = 50000,
                    NetworkMode = "none"
                }
            };

            var createResponse = await _docker.Containers.CreateContainerAsync(containerConfig);
            containerId = createResponse.ID;
            await _docker.Containers.StartContainerAsync(containerId, new ContainerStartParameters());

            var waitTask    = _docker.Containers.WaitContainerAsync(containerId);
            var timeoutTask = Task.Delay(TimeSpan.FromSeconds(15));
            var winner      = await Task.WhenAny(waitTask, timeoutTask);

            if (winner == timeoutTask)
            {
                await _docker.Containers.StopContainerAsync(containerId, new ContainerStopParameters { WaitBeforeKillSeconds = 1 });
                return false; // TLE → test case failed
            }

            var waitResult = await waitTask;
            if (waitResult.StatusCode != 0) return false;

            var logsStream = await _docker.Containers.GetContainerLogsAsync(containerId, false, new ContainerLogsParameters
            {
                ShowStdout = true,
                ShowStderr = false,
            });
            var (stdout, _) = await logsStream.ReadOutputToEndAsync(CancellationToken.None);

            return string.Equals(stdout.Trim(), expectedOutput.Trim(), StringComparison.Ordinal);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running test case for language {Language}", language);
            return false;
        }
        finally
        {
            if (containerId != null)
            {
                try { await _docker.Containers.RemoveContainerAsync(containerId, new ContainerRemoveParameters { Force = true }); }
                catch { /* best effort */ }
            }
        }
    }
}
