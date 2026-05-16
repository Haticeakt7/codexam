namespace CodExam.Application.DTOs.Admin;

public class StatsDto
{
    public int TotalUsers       { get; set; }
    public int ActiveQuizzes    { get; set; }
    public int DailyExecutions  { get; set; }
    public int Last24hErrors    { get; set; }
}
