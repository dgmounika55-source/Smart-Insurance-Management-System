namespace SmartInsurance.API.Models;

public class Notification
{
    public int NotificationId { get; set; }

    public int CustomerId { get; set; }

    public int? ClaimId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public string Type { get; set; } = "Information";

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Customer? Customer { get; set; }

    public Claim? Claim { get; set; }
}