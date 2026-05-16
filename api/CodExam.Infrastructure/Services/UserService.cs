using CodExam.Application.DTOs.User;
using CodExam.Application.Interfaces;
using CodExam.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CodExam.Infrastructure.Services;

public class UserService(AppDbContext db) : IUserService
{
    public async Task<UpdateDisplayNameResponse> UpdateDisplayNameAsync(Guid userId, UpdateDisplayNameRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");

        user.DisplayName = request.DisplayName.Trim();
        user.UpdatedAt   = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return new UpdateDisplayNameResponse { DisplayName = user.DisplayName };
    }

    public async Task UpdatePasswordAsync(Guid userId, UpdatePasswordRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("Current password is incorrect.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt    = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }
}
