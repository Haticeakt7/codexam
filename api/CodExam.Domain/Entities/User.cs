using CodExam.Domain.Enums;

namespace CodExam.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string DisplayName { get; set; } = null!;
    public UserRole Role { get; set; }
    public string Status { get; set; } = "active";
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    public ICollection<Quiz> Quizzes { get; set; } = [];
    public ICollection<QuizSession> Sessions { get; set; } = [];
    public ICollection<AuditLog> AuditLogs { get; set; } = [];
}
