using System.Text.Json;

namespace CodExam.Domain.Entities;

public class SubmissionReplay
{
    public Guid Id { get; set; }
    public Guid SubmissionId { get; set; }
    public JsonDocument Diffs { get; set; } = null!;

    public Submission Submission { get; set; } = null!;
}
