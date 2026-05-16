namespace CodExam.Application.Interfaces;

public interface IMonitorNotifier
{
    Task NotifyParticipantJoined(Guid quizId, object data);
    Task NotifyAntiCheatEvent(Guid quizId, object data);
    Task NotifySubmission(Guid quizId, object data);
    Task NotifySessionFinished(Guid quizId, object data);
    Task NotifyCodeSnapshot(Guid quizId, object data);
    Task NotifyParticipantTerminated(Guid sessionId);
    Task NotifySessionLocked(Guid quizId, object data);
    Task NotifyWarningSent(Guid quizId, object data);
}
