namespace CodExam.Application.DTOs.Admin;

public class UpdateUserRequest
{
    public string? Role   { get; set; }  // "Admin" | "User"
    public string? Status { get; set; }  // "active" | "inactive"
}
