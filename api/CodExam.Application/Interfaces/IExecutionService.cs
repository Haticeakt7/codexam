using CodExam.Application.DTOs.Execute;

namespace CodExam.Application.Interfaces;

public interface IExecutionService
{
    Task<string>            EnqueueAsync(ExecuteRequest request);
    Task<ExecuteJobResponse> GetJobStatusAsync(string jobId);
}
