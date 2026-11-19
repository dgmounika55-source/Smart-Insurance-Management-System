namespace SmartInsurance.API.Models;

public class Payment
{
    public int PaymentId { get; set; }
    public int CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public int PolicyId { get; set; }
    public Policy? Policy { get; set; }

    public int? CustomerPolicyId { get; set; }
    public CustomerPolicy? CustomerPolicy { get; set; }

    public string TransactionReference { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Demo";
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }
}
