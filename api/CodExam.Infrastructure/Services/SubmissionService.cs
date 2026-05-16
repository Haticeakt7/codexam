using System.Text.Json;
using CodExam.Application.DTOs.Submission;
using CodExam.Application.Interfaces;
using CodExam.Domain.Entities;
using CodExam.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CodExam.Infrastructure.Services;

public class SubmissionService(AppDbContext db) : ISubmissionService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public async Task AppendReplayDiffAsync(Guid submissionId, string sessionToken, AppendReplayDiffRequest request)
    {
        var submission = await db.Submissions
            .Include(s => s.Session)
            .Include(s => s.Replay)
            .FirstOrDefaultAsync(s => s.Id == submissionId);

        if (submission == null || submission.Session.SessionToken.ToString() != sessionToken)
            throw new UnauthorizedAccessException("Invalid submission or token.");

        if (submission.Replay == null)
        {
            submission.Replay = new SubmissionReplay
            {
                Id = Guid.NewGuid(),
                SubmissionId = submissionId,
                Diffs = JsonSerializer.SerializeToDocument(request.Diffs)
            };
            db.SubmissionReplays.Add(submission.Replay);
        }
        else
        {
            var existingDiffs = submission.Replay.Diffs.Deserialize<List<ReplayDiffEntry>>(JsonOptions) ?? [];
            existingDiffs.AddRange(request.Diffs);
            submission.Replay.Diffs = JsonSerializer.SerializeToDocument(existingDiffs);
            db.SubmissionReplays.Update(submission.Replay);
        }

        await db.SaveChangesAsync();
    }

    public async Task<ReplayResponse> GetReplayAsync(Guid sessionId, Guid requesterId)
    {
        var submissions = await db.Submissions
            .AsNoTracking()
            .Include(s => s.Replay)
            .Include(s => s.Question)
            .Where(s => s.SessionId == sessionId && s.Replay != null)
            .OrderBy(s => s.Question.OrderNo)
            .ToListAsync();

        if (submissions.Count == 0) return new ReplayResponse { SubmissionId = Guid.Empty, Diffs = [], Questions = [] };

        // Build per-question entries for all coding submissions with replay data
        var questionEntries = submissions
            .GroupBy(s => s.QuestionId)
            .Select(g => g.OrderByDescending(s => s.SubmittedAt).First())
            .OrderBy(s => s.Question.OrderNo)
            .Select(s => new ReplayQuestionEntry
            {
                SubmissionId  = s.Id,
                QuestionId    = s.QuestionId,
                QuestionTitle = s.Question.Title,
                QuestionType  = s.Question.Type.ToString(),
                OrderNo       = s.Question.OrderNo,
                Diffs         = s.Replay!.Diffs.Deserialize<List<ReplayDiffEntry>>(JsonOptions) ?? []
            })
            .ToList();

        // Legacy single-submission compatibility: first entry's fields
        var first = questionEntries[0];
        return new ReplayResponse
        {
            SubmissionId = first.SubmissionId,
            Diffs        = first.Diffs,
            Questions    = questionEntries
        };
    }

    public async Task<SessionSubmissionsResponse> GetSessionSubmissionsAsync(Guid sessionId, Guid requesterId)
    {
        var session = await db.QuizSessions
            .AsNoTracking()
            .Include(s => s.Quiz)
            .Include(s => s.Submissions)
                .ThenInclude(sub => sub.Question)
            .Include(s => s.Submissions)
                .ThenInclude(sub => sub.Replay)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
            throw new KeyNotFoundException("Session not found.");

        if (session.Quiz.OwnerId != requesterId)
            throw new UnauthorizedAccessException("Access denied.");

        var submissionDtos = session.Submissions
            .GroupBy(s => s.QuestionId)
            .Select(g => g.OrderByDescending(s => s.SubmittedAt).First())
            .Select(s => new SessionSubmissionDto
            {
                SubmissionId   = s.Id,
                QuestionId     = s.QuestionId,
                QuestionTitle  = s.Question.Title,
                QuestionType   = s.Question.Type.ToString(),
                QuestionPoints = s.Question.Points,
                Language       = s.Language,
                Code           = s.Code,
                Score          = s.Score,
                Status         = s.Status.ToString(),
                SubmittedAt    = s.SubmittedAt,
                HasReplay      = s.Replay != null
            })
            .OrderBy(s => s.QuestionTitle)
            .ToList();

        return new SessionSubmissionsResponse
        {
            SessionId   = sessionId,
            FormData    = session.FormData.RootElement,
            Submissions = submissionDtos
        };
    }

    public async Task<QuizResultsResponse> GetResultsAsync(Guid quizId, Guid requesterId)
    {
        var sessions = await db.QuizSessions
            .AsNoTracking()
            .Include(s => s.Submissions)
            .Where(s => s.QuizId == quizId)
            .ToListAsync();

        var questions = await db.Questions
            .AsNoTracking()
            .Where(q => q.QuizId == quizId)
            .ToListAsync();

        var maxScore = questions.Sum(q => q.Points);

        var participants = sessions.Select(s => new ParticipantResult
        {
            SessionId = s.Id,
            FormData = s.FormData.RootElement,
            TotalScore = s.TotalScore,
            MaxScore = maxScore,
            CompletedQuestions = s.Submissions.Select(sub => sub.QuestionId).Distinct().Count(),
            SubmittedAt = s.FinishedAt ?? s.StartedAt
        }).ToList();

        var avgScore = participants.Count > 0 ? participants.Average(p => p.TotalScore) : 0;

        var stats = questions.Select(q =>
        {
            var questionSubmissions = sessions.SelectMany(s => s.Submissions).Where(sub => sub.QuestionId == q.Id).ToList();
            var successCount = questionSubmissions.Count(sub => sub.Score == q.Points);
            var rate = questionSubmissions.Count > 0 ? (double)successCount / questionSubmissions.Count * 100 : 0;
            return new QuestionStat { QuestionId = q.Id, Title = q.Title, SuccessRate = rate };
        }).ToList();

        return new QuizResultsResponse
        {
            ParticipantCount = sessions.Count,
            AvgScore = avgScore,
            Participants = participants,
            QuestionStats = stats
        };
    }

}
