using System.Security.Claims;
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
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

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

    [HttpDelete("quizzes")]
    public async Task<IActionResult> BulkDeleteQuizzes([FromBody] List<Guid> ids)
    {
        await adminService.BulkDeleteQuizzesAsync(ids);
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

    [HttpGet("user-sessions")]
    public async Task<IActionResult> GetUserSessions()
    {
        var result = await adminService.GetUserSessionsAsync();
        return Ok(result);
    }

    [HttpPost("user-sessions/{userId:guid}/revoke")]
    public async Task<IActionResult> RevokeUserSession(Guid userId)
    {
        if (userId == CurrentUserId)
            return BadRequest(new { error = "Cannot revoke your own session." });

        await adminService.RevokeUserSessionAsync(userId);
        return NoContent();
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetSystemLogs([FromQuery] string? source, [FromQuery] int limit = 200)
    {
        var result = await adminService.GetSystemLogsAsync(source, Math.Min(limit, 500));
        return Ok(result);
    }
}
