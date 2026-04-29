using CodExam.Application.DTOs.Submission;
using CodExam.Application.Interfaces;
using CodExam.Infrastructure.Persistence;

namespace CodExam.Infrastructure.Services;

public class SubmissionService(AppDbContext db) : ISubmissionService
{
    public Task                     AppendReplayDiffAsync(Guid submissionId, string sessionToken, AppendReplayDiffRequest request) => throw new NotImplementedException();
    public Task<ReplayResponse>     GetReplayAsync(Guid sessionId, Guid requesterId)                                               => throw new NotImplementedException();
    public Task<QuizResultsResponse> GetResultsAsync(Guid quizId, Guid requesterId)                                               => throw new NotImplementedException();
}
