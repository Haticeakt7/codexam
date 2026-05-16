using CodExam.Application.DTOs.Execute;
using CodExam.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CodExam.Api.Controllers;

[ApiController]
[Route("api/execute")]
public class ExecuteController(IExecutionService executionService, IConfiguration configuration) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Enqueue([FromBody] ExecuteRequest request)
    {
        var jobId = await executionService.EnqueueAsync(request);
        return Accepted(new { jobId });
    }

    [HttpGet("{jobId}")]
    public async Task<IActionResult> GetStatus(string jobId)
    {
        var result = await executionService.GetJobStatusAsync(jobId);
        return Ok(result);
    }

    [HttpGet("languages")]
    public IActionResult GetSupportedLanguages()
    {
        var languages = configuration
            .GetSection("SupportedLanguages")
            .Get<List<SupportedLanguageDto>>() ?? [];
        return Ok(languages);
    }
}
