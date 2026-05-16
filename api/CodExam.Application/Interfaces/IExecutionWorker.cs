namespace CodExam.Application.Interfaces;

public interface IExecutionWorker
{
    Task ProcessExecutionJob(Guid compileJobId);
}
