using CodExam.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CodExam.Infrastructure.Persistence.Configurations;

public class QuizSessionConfiguration : IEntityTypeConfiguration<QuizSession>
{
    public void Configure(EntityTypeBuilder<QuizSession> b)
    {
        b.HasKey(s => s.Id);
        b.Property(s => s.Id).HasDefaultValueSql("gen_random_uuid()");

        b.Property(s => s.SessionToken).HasDefaultValueSql("gen_random_uuid()").IsRequired();
        b.Property(s => s.FormData).HasColumnType("jsonb").IsRequired();
        b.Property(s => s.StartedAt).HasColumnType("timestamp with time zone").IsRequired();
        b.Property(s => s.EndsAt).HasColumnType("timestamp with time zone").IsRequired();
        b.Property(s => s.FinishedAt).HasColumnType("timestamp with time zone");
        b.Property(s => s.IsActive).HasDefaultValue(true).IsRequired();
        b.Property(s => s.IsLocked).HasDefaultValue(false).IsRequired();
        b.Property(s => s.TotalScore).HasDefaultValue(0).IsRequired();

        b.HasOne(s => s.Quiz)
            .WithMany(q => q.Sessions)
            .HasForeignKey(s => s.QuizId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(s => s.User)
            .WithMany(u => u.Sessions)
            .HasForeignKey(s => s.UserId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        b.HasIndex(s => s.QuizId);
        b.HasIndex(s => s.SessionToken).IsUnique();
        b.HasIndex(s => s.IsActive)
            .HasFilter("is_active = true");

        // GIN index for participant search
        b.HasIndex(s => s.FormData)
            .HasMethod("GIN");
    }
}
