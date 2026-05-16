using System.Text.Json;
using CodExam.Domain.Enums;

namespace CodExam.Domain.Entities;

public class ExamEvent
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public Guid QuizId { get; set; }
    public Guid? QuestionId { get; set; }
    public EventType EventType { get; set; }
    public EventSeverity Severity { get; set; }
    public DateTime Timestamp { get; set; }
    public JsonDocument Metadata { get; set; } = null!;

    public QuizSession Session { get; set; } = null!;
    public Question? Question { get; set; }
}
