using System.Text.Json;
using CodExam.Application.DTOs.Admin;
using CodExam.Application.DTOs.Quiz;
using CodExam.Application.Interfaces;
using CodExam.Domain.Entities;
using CodExam.Domain.Enums;
using CodExam.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace CodExam.Infrastructure.Services;

public class AdminService(AppDbContext db, IMemoryCache cache) : IAdminService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public async Task<StatsDto> GetStatsAsync()
    {
        var totalUsers = await db.Users.CountAsync();
        var activeQuizzes = await db.Quizzes.CountAsync(q => q.Status == QuizStatus.Active);
        
        var yesterday = DateTime.UtcNow.AddDays(-1);
        var dailyExecutions = await db.CodeExecutions.CountAsync(c => c.CreatedAt >= yesterday);
        var last24hErrors = await db.SystemErrorLogs.CountAsync(e => e.CreatedAt >= yesterday);

        return new StatsDto
        {
            TotalUsers = totalUsers,
            ActiveQuizzes = activeQuizzes,
            DailyExecutions = dailyExecutions,
            Last24hErrors = last24hErrors
        };
    }

    public async Task<List<AdminUserDto>> GetUsersAsync(string? search, string? role, int page, int pageSize)
    {
        var query = db.Users.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(u => u.Email.Contains(search) || u.DisplayName.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, true, out var parsedRole))
        {
            query = query.Where(u => u.Role == parsedRole);
        }

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return users.Select(u => new AdminUserDto
        {
            Id = u.Id,
            Email = u.Email,
            DisplayName = u.DisplayName,
            Role = u.Role.ToString(),
            Status = u.Status,
            CreatedAt = u.CreatedAt,
            UpdatedAt = u.UpdatedAt
        }).ToList();
    }

    public async Task<AdminUserDto> UpdateUserAsync(Guid userId, UpdateUserRequest request)
    {
        var user = await db.Users.FindAsync(userId);
        if (user == null) throw new KeyNotFoundException("User not found.");

        if (!string.IsNullOrWhiteSpace(request.Role)) user.Role = Enum.Parse<UserRole>(request.Role, true);
        if (!string.IsNullOrWhiteSpace(request.Status)) user.Status = request.Status;

        user.UpdatedAt = DateTime.UtcNow;

        db.Users.Update(user);
        await db.SaveChangesAsync();

        return new AdminUserDto
        {
            Id = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName,
            Role = user.Role.ToString(),
            Status = user.Status,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }

    public async Task DeleteUserAsync(Guid userId)
    {
        var user = await db.Users.FindAsync(userId);
        if (user == null) return;

        db.Users.Remove(user);
        await db.SaveChangesAsync();
    }

    public async Task<List<QuizDto>> GetAllQuizzesAsync()
    {
        var quizzes = await db.Quizzes
            .AsNoTracking()
            .Include(q => q.Questions)
            .Include(q => q.Sessions)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();

        return quizzes.Select(q => new QuizDto
        {
            Id = q.Id,
            Title = q.Title,
            Description = q.Description,
            DurationMinutes = q.DurationMinutes,
            Mode = q.Mode.ToString(),
            Status = q.Status.ToString(),
            AntiCheatOptions = q.AntiCheatOptions?.Deserialize<AntiCheatOptionsDto>(JsonOptions) ?? new AntiCheatOptionsDto(),
            FormSchema = q.FormSchema?.Deserialize<List<FormFieldDto>>(JsonOptions) ?? [],
            AccessCode = q.AccessCode,
            ParticipationToken = q.ParticipationToken.ToString(),
            ParticipantCount = q.Sessions?.Count ?? 0,
            QuestionCount = q.Questions?.Count ?? 0,
            CreatedAt = q.CreatedAt,
            PublishedAt = q.PublishedAt,
            StartsAt = q.StartsAt,
            EndsAt = q.EndsAt
        }).ToList();
    }

    public async Task DeleteQuizAsync(Guid quizId)
    {
        // Delete sessions first — QuizSession→Quiz FK is Restrict, not Cascade
        var sessions = await db.QuizSessions
            .Where(s => s.QuizId == quizId)
            .ToListAsync();
        if (sessions.Count > 0)
        {
            db.QuizSessions.RemoveRange(sessions);
            await db.SaveChangesAsync();
        }

        var quiz = await db.Quizzes.FindAsync(quizId);
        if (quiz == null) return;

        db.Quizzes.Remove(quiz);
        await db.SaveChangesAsync();
    }

    public async Task BulkDeleteQuizzesAsync(List<Guid> quizIds)
    {
        // Delete sessions first — QuizSession→Quiz FK is Restrict, not Cascade
        var sessions = await db.QuizSessions
            .Where(s => quizIds.Contains(s.QuizId))
            .ToListAsync();
        if (sessions.Count > 0)
        {
            db.QuizSessions.RemoveRange(sessions);
            await db.SaveChangesAsync();
        }

        var quizzes = await db.Quizzes
            .Where(q => quizIds.Contains(q.Id))
            .ToListAsync();
        if (quizzes.Count > 0)
        {
            db.Quizzes.RemoveRange(quizzes);
            await db.SaveChangesAsync();
        }
    }

    public async Task<List<AdminUserSessionDto>> GetUserSessionsAsync()
    {
        var now = DateTime.UtcNow;
        return await db.Users
            .AsNoTracking()
            .Where(u => u.RefreshToken != null && u.RefreshTokenExpiresAt > now)
            .OrderBy(u => u.DisplayName)
            .Select(u => new AdminUserSessionDto
            {
                UserId           = u.Id,
                Email            = u.Email,
                DisplayName      = u.DisplayName,
                Role             = u.Role.ToString(),
                SessionExpiresAt = u.RefreshTokenExpiresAt!.Value,
            })
            .ToListAsync();
    }

    public async Task RevokeUserSessionAsync(Guid userId)
    {
        var user = await db.Users.FindAsync(userId);
        if (user == null) return;

        user.SecurityStamp         = Guid.NewGuid();
        user.RefreshToken          = null;
        user.RefreshTokenExpiresAt = null;
        await db.SaveChangesAsync();

        // Evict the cached stamp so the next request picks up the new value immediately
        cache.Remove($"sec_stamp_{userId}");
    }

    public async Task<List<SystemLogDto>> GetSystemLogsAsync(string? source, int limit)
    {
        var query = db.SystemErrorLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(source))
            query = query.Where(l => l.SourceService == source);

        return await query
            .OrderByDescending(l => l.CreatedAt)
            .Take(limit)
            .Select(l => new SystemLogDto
            {
                Id            = l.Id,
                SourceService = l.SourceService,
                ErrorTitle    = l.ErrorTitle,
                ErrorMessage  = l.ErrorMessage,
                StackTrace    = l.StackTrace,
                CreatedAt     = l.CreatedAt,
            })
            .ToListAsync();
    }
}
