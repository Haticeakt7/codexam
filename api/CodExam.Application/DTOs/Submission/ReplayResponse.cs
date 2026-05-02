namespace CodExam.Application.DTOs.Submission;

public class ReplayResponse
{
    public Guid                  SubmissionId { get; set; }
    public List<ReplayDiffEntry> Diffs        { get; set; } = [];
}
