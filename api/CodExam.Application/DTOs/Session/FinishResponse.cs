namespace CodExam.Application.DTOs.Session;

public class FinishResponse
{
    public Guid SessionId { get; set; }
    public int TotalScore { get; set; }
    public int MaxScore { get; set; }
    public DateTime FinishedAt { get; set; }
    public int SubmittedQuestions { get; set; }
}
