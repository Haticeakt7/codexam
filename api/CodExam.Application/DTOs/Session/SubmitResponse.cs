namespace CodExam.Application.DTOs.Session;

public class SubmitResponse
{
    public Guid   SubmissionId { get; set; }
    public int    Score        { get; set; }
    public int    MaxScore     { get; set; }
    /// <summary>Passed | Failed | Pending (Coding/BugFix graded asynchronously)</summary>
    public string Status       { get; set; } = "Pending";
    /// <summary>false for Coding/BugFix — final score arrives via async grading job</summary>
    public bool   IsGraded     { get; set; }
}
