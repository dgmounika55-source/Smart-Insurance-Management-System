using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartInsurance.API.Data;

namespace SmartInsurance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,ClaimsManager")]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DashboardController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var totalCustomers = await _context.Customers.CountAsync();
        var totalPolicies = await _context.Policies
            .CountAsync(p => p.Status == "Active");

        var totalClaims = await _context.Claims.CountAsync();
        var pendingClaims = await _context.Claims
            .CountAsync(c => c.Status == "Submitted" || c.Status == "UnderReview");

        var approvedClaims = await _context.Claims
            .CountAsync(c => c.Status == "Approved");

        var rejectedClaims = await _context.Claims
            .CountAsync(c => c.Status == "Rejected");

        var cancelledClaims = await _context.Claims
            .CountAsync(c => c.Status == "Cancelled");

        var totalClaimAmount = await _context.Claims
            .SumAsync(c => (decimal?)c.ClaimAmount) ?? 0;

        var approvedClaimAmount = await _context.Claims
            .Where(c => c.Status == "Approved")
            .SumAsync(c => (decimal?)c.ClaimAmount) ?? 0;

        return Ok(new
        {
            totalCustomers,
            totalPolicies,
            totalClaims,
            pendingClaims,
            approvedClaims,
            rejectedClaims,
            cancelledClaims,
            totalClaimAmount,
            approvedClaimAmount
        });
    }

    [HttpGet("claim-status")]
    public async Task<IActionResult> GetClaimStatusSummary()
    {
        var summary = await _context.Claims
            .GroupBy(c => c.Status)
            .Select(group => new
            {
                status = group.Key,
                count = group.Count()
            })
            .ToListAsync();

        return Ok(summary);
    }

    [HttpGet("recent-claims")]
    public async Task<IActionResult> GetRecentClaims()
    {
        var claims = await _context.Claims
            .Include(c => c.Customer)
            .OrderByDescending(c => c.SubmissionDate)
            .ThenByDescending(c => c.ClaimId)
            .Take(10)
            .Select(c => new
            {
                c.ClaimId,
                c.ClaimNumber,
                CustomerName = c.Customer!.FullName,
                c.ClaimAmount,
                c.Status,
                c.SubmissionDate
            })
            .ToListAsync();

        return Ok(claims);
    }
}
