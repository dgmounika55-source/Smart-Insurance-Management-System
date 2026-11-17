namespace SmartInsurance.API.Models;

public class Policy
{
    public int PolicyId { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public string PolicyName { get; set; } = string.Empty;
    public string PolicyType { get; set; } = string.Empty;
    public decimal PremiumAmount { get; set; }
    public decimal CoverageAmount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int DurationMonths { get; set; } = 12;
    public string Status { get; set; } = "Active";

    public ICollection<CustomerPolicy> CustomerPolicies { get; set; } = new List<CustomerPolicy>();
}
