using System.Security.Claims;
using CodExam.Application.DTOs.Quiz;
using CodExam.Application.DTOs.Session;
using CodExam.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CodExam.Api.Controllers;

[ApiController]
[Route("api/quizzes")]
public class QuizzesController(
    IQuizService     quizService,
    IQuestionService questionService,
    ISessionService  sessionService,
    ISubmissionService submissionService) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // --- Quiz CRUD ---

    [HttpGet]
    [Authorize(Policy = "RequireUser")]
    public async Task<IActionResult> GetMyQuizzes()
    {
        var result = await quizService.GetUserQuizzesAsync(UserId);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "RequireUser")]
    public async Task<IActionResult> CreateQuiz([FromBody] CreateQuizRequest request)
    {
        var result = await quizService.CreateQuizAsync(UserId, request);
        return CreatedAtAction(nameof(GetQuiz), new { id = result.Id }, result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "RequireUser")]
    public async Task<IActionResult> GetQuiz(Guid id)
    {
        var result = await quizService.GetQuizAsync(id, UserId);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "RequireUser")]
    public async Task<IActionResult> UpdateQuiz(Guid id, [FromBody] UpdateQuizRequest request)
    {
        var result = await quizService.UpdateQuizAsync(id, UserId, request);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireUser")]
    public async Task<IActionResult> DeleteQuiz(Guid id)
    {
        await quizService.DeleteQuizAsync(id, UserId);
        return NoContent();
    }

    [HttpPost("{id:guid}/publish")]
    [Authorize(Policy = "RequireUser")]
    public async Task<IActionResult> PublishQuiz(Guid id)
    {
        var result = await quizService.PublishQuizAsync(id, UserId);
        return Ok(result);
    }

    // --- Public quiz info (for participants) ---

    [HttpGet("{id:guid}/info")]
    public async Task<IActionResult> GetQuizInfo(Guid id)
    {
        var result = await sessionService.GetQuizInfoAsync(id);
        return Ok(result);
    }

    // --- Questions (owner/admin) ---

    [HttpGet("{id:guid}/questions")]
    [Authorize(Policy = "RequireUser")]
    public async Task<IActionResult> GetQuestions(Guid id)
    {
        var result = await questionService.GetQuestionsAsync(id, UserId);
        return Ok(result);
    }

    [HttpPost("{id:guid}/questions")]
    [Authorize(Policy = "RequireUser")]
    public async Task<IActionResult> CreateQuestion(Guid id, [FromBody] CodExam.Application.DTOs.Question.CreateQuestionRequest request)
    {
        var result = await questionService.CreateQuestionAsync(id, UserId, request);
        return CreatedAtAction(nameof(GetQuestions), new { id }, result);
    }

    // --- Sessions (owner/admin) ---

    [HttpGet("{id:guid}/sessions")]
    [Authorize(Policy = "RequireUser")]
    public async Task<IActionResult> GetSessions(Guid id)
    {
        var result = await sessionService.GetSessionsByQuizAsync(id, UserId);
        return Ok(result);
    }

    [HttpGet("{id:guid}/results")]
    [Authorize(Policy = "RequireUser")]
    public async Task<IActionResult> GetResults(Guid id)
    {
        var result = await submissionService.GetResultsAsync(id, UserId);
        return Ok(result);
    }

    // --- Participation (public, session token) ---

    [HttpPost("{id:guid}/join")]
    public async Task<IActionResult> JoinQuiz(Guid id, [FromBody] JoinRequest request)
    {
        var result = await sessionService.JoinAsync(id, request);
        return Ok(result);
    }

    [HttpPost("{id:guid}/submit")]
    public async Task<IActionResult> Submit(Guid id, [FromBody] SubmitRequest request)
    {
        var sessionToken = Request.Headers["X-Session-Token"].FirstOrDefault();
        if (string.IsNullOrEmpty(sessionToken))
            return Unauthorized(new { title = "X-Session-Token header is required." });
        await sessionService.SubmitAsync(id, sessionToken, request);
        return Accepted();
    }

    [HttpPost("{id:guid}/event")]
    public async Task<IActionResult> LogEvent(Guid id, [FromBody] ExamEventRequest request)
    {
        var sessionToken = Request.Headers["X-Session-Token"].FirstOrDefault();
        if (string.IsNullOrEmpty(sessionToken))
            return Unauthorized(new { title = "X-Session-Token header is required." });
        await sessionService.LogEventAsync(id, sessionToken, request);
        return NoContent();
    }
}
