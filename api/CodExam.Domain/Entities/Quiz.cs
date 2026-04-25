using System.Text.Json;
using CodExam.Domain.Enums;

namespace CodExam.Domain.Entities;

public class Quiz
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public int DurationMinutes { get; set; }
    public QuizMode Mode { get; set; }
    public JsonDocument AntiCheatOptions { get; set; } = null!;
    public JsonDocument FormSchema { get; set; } = null!;
    public string? AccessCode { get; set; }
    public QuizStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }

    public User Owner { get; set; } = null!;
    public ICollection<Question> Questions { get; set; } = [];
    public ICollection<QuizSession> Sessions { get; set; } = [];
}
