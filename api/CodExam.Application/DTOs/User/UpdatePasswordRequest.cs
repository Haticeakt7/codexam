namespace CodExam.Application.DTOs.User;

public class UpdatePasswordRequest
{
    public string CurrentPassword { get; set; } = null!;
    public string NewPassword     { get; set; } = null!;
}
