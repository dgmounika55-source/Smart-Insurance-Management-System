namespace SmartInsurance.API.Models;

public class SupportTicket
{
    public int TicketId { get; set; }

    public string UserId { get; set; } = string.Empty;

    public string UserName { get; set; } = string.Empty;

    public string UserRole { get; set; } = string.Empty;

    public string Subject { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string Priority { get; set; } = "Medium";

    public string Description { get; set; } = string.Empty;

    public string Status { get; set; } = "Open";

    public string? AdminResponse { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
