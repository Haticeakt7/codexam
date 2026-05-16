using CodExam.Application.DTOs.User;

namespace CodExam.Application.Interfaces;

public interface IUserService
{
    Task<UpdateDisplayNameResponse> UpdateDisplayNameAsync(Guid userId, UpdateDisplayNameRequest request);
    Task UpdatePasswordAsync(Guid userId, UpdatePasswordRequest request);
}
