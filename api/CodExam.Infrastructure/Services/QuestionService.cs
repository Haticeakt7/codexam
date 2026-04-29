using CodExam.Application.DTOs.Question;
using CodExam.Application.Interfaces;
using CodExam.Infrastructure.Persistence;

namespace CodExam.Infrastructure.Services;

public class QuestionService(AppDbContext db) : IQuestionService
{
    public Task<List<QuestionDto>> GetQuestionsAsync(Guid quizId, Guid requesterId)                                              => throw new NotImplementedException();
    public Task<QuestionDto>       CreateQuestionAsync(Guid quizId, Guid requesterId, CreateQuestionRequest request)             => throw new NotImplementedException();
    public Task<QuestionDto>       UpdateQuestionAsync(Guid questionId, Guid requesterId, UpdateQuestionRequest request)         => throw new NotImplementedException();
    public Task                    DeleteQuestionAsync(Guid questionId, Guid requesterId)                                        => throw new NotImplementedException();
    public Task                    UpdateOrderAsync(Guid questionId, Guid requesterId, int newOrder)                             => throw new NotImplementedException();
    public Task<List<TestCaseDto>> GetTestCasesAsync(Guid questionId, Guid requesterId)                                          => throw new NotImplementedException();
    public Task<TestCaseDto>       CreateTestCaseAsync(Guid questionId, Guid requesterId, CreateTestCaseRequest request)         => throw new NotImplementedException();
    public Task                    DeleteTestCaseAsync(Guid questionId, Guid testCaseId, Guid requesterId)                       => throw new NotImplementedException();
}
