using CodExam.Application.DTOs.Admin;
using CodExam.Application.DTOs.Session;
using CodExam.Application.Interfaces;
using CodExam.Infrastructure.Persistence;

namespace CodExam.Infrastructure.Services;

public class SessionService(AppDbContext db) : ISessionService
{
    public Task<QuizInfoResponse>     GetQuizInfoAsync(Guid quizId)                                           => throw new NotImplementedException();
    public Task<JoinResponse>         JoinAsync(Guid quizId, JoinRequest request)                             => throw new NotImplementedException();
    public Task                       SubmitAsync(Guid quizId, string sessionToken, SubmitRequest request)    => throw new NotImplementedException();
    public Task                       LogEventAsync(Guid quizId, string sessionToken, ExamEventRequest request) => throw new NotImplementedException();
    public Task<List<AdminSessionDto>> GetSessionsByQuizAsync(Guid quizId, Guid requesterId)                  => throw new NotImplementedException();
    public Task<List<AdminSessionDto>> GetAllSessionsAsync()                                                   => throw new NotImplementedException();
    public Task                       ForceEndSessionAsync(Guid sessionId)                                    => throw new NotImplementedException();
}
