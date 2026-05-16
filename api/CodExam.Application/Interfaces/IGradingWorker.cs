namespace CodExam.Application.Interfaces;

public interface IGradingWorker
{
    Task ProcessGradingJob(Guid submissionId);
}
