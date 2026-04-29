using System.Text.Json;

namespace CodExam.Application.DTOs.Question;

public class CreateQuestionRequest
{
    public string      Type    { get; set; } = null!; // "Coding" | "MultipleChoice" | ...
    public string      Title   { get; set; } = null!;
    public string      Body    { get; set; } = null!;
    public int         Points  { get; set; }
    public int         OrderNo { get; set; }
    public JsonElement Options { get; set; }
}
