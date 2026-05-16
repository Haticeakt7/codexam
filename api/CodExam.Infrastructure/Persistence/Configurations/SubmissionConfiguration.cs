using CodExam.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CodExam.Infrastructure.Persistence.Configurations;

public class SubmissionConfiguration : IEntityTypeConfiguration<Submission>
{
    public void Configure(EntityTypeBuilder<Submission> b)
    {
        b.HasKey(s => s.Id);
        b.Property(s => s.Id).HasDefaultValueSql("gen_random_uuid()");

        b.Property(s => s.Language).HasMaxLength(20).IsRequired();
        b.Property(s => s.Code).IsRequired();
        b.Property(s => s.Status).HasConversion<string>().HasMaxLength(10).IsRequired();
        b.Property(s => s.Score).HasDefaultValue(0).IsRequired();
        b.Property(s => s.Version).HasDefaultValue(1).IsRequired();
        b.Property(s => s.SubmittedAt).HasColumnType("timestamp with time zone").IsRequired();

        b.HasOne(s => s.Session)
            .WithMany(qs => qs.Submissions)
            .HasForeignKey(s => s.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(s => s.Question)
            .WithMany(q => q.Submissions)
            .HasForeignKey(s => s.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasIndex(s => s.SessionId);
        b.HasIndex(s => s.QuestionId);
    }
}
