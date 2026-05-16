using System.Text.Json;
using CodExam.Application.DTOs.Admin;
using CodExam.Application.DTOs.Quiz;
using CodExam.Application.DTOs.Session;
using CodExam.Application.Interfaces;
using CodExam.Domain.Entities;
using CodExam.Domain.Enums;
using CodExam.Infrastructure.Persistence;
using Hangfire;
using Hangfire.States;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace CodExam.Infrastructure.Services;

public class SessionService(AppDbContext db, IMonitorNotifier monitor, IMemoryCache cache, IBackgroundJobClient jobClient) : ISessionService
{
    private record CodeSnapshotCache(string Code, string Language, int QuestionIndex);
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public async Task<QuizInfoResponse> GetQuizInfoAsync(Guid quizId)
    {
        var quiz = await db.Quizzes
            .AsNoTracking()
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null) throw new KeyNotFoundException("Quiz not found.");

        return new QuizInfoResponse
        {
            Id = quiz.Id,
            Title = quiz.Title,
            Description = quiz.Description,
            DurationMinutes = quiz.DurationMinutes,
            QuestionCount = quiz.Questions.Count,
            Mode = quiz.Mode.ToString(),
            FormSchema = quiz.FormSchema?.Deserialize<List<FormFieldDto>>(JsonOptions) ?? [],
            AntiCheatOptions = quiz.AntiCheatOptions?.Deserialize<AntiCheatOptionsDto>(JsonOptions) ?? new AntiCheatOptionsDto(),
            Status = quiz.Status.ToString(),
            StartsAt = quiz.StartsAt,
            EndsAt = quiz.EndsAt
        };
    }

    public async Task<JoinResponse> JoinAsync(Guid quizId, JoinRequest request)
    {
        var quiz = await db.Quizzes
            .Include(q => q.Questions)
                .ThenInclude(q => q.TestCases)
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null) throw new KeyNotFoundException("Quiz not found.");

        // Quiz must be Active to accept participants
        if (quiz.Status != QuizStatus.Active)
            throw new InvalidOperationException("Quiz is not currently accepting participants.");

        var now = DateTime.UtcNow;

        // Mode-specific time window validation
        if (quiz.Mode == QuizMode.RealTime && quiz.StartsAt.HasValue)
        {
            var windowEnd = quiz.StartsAt.Value.AddMinutes(quiz.DurationMinutes);
            if (now < quiz.StartsAt.Value || now > windowEnd)
                throw new InvalidOperationException("Quiz participation window has closed.");
        }
        else if (quiz.Mode == QuizMode.FreeStyle && quiz.StartsAt.HasValue && quiz.EndsAt.HasValue)
        {
            if (now < quiz.StartsAt.Value || now > quiz.EndsAt.Value)
                throw new InvalidOperationException("Quiz participation window has closed.");
        }

        // Identity uniqueness check: if quiz has a designated identity field, reject duplicate participants
        var schema = quiz.FormSchema.Deserialize<List<CodExam.Application.DTOs.Quiz.FormFieldDto>>(JsonOptions) ?? [];
        var identityField = schema.FirstOrDefault(f => f.IsIdentity);
        if (identityField != null && request.FormData.TryGetValue(identityField.Label, out var identityElement))
        {
            var identityValue = (identityElement.ValueKind == System.Text.Json.JsonValueKind.String
                ? identityElement.GetString()
                : identityElement.ToString())?.Trim() ?? "";

            var existingFormDatas = await db.QuizSessions
                .Where(s => s.QuizId == quizId)
                .Select(s => s.FormData)
                .ToListAsync();

            var duplicate = existingFormDatas.Any(fd =>
            {
                if (!fd.RootElement.TryGetProperty(identityField.Label, out var val)) return false;
                var existing = (val.ValueKind == System.Text.Json.JsonValueKind.String
                    ? val.GetString() : val.ToString())?.Trim() ?? "";
                return string.Equals(existing, identityValue, StringComparison.OrdinalIgnoreCase);
            });

            if (duplicate)
                throw new InvalidOperationException("duplicate_identity");
        }

        var session = new QuizSession
        {
            Id = Guid.NewGuid(),
            QuizId = quizId,
            SessionToken = Guid.NewGuid(),
            FormData = JsonSerializer.SerializeToDocument(request.FormData),
            StartedAt = DateTime.UtcNow,
            EndsAt = DateTime.UtcNow.AddMinutes(quiz.DurationMinutes),
            IsActive = true
        };

        db.QuizSessions.Add(session);
        await db.SaveChangesAsync();

        // Monitor'a katılım bildirimi gönder
        await monitor.NotifyParticipantJoined(quizId, new
        {
            sessionId = session.Id,
            formData = request.FormData,
            startedAt = session.StartedAt,
            endsAt = session.EndsAt,
            isActive = true,
            isLocked = false,
            antiCheatEvents = new object[] { }
        });

        return new JoinResponse
        {
            SessionToken = session.SessionToken.ToString(),
            SessionId = session.Id,
            QuizId = quiz.Id,
            EndsAt = session.EndsAt,
            Questions = quiz.Questions.OrderBy(q => q.OrderNo).Select(q => new CodExam.Application.DTOs.Question.QuestionDto
            {
                Id = q.Id,
                Type = q.Type.ToString(),
                Title = q.Title,
                Body = q.Body,
                Points = q.Points,
                OrderNo = q.OrderNo,
                Options = q.Options.RootElement,
                TestCases = q.TestCases.Select(tc => new CodExam.Application.DTOs.Question.TestCaseDto
                {
                    Id             = tc.Id,
                    Input          = tc.IsVisible ? tc.Input : "",
                    ExpectedOutput = tc.IsVisible ? tc.ExpectedOutput : "",
                    IsVisible      = tc.IsVisible
                }).ToList()
            }).ToList()
        };
    }

    public async Task<SubmitResponse> SubmitAsync(Guid quizId, string sessionToken, SubmitRequest request)
    {
        if (!Guid.TryParse(sessionToken, out var token)) throw new UnauthorizedAccessException("Invalid token.");

        var session = await db.QuizSessions
            .Include(s => s.Submissions)
            .FirstOrDefaultAsync(s => s.QuizId == quizId && s.SessionToken == token);
        if (session == null || !session.IsActive || session.IsLocked || session.EndsAt < DateTime.UtcNow)
            throw new InvalidOperationException("Session is invalid or expired.");

        var question = await db.Questions
            .Include(q => q.TestCases)
            .FirstOrDefaultAsync(q => q.Id == request.QuestionId);
        if (question == null) throw new KeyNotFoundException("Question not found.");

        var existing = session.Submissions.FirstOrDefault(s => s.QuestionId == request.QuestionId);

        int score = 0;
        var status = ExecutionStatus.Pending;
        bool isGraded = false;

        bool isCodingType = question.Type == QuestionType.Coding || question.Type == QuestionType.BugFix;

        if (!isCodingType)
        {
            (score, status) = GradeNonCodingQuestion(question, request);
            isGraded = true;
        }

        Guid submissionId;

        if (existing != null)
        {
            existing.Language = request.Language ?? "unknown";
            existing.Code = GetSubmissionContent(request);
            existing.Status = status;
            existing.Score = score;
            existing.SubmittedAt = DateTime.UtcNow;
            existing.Version += 1;
            db.Submissions.Update(existing);
            submissionId = existing.Id;
        }
        else
        {
            var submission = new Submission
            {
                Id = Guid.NewGuid(),
                SessionId = session.Id,
                QuestionId = request.QuestionId,
                Language = request.Language ?? "unknown",
                Code = GetSubmissionContent(request),
                Status = status,
                Score = score,
                SubmittedAt = DateTime.UtcNow
            };
            db.Submissions.Add(submission);
            session.Submissions.Add(submission);
            submissionId = submission.Id;
        }

        session.TotalScore = session.Submissions.Sum(s => s.Score);
        db.QuizSessions.Update(session);
        await db.SaveChangesAsync();

        // Enqueue async grading for Coding/BugFix
        if (isCodingType && question.TestCases.Count > 0)
        {
            var job = Hangfire.Common.Job.FromExpression<IGradingWorker>(w => w.ProcessGradingJob(submissionId));
            jobClient.Create(job, new EnqueuedState("grading"));
        }

        await monitor.NotifySubmission(quizId, new
        {
            sessionId = session.Id,
            questionId = request.QuestionId,
            questionType = question.Type.ToString(),
            score,
            maxScore = question.Points,
            status = status.ToString()
        });

        return new SubmitResponse
        {
            SubmissionId = submissionId,
            Score        = score,
            MaxScore     = question.Points,
            Status       = status.ToString(),
            IsGraded     = isGraded
        };
    }

    public async Task LogEventAsync(Guid quizId, string sessionToken, ExamEventRequest request)
    {
        if (!Guid.TryParse(sessionToken, out var token)) throw new UnauthorizedAccessException("Invalid token.");

        var session = await db.QuizSessions.FirstOrDefaultAsync(s => s.QuizId == quizId && s.SessionToken == token);
        if (session == null || !session.IsActive)
            throw new InvalidOperationException("Session is invalid or inactive.");

        string? questionTitle = null;
        if (request.QuestionId.HasValue)
        {
            questionTitle = await db.Questions
                .Where(q => q.Id == request.QuestionId.Value)
                .Select(q => q.Title)
                .FirstOrDefaultAsync();
        }

        var examEvent = new ExamEvent
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            QuizId = quizId,
            QuestionId = request.QuestionId,
            EventType = Enum.Parse<EventType>(request.EventType, true),
            Severity = EventSeverity.Medium,
            Timestamp = DateTime.UtcNow,
            Metadata = request.Metadata.HasValue ? JsonDocument.Parse(request.Metadata.Value.GetRawText()) : JsonDocument.Parse("{}")
        };

        db.ExamEvents.Add(examEvent);
        await db.SaveChangesAsync();

        // Monitor'a anti-cheat event bildir
        await monitor.NotifyAntiCheatEvent(quizId, new
        {
            sessionId = session.Id,
            eventType = request.EventType,
            severity = "Medium",
            timestamp = examEvent.Timestamp,
            questionId = request.QuestionId,
            questionTitle
        });
    }

    public async Task<FinishResponse> FinishSessionAsync(Guid quizId, string sessionToken)
    {
        if (!Guid.TryParse(sessionToken, out var token)) throw new UnauthorizedAccessException("Invalid token.");

        var session = await db.QuizSessions
            .Include(s => s.Submissions)
            .Include(s => s.Quiz)
                .ThenInclude(q => q.Questions)
            .FirstOrDefaultAsync(s => s.QuizId == quizId && s.SessionToken == token);

        if (session == null) throw new KeyNotFoundException("Session not found.");
        if (!session.IsActive) throw new InvalidOperationException("Session is already finished.");

        var now = DateTime.UtcNow;
        session.IsActive = false;
        session.FinishedAt = now;

        // Toplam skoru hesapla
        session.TotalScore = session.Submissions.Sum(s => s.Score);

        db.QuizSessions.Update(session);
        await db.SaveChangesAsync();

        var maxScore = session.Quiz.Questions.Sum(q => q.Points);

        // Monitor'a bitirme bildirimi gönder
        await monitor.NotifySessionFinished(quizId, new
        {
            sessionId = session.Id,
            totalScore = session.TotalScore,
            maxScore,
            finishedAt = now
        });

        return new FinishResponse
        {
            SessionId = session.Id,
            TotalScore = session.TotalScore,
            MaxScore = maxScore,
            FinishedAt = now,
            SubmittedQuestions = session.Submissions.Select(s => s.QuestionId).Distinct().Count()
        };
    }

    public async Task CodeSnapshotAsync(Guid quizId, string sessionToken, CodeSnapshotRequest request)
    {
        if (!Guid.TryParse(sessionToken, out var token)) throw new UnauthorizedAccessException("Invalid token.");

        var session = await db.QuizSessions.FirstOrDefaultAsync(s => s.QuizId == quizId && s.SessionToken == token);
        if (session == null || !session.IsActive) return;

        // Canlı kod durumunu monitöre push et
        await monitor.NotifyCodeSnapshot(quizId, new
        {
            sessionId = session.Id,
            code = request.Code,
            language = request.Language,
            questionIndex = request.QuestionIndex,
            timestamp = DateTime.UtcNow
        });

        cache.Set($"snapshot_{session.Id}", new CodeSnapshotCache(request.Code, request.Language, request.QuestionIndex), TimeSpan.FromHours(2));
    }

    public async Task<List<AdminSessionDto>> GetSessionsByQuizAsync(Guid quizId, Guid requesterId)
    {
        var sessions = await db.QuizSessions
            .AsNoTracking()
            .Include(s => s.Quiz)
            .Include(s => s.ExamEvents)
                .ThenInclude(e => e.Question)
            .Include(s => s.Submissions)
            .Where(s => s.QuizId == quizId)
            .OrderByDescending(s => s.StartedAt)
            .ToListAsync();

        return sessions.Select(s =>
        {
            cache.TryGetValue<CodeSnapshotCache>($"snapshot_{s.Id}", out var snap);
            return new AdminSessionDto
            {
                Id = s.Id,
                QuizId = s.QuizId,
                QuizTitle = s.Quiz.Title,
                FormData = s.FormData.RootElement,
                StartedAt = s.StartedAt,
                EndsAt = s.EndsAt,
                FinishedAt = s.FinishedAt,
                IsActive = s.IsActive,
                IsLocked = s.IsLocked,
                TotalScore = s.TotalScore,
                AntiCheatEventCount = s.ExamEvents.Count(e => e.EventType != EventType.Warned),
                AntiCheatEvents = s.ExamEvents
                    .Where(e => e.EventType != EventType.Warned)
                    .Select(e => new AdminSessionEventDto
                    {
                        EventType     = e.EventType.ToString(),
                        Severity      = e.Severity.ToString(),
                        Timestamp     = e.Timestamp,
                        QuestionId    = e.QuestionId,
                        QuestionTitle = e.Question?.Title
                    }).ToList(),
                Warnings = s.ExamEvents
                    .Where(e => e.EventType == EventType.Warned)
                    .Select(e => new AdminSessionEventDto
                    {
                        EventType = e.EventType.ToString(),
                        Severity  = e.Severity.ToString(),
                        Timestamp = e.Timestamp,
                        Message   = e.Metadata.RootElement.TryGetProperty("message", out var msg) ? msg.GetString() : null
                    }).ToList(),
                LatestCode = snap?.Code,
                LatestLanguage = snap?.Language,
                CurrentQuestionIndex = snap?.QuestionIndex
            };
        }).ToList();
    }

    public async Task<List<AdminSessionDto>> GetAllSessionsAsync()
    {
        var sessions = await db.QuizSessions
            .AsNoTracking()
            .Include(s => s.Quiz)
            .Include(s => s.ExamEvents)
                .ThenInclude(e => e.Question)
            .Include(s => s.Submissions)
            .OrderByDescending(s => s.StartedAt)
            .ToListAsync();

        return sessions.Select(s =>
        {
            cache.TryGetValue<CodeSnapshotCache>($"snapshot_{s.Id}", out var snap);
            return new AdminSessionDto
            {
                Id = s.Id,
                QuizId = s.QuizId,
                QuizTitle = s.Quiz.Title,
                FormData = s.FormData.RootElement,
                StartedAt = s.StartedAt,
                EndsAt = s.EndsAt,
                FinishedAt = s.FinishedAt,
                IsActive = s.IsActive,
                IsLocked = s.IsLocked,
                TotalScore = s.TotalScore,
                AntiCheatEventCount = s.ExamEvents.Count(e => e.EventType != EventType.Warned),
                AntiCheatEvents = s.ExamEvents
                    .Where(e => e.EventType != EventType.Warned)
                    .Select(e => new AdminSessionEventDto
                    {
                        EventType     = e.EventType.ToString(),
                        Severity      = e.Severity.ToString(),
                        Timestamp     = e.Timestamp,
                        QuestionId    = e.QuestionId,
                        QuestionTitle = e.Question?.Title
                    }).ToList(),
                Warnings = s.ExamEvents
                    .Where(e => e.EventType == EventType.Warned)
                    .Select(e => new AdminSessionEventDto
                    {
                        EventType = e.EventType.ToString(),
                        Severity  = e.Severity.ToString(),
                        Timestamp = e.Timestamp,
                        Message   = e.Metadata.RootElement.TryGetProperty("message", out var msg) ? msg.GetString() : null
                    }).ToList(),
                LatestCode = snap?.Code,
                LatestLanguage = snap?.Language,
                CurrentQuestionIndex = snap?.QuestionIndex
            };
        }).ToList();
    }

    public async Task ForceEndSessionAsync(Guid sessionId)
    {
        var session = await db.QuizSessions.FindAsync(sessionId);
        if (session == null) return;

        session.IsActive = false;
        session.IsLocked = true;
        session.FinishedAt = DateTime.UtcNow;

        db.QuizSessions.Update(session);
        await db.SaveChangesAsync();
    }

    public async Task TerminateSessionAsync(Guid quizId, Guid sessionId, Guid requesterId)
    {
        var session = await db.QuizSessions
            .Include(s => s.Quiz)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.QuizId == quizId);

        if (session == null)
            throw new KeyNotFoundException("Session not found.");
        if (session.Quiz.OwnerId != requesterId)
            throw new UnauthorizedAccessException("You don't own this quiz.");

        session.IsActive = false;
        session.IsLocked = true;
        session.FinishedAt = DateTime.UtcNow;
        db.QuizSessions.Update(session);
        await db.SaveChangesAsync();

        await monitor.NotifyParticipantTerminated(sessionId);
        await monitor.NotifySessionLocked(quizId, new { sessionId });
    }

    public async Task SelfLockAsync(Guid quizId, string sessionToken)
    {
        if (!Guid.TryParse(sessionToken, out var token)) throw new UnauthorizedAccessException("Invalid token.");

        var session = await db.QuizSessions
            .FirstOrDefaultAsync(s => s.QuizId == quizId && s.SessionToken == token);

        if (session == null) throw new KeyNotFoundException("Session not found.");
        if (!session.IsActive) return; // already ended, no-op

        var now = DateTime.UtcNow;

        var examEvent = new ExamEvent
        {
            Id        = Guid.NewGuid(),
            SessionId = session.Id,
            QuizId    = quizId,
            EventType = EventType.PageRefresh,
            Severity  = EventSeverity.High,
            Timestamp = now,
            Metadata  = JsonDocument.Parse("{}")
        };
        db.ExamEvents.Add(examEvent);

        session.IsActive   = false;
        session.IsLocked   = true;
        session.FinishedAt = now;
        db.QuizSessions.Update(session);
        await db.SaveChangesAsync();

        await monitor.NotifyAntiCheatEvent(quizId, new
        {
            sessionId = session.Id,
            eventType = "PageRefresh",
            severity  = "High",
            timestamp = now
        });

        await monitor.NotifySessionLocked(quizId, new { sessionId = session.Id });
    }

    public async Task WarnAsync(Guid sessionId, string message)
    {
        var session = await db.QuizSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        if (session == null) return;

        var now      = DateTime.UtcNow;
        var metadata = JsonDocument.Parse(System.Text.Json.JsonSerializer.Serialize(new { message }));

        var examEvent = new ExamEvent
        {
            Id        = Guid.NewGuid(),
            SessionId = sessionId,
            QuizId    = session.QuizId,
            EventType = EventType.Warned,
            Severity  = EventSeverity.Low,
            Timestamp = now,
            Metadata  = metadata
        };
        db.ExamEvents.Add(examEvent);
        await db.SaveChangesAsync();

        await monitor.NotifyWarningSent(session.QuizId, new
        {
            sessionId,
            message,
            timestamp = now
        });
    }

    // ── Grading helpers ──────────────────────────────────────────────────────

    private static string GetSubmissionContent(SubmitRequest request)
    {
        if (!string.IsNullOrEmpty(request.Code)) return request.Code;
        if (!string.IsNullOrEmpty(request.TextAnswer)) return request.TextAnswer;
        if (request.SelectedChoiceIds != null) return System.Text.Json.JsonSerializer.Serialize(request.SelectedChoiceIds);
        return "";
    }

    private static (int score, ExecutionStatus status) GradeNonCodingQuestion(Question question, SubmitRequest request)
    {
        var opts = question.Options.Deserialize<System.Text.Json.JsonElement>();

        return question.Type switch
        {
            QuestionType.MultipleChoice   => GradeMcq(opts, request.SelectedChoiceIds, question.Points),
            QuestionType.ShortAnswer      => GradeShortAnswer(opts, request.TextAnswer, question.Points),
            QuestionType.OutputPrediction => GradeOutputPrediction(opts, request.TextAnswer, question.Points),
            _                             => (0, ExecutionStatus.Pending)
        };
    }

    // Options schema (new): { choices: [{id, text}], correctIds: ["id1","id2"], multiSelect: bool }
    private static (int score, ExecutionStatus status) GradeMcq(System.Text.Json.JsonElement opts, List<string>? selectedChoiceIds, int points)
    {
        if (selectedChoiceIds == null || selectedChoiceIds.Count == 0) return (0, ExecutionStatus.Failed);

        try
        {
            if (!opts.TryGetProperty("choices", out var choices)) return (0, ExecutionStatus.Failed);

            // Collect correct IDs from correctIds array
            var correctIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (opts.TryGetProperty("correctIds", out var correctIdsEl))
            {
                foreach (var el in correctIdsEl.EnumerateArray())
                {
                    var id = el.GetString();
                    if (id != null) correctIds.Add(id);
                }
            }

            // Validate that all selected IDs exist in the choices list
            var validIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var choice in choices.EnumerateArray())
            {
                if (choice.TryGetProperty("id", out var idEl))
                {
                    var id = idEl.GetString();
                    if (id != null) validIds.Add(id);
                }
            }

            var selected = selectedChoiceIds
                .Where(id => validIds.Contains(id))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            bool passed = selected.Count == correctIds.Count &&
                          selected.All(id => correctIds.Contains(id));

            return passed ? (points, ExecutionStatus.Passed) : (0, ExecutionStatus.Failed);
        }
        catch { }
        return (0, ExecutionStatus.Failed);
    }

    // Options schema: { acceptedAnswers: ["ans1","ans2"], matchMode: "exact"|"exactIgnoreCase"|"contains" }
    private static (int score, ExecutionStatus status) GradeShortAnswer(System.Text.Json.JsonElement opts, string? textAnswer, int points)
    {
        if (string.IsNullOrWhiteSpace(textAnswer)) return (0, ExecutionStatus.Failed);

        try
        {
            string matchMode = "exactIgnoreCase";
            if (opts.TryGetProperty("matchMode", out var mm)) matchMode = mm.GetString() ?? matchMode;

            if (opts.TryGetProperty("acceptedAnswers", out var answers))
            {
                foreach (var answer in answers.EnumerateArray())
                {
                    var expected = answer.GetString() ?? "";
                    bool match = matchMode switch
                    {
                        "exact"           => textAnswer == expected,
                        "exactIgnoreCase" => string.Equals(textAnswer, expected, StringComparison.OrdinalIgnoreCase),
                        "contains"        => textAnswer.Contains(expected, StringComparison.OrdinalIgnoreCase),
                        _                 => string.Equals(textAnswer, expected, StringComparison.OrdinalIgnoreCase)
                    };
                    if (match) return (points, ExecutionStatus.Passed);
                }
            }
        }
        catch { }
        return (0, ExecutionStatus.Failed);
    }

    // Options schema: { codeBlock, expectedOutput, matchMode: "trimmed"|"ignoreWhitespace"|"exact" }
    private static (int score, ExecutionStatus status) GradeOutputPrediction(System.Text.Json.JsonElement opts, string? textAnswer, int points)
    {
        if (string.IsNullOrWhiteSpace(textAnswer)) return (0, ExecutionStatus.Failed);

        try
        {
            if (!opts.TryGetProperty("expectedOutput", out var expectedEl)) return (0, ExecutionStatus.Failed);
            var expected = expectedEl.GetString() ?? "";

            string matchMode = "trimmed";
            if (opts.TryGetProperty("matchMode", out var mm)) matchMode = mm.GetString() ?? matchMode;

            bool match = matchMode switch
            {
                "exact"            => textAnswer == expected,
                "ignoreWhitespace" => Normalize(textAnswer) == Normalize(expected),
                _                  => textAnswer.Trim() == expected.Trim() // "trimmed" default
            };

            return match ? (points, ExecutionStatus.Passed) : (0, ExecutionStatus.Failed);
        }
        catch { }
        return (0, ExecutionStatus.Failed);
    }

    private static string Normalize(string s) =>
        string.Join(" ", s.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
}
