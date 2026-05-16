using CodExam.Application.DTOs.Quiz;

namespace CodExam.Application.Interfaces;

public interface IQuizService
{
    Task<List<QuizDto>> GetUserQuizzesAsync(Guid userId);
    Task<QuizDto>       CreateQuizAsync(Guid userId, CreateQuizRequest request);
    Task<QuizDto>       GetQuizAsync(Guid quizId, Guid requesterId);
    Task<QuizDto>       UpdateQuizAsync(Guid quizId, Guid requesterId, UpdateQuizRequest request);
    Task                DeleteQuizAsync(Guid quizId, Guid requesterId);
    Task<QuizDto>       PublishQuizAsync(Guid quizId, Guid requesterId);
    Task<List<QuizDto>> GetAllQuizzesAsync();
    Task<QuizDto>       GetByParticipationTokenAsync(string token);
}
