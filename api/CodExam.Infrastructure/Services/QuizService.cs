using CodExam.Application.DTOs.Quiz;
using CodExam.Application.Interfaces;
using CodExam.Infrastructure.Persistence;

namespace CodExam.Infrastructure.Services;

public class QuizService(AppDbContext db) : IQuizService
{
    public Task<List<QuizDto>> GetUserQuizzesAsync(Guid userId)                                        => throw new NotImplementedException();
    public Task<QuizDto>       CreateQuizAsync(Guid userId, CreateQuizRequest request)                 => throw new NotImplementedException();
    public Task<QuizDto>       GetQuizAsync(Guid quizId, Guid requesterId)                             => throw new NotImplementedException();
    public Task<QuizDto>       UpdateQuizAsync(Guid quizId, Guid requesterId, UpdateQuizRequest request) => throw new NotImplementedException();
    public Task                DeleteQuizAsync(Guid quizId, Guid requesterId)                          => throw new NotImplementedException();
    public Task<QuizDto>       PublishQuizAsync(Guid quizId, Guid requesterId)                         => throw new NotImplementedException();
    public Task<List<QuizDto>> GetAllQuizzesAsync()                                                    => throw new NotImplementedException();
}
