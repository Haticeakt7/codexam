using System.Text.Json;

namespace CodExam.Domain.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    public Guid? ActorUserId { get; set; }
    public string ActionType { get; set; } = null!;
    public string EntityType { get; set; } = null!;
    public Guid? EntityId { get; set; }
    public JsonDocument Details { get; set; } = null!;
    public DateTime CreatedAt { get; set; }

    public User? ActorUser { get; set; }
}
