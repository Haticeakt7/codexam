using CodExam.Domain.Enums;

namespace CodExam.Domain.Entities;

public class CodeExecution
{
    public Guid Id { get; set; }
    public string Language { get; set; } = null!;
    public string SourceCode { get; set; } = null!;
    public string StdinText { get; set; } = "";
    public string? StdoutText { get; set; }
    public string? StderrText { get; set; }
    public int? ExecutionTimeMs { get; set; }
    public int? MemoryUsedKb { get; set; }
    public ExecutionStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }

    public CompileJob? CompileJob { get; set; }
}
