namespace CodExam.Application.DTOs.Auth;

public class RegisterRequest
{
    public string Email       { get; set; } = null!;
    public string Password    { get; set; } = null!;
    public string DisplayName { get; set; } = null!;
}
