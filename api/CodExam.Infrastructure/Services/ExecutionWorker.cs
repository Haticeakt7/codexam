using CodExam.Application.Interfaces;
using CodExam.Domain.Enums;
using CodExam.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CodExam.Infrastructure.Services;

public class ExecutionWorker(AppDbContext db) : IExecutionWorker
{
    public async Task ProcessExecutionJob(Guid compileJobId)
    {
        var compileJob = await db.CompileJobs.Include(c => c.Execution).FirstOrDefaultAsync(c => c.Id == compileJobId);
        if (compileJob == null) return;

        compileJob.JobStatus = "Processing";
        compileJob.StartedAt = DateTime.UtcNow;
        compileJob.Execution.Status = ExecutionStatus.Running;
        await db.SaveChangesAsync();

        // Simulate execution delay for now, actual worker logic will connect to Docker API
        await Task.Delay(1000);

        compileJob.JobStatus = "Completed";
        compileJob.FinishedAt = DateTime.UtcNow;
        compileJob.Execution.Status = ExecutionStatus.Passed;
        compileJob.Execution.StdoutText = "Execution finished successfully.";
        compileJob.Execution.ExecutionTimeMs = 15;
        compileJob.Execution.MemoryUsedKb = 1024;
        
        await db.SaveChangesAsync();
    }
}
