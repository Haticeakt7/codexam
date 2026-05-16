using CodExam.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CodExam.Infrastructure.Persistence.Configurations;

public class CodeExecutionConfiguration : IEntityTypeConfiguration<CodeExecution>
{
    public void Configure(EntityTypeBuilder<CodeExecution> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");

        b.Property(e => e.Language).HasMaxLength(20).IsRequired();
        b.Property(e => e.SourceCode).IsRequired();
        b.Property(e => e.StdinText).HasDefaultValue("").IsRequired();
        b.Property(e => e.Status).HasConversion<string>().HasMaxLength(10).IsRequired();
        b.Property(e => e.CreatedAt).HasColumnType("timestamp with time zone").IsRequired();

        b.HasIndex(e => e.Status);
    }
}
