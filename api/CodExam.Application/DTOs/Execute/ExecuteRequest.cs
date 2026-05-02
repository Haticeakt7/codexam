namespace CodExam.Application.DTOs.Execute;

public class ExecuteRequest
{
    public string  Language { get; set; } = null!;
    public string  Code     { get; set; } = null!;
    public string? Stdin    { get; set; }
}
