using CodExam.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CodExam.Infrastructure.Persistence.Configurations;

public class ExamEventConfiguration : IEntityTypeConfiguration<ExamEvent>
{
    public void Configure(EntityTypeBuilder<ExamEvent> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");

        b.Property(e => e.EventType).HasConversion<string>().HasMaxLength(30).IsRequired();
        b.Property(e => e.Severity).HasConversion<string>().HasMaxLength(10).IsRequired();
        b.Property(e => e.Timestamp).HasColumnType("timestamp with time zone").IsRequired();
        b.Property(e => e.Metadata).HasColumnType("jsonb").IsRequired()
            .HasDefaultValueSql("'{}'::jsonb");

        b.HasOne(e => e.Session)
            .WithMany(s => s.ExamEvents)
            .HasForeignKey(e => e.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(e => e.SessionId);
        b.HasIndex(e => new { e.SessionId, e.Timestamp });

        // GIN index for metadata search
        b.HasIndex(e => e.Metadata)
            .HasMethod("GIN");
    }
}
