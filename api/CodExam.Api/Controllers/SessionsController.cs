using System.Security.Claims;
using CodExam.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CodExam.Api.Controllers;

[ApiController]
[Route("api/sessions")]
public class SessionsController(ISubmissionService submissionService) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("{sessionId:guid}/replay")]
    [Authorize(Policy = "RequireUser")]
    public async Task<IActionResult> GetReplay(Guid sessionId)
    {
        var result = await submissionService.GetReplayAsync(sessionId, UserId);
        return Ok(result);
    }

    [HttpGet("{sessionId:guid}/submissions")]
    [Authorize(Policy = "RequireUser")]
    public async Task<IActionResult> GetSessionSubmissions(Guid sessionId)
    {
        var result = await submissionService.GetSessionSubmissionsAsync(sessionId, UserId);
        return Ok(result);
    }

}
