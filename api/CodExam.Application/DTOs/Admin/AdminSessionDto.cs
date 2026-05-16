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
    public int         TotalScore          { get; set; }
    public int         AntiCheatEventCount { get; set; }
    public List<AdminSessionEventDto> AntiCheatEvents { get; set; } = [];
    public List<AdminSessionEventDto> Warnings        { get; set; } = [];
    public string?     LatestCode          { get; set; }
    public string?     LatestLanguage      { get; set; }
    public int?        CurrentQuestionIndex { get; set; }
}

public class AdminSessionEventDto
{
    public string   EventType     { get; set; } = "";
    public string   Severity      { get; set; } = "";
    public DateTime Timestamp     { get; set; }
    public string?  Message       { get; set; }
    public Guid?    QuestionId    { get; set; }
    public string?  QuestionTitle { get; set; }
}
