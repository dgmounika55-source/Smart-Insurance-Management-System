using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartInsurance.API.Data;
using SmartInsurance.API.DTOs;
using SmartInsurance.API.Models;

namespace SmartInsurance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomerPoliciesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CustomerPoliciesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("my")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> GetMyPolicies()
    {
        var email = User.FindFirstValue(ClaimTypes.Email)
                    ?? User.FindFirstValue("email");

        if (string.IsNullOrWhiteSpace(email))
            return Unauthorized();

        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Email == email);

        if (customer == null)
            return NotFound(new { message = "Customer profile not found." });

        var policies = await _context.CustomerPolicies
            .Include(cp => cp.Policy)
            .Where(cp => cp.CustomerId == customer.CustomerId)
            .ToListAsync();

        return Ok(policies);
    }
    [HttpGet("customer/{customerId:int}")]
    [Authorize(Roles = "Customer,Admin,ClaimsManager")]
    public async Task<IActionResult> GetCustomerPolicies(int customerId)
    {
        if (!IsAuthorizedCustomer(customerId))
            return Forbid();

        var policies = await _context.CustomerPolicies
            .Include(cp => cp.Policy)
            .Where(cp => cp.CustomerId == customerId)
            .ToListAsync();

        return Ok(policies);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Customer,Admin,ClaimsManager")]
    public async Task<IActionResult> GetCustomerPolicy(int id)
    {
        var customerPolicy = await _context.CustomerPolicies
            .Include(cp => cp.Policy)
            .FirstOrDefaultAsync(cp => cp.CustomerPolicyId == id);

        if (customerPolicy == null)
            return NotFound(new { message = "Customer policy not found." });

        if (!IsAuthorizedCustomer(customerPolicy.CustomerId))
            return Forbid();

        return Ok(customerPolicy);
    }

    [HttpPost("purchase")]
    [Authorize(Roles = "Customer")]
    public IActionResult PurchasePolicy()
    {
        return Conflict(new
        {
            message = "Direct policy purchases are disabled. Please complete payment through the payment checkout."
        });
    }
    private bool IsAuthorizedCustomer(int customerId)
    {
        if (User.IsInRole("Admin") || User.IsInRole("ClaimsManager"))
            return true;

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        var email = User.FindFirstValue(ClaimTypes.Email)
                    ?? User.FindFirstValue("email");

        return _context.Customers.Any(c =>
            c.CustomerId == customerId &&
            c.Email == email);
    }
}
