using CodExam.Domain.Entities;
using CodExam.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CodExam.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.HasKey(u => u.Id);
        b.Property(u => u.Id).HasDefaultValueSql("gen_random_uuid()");

        b.Property(u => u.Email).HasMaxLength(254).IsRequired();
        b.Property(u => u.PasswordHash).HasMaxLength(72).IsRequired();
        b.Property(u => u.DisplayName).HasMaxLength(100).IsRequired();
        b.Property(u => u.Role).HasConversion<string>().HasMaxLength(10).IsRequired();
        b.Property(u => u.Status).HasMaxLength(10).HasDefaultValue("active").IsRequired();
        b.Property(u => u.RefreshToken).HasMaxLength(512);
        b.Property(u => u.RefreshTokenExpiresAt).HasColumnType("timestamp with time zone");
        b.Property(u => u.SecurityStamp).HasDefaultValueSql("gen_random_uuid()").IsRequired();
        b.Property(u => u.CreatedAt).HasColumnType("timestamp with time zone").IsRequired();
        b.Property(u => u.UpdatedAt).HasColumnType("timestamp with time zone").IsRequired();
        b.Property(u => u.DeletedAt).HasColumnType("timestamp with time zone");
        b.Property(u => u.PreferencesJson);  // nullable, no max length — free-form JSON text

        b.HasIndex(u => u.Email).IsUnique();
        b.HasIndex(u => u.DeletedAt)
            .HasFilter("deleted_at IS NULL");
    }
}
