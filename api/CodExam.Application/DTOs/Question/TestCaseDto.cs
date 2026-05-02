namespace CodExam.Application.DTOs.Question;

public class TestCaseDto
{
    public Guid   Id             { get; set; }
    public string Input          { get; set; } = null!;
    public string ExpectedOutput { get; set; } = null!;
    public bool   IsVisible      { get; set; }
}
