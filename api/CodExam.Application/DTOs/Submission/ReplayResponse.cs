namespace CodExam.Application.DTOs.Submission;

public class ReplayQuestionEntry
{
    public Guid                  SubmissionId   { get; set; }
    public Guid                  QuestionId     { get; set; }
    public string                QuestionTitle  { get; set; } = "";
    public string                QuestionType   { get; set; } = "";
    public int                   OrderNo        { get; set; }
    public List<ReplayDiffEntry> Diffs          { get; set; } = [];
}

public class ReplayResponse
{
    public Guid                  SubmissionId { get; set; }
    public List<ReplayDiffEntry> Diffs        { get; set; } = [];
    public List<ReplayQuestionEntry> Questions { get; set; } = [];
}
