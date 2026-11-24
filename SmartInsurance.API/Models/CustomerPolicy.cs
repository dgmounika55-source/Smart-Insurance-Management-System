using Microsoft.EntityFrameworkCore;
using SmartInsurance.API.Models;

namespace SmartInsurance.API.Models;

public class CustomerPolicy
{
    public int CustomerPolicyId { get; set; }
    public int CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public int PolicyId { get; set; }
    public Policy? Policy { get; set; }

    public string PolicyReference { get; set; } = string.Empty;
    public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Status { get; set; } = "Active";

    public string PolicyNameSnapshot { get; set; } = string.Empty;
    public string PolicyTypeSnapshot { get; set; } = string.Empty;
    public decimal PremiumAmount { get; set; }
    public decimal CoverageAmount { get; set; }
    public int DurationMonths { get; set; }
}
