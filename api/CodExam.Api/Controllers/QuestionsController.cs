using System.Security.Claims;
using CodExam.Application.DTOs.Question;
using CodExam.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CodExam.Api.Controllers;

[ApiController]
[Route("api/questions")]
[Authorize(Policy = "RequireUser")]
public class QuestionsController(IQuestionService questionService) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateQuestion(Guid id, [FromBody] UpdateQuestionRequest request)
    {
        var result = await questionService.UpdateQuestionAsync(id, UserId, request);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteQuestion(Guid id)
    {
        await questionService.DeleteQuestionAsync(id, UserId);
        return NoContent();
    }

    [HttpPatch("{id:guid}/order")]
    public async Task<IActionResult> UpdateOrder(Guid id, [FromBody] int newOrder)
    {
        await questionService.UpdateOrderAsync(id, UserId, newOrder);
        return NoContent();
    }

    [HttpGet("{id:guid}/test-cases")]
    public async Task<IActionResult> GetTestCases(Guid id)
    {
        var result = await questionService.GetTestCasesAsync(id, UserId);
        return Ok(result);
    }

    [HttpPost("{id:guid}/test-cases")]
    public async Task<IActionResult> CreateTestCase(Guid id, [FromBody] CreateTestCaseRequest request)
    {
        var result = await questionService.CreateTestCaseAsync(id, UserId, request);
        return CreatedAtAction(nameof(GetTestCases), new { id }, result);
    }

    [HttpDelete("{questionId:guid}/test-cases/{caseId:guid}")]
    public async Task<IActionResult> DeleteTestCase(Guid questionId, Guid caseId)
    {
        await questionService.DeleteTestCaseAsync(questionId, caseId, UserId);
        return NoContent();
    }
}
