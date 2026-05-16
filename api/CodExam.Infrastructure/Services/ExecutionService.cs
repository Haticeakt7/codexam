using CodExam.Application.DTOs.Execute;
using CodExam.Application.Interfaces;
using CodExam.Domain.Entities;
using CodExam.Domain.Enums;
using CodExam.Infrastructure.Persistence;
using Hangfire;
using Hangfire.States;
using Microsoft.EntityFrameworkCore;

namespace CodExam.Infrastructure.Services;

public class ExecutionService(AppDbContext db, IBackgroundJobClient jobClient) : IExecutionService
{
    public async Task<string> EnqueueAsync(ExecuteRequest request)
    {
        var codeExecution = new CodeExecution
        {
            Id = Guid.NewGuid(),
            Language = request.Language,
            SourceCode = request.Code,
            StdinText = request.Stdin ?? "",
            Status = ExecutionStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        var compileJob = new CompileJob
        {
            Id = Guid.NewGuid(),
            ExecutionId = codeExecution.Id,
            JobStatus = "Queued",
            QueuedAt = DateTime.UtcNow
        };

        db.CodeExecutions.Add(codeExecution);
        db.CompileJobs.Add(compileJob);
        await db.SaveChangesAsync();

        var hangfireJob = Hangfire.Common.Job.FromExpression<IExecutionWorker>(w => w.ProcessExecutionJob(compileJob.Id));
        var jobId = jobClient.Create(hangfireJob, new EnqueuedState("execution"));

        return compileJob.Id.ToString();
    }

    public async Task<ExecuteJobResponse> GetJobStatusAsync(string jobId)
    {
        if (!Guid.TryParse(jobId, out var parsedId)) throw new ArgumentException("Invalid job ID format.");

        var compileJob = await db.CompileJobs
            .Include(cj => cj.Execution)
            .FirstOrDefaultAsync(cj => cj.Id == parsedId);

        if (compileJob == null) throw new KeyNotFoundException("Job not found.");

        return new ExecuteJobResponse
        {
            JobId = compileJob.Id.ToString(),
            Status = compileJob.Execution.Status.ToString(),
            Stdout = compileJob.Execution.StdoutText,
            Stderr = compileJob.Execution.StderrText,
            ExecutionTimeMs = compileJob.Execution.ExecutionTimeMs,
            MemoryUsedKb = compileJob.Execution.MemoryUsedKb
        };
    }
}
