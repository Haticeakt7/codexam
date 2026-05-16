using System.Text.Json;

namespace CodExam.Application.DTOs.Question;

public class UpdateQuestionRequest
{
    public string?      Title   { get; set; }
    public string?      Body    { get; set; }
    public int?         Points  { get; set; }
    public int?         OrderNo { get; set; }
    public JsonElement? Options { get; set; }
}
