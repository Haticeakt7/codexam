using System.Text.Json;
using CodExam.Application.DTOs.Quiz;
using CodExam.Application.Interfaces;
using CodExam.Domain.Entities;
using CodExam.Domain.Enums;
using CodExam.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CodExam.Infrastructure.Services;

public class QuizService(AppDbContext db) : IQuizService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public async Task<List<QuizDto>> GetUserQuizzesAsync(Guid userId)
    {
        var quizzes = await db.Quizzes
            .AsNoTracking()
            .Include(q => q.Questions)
            .Include(q => q.Sessions)
            .Where(q => q.OwnerId == userId)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();

        return quizzes.Select(MapToDto).ToList();
    }

    public async Task<QuizDto> CreateQuizAsync(Guid userId, CreateQuizRequest request)
    {
        var quiz = new Quiz
        {
            Id = Guid.NewGuid(),
            OwnerId = userId,
            Title = request.Title,
            Description = request.Description,
            DurationMinutes = request.DurationMinutes,
            Mode = Enum.Parse<QuizMode>(request.Mode, true),
            AntiCheatOptions = JsonSerializer.SerializeToDocument(request.AntiCheatOptions),
            FormSchema = JsonSerializer.SerializeToDocument(request.FormSchema),
            AccessCode = string.IsNullOrWhiteSpace(request.AccessCode) ? null : request.AccessCode,
            Status = QuizStatus.Draft,
            ParticipationToken = Guid.NewGuid(),
            StartsAt = request.StartsAt,
            EndsAt = request.EndsAt,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Quizzes.Add(quiz);
        await db.SaveChangesAsync();

        return MapToDto(quiz);
    }

    public async Task<QuizDto> GetQuizAsync(Guid quizId, Guid requesterId)
    {
        var quiz = await db.Quizzes
            .AsNoTracking()
            .Include(q => q.Questions)
            .Include(q => q.Sessions)
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null) throw new KeyNotFoundException("Quiz not found.");

        return MapToDto(quiz);
    }

    public async Task<QuizDto> UpdateQuizAsync(Guid quizId, Guid requesterId, UpdateQuizRequest request)
    {
        var quiz = await db.Quizzes
            .Include(q => q.Questions)
            .Include(q => q.Sessions)
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null) throw new KeyNotFoundException("Quiz not found.");

        var hasParticipants = quiz.Sessions.Any();
        var isLocked = quiz.Status == QuizStatus.Active
                    || quiz.Status == QuizStatus.Ended
                    || hasParticipants;

        if (isLocked)
        {
            // Only title, description, and accessCode may be changed after participants join / quiz goes active.
            // Mode, DurationMinutes, FormSchema, StartsAt, EndsAt are immutable.
            if (request.Mode != null
             || request.DurationMinutes.HasValue
             || request.FormSchema != null
             || request.StartsAt.HasValue
             || request.EndsAt.HasValue)
            {
                throw new InvalidOperationException(
                    "Cannot change quiz structure after it becomes active or participants have joined.");
            }
        }

        if (request.Title != null) quiz.Title = request.Title;
        if (request.Description != null) quiz.Description = request.Description;

        if (!isLocked)
        {
            if (request.DurationMinutes.HasValue) quiz.DurationMinutes = request.DurationMinutes.Value;
            if (request.Mode != null) quiz.Mode = Enum.Parse<QuizMode>(request.Mode, true);
            if (request.AntiCheatOptions != null) quiz.AntiCheatOptions = JsonSerializer.SerializeToDocument(request.AntiCheatOptions);
            if (request.FormSchema != null) quiz.FormSchema = JsonSerializer.SerializeToDocument(request.FormSchema);

            if (request.ClearStartsAt)
                quiz.StartsAt = null;
            else if (request.StartsAt.HasValue)
                quiz.StartsAt = request.StartsAt.Value;

            if (request.ClearEndsAt)
                quiz.EndsAt = null;
            else if (request.EndsAt.HasValue)
                quiz.EndsAt = request.EndsAt.Value;
        }

        // If an empty string is passed, we can treat it as removing the access code.
        if (request.AccessCode != null) quiz.AccessCode = string.IsNullOrWhiteSpace(request.AccessCode) ? null : request.AccessCode;

        quiz.UpdatedAt = DateTime.UtcNow;

        db.Quizzes.Update(quiz);
        await db.SaveChangesAsync();

        return MapToDto(quiz);
    }

    public async Task DeleteQuizAsync(Guid quizId, Guid requesterId)
    {
        var quiz = await db.Quizzes
            .Include(q => q.Sessions)
                .ThenInclude(s => s.Submissions)
                    .ThenInclude(sub => sub.Replay)
            .Include(q => q.Sessions)
                .ThenInclude(s => s.ExamEvents)
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null) return;

        // Cascade sırası: Replay → Submissions → ExamEvents → Sessions → Quiz
        foreach (var session in quiz.Sessions)
        {
            foreach (var submission in session.Submissions)
            {
                if (submission.Replay != null)
                    db.SubmissionReplays.Remove(submission.Replay);
            }
            db.Submissions.RemoveRange(session.Submissions);
            db.ExamEvents.RemoveRange(session.ExamEvents);
        }
        db.QuizSessions.RemoveRange(quiz.Sessions);
        db.Quizzes.Remove(quiz);

        await db.SaveChangesAsync();
    }

    public async Task<QuizDto> PublishQuizAsync(Guid quizId, Guid requesterId)
    {
        var quiz = await db.Quizzes
            .Include(q => q.Questions)
            .Include(q => q.Sessions)
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null) throw new KeyNotFoundException("Quiz not found.");

        if (quiz.Status != QuizStatus.Draft)
            throw new InvalidOperationException("Only quizzes in Draft status can be published.");

        if (quiz.OwnerId != requesterId)
            throw new InvalidOperationException("You do not own this quiz.");

        if (!quiz.Questions.Any())
            throw new InvalidOperationException("Quiz must have at least one question before publishing.");

        var now = DateTime.UtcNow;

        if (quiz.StartsAt.HasValue && quiz.StartsAt.Value <= now)
            throw new InvalidOperationException("StartsAt must be in the future.");

        if (quiz.StartsAt.HasValue && quiz.EndsAt.HasValue && quiz.EndsAt.Value <= quiz.StartsAt.Value)
            throw new InvalidOperationException("EndsAt must be after StartsAt.");

        if (quiz.Mode == QuizMode.FreeStyle && !quiz.EndsAt.HasValue)
            throw new InvalidOperationException("FreeStyle quizzes require an end date (EndsAt).");

        quiz.PublishedAt = now;
        quiz.UpdatedAt = now;

        if (quiz.StartsAt.HasValue && quiz.StartsAt.Value > now)
        {
            // Scheduled — awaiting StartsAt
            quiz.Status = QuizStatus.Published;
        }
        else
        {
            // No StartsAt (or StartsAt in the past which was already validated above) → immediately available
            quiz.Status = QuizStatus.Active;
        }

        db.Quizzes.Update(quiz);
        await db.SaveChangesAsync();

        return MapToDto(quiz);
    }

    public async Task<List<QuizDto>> GetAllQuizzesAsync()
    {
        var quizzes = await db.Quizzes
            .AsNoTracking()
            .Include(q => q.Questions)
            .Include(q => q.Sessions)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();

        return quizzes.Select(MapToDto).ToList();
    }

    public async Task<QuizDto> GetByParticipationTokenAsync(string token)
    {
        if (!Guid.TryParse(token, out var guid))
            throw new KeyNotFoundException("Invalid participation token.");

        var quiz = await db.Quizzes
            .AsNoTracking()
            .Include(q => q.Questions)
            .Include(q => q.Sessions)
            .FirstOrDefaultAsync(q => q.ParticipationToken == guid);

        if (quiz == null) throw new KeyNotFoundException("Quiz not found.");
        return MapToDto(quiz);
    }

    private static QuizDto MapToDto(Quiz quiz)
    {
        return new QuizDto
        {
            Id = quiz.Id,
            Title = quiz.Title,
            Description = quiz.Description,
            DurationMinutes = quiz.DurationMinutes,
            Mode = quiz.Mode.ToString(),
            Status = quiz.Status.ToString(),
            AntiCheatOptions = quiz.AntiCheatOptions?.Deserialize<AntiCheatOptionsDto>(JsonOptions) ?? new AntiCheatOptionsDto(),
            FormSchema = quiz.FormSchema?.Deserialize<List<FormFieldDto>>(JsonOptions) ?? [],
            AccessCode = quiz.AccessCode,
            ParticipationToken = quiz.ParticipationToken.ToString(),
            ParticipantCount = quiz.Sessions?.Count ?? 0,
            QuestionCount = quiz.Questions?.Count ?? 0,
            CreatedAt = quiz.CreatedAt,
            PublishedAt = quiz.PublishedAt,
            StartsAt = quiz.StartsAt,
            EndsAt = quiz.EndsAt
        };
    }
}
