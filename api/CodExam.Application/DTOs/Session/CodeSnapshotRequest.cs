namespace CodExam.Application.DTOs.Session;

public class CodeSnapshotRequest
{
    public string Code { get; set; } = "";
    public string Language { get; set; } = "";
    public int QuestionIndex { get; set; }
}
