using CodExam.Api.Hubs;
using CodExam.Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace CodExam.Api.Services;

public class SignalRMonitorNotifier(
    IHubContext<MonitorHub>     hub,
    IHubContext<ParticipantHub> participantHub) : IMonitorNotifier
{
    public Task NotifyParticipantJoined(Guid quizId, object data) =>
        hub.Clients.Group($"Quiz_{quizId}").SendAsync("ParticipantJoined", data);

    public Task NotifyAntiCheatEvent(Guid quizId, object data) =>
        hub.Clients.Group($"Quiz_{quizId}").SendAsync("AntiCheatEvent", data);

    public Task NotifySubmission(Guid quizId, object data) =>
        hub.Clients.Group($"Quiz_{quizId}").SendAsync("SubmissionReceived", data);

    public Task NotifySessionFinished(Guid quizId, object data) =>
        hub.Clients.Group($"Quiz_{quizId}").SendAsync("SessionFinished", data);

    public Task NotifyCodeSnapshot(Guid quizId, object data) =>
        hub.Clients.Group($"Quiz_{quizId}").SendAsync("CodeSnapshot", data);

    public Task NotifyParticipantTerminated(Guid sessionId) =>
        participantHub.Clients.Group($"Session_{sessionId}").SendAsync("Terminated");

    public Task NotifySessionLocked(Guid quizId, object data) =>
        hub.Clients.Group($"Quiz_{quizId}").SendAsync("SessionLocked", data);

    public Task NotifyWarningSent(Guid quizId, object data) =>
        hub.Clients.Group($"Quiz_{quizId}").SendAsync("WarningSent", data);
}
