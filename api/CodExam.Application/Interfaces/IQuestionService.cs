using CodExam.Application.DTOs.Question;

namespace CodExam.Application.Interfaces;

public interface IQuestionService
{
    Task<List<QuestionDto>> GetQuestionsAsync(Guid quizId, Guid requesterId);
    Task<QuestionDto>       CreateQuestionAsync(Guid quizId, Guid requesterId, CreateQuestionRequest request);
    Task<QuestionDto>       UpdateQuestionAsync(Guid questionId, Guid requesterId, UpdateQuestionRequest request);
    Task                    DeleteQuestionAsync(Guid questionId, Guid requesterId);
    Task                    UpdateOrderAsync(Guid questionId, Guid requesterId, int newOrder);
    Task<List<TestCaseDto>> GetTestCasesAsync(Guid questionId, Guid requesterId);
    Task<TestCaseDto>       CreateTestCaseAsync(Guid questionId, Guid requesterId, CreateTestCaseRequest request);
    Task                    DeleteTestCaseAsync(Guid questionId, Guid testCaseId, Guid requesterId);
}
