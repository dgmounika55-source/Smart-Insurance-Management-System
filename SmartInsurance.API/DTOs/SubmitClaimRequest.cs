using System.ComponentModel.DataAnnotations;

namespace SmartInsurance.API.DTOs;

public class SubmitClaimRequest
{
    [Required]
    [Range(1, int.MaxValue)]
    public int CustomerPolicyId { get; set; }

    [Required]
    public DateTime IncidentDate { get; set; }

    [Range(typeof(decimal), "0.01", "999999999")]
    public decimal ClaimAmount { get; set; }

    [Required]
    [StringLength(1000, MinimumLength = 5)]
    public string Description { get; set; } = string.Empty;
}