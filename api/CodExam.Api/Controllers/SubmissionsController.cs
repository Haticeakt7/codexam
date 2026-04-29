using CodExam.Api.Filters;
using CodExam.Application.DTOs.Submission;
using CodExam.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CodExam.Api.Controllers;

[ApiController]
[Route("api/submissions")]
public class SubmissionsController(ISubmissionService submissionService) : ControllerBase
{
    [HttpPatch("{id:guid}/replay")]
    [RequireSessionToken]
    public async Task<IActionResult> AppendReplayDiff(Guid id, [FromBody] AppendReplayDiffRequest request)
    {
        var sessionToken = (string)HttpContext.Items[RequireSessionTokenAttribute.ItemKey]!;
        await submissionService.AppendReplayDiffAsync(id, sessionToken, request);
        return NoContent();
    }
}
