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
    public int         ViolationCount      { get; set; }
    public DateTime    SubmittedAt         { get; set; }
}

public class QuestionStat
{
    public Guid   QuestionId  { get; set; }
    public string Title       { get; set; } = null!;
    public double SuccessRate { get; set; }
}

public class SessionSubmissionsResponse
{
    public Guid                       SessionId   { get; set; }
    public JsonElement                FormData    { get; set; }
    public DateTime                   StartedAt   { get; set; }
    public List<SessionSubmissionDto> Submissions { get; set; } = [];
}

public class SessionSubmissionDto
{
    public Guid     SubmissionId   { get; set; }
    public Guid     QuestionId     { get; set; }
    public string   QuestionTitle  { get; set; } = null!;
    public string   QuestionType   { get; set; } = null!;
    public int      QuestionPoints { get; set; }
    public string   Language       { get; set; } = null!;
    public string   Code           { get; set; } = null!;
    public int      Score          { get; set; }
    public string   Status         { get; set; } = null!;
    public DateTime SubmittedAt    { get; set; }
    public bool     HasReplay      { get; set; }
    public List<ViolationDto> Violations { get; set; } = [];
}

public class ViolationDto
{
    public string   EventType     { get; set; } = null!;
    public string   Severity      { get; set; } = null!;
    public DateTime Timestamp     { get; set; }
}
