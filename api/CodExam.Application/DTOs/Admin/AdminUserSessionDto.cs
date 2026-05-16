namespace CodExam.Application.DTOs.Admin;

public class AdminUserSessionDto
{
    public Guid     UserId          { get; set; }
    public string   Email           { get; set; } = null!;
    public string   DisplayName     { get; set; } = null!;
    public string   Role            { get; set; } = null!;
    public DateTime SessionExpiresAt { get; set; }
}
