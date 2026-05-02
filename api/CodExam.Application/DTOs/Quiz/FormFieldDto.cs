namespace CodExam.Application.DTOs.Quiz;

public class FormFieldDto
{
    public string Key      { get; set; } = null!;
    public string Label    { get; set; } = null!;
    public string Type     { get; set; } = null!;  // "text" | "number" | "email"
    public bool   Required { get; set; }
}
