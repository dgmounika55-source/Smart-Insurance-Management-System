namespace SmartInsurance.API.Models;

public class ClaimStatusHistory
{
    public int ClaimStatusHistoryId { get; set; }

    public int ClaimId { get; set; }

    public Claim? Claim { get; set; }

    public string PreviousStatus { get; set; } = string.Empty;

    public string NewStatus { get; set; } = string.Empty;

    public string? Remarks { get; set; }

    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    public string ChangedBy { get; set; } = "System";
}
