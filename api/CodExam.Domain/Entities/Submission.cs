using CodExam.Domain.Enums;

namespace CodExam.Domain.Entities;

public class Submission
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public Guid QuestionId { get; set; }
    public string Language { get; set; } = null!;
    public string Code { get; set; } = null!;
    public ExecutionStatus Status { get; set; }
    public int? ExecutionTimeMs { get; set; }
    public int? MemoryUsedKb { get; set; }
    public int Score { get; set; } = 0;
    public DateTime SubmittedAt { get; set; }
    public int Version { get; set; } = 1;

    public QuizSession Session { get; set; } = null!;
    public Question Question { get; set; } = null!;
    public SubmissionReplay? Replay { get; set; }
}
