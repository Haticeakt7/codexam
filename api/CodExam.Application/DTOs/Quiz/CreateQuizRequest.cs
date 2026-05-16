namespace CodExam.Application.DTOs.Quiz;

public class CreateQuizRequest
{
    public string              Title             { get; set; } = null!;
    public string?             Description       { get; set; }
    public int                 DurationMinutes   { get; set; }
    public string              Mode              { get; set; } = null!; // "RealTime" | "FreeStyle"
    public AntiCheatOptionsDto AntiCheatOptions  { get; set; } = new();
    public List<FormFieldDto>  FormSchema        { get; set; } = [];
    public string?             AccessCode        { get; set; }
    public DateTime?           StartsAt          { get; set; }
    public DateTime?           EndsAt            { get; set; }
}
