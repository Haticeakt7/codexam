namespace CodExam.Application.DTOs.Admin;

public class AdminUserDto
{
    public Guid      Id          { get; set; }
    public string    Email       { get; set; } = null!;
    public string    DisplayName { get; set; } = null!;
    public string    Role        { get; set; } = null!;
    public string    Status      { get; set; } = null!;
    public DateTime  CreatedAt   { get; set; }
    public DateTime? UpdatedAt   { get; set; }
}
