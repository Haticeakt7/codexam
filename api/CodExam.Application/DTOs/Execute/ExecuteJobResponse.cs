namespace CodExam.Application.DTOs.Execute;

public class ExecuteJobResponse
{
    public string  JobId           { get; set; } = null!;
    public string  Status          { get; set; } = null!;
    public string? Stdout          { get; set; }
    public string? Stderr          { get; set; }
    public int?    ExecutionTimeMs { get; set; }
    public int?    MemoryUsedKb   { get; set; }
}
