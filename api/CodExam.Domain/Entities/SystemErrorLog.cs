namespace CodExam.Domain.Entities;

public class SystemErrorLog
{
    public Guid Id { get; set; }
    public string SourceService { get; set; } = null!;
    public string ErrorTitle { get; set; } = null!;
    public string ErrorMessage { get; set; } = null!;
    public string? StackTrace { get; set; }
    public DateTime CreatedAt { get; set; }
}
