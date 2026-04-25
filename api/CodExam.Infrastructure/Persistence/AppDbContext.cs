using System.Reflection;
using CodExam.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CodExam.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User>             Users             => Set<User>();
    public DbSet<Quiz>             Quizzes           => Set<Quiz>();
    public DbSet<Question>         Questions         => Set<Question>();
    public DbSet<TestCase>         TestCases         => Set<TestCase>();
    public DbSet<QuizSession>      QuizSessions      => Set<QuizSession>();
    public DbSet<Submission>       Submissions       => Set<Submission>();
    public DbSet<SubmissionReplay> SubmissionReplays => Set<SubmissionReplay>();
    public DbSet<ExamEvent>        ExamEvents        => Set<ExamEvent>();
    public DbSet<CodeExecution>    CodeExecutions    => Set<CodeExecution>();
    public DbSet<CompileJob>       CompileJobs       => Set<CompileJob>();
    public DbSet<AuditLog>         AuditLogs         => Set<AuditLog>();
    public DbSet<SystemErrorLog>   SystemErrorLogs   => Set<SystemErrorLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        modelBuilder.Entity<User>()
            .HasQueryFilter(u => u.DeletedAt == null);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Properties.Any(p => p.Metadata.Name == "CreatedAt"))
                    entry.Property("CreatedAt").CurrentValue = now;
                if (entry.Properties.Any(p => p.Metadata.Name == "UpdatedAt"))
                    entry.Property("UpdatedAt").CurrentValue = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                if (entry.Properties.Any(p => p.Metadata.Name == "UpdatedAt"))
                    entry.Property("UpdatedAt").CurrentValue = now;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
