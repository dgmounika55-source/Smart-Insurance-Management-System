using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartInsurance.API.Data;
using SmartInsurance.API.Models;
using SmartInsurance.API.Services;

namespace SmartInsurance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,ClaimsManager")]
public class ClaimReviewsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly NotificationService _notificationService;

    public ClaimReviewsController(
        ApplicationDbContext context,
        NotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    [HttpGet("pending")]
    public async Task<ActionResult<IEnumerable<Claim>>> GetPendingClaims()
    {
        var claims = await _context.Claims
            .Include(c => c.Customer)
            .Include(c => c.CustomerPolicy)
                .ThenInclude(cp => cp!.Policy)
            .Where(c => c.Status == "Submitted" || c.Status == "UnderReview")
            .ToListAsync();

        return Ok(claims);
    }

    [HttpPatch("{id}/approve")]
    public async Task<IActionResult> ApproveClaim(int id, [FromBody] string remarks)
    {
        return await ChangeStatus(id, "Approved", remarks);
    }

    [HttpPatch("{id}/reject")]
    public async Task<IActionResult> RejectClaim(int id, [FromBody] string remarks)
    {
        return await ChangeStatus(id, "Rejected", remarks);
    }

    [HttpPatch("{id}/request-documents")]
    public async Task<IActionResult> RequestDocuments(int id, [FromBody] string remarks)
    {
        return await ChangeStatus(id, "DocumentsRequired", remarks);
    }

    [HttpPatch("{id}/review")]
    public async Task<IActionResult> StartReview(int id)
    {
        return await ChangeStatus(id, "UnderReview", "Claim review started.");
    }

    private async Task<IActionResult> ChangeStatus(
        int id,
        string newStatus,
        string? remarks)
    {
        var claim = await _context.Claims.FindAsync(id);

        if (claim == null)
            return NotFound(new { message = "Claim not found." });

        var allowedTransitions = new Dictionary<string, string[]>
        {
            ["Submitted"] = new[] { "UnderReview" },
            ["UnderReview"] = new[] { "Approved", "Rejected", "DocumentsRequired" },
            ["DocumentsRequired"] = new[] { "UnderReview" }
        };

        if (!allowedTransitions.TryGetValue(claim.Status, out var allowedStatuses) ||
            !allowedStatuses.Contains(newStatus))
        {
            return BadRequest(new
            {
                message = $"Cannot change claim status from '{claim.Status}' to '{newStatus}'."
            });
        }

        if (newStatus != "UnderReview" && string.IsNullOrWhiteSpace(remarks))
            return BadRequest(new { message = "Remarks are required." });

        var previousStatus = claim.Status;
        claim.Status = newStatus;
        claim.AdminRemarks = remarks;

        _context.ClaimStatusHistories.Add(new ClaimStatusHistory
        {
            ClaimId = claim.ClaimId,
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            Remarks = remarks,
            ChangedBy = User.Identity?.Name ?? "ClaimsManager"
        });

        _notificationService.AddClaimStatusNotification(
            claim,
            newStatus,
            remarks
        );

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Claim status updated successfully.",
            claim.ClaimNumber,
            claim.Status
        });
    }
}