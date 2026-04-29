using CodExam.Application.DTOs.Admin;
using CodExam.Application.DTOs.Session;

namespace CodExam.Application.Interfaces;

public interface ISessionService
{
    Task<QuizInfoResponse>    GetQuizInfoAsync(Guid quizId);
    Task<JoinResponse>        JoinAsync(Guid quizId, JoinRequest request);
    Task                      SubmitAsync(Guid quizId, string sessionToken, SubmitRequest request);
    Task                      LogEventAsync(Guid quizId, string sessionToken, ExamEventRequest request);
    Task<List<AdminSessionDto>> GetSessionsByQuizAsync(Guid quizId, Guid requesterId);
    Task<List<AdminSessionDto>> GetAllSessionsAsync();
    Task                      ForceEndSessionAsync(Guid sessionId);
}
