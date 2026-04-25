using CodExam.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CodExam.Infrastructure.Persistence.Configurations;

public class SubmissionReplayConfiguration : IEntityTypeConfiguration<SubmissionReplay>
{
    public void Configure(EntityTypeBuilder<SubmissionReplay> b)
    {
        b.HasKey(r => r.Id);
        b.Property(r => r.Id).HasDefaultValueSql("gen_random_uuid()");

        b.Property(r => r.Diffs).HasColumnType("jsonb").IsRequired()
            .HasDefaultValueSql("'[]'::jsonb");

        b.HasOne(r => r.Submission)
            .WithOne(s => s.Replay)
            .HasForeignKey<SubmissionReplay>(r => r.SubmissionId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(r => r.SubmissionId).IsUnique();
    }
}
