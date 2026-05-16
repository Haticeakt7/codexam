using CodExam.Application.DTOs.Quiz;

namespace CodExam.Application.DTOs.Session;

public class QuizInfoResponse
{
    public Guid               Id               { get; set; }
    public string             Title            { get; set; } = null!;
    public string?            Description      { get; set; }
    public int                DurationMinutes  { get; set; }
    public int                QuestionCount    { get; set; }
    public string             Mode             { get; set; } = null!;
    public List<FormFieldDto>  FormSchema       { get; set; } = [];
    public AntiCheatOptionsDto AntiCheatOptions { get; set; } = null!;
    public string             Status           { get; set; } = null!;
    public DateTime?          StartsAt         { get; set; }
    public DateTime?          EndsAt           { get; set; }
}
