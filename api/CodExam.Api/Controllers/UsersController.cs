using System.Security.Claims;
using CodExam.Application.DTOs.User;
using CodExam.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CodExam.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController(IUserPreferencesService preferencesService, IUserService userService) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("me/preferences")]
    [Authorize(Policy = "RequireUser")]
    public async Task<IActionResult> GetPreferences()
    {
        var result = await preferencesService.GetAsync(UserId);
        return Ok(result);
    }

    [HttpPut("me/preferences")]
    [Authorize(Policy = "RequireUser")]
    public async Task<IActionResult> UpdatePreferences([FromBody] UserPreferencesDto dto)
    {
        var result = await preferencesService.UpdateAsync(UserId, dto);
        return Ok(result);
    }

    [HttpPut("me")]
    [Authorize(Policy = "RequireUser")]
    public async Task<IActionResult> UpdateDisplayName([FromBody] UpdateDisplayNameRequest request)
    {
        var result = await userService.UpdateDisplayNameAsync(UserId, request);
        return Ok(result);
    }

    [HttpPut("me/password")]
    [Authorize(Policy = "RequireUser")]
    public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordRequest request)
    {
        await userService.UpdatePasswordAsync(UserId, request);
        return NoContent();
    }
}
