namespace CodExam.Application.DTOs.Session;

public class SubmitRequest
{
    public Guid           QuestionId        { get; set; }
    // Coding / BugFix
    public string?        Language          { get; set; }
    public string?        Code              { get; set; }
    // MultipleChoice — stable string IDs (new schema)
    public List<string>?  SelectedChoiceIds { get; set; }
    // ShortAnswer / OutputPrediction
    public string?        TextAnswer        { get; set; }
}
