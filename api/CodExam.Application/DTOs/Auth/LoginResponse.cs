namespace CodExam.Application.DTOs.Auth;

public class LoginResponse
{
    public string      AccessToken  { get; set; } = null!;
    public string      RefreshToken { get; set; } = null!;
    public int         ExpiresIn    { get; set; }
    public AuthUserDto User         { get; set; } = null!;
}

public class AuthUserDto
{
    public Guid   Id          { get; set; }
    public string Email       { get; set; } = null!;
    public string DisplayName { get; set; } = null!;
    public string Role        { get; set; } = null!;
}
