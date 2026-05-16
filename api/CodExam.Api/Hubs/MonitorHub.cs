using CodExam.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CodExam.Api.Hubs;

[Authorize(Policy = "RequireUser")]
public class MonitorHub(ISessionService sessionService, IHubContext<ParticipantHub> participantHub) : Hub
{
    public async Task JoinQuizMonitor(string quizId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Quiz_{quizId}");
    }

    public async Task LeaveQuizMonitor(string quizId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Quiz_{quizId}");
    }

    // Warning is persisted in DB and broadcast back to all monitors, then forwarded to participant
    public async Task WarnParticipant(string sessionId, string message)
    {
        if (!Guid.TryParse(sessionId, out var sid)) return;

        // Persist warning and notify monitor group
        await sessionService.WarnAsync(sid, message);

        // Forward to participant
        await participantHub.Clients
            .Group($"Session_{sessionId}")
            .SendAsync("Warning", new { message, timestamp = DateTime.UtcNow });
    }
}
