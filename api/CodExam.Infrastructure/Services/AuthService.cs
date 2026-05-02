using CodExam.Application.DTOs.Auth;
using CodExam.Application.Interfaces;
using CodExam.Infrastructure.Persistence;

namespace CodExam.Infrastructure.Services;

public class AuthService(AppDbContext db) : IAuthService
{
    public Task<LoginResponse> RegisterAsync(RegisterRequest request) => throw new NotImplementedException();
    public Task<LoginResponse> LoginAsync(LoginRequest request)       => throw new NotImplementedException();
    public Task<LoginResponse> RefreshAsync(RefreshRequest request)   => throw new NotImplementedException();
    public Task<AuthUserDto>   GetMeAsync(Guid userId)                => throw new NotImplementedException();
}
