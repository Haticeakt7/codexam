using CodExam.Application.DTOs.Auth;

namespace CodExam.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> RegisterAsync(RegisterRequest request);
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<LoginResponse> RefreshAsync(RefreshRequest request);
    Task<AuthUserDto>   GetMeAsync(Guid userId);
}
