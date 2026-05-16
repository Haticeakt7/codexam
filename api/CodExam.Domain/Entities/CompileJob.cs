namespace CodExam.Domain.Entities;

public class CompileJob
{
    public Guid Id { get; set; }
    public Guid ExecutionId { get; set; }
    public string? RunnerContainerId { get; set; }
    public string JobStatus { get; set; } = "Queued";
    public DateTime QueuedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }

    public CodeExecution Execution { get; set; } = null!;
}
