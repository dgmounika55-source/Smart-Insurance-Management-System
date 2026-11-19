using System.ComponentModel.DataAnnotations;

namespace SmartInsurance.API.DTOs;

public class ForgotPasswordRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
