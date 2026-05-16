using CodExam.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CodExam.Infrastructure.Persistence.Configurations;

public class TestCaseConfiguration : IEntityTypeConfiguration<TestCase>
{
    public void Configure(EntityTypeBuilder<TestCase> b)
    {
        b.HasKey(t => t.Id);
        b.Property(t => t.Id).HasDefaultValueSql("gen_random_uuid()");

        b.Property(t => t.Input).HasDefaultValue("").IsRequired();
        b.Property(t => t.ExpectedOutput).IsRequired();
        b.Property(t => t.IsVisible).HasDefaultValue(true).IsRequired();
        b.Property(t => t.OrderNo).HasDefaultValue(0).IsRequired();
        b.Property(t => t.CreatedAt).HasColumnType("timestamp with time zone").IsRequired();

        b.HasOne(t => t.Question)
            .WithMany(q => q.TestCases)
            .HasForeignKey(t => t.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
