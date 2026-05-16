using CodExam.Application.Interfaces;
using CodExam.Domain.Enums;
using CodExam.Infrastructure.Persistence;
using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace CodExam.Worker;

public class ExecutionWorker : IExecutionWorker
{
    private readonly ILogger<ExecutionWorker> _logger;
    private readonly AppDbContext _dbContext;
    private readonly IDockerClient _dockerClient;

    public ExecutionWorker(ILogger<ExecutionWorker> logger, AppDbContext dbContext, IDockerClient dockerClient)
    {
        _logger = logger;
        _dbContext = dbContext;
        _dockerClient = dockerClient;
    }

    public async Task ProcessExecutionJob(Guid compileJobId)
    {
        _logger.LogInformation("Processing execution job {JobId}", compileJobId);

        var compileJob = await _dbContext.CompileJobs
            .Include(cj => cj.Execution)
            .FirstOrDefaultAsync(cj => cj.Id == compileJobId);

        if (compileJob == null || compileJob.Execution == null)
        {
            _logger.LogWarning("Job {JobId} not found or has no execution.", compileJobId);
            return;
        }

        var execution = compileJob.Execution;
        compileJob.JobStatus = "Running";
        execution.Status = ExecutionStatus.Running;
        await _dbContext.SaveChangesAsync();

        var startTime = DateTime.UtcNow;

        try
        {
            var imageTag = $"codexam-runner-{execution.Language.ToLower()}";
            var containerConfig = new CreateContainerParameters
            {
                Image = imageTag,
                Env = new List<string>
                {
                    $"SOURCE_CODE={Convert.ToBase64String(Encoding.UTF8.GetBytes(execution.SourceCode))}",
                    $"STDIN={Convert.ToBase64String(Encoding.UTF8.GetBytes(execution.StdinText))}"
                },
                HostConfig = new HostConfig
                {
                    AutoRemove = false,
                    Memory = 256 * 1024 * 1024,
                    CPUQuota = 50000,
                    NetworkMode = "none"
                }
            };

            var containerResponse = await _dockerClient.Containers.CreateContainerAsync(containerConfig);
            var containerId = containerResponse.ID;
            await _dockerClient.Containers.StartContainerAsync(containerId, new ContainerStartParameters());

            // Wait for completion (with timeout)
            var waitTask = _dockerClient.Containers.WaitContainerAsync(containerId);
            var timeoutTask = Task.Delay(TimeSpan.FromSeconds(15));
            var completedTask = await Task.WhenAny(waitTask, timeoutTask);

            if (completedTask == timeoutTask)
            {
                await _dockerClient.Containers.StopContainerAsync(containerId, new ContainerStopParameters { WaitBeforeKillSeconds = 1 });
                execution.Status = ExecutionStatus.TLE;
                execution.StderrText = "Execution timed out.";
            }
            else
            {
                var waitResponse = await waitTask;
                execution.Status = waitResponse.StatusCode == 0 ? ExecutionStatus.Passed : ExecutionStatus.Failed;

                var logsStream = await _dockerClient.Containers.GetContainerLogsAsync(containerId, false, new ContainerLogsParameters
                {
                    ShowStdout = true,
                    ShowStderr = true,
                });

                var (stdout, stderr) = await logsStream.ReadOutputToEndAsync(CancellationToken.None);

                if (waitResponse.StatusCode == 0)
                {
                    execution.StdoutText = stdout.Trim();
                }
                else
                {
                    execution.StderrText = stderr.Trim();
                }
            }

            await _dockerClient.Containers.RemoveContainerAsync(containerId, new ContainerRemoveParameters { Force = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing code.");
            execution.Status = ExecutionStatus.Error;
            execution.StderrText = ex.Message;
        }
        finally
        {
            var endTime = DateTime.UtcNow;
            execution.ExecutionTimeMs = (int)(endTime - startTime).TotalMilliseconds;
            compileJob.JobStatus = "Completed";
            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("Job {JobId} completed with status {Status}", compileJobId, execution.Status);
        }
    }
}
