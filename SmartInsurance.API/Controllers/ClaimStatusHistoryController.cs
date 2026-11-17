using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartInsurance.API.Data;

namespace SmartInsurance.API.Controllers;

[ApiController]
[Route("api/claims/{claimId:int}/history")]
[Authorize(Roles = "Customer,Admin,ClaimsManager")]
public class ClaimStatusHistoryController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ClaimStatusHistoryController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetHistory(int claimId)
    {
        var claim = await _context.Claims
            .FirstOrDefaultAsync(c => c.ClaimId == claimId);

        if (claim == null)
            return NotFound(new { message = "Claim not found." });

        if (User.IsInRole("Customer"))
        {
            var email = User.FindFirstValue(ClaimTypes.Email)
                        ?? User.FindFirstValue("email");

            var ownsClaim = !string.IsNullOrWhiteSpace(email) &&
                await _context.Claims.AnyAsync(c =>
                    c.ClaimId == claimId &&
                    c.Customer != null &&
                    c.Customer.Email == email);

            if (!ownsClaim)
                return Forbid();
        }

        var history = await _context.ClaimStatusHistories
            .Where(h => h.ClaimId == claimId)
            .OrderBy(h => h.ChangedAt)
            .Select(h => new
            {
                h.PreviousStatus,
                h.NewStatus,
                h.Remarks,
                h.ChangedAt,
                h.ChangedBy
            })
            .ToListAsync();

        return Ok(history);
    }
}
