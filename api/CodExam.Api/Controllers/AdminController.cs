using CodExam.Application.DTOs.Admin;
using CodExam.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CodExam.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "RequireAdmin")]
public class AdminController(
    IAdminService   adminService,
    ISessionService sessionService) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var result = await adminService.GetStatsAsync();
        return Ok(result);
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] string? role,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await adminService.GetUsersAsync(search, role, page, pageSize);
        return Ok(result);
    }

    [HttpPut("users/{id:guid}")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
    {
        var result = await adminService.UpdateUserAsync(id, request);
        return Ok(result);
    }

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        await adminService.DeleteUserAsync(id);
        return NoContent();
    }

    [HttpGet("quizzes")]
    public async Task<IActionResult> GetQuizzes()
    {
        var result = await adminService.GetAllQuizzesAsync();
        return Ok(result);
    }

    [HttpDelete("quizzes/{id:guid}")]
    public async Task<IActionResult> DeleteQuiz(Guid id)
    {
        await adminService.DeleteQuizAsync(id);
        return NoContent();
    }

    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions()
    {
        var result = await sessionService.GetAllSessionsAsync();
        return Ok(result);
    }

    [HttpDelete("sessions/{id:guid}")]
    public async Task<IActionResult> ForceEndSession(Guid id)
    {
        await sessionService.ForceEndSessionAsync(id);
        return NoContent();
    }
}
