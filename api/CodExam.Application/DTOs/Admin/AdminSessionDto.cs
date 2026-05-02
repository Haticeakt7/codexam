using System.Text.Json;

namespace CodExam.Application.DTOs.Admin;

public class AdminSessionDto
{
    public Guid        Id          { get; set; }
    public Guid        QuizId      { get; set; }
    public string      QuizTitle   { get; set; } = null!;
    public JsonElement FormData    { get; set; }
    public DateTime    StartedAt   { get; set; }
    public DateTime    EndsAt      { get; set; }
    public DateTime?   FinishedAt  { get; set; }
    public bool        IsActive    { get; set; }
    public bool        IsLocked    { get; set; }
}
