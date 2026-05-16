using System.Text.Json;

namespace CodExam.Application.DTOs.Session;

public class ExamEventRequest
{
    public string       EventType  { get; set; } = null!; // "TabSwitch" | "FullscreenExit" | "ClipboardAttempt" | "Keydown"
    public Guid?        QuestionId { get; set; }
    public JsonElement? Metadata   { get; set; }
}
