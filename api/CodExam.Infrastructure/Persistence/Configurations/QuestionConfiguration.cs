using CodExam.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CodExam.Infrastructure.Persistence.Configurations;

public class QuestionConfiguration : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> b)
    {
        b.HasKey(q => q.Id);
        b.Property(q => q.Id).HasDefaultValueSql("gen_random_uuid()");

        b.Property(q => q.Type).HasConversion<string>().HasMaxLength(30).IsRequired();
        b.Property(q => q.Title).HasMaxLength(300).IsRequired();
        b.Property(q => q.Body).IsRequired();
        b.Property(q => q.Points).HasDefaultValue(10).IsRequired();
        b.Property(q => q.OrderNo).HasDefaultValue(0).IsRequired();
        b.Property(q => q.Options).HasColumnType("jsonb").IsRequired();
        b.Property(q => q.CreatedAt).HasColumnType("timestamp with time zone").IsRequired();
        b.Property(q => q.UpdatedAt).HasColumnType("timestamp with time zone").IsRequired();

        b.HasOne(q => q.Quiz)
            .WithMany(qz => qz.Questions)
            .HasForeignKey(q => q.QuizId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
