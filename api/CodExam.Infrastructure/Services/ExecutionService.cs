using CodExam.Application.DTOs.Execute;
using CodExam.Application.Interfaces;
using CodExam.Infrastructure.Persistence;
using Hangfire;

namespace CodExam.Infrastructure.Services;

public class ExecutionService(AppDbContext db, IBackgroundJobClient jobClient) : IExecutionService
{
    public Task<string>             EnqueueAsync(ExecuteRequest request)    => throw new NotImplementedException();
    public Task<ExecuteJobResponse> GetJobStatusAsync(string jobId)         => throw new NotImplementedException();
}
