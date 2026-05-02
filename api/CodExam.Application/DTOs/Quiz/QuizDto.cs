namespace CodExam.Application.DTOs.Quiz;

public class QuizDto
{
    public Guid               Id               { get; set; }
    public string             Title            { get; set; } = null!;
    public string?            Description      { get; set; }
    public int                DurationMinutes  { get; set; }
    public string             Mode             { get; set; } = null!;
    public string             Status           { get; set; } = null!;
    public AntiCheatOptionsDto AntiCheatOptions { get; set; } = null!;
    public List<FormFieldDto>  FormSchema       { get; set; } = [];
    public string?            AccessCode       { get; set; }
    public int                ParticipantCount { get; set; }
    public int                QuestionCount    { get; set; }
    public DateTime           CreatedAt        { get; set; }
    public DateTime?          PublishedAt      { get; set; }
}

public class QuizInfoDto
{
    public Guid               Id               { get; set; }
    public string             Title            { get; set; } = null!;
    public string?            Description      { get; set; }
    public int                DurationMinutes  { get; set; }
    public int                QuestionCount    { get; set; }
    public List<FormFieldDto>  FormSchema       { get; set; } = [];
    public AntiCheatOptionsDto AntiCheatOptions { get; set; } = null!;
    public string             Status           { get; set; } = null!;
}
