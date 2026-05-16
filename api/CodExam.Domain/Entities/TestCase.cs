namespace CodExam.Domain.Entities;

public class TestCase
{
    public Guid Id { get; set; }
    public Guid QuestionId { get; set; }
    public string Input { get; set; } = "";
    public string ExpectedOutput { get; set; } = null!;
    public bool IsVisible { get; set; } = true;
    public int OrderNo { get; set; }
    public DateTime CreatedAt { get; set; }

    public Question Question { get; set; } = null!;
}
