using CodExam.Application.DTOs.Submission;

namespace CodExam.Application.Interfaces;

public interface ISubmissionService
{
    Task                    AppendReplayDiffAsync(Guid submissionId, string sessionToken, AppendReplayDiffRequest request);
    Task<ReplayResponse>    GetReplayAsync(Guid sessionId, Guid requesterId);
    Task<QuizResultsResponse> GetResultsAsync(Guid quizId, Guid requesterId);
}
