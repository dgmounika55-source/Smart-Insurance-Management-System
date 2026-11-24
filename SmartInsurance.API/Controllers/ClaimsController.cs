using System.Security.Claims;
using InsuranceClaim = SmartInsurance.API.Models.Claim;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartInsurance.API.Data;
using SmartInsurance.API.DTOs;
using SmartInsurance.API.Models;
using SmartInsurance.API.Services;

namespace SmartInsurance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClaimsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly NotificationService _notificationService;

    public ClaimsController(
        ApplicationDbContext context,
        NotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    private bool IsStaff =>
        User.IsInRole("Admin") || User.IsInRole("ClaimsManager");

    private string? CurrentEmail =>
        User.FindFirstValue(ClaimTypes.Email) ??
        User.FindFirstValue("email");

    private async Task<int?> GetCurrentCustomerId()
    {
        var email = CurrentEmail;

        if (string.IsNullOrWhiteSpace(email))
            return null;

        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Email == email);

        return customer?.CustomerId;
    }

    [HttpGet]
    [Authorize(Roles = "Customer,Admin,ClaimsManager")]
    public async Task<IActionResult> GetClaims()
    {
        var query = _context.Claims
            .Include(c => c.Customer)
            .Include(c => c.CustomerPolicy)
                .ThenInclude(cp => cp!.Policy)
            .AsQueryable();

        if (!IsStaff)
        {
            var customerId = await GetCurrentCustomerId();

            if (customerId == null)
                return NotFound(new { message = "Customer profile not found." });

            query = query.Where(c => c.CustomerId == customerId.Value);
        }

        return Ok(await query.OrderByDescending(c => c.SubmissionDate)
            .ThenByDescending(c => c.ClaimId).ToListAsync());
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Customer,Admin,ClaimsManager")]
    public async Task<IActionResult> GetClaim(int id)
    {
        var claim = await _context.Claims
            .Include(c => c.Customer)
            .Include(c => c.CustomerPolicy)
                .ThenInclude(cp => cp!.Policy)
            .FirstOrDefaultAsync(c => c.ClaimId == id);

        if (claim == null)
            return NotFound(new { message = "Claim not found." });

        if (!IsStaff)
        {
            var customerId = await GetCurrentCustomerId();

            if (customerId == null || claim.CustomerId != customerId.Value)
                return Forbid();
        }

        return Ok(claim);
    }

    [HttpPost]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> SubmitClaim(SubmitClaimRequest request)
    {
        var customerId = await GetCurrentCustomerId();

        if (customerId == null)
            return NotFound(new { message = "Customer profile not found." });

        var customerPolicy = await _context.CustomerPolicies
            .Include(cp => cp.Policy)
            .FirstOrDefaultAsync(cp =>
                cp.CustomerPolicyId == request.CustomerPolicyId &&
                cp.CustomerId == customerId.Value);

        if (customerPolicy?.Policy == null)
            return BadRequest(new { message = "Invalid customer policy." });

        if (request.IncidentDate.Date > DateTime.UtcNow.Date)
            return BadRequest(new { message = "Incident date cannot be in the future." });

        if (request.ClaimAmount <= 0 ||
            request.ClaimAmount > customerPolicy.Policy.CoverageAmount ||
            string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest(new { message = "Enter a valid claim amount and description." });
        }

        if (customerPolicy.Status != "Active" ||
            request.IncidentDate.Date < customerPolicy.StartDate.Date ||
            request.IncidentDate.Date > customerPolicy.EndDate.Date)
        {
            return BadRequest(new { message = "The customer policy was not active on the incident date." });
        }

        var claim = new InsuranceClaim
        {
            ClaimNumber = $"CLM-{Guid.NewGuid():N}"[..12].ToUpperInvariant(),
            CustomerId = customerId.Value,
            CustomerPolicyId = customerPolicy.CustomerPolicyId,
            IncidentDate = request.IncidentDate,
            SubmissionDate = DateTime.UtcNow,
            ClaimAmount = request.ClaimAmount,
            Description = request.Description.Trim(),
            Status = "Submitted"
        };

        _context.Claims.Add(claim);

        _context.ClaimStatusHistories.Add(new ClaimStatusHistory
        {
            Claim = claim,
            PreviousStatus = "None",
            NewStatus = "Submitted",
            Remarks = "Claim submitted.",
            ChangedBy = User.Identity?.Name ?? "Customer"
        });

        _notificationService.AddClaimSubmittedNotification(claim);

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetClaim), new { id = claim.ClaimId }, claim);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> UpdateClaim(int id, SubmitClaimRequest request)
    {
        var customerId = await GetCurrentCustomerId();

        if (customerId == null)
            return NotFound(new { message = "Customer profile not found." });

        var claim = await _context.Claims
            .FirstOrDefaultAsync(c => c.ClaimId == id &&
                                      c.CustomerId == customerId.Value);

        if (claim == null)
            return NotFound(new { message = "Claim not found." });

        if (claim.Status != "Submitted")
            return BadRequest(new { message = "Only submitted claims can be edited." });

        if (request.IncidentDate.Date > DateTime.UtcNow.Date)
            return BadRequest(new { message = "Incident date cannot be in the future." });

        if (request.ClaimAmount <= 0 ||
            string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest(new { message = "Enter valid claim details." });
        }

        var customerPolicy = await _context.CustomerPolicies
            .Include(cp => cp.Policy)
            .FirstOrDefaultAsync(cp =>
                cp.CustomerPolicyId == claim.CustomerPolicyId &&
                cp.CustomerId == customerId.Value);

        if (customerPolicy?.Policy == null ||
            request.ClaimAmount > customerPolicy.Policy.CoverageAmount ||
            request.IncidentDate.Date < customerPolicy.StartDate.Date ||
            request.IncidentDate.Date > customerPolicy.EndDate.Date)
        {
            return BadRequest(new { message = "The updated claim details are invalid." });
        }

        claim.ClaimAmount = request.ClaimAmount;
        claim.Description = request.Description.Trim();
        claim.IncidentDate = request.IncidentDate;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPatch("{id:int}/cancel")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> CancelClaim(int id)
    {
        var customerId = await GetCurrentCustomerId();

        if (customerId == null)
            return NotFound(new { message = "Customer profile not found." });

        var claim = await _context.Claims
            .FirstOrDefaultAsync(c => c.ClaimId == id &&
                                      c.CustomerId == customerId.Value);

        if (claim == null)
            return NotFound(new { message = "Claim not found." });

        if (claim.Status != "Submitted")
            return BadRequest(new { message = "Only submitted claims can be cancelled." });

        var previousStatus = claim.Status;
        claim.Status = "Cancelled";

        _context.ClaimStatusHistories.Add(new ClaimStatusHistory
        {
            ClaimId = claim.ClaimId,
            PreviousStatus = previousStatus,
            NewStatus = "Cancelled",
            Remarks = "Claim cancelled by customer.",
            ChangedBy = User.Identity?.Name ?? "Customer"
        });

        _notificationService.AddClaimCancelledNotification(claim);

        await _context.SaveChangesAsync();

        return Ok(new { message = "Claim cancelled successfully." });
    }
}
