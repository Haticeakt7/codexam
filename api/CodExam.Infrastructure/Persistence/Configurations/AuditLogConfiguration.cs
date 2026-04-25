using CodExam.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CodExam.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> b)
    {
        b.HasKey(a => a.Id);
        b.Property(a => a.Id).HasDefaultValueSql("gen_random_uuid()");

        b.Property(a => a.ActionType).HasMaxLength(50).IsRequired();
        b.Property(a => a.EntityType).HasMaxLength(50).IsRequired();
        b.Property(a => a.Details).HasColumnType("jsonb").IsRequired()
            .HasDefaultValueSql("'{}'::jsonb");
        b.Property(a => a.CreatedAt).HasColumnType("timestamp with time zone").IsRequired();

        b.HasOne(a => a.ActorUser)
            .WithMany(u => u.AuditLogs)
            .HasForeignKey(a => a.ActorUserId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        b.HasIndex(a => new { a.EntityType, a.EntityId });
    }
}
