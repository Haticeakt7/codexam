using System.Text.Json;
using CodExam.Application.DTOs.User;
using CodExam.Application.Interfaces;
using CodExam.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CodExam.Infrastructure.Services;

public class UserPreferencesService(AppDbContext db) : IUserPreferencesService
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };
    private static readonly UserPreferencesDto Defaults = new();

    public async Task<UserPreferencesDto> GetAsync(Guid userId)
    {
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) throw new KeyNotFoundException("User not found.");
        if (string.IsNullOrWhiteSpace(user.PreferencesJson)) return Defaults;
        try
        {
            return JsonSerializer.Deserialize<UserPreferencesDto>(user.PreferencesJson, JsonOpts) ?? Defaults;
        }
        catch { return Defaults; }
    }

    public async Task<UserPreferencesDto> UpdateAsync(Guid userId, UserPreferencesDto dto)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) throw new KeyNotFoundException("User not found.");

        // Clamp font size to sane range
        dto.FontSize = Math.Max(8, Math.Min(32, dto.FontSize));

        user.PreferencesJson = JsonSerializer.Serialize(dto);
        db.Users.Update(user);
        await db.SaveChangesAsync();
        return dto;
    }
}
