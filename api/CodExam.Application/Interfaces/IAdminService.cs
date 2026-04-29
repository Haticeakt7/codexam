using CodExam.Application.DTOs.Admin;
using CodExam.Application.DTOs.Quiz;

namespace CodExam.Application.Interfaces;

public interface IAdminService
{
    Task<StatsDto>          GetStatsAsync();
    Task<List<AdminUserDto>> GetUsersAsync(string? search, string? role, int page, int pageSize);
    Task<AdminUserDto>      UpdateUserAsync(Guid userId, UpdateUserRequest request);
    Task                    DeleteUserAsync(Guid userId);
    Task<List<QuizDto>>     GetAllQuizzesAsync();
    Task                    DeleteQuizAsync(Guid quizId);
}
