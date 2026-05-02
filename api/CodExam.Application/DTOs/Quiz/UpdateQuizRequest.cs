namespace CodExam.Application.DTOs.Quiz;

public class UpdateQuizRequest
{
    public string?              Title            { get; set; }
    public string?              Description      { get; set; }
    public int?                 DurationMinutes  { get; set; }
    public string?              Mode             { get; set; }
    public AntiCheatOptionsDto? AntiCheatOptions { get; set; }
    public List<FormFieldDto>?  FormSchema       { get; set; }
    public string?              AccessCode       { get; set; }
}
