using CodExam.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CodExam.Infrastructure.Persistence.Configurations;

public class SystemErrorLogConfiguration : IEntityTypeConfiguration<SystemErrorLog>
{
    public void Configure(EntityTypeBuilder<SystemErrorLog> b)
    {
        b.HasKey(l => l.Id);
        b.Property(l => l.Id).HasDefaultValueSql("gen_random_uuid()");

        b.Property(l => l.SourceService).HasMaxLength(20).IsRequired();
        b.Property(l => l.ErrorTitle).HasMaxLength(200).IsRequired();
        b.Property(l => l.ErrorMessage).IsRequired();
        b.Property(l => l.CreatedAt).HasColumnType("timestamp with time zone").IsRequired();

        b.HasIndex(l => l.CreatedAt).IsDescending();
    }
}
