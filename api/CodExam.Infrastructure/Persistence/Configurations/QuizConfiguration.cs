using CodExam.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CodExam.Infrastructure.Persistence.Configurations;

public class QuizConfiguration : IEntityTypeConfiguration<Quiz>
{
    public void Configure(EntityTypeBuilder<Quiz> b)
    {
        b.HasKey(q => q.Id);
        b.Property(q => q.Id).HasDefaultValueSql("gen_random_uuid()");

        b.Property(q => q.Title).HasMaxLength(200).IsRequired();
        b.Property(q => q.Mode).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(q => q.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(q => q.AccessCode).HasMaxLength(50);
        b.Property(q => q.AntiCheatOptions).HasColumnType("jsonb").IsRequired();
        b.Property(q => q.FormSchema).HasColumnType("jsonb").IsRequired();
        b.Property(q => q.CreatedAt).HasColumnType("timestamp with time zone").IsRequired();
        b.Property(q => q.UpdatedAt).HasColumnType("timestamp with time zone").IsRequired();
        b.Property(q => q.PublishedAt).HasColumnType("timestamp with time zone");

        b.Property(q => q.ParticipationToken).IsRequired().HasDefaultValueSql("gen_random_uuid()");
        b.Property(q => q.StartsAt).HasColumnType("timestamp with time zone");
        b.Property(q => q.EndsAt).HasColumnType("timestamp with time zone");

        b.HasOne(q => q.Owner)
            .WithMany(u => u.Quizzes)
            .HasForeignKey(q => q.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(q => q.OwnerId);
        b.HasIndex(q => q.Status);
        b.HasIndex(q => q.ParticipationToken).IsUnique();
    }
}
