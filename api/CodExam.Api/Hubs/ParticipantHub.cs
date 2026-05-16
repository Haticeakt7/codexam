using CodExam.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CodExam.Api.Hubs;

public class ParticipantHub(AppDbContext db) : Hub
{
    public async Task JoinSession(string sessionToken)
    {
        if (!Guid.TryParse(sessionToken, out var token)) return;

        var session = await db.QuizSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.SessionToken == token && s.IsActive);

        if (session == null) return;

        await Groups.AddToGroupAsync(Context.ConnectionId, $"Session_{session.Id}");
    }
}
