namespace CodExam.Application.DTOs.Execute;

public class SupportedLanguageDto
{
    public string Id             { get; set; } = null!;  // "python", "javascript", "cpp", etc.
    public string Label          { get; set; } = null!;  // "Python 3", "Node.js", "C++"
    public string MonacoLanguage { get; set; } = null!;  // Monaco editor language ID
    public string DefaultCode    { get; set; } = "";
}
