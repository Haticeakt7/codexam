using System.Text.Json;
using CodExam.Application.DTOs.Question;
using CodExam.Application.Interfaces;
using CodExam.Domain.Entities;
using CodExam.Domain.Enums;
using CodExam.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CodExam.Infrastructure.Services;

public class QuestionService(AppDbContext db) : IQuestionService
{
    public async Task<List<QuestionDto>> GetQuestionsAsync(Guid quizId, Guid requesterId)
    {
        var questions = await db.Questions
            .AsNoTracking()
            .Include(q => q.TestCases)
            .Where(q => q.QuizId == quizId)
            .OrderBy(q => q.OrderNo)
            .ToListAsync();

        return questions.Select(MapToDto).ToList();
    }

    public async Task<QuestionDto> CreateQuestionAsync(Guid quizId, Guid requesterId, CreateQuestionRequest request)
    {
        var question = new Question
        {
            Id = Guid.NewGuid(),
            QuizId = quizId,
            Type = Enum.Parse<QuestionType>(request.Type, true),
            Title = request.Title,
            Body = request.Body,
            Points = request.Points,
            OrderNo = request.OrderNo,
            Options = JsonDocument.Parse(request.Options.GetRawText()),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Questions.Add(question);
        await db.SaveChangesAsync();

        return MapToDto(question);
    }

    public async Task<QuestionDto> UpdateQuestionAsync(Guid questionId, Guid requesterId, UpdateQuestionRequest request)
    {
        var question = await db.Questions.Include(q => q.TestCases).FirstOrDefaultAsync(q => q.Id == questionId);
        if (question == null) throw new KeyNotFoundException("Question not found.");

        if (request.Title != null) question.Title = request.Title;
        if (request.Body != null) question.Body = request.Body;
        if (request.Points.HasValue) question.Points = request.Points.Value;
        if (request.OrderNo.HasValue) question.OrderNo = request.OrderNo.Value;
        if (request.Options.HasValue) question.Options = JsonDocument.Parse(request.Options.Value.GetRawText());

        question.UpdatedAt = DateTime.UtcNow;

        db.Questions.Update(question);
        await db.SaveChangesAsync();

        return MapToDto(question);
    }

    public async Task DeleteQuestionAsync(Guid questionId, Guid requesterId)
    {
        var question = await db.Questions.FindAsync(questionId);
        if (question == null) return;

        db.Questions.Remove(question);
        await db.SaveChangesAsync();
    }

    public async Task UpdateOrderAsync(Guid questionId, Guid requesterId, int newOrder)
    {
        var question = await db.Questions.FindAsync(questionId);
        if (question == null) throw new KeyNotFoundException("Question not found.");

        question.OrderNo = newOrder;
        question.UpdatedAt = DateTime.UtcNow;

        db.Questions.Update(question);
        await db.SaveChangesAsync();
    }

    public async Task<List<TestCaseDto>> GetTestCasesAsync(Guid questionId, Guid requesterId)
    {
        var testCases = await db.TestCases
            .AsNoTracking()
            .Where(t => t.QuestionId == questionId)
            .OrderBy(t => t.OrderNo)
            .ToListAsync();

        return testCases.Select(MapTestCaseDto).ToList();
    }

    public async Task<TestCaseDto> CreateTestCaseAsync(Guid questionId, Guid requesterId, CreateTestCaseRequest request)
    {
        var testCase = new TestCase
        {
            Id = Guid.NewGuid(),
            QuestionId = questionId,
            Input = request.Input,
            ExpectedOutput = request.ExpectedOutput,
            IsVisible = request.IsVisible,
            CreatedAt = DateTime.UtcNow
        };

        db.TestCases.Add(testCase);
        await db.SaveChangesAsync();

        return MapTestCaseDto(testCase);
    }

    public async Task DeleteTestCaseAsync(Guid questionId, Guid testCaseId, Guid requesterId)
    {
        var testCase = await db.TestCases.FirstOrDefaultAsync(t => t.Id == testCaseId && t.QuestionId == questionId);
        if (testCase == null) return;

        db.TestCases.Remove(testCase);
        await db.SaveChangesAsync();
    }

    private static QuestionDto MapToDto(Question question)
    {
        return new QuestionDto
        {
            Id = question.Id,
            Type = question.Type.ToString(),
            Title = question.Title,
            Body = question.Body,
            Points = question.Points,
            OrderNo = question.OrderNo,
            Options = question.Options.RootElement,
            TestCases = question.TestCases?.Select(MapTestCaseDto).ToList() ?? []
        };
    }

    private static TestCaseDto MapTestCaseDto(TestCase testCase)
    {
        return new TestCaseDto
        {
            Id = testCase.Id,
            Input = testCase.Input,
            ExpectedOutput = testCase.ExpectedOutput,
            IsVisible = testCase.IsVisible
        };
    }
}
