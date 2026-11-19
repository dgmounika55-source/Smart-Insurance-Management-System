using System.ComponentModel.DataAnnotations;

namespace SmartInsurance.API.DTOs;

public class UpdateProfileRequest
{
    [Required]
    [StringLength(150, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [Phone]
    public string? PhoneNumber { get; set; }

    [StringLength(300)]
    public string? Address { get; set; }
}
