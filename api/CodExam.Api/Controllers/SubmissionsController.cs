using CodExam.Application.DTOs.Submission;
using CodExam.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CodExam.Api.Controllers;

[ApiController]
[Route("api/submissions")]
public class SubmissionsController(ISubmissionService submissionService) : ControllerBase
{
    [HttpPatch("{id:guid}/replay")]
    public async Task<IActionResult> AppendReplayDiff(Guid id, [FromBody] AppendReplayDiffRequest request)
    {
        var sessionToken = Request.Headers["X-Session-Token"].FirstOrDefault()
            ?? throw new UnauthorizedAccessException("X-Session-Token header is required.");
        await submissionService.AppendReplayDiffAsync(id, sessionToken, request);
        return NoContent();
    }
}
