using System.Text.Json;

namespace CodExam.Domain.Entities;

public class QuizSession
{
    public Guid Id { get; set; }
    public Guid QuizId { get; set; }
    public Guid? UserId { get; set; }
    public Guid SessionToken { get; set; }
    public JsonDocument FormData { get; set; } = null!;
    public DateTime StartedAt { get; set; }
    public DateTime EndsAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsLocked { get; set; } = false;
    public int TotalScore { get; set; } = 0;

    public Quiz Quiz { get; set; } = null!;
    public User? User { get; set; }
    public ICollection<Submission> Submissions { get; set; } = [];
    public ICollection<ExamEvent> ExamEvents { get; set; } = [];
}
