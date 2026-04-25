using CodExam.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CodExam.Infrastructure.Persistence.Configurations;

public class CompileJobConfiguration : IEntityTypeConfiguration<CompileJob>
{
    public void Configure(EntityTypeBuilder<CompileJob> b)
    {
        b.HasKey(j => j.Id);
        b.Property(j => j.Id).HasDefaultValueSql("gen_random_uuid()");

        b.Property(j => j.RunnerContainerId).HasMaxLength(64);
        b.Property(j => j.JobStatus).HasMaxLength(20).HasDefaultValue("Queued").IsRequired();
        b.Property(j => j.QueuedAt).HasColumnType("timestamp with time zone").IsRequired();
        b.Property(j => j.StartedAt).HasColumnType("timestamp with time zone");
        b.Property(j => j.FinishedAt).HasColumnType("timestamp with time zone");

        b.HasOne(j => j.Execution)
            .WithOne(e => e.CompileJob)
            .HasForeignKey<CompileJob>(j => j.ExecutionId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(j => j.ExecutionId);
    }
}
