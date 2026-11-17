using SmartInsurance.API.Data;
using SmartInsurance.API.Models;

namespace SmartInsurance.API.Services;

public class NotificationService
{
    private readonly ApplicationDbContext _context;

    public NotificationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public void AddClaimSubmittedNotification(Claim claim)
    {
        _context.Notifications.Add(new Notification
        {
            CustomerId = claim.CustomerId,
            ClaimId = claim.ClaimId,
            Title = "Claim Submitted Successfully",
            Message = $"Your claim {claim.ClaimNumber} has been submitted successfully. You can track its progress from your dashboard.",
            Type = "Success",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });
    }

    public void AddClaimCancelledNotification(Claim claim)
    {
        _context.Notifications.Add(new Notification
        {
            CustomerId = claim.CustomerId,
            ClaimId = claim.ClaimId,
            Title = "Claim Cancelled",
            Message = $"Your claim {claim.ClaimNumber} has been cancelled successfully.",
            Type = "Information",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });
    }
    public void AddClaimStatusNotification(
        Claim claim,
        string newStatus,
        string? remarks)
    {
        var (title, message, type) = newStatus switch
        {
            "UnderReview" => (
                "Claim Under Review",
                $"Your claim {claim.ClaimNumber} is now under review.",
                "Information"
            ),

            "Approved" => (
                "Claim Approved",
                $"Good news! Your claim {claim.ClaimNumber} has been approved. Remarks: {remarks}",
                "Success"
            ),

            "Rejected" => (
                "Claim Rejected",
                $"Your claim {claim.ClaimNumber} has been rejected. Remarks: {remarks}",
                "Warning"
            ),

            "DocumentsRequired" => (
                "Additional Documents Required",
                $"Please upload additional documents for claim {claim.ClaimNumber}. Remarks: {remarks}",
                "ActionRequired"
            ),

            _ => (
                "Claim Updated",
                $"Your claim {claim.ClaimNumber} status has been updated to {newStatus}.",
                "Information"
            )
        };

        _context.Notifications.Add(new Notification
        {
            CustomerId = claim.CustomerId,
            ClaimId = claim.ClaimId,
            Title = title,
            Message = message,
            Type = type,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });
    }
}