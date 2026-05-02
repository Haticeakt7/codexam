using CodExam.Application.DTOs.Admin;
using CodExam.Application.DTOs.Quiz;
using CodExam.Application.Interfaces;
using CodExam.Infrastructure.Persistence;

namespace CodExam.Infrastructure.Services;

public class AdminService(AppDbContext db) : IAdminService
{
    public Task<StatsDto>           GetStatsAsync()                                                    => throw new NotImplementedException();
    public Task<List<AdminUserDto>> GetUsersAsync(string? search, string? role, int page, int pageSize) => throw new NotImplementedException();
    public Task<AdminUserDto>       UpdateUserAsync(Guid userId, UpdateUserRequest request)            => throw new NotImplementedException();
    public Task                     DeleteUserAsync(Guid userId)                                       => throw new NotImplementedException();
    public Task<List<QuizDto>>      GetAllQuizzesAsync()                                               => throw new NotImplementedException();
    public Task                     DeleteQuizAsync(Guid quizId)                                       => throw new NotImplementedException();
}
