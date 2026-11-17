namespace SmartInsurance.API.DTOs;

public class SubmitClaimRequest
{
    public int CustomerPolicyId { get; set; }
    public DateTime IncidentDate { get; set; }
    public decimal ClaimAmount { get; set; }
    public string Description { get; set; } = string.Empty;
}
