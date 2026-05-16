namespace CodExam.Application.DTOs.Submission;

public class AppendReplayDiffRequest
{
    public List<ReplayDiffEntry> Diffs { get; set; } = [];
}

public class ReplayDiffEntry
{
    public int    TimeMs { get; set; }
    public string Diff   { get; set; } = null!;
}
