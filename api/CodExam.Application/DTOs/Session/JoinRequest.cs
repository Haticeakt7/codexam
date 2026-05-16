using System.Text.Json;

namespace CodExam.Application.DTOs.Session;

public class JoinRequest
{
    public Dictionary<string, JsonElement> FormData { get; set; } = [];
}
