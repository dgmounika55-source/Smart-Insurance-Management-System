using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartInsurance.API.Data;
using SmartInsurance.API.Models;

namespace SmartInsurance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PoliciesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PoliciesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<Policy>>> GetPolicies()
    {
        return Ok(await _context.Policies.ToListAsync());
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<Policy>> GetPolicy(int id)
    {
        var policy = await _context.Policies.FindAsync(id);

        if (policy == null)
            return NotFound(new { message = "Policy not found." });

        return Ok(policy);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Policy>> CreatePolicy(Policy policy)
    {
        if (string.IsNullOrWhiteSpace(policy.PolicyName) ||
            policy.PolicyName.Trim().Length > 100 ||
            policy.PolicyType.Trim().Length > 50 ||
            string.IsNullOrWhiteSpace(policy.PolicyType) ||
            policy.PremiumAmount <= 0 ||
            policy.CoverageAmount <= 0 ||
            policy.DurationMonths <= 0)
        {
            return BadRequest(new { message = "Enter valid policy details." });
        }

        var normalizedName = policy.PolicyName.Trim().ToLower();
        var normalizedType = policy.PolicyType.Trim().ToLower();

        var duplicatePolicy = await _context.Policies.AnyAsync(p =>
            p.PolicyName.ToLower() == normalizedName &&
            p.PolicyType.ToLower() == normalizedType);

        if (duplicatePolicy)
            return Conflict(new { message = "A policy with this name and type already exists." });

        policy.PolicyName = policy.PolicyName.Trim();
        policy.PolicyType = policy.PolicyType.Trim();
        policy.PolicyNumber = $"POL-{Guid.NewGuid():N}"[..12].ToUpperInvariant();
        policy.Status = "Active";

        _context.Policies.Add(policy);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPolicy), new { id = policy.PolicyId }, policy);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdatePolicy(int id, Policy updatedPolicy)
    {
        var policy = await _context.Policies.FindAsync(id);

        if (policy == null)
            return NotFound(new { message = "Policy not found." });

        if (string.IsNullOrWhiteSpace(updatedPolicy.PolicyName) ||
            string.IsNullOrWhiteSpace(updatedPolicy.PolicyType) ||
            updatedPolicy.PolicyName.Trim().Length > 100 ||
            updatedPolicy.PolicyType.Trim().Length > 50 ||
            updatedPolicy.PremiumAmount <= 0 ||
            updatedPolicy.CoverageAmount <= 0 ||
            updatedPolicy.DurationMonths <= 0)
        {
            return BadRequest(new { message = "Enter valid policy details." });
        }

        var normalizedName = updatedPolicy.PolicyName.Trim().ToLower();
        var normalizedType = updatedPolicy.PolicyType.Trim().ToLower();

        var duplicatePolicy = await _context.Policies.AnyAsync(p =>
            p.PolicyId != id &&
            p.PolicyName.ToLower() == normalizedName &&
            p.PolicyType.ToLower() == normalizedType);

        if (duplicatePolicy)
            return Conflict(new { message = "A policy with this name and type already exists." });
        policy.PolicyName = updatedPolicy.PolicyName;
        policy.PolicyType = updatedPolicy.PolicyType;
        policy.PremiumAmount = updatedPolicy.PremiumAmount;
        policy.CoverageAmount = updatedPolicy.CoverageAmount;
        policy.DurationMonths = updatedPolicy.DurationMonths;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePolicy(int id)
    {
        var policy = await _context.Policies.FindAsync(id);

        if (policy == null)
            return NotFound(new { message = "Policy not found." });

        policy.Status = "Inactive";
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
