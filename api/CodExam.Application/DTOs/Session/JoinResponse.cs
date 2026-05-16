using CodExam.Application.DTOs.Question;

namespace CodExam.Application.DTOs.Session;

public class JoinResponse
{
    public string          SessionToken { get; set; } = null!;
    public Guid            SessionId    { get; set; }
    public Guid            QuizId       { get; set; }
    public DateTime        EndsAt       { get; set; }
    public List<QuestionDto> Questions  { get; set; } = [];
}
