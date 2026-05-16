namespace CodExam.Application.DTOs.Question;

public class CreateTestCaseRequest
{
    public string Input          { get; set; } = null!;
    public string ExpectedOutput { get; set; } = null!;
    public bool   IsVisible      { get; set; }
}
