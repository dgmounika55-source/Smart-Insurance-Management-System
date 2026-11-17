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
}
