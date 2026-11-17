namespace SmartInsurance.API.Models;

public class Claim
{
    public int ClaimId { get; set; }

    public string ClaimNumber { get; set; } = string.Empty;

    public int CustomerId { get; set; }

    public int CustomerPolicyId { get; set; }

    public Customer? Customer { get; set; }

    public CustomerPolicy? CustomerPolicy { get; set; }

    public DateTime IncidentDate { get; set; }

    public DateTime SubmissionDate { get; set; } = DateTime.UtcNow;

    public decimal ClaimAmount { get; set; }

    public string Description { get; set; } = string.Empty;

    public string Status { get; set; } = "Submitted";

    public string? AdminRemarks { get; set; }

    public ICollection<ClaimDocument> Documents { get; set; } = new List<ClaimDocument>();

    public ICollection<ClaimStatusHistory> StatusHistory { get; set; } = new List<ClaimStatusHistory>();
}
