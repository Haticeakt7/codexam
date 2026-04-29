using System.Text.Json;

namespace CodExam.Application.DTOs.Submission;

public class QuizResultsResponse
{
    public int                      ParticipantCount { get; set; }
    public double                   AvgScore         { get; set; }
    public List<ParticipantResult>  Participants     { get; set; } = [];
    public List<QuestionStat>       QuestionStats    { get; set; } = [];
}

public class ParticipantResult
{
    public Guid        SessionId           { get; set; }
    public JsonElement FormData            { get; set; }
    public int         TotalScore          { get; set; }
    public int         MaxScore            { get; set; }
    public int         CompletedQuestions  { get; set; }
    public DateTime    SubmittedAt         { get; set; }
}

public class QuestionStat
{
    public Guid   QuestionId  { get; set; }
    public string Title       { get; set; } = null!;
    public double SuccessRate { get; set; }
}
