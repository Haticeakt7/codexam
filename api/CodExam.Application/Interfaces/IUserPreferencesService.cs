using CodExam.Application.DTOs.User;

namespace CodExam.Application.Interfaces;

public interface IUserPreferencesService
{
    Task<UserPreferencesDto> GetAsync(Guid userId);
    Task<UserPreferencesDto> UpdateAsync(Guid userId, UserPreferencesDto dto);
}
