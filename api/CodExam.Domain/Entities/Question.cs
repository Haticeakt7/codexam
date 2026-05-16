using System.Text.Json;
using CodExam.Domain.Enums;

namespace CodExam.Domain.Entities;

public class Question
{
    public Guid Id { get; set; }
    public Guid QuizId { get; set; }
    public QuestionType Type { get; set; }
    public string Title { get; set; } = null!;
    public string Body { get; set; } = null!;
    public int Points { get; set; }
    public int OrderNo { get; set; }
    public JsonDocument Options { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Quiz Quiz { get; set; } = null!;
    public ICollection<TestCase> TestCases { get; set; } = [];
    public ICollection<Submission> Submissions { get; set; } = [];
}
