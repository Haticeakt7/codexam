namespace CodExam.Application.DTOs.User;

public class UserPreferencesDto
{
    public string EditorTheme { get; set; } = "vs-dark";   // "vs" | "vs-dark" | "hc-black"
    public int    FontSize    { get; set; } = 14;
    public string LayoutJson  { get; set; } = "{}";        // serialized panel layout
}
