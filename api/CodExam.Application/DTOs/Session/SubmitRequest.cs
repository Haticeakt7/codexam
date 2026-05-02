namespace CodExam.Application.DTOs.Session;

public class SubmitRequest
{
    public Guid         QuestionId       { get; set; }
    // Coding
    public string?      Language         { get; set; }
    public string?      Code             { get; set; }
    // MultipleChoice
    public List<int>?   SelectedChoices  { get; set; }
    // ShortAnswer / OutputPrediction / BugFix
    public string?      TextAnswer       { get; set; }
}
